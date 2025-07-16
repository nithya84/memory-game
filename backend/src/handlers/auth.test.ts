import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { register, login } from './auth';
import { createMockEvent, createMockContext } from '../test/test-utils';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';

// Mock auth utilities
jest.mock('../utils/auth');
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;
const mockedGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('Auth Handlers', () => {
  beforeEach(() => {
    dynamoMock.reset();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterBody = {
      email: 'test@example.com',
      password: 'password123',
      userType: 'child' as const
    };

    it('should successfully register a new child user', async () => {
      // Mock email check - no existing user
      dynamoMock.on(QueryCommand).resolves({
        Items: []
      });

      // Mock password hashing
      mockedHashPassword.mockResolvedValue('hashed_password');

      // Mock token generation
      mockedGenerateToken.mockReturnValue('mock-jwt-token');

      // Mock user creation
      dynamoMock.on(PutCommand).resolves({});

      const event = createMockEvent({
        body: JSON.stringify(validRegisterBody),
        httpMethod: 'POST',
        path: '/auth/register'
      });

      const result = await register(event, createMockContext());

      expect(result.statusCode).toBe(201);
      const response = JSON.parse(result.body);
      expect(response.user).toBeDefined();
      expect(response.token).toBeDefined();

      // Verify email check query
      const queryCall = dynamoMock.calls().find(call => call.args[0].input.TableName?.includes('users'));
      expect(queryCall?.args[0].input.IndexName).toBe('EmailIndex');
      expect(queryCall?.args[0].input.KeyConditionExpression).toBe('email = :email');

      // Verify user creation
      const putCall = dynamoMock.calls().find(call => call.args[0].constructor.name === 'PutCommand');
      const userData = putCall?.args[0].input.Item;
      expect(userData?.email).toBe('test@example.com');
      expect(userData?.userType).toBe('child');
      expect(userData?.password).toBe('hashed_password');
      expect(userData?.parentPin).toBeUndefined();
    });

    it('should successfully register a new parent user with PIN', async () => {
      const parentRegisterBody = {
        ...validRegisterBody,
        userType: 'parent' as const,
        parentPin: '1234'
      };

      dynamoMock.on(QueryCommand).resolves({ Items: [] });
      mockedHashPassword.mockResolvedValueOnce('hashed_password').mockResolvedValueOnce('hashed_pin');
      mockedGenerateToken.mockReturnValue('mock-jwt-token');
      dynamoMock.on(PutCommand).resolves({});

      const event = createMockEvent({
        body: JSON.stringify(parentRegisterBody),
        httpMethod: 'POST',
        path: '/auth/register'
      });

      const result = await register(event, createMockContext());

      expect(result.statusCode).toBe(201);
      expect(mockedHashPassword).toHaveBeenCalledTimes(2); // Password and PIN

      const putCall = dynamoMock.calls().find(call => call.args[0].constructor.name === 'PutCommand');
      const userData = putCall?.args[0].input.Item;
      expect(userData?.userType).toBe('parent');
      expect(userData?.parentPin).toBe('hashed_pin');
    });

    it('should reject registration if email already exists', async () => {
      // Mock email check - user exists
      dynamoMock.on(QueryCommand).resolves({
        Items: [{ id: 'existing-user', email: 'test@example.com' }]
      });

      const event = createMockEvent({
        body: JSON.stringify(validRegisterBody),
        httpMethod: 'POST',
        path: '/auth/register'
      });

      const result = await register(event, createMockContext());

      expect(result.statusCode).toBe(409);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('EMAIL_EXISTS');
      expect(response.error.message).toBe('Email already registered');

      // Should not attempt to create user
      const putCalls = dynamoMock.calls().filter(call => call.args[0].constructor.name === 'PutCommand');
      expect(putCalls).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      const invalidBody = {
        email: 'test@example.com'
        // Missing password and userType
      };

      const event = createMockEvent({
        body: JSON.stringify(invalidBody),
        httpMethod: 'POST',
        path: '/auth/register'
      });

      const result = await register(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INVALID_INPUT');
      expect(response.error.message).toContain('required');
    });

    it('should validate email format', async () => {
      const invalidEmailBody = {
        ...validRegisterBody,
        email: 'invalid-email'
      };

      const event = createMockEvent({
        body: JSON.stringify(invalidEmailBody),
        httpMethod: 'POST',
        path: '/auth/register'
      });

      const result = await register(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INVALID_INPUT');
      expect(response.error.message).toContain('valid email');
    });

    it('should handle DynamoDB errors during email check', async () => {
      dynamoMock.on(QueryCommand).rejects(new Error('DynamoDB Error'));

      const event = createMockEvent({
        body: JSON.stringify(validRegisterBody),
        httpMethod: 'POST',
        path: '/auth/register'
      });

      const result = await register(event, createMockContext());

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('Registration failed');
    });

    it('should handle DynamoDB errors during user creation', async () => {
      dynamoMock.on(QueryCommand).resolves({ Items: [] });
      mockedHashPassword.mockResolvedValue('hashed_password');
      dynamoMock.on(PutCommand).rejects(new Error('DynamoDB Put Error'));

      const event = createMockEvent({
        body: JSON.stringify(validRegisterBody),
        httpMethod: 'POST',
        path: '/auth/register'
      });

      const result = await register(event, createMockContext());

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('Registration failed');
    });
  });

  describe('login', () => {
    const validLoginBody = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed_password',
      userType: 'child',
      createdAt: '2024-01-01T00:00:00.000Z',
      settings: {}
    };

    it('should successfully login with valid credentials', async () => {
      // Mock user lookup
      dynamoMock.on(QueryCommand).resolves({
        Items: [mockUser]
      });

      // Mock password verification
      mockedVerifyPassword.mockResolvedValue(true);

      // Mock token generation
      mockedGenerateToken.mockReturnValue('mock-jwt-token');

      const event = createMockEvent({
        body: JSON.stringify(validLoginBody),
        httpMethod: 'POST',
        path: '/auth/login'
      });

      const result = await login(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.user).toBeDefined();
      expect(responseBody.token).toBeDefined();
      expect(responseBody.user.id).toBe('user-123');
      expect(responseBody.user.email).toBe('test@example.com');
      expect(responseBody.user.password).toBeUndefined(); // Password should be removed

      // Verify user lookup query
      const queryCall = dynamoMock.calls()[0];
      expect(queryCall.args[0].input.IndexName).toBe('EmailIndex');
      expect(queryCall.args[0].input.KeyConditionExpression).toBe('email = :email');
      expect(queryCall.args[0].input.ExpressionAttributeValues[':email']).toBe('test@example.com');
    });

    it('should reject login with non-existent email', async () => {
      // Mock user lookup - no user found
      dynamoMock.on(QueryCommand).resolves({
        Items: []
      });

      const event = createMockEvent({
        body: JSON.stringify(validLoginBody),
        httpMethod: 'POST',
        path: '/auth/login'
      });

      const result = await login(event, createMockContext());

      expect(result.statusCode).toBe(401);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.error.message).toBe('Invalid email or password');

      // Should not attempt password verification
      expect(mockedVerifyPassword).not.toHaveBeenCalled();
    });

    it('should reject login with incorrect password', async () => {
      // Mock user lookup
      dynamoMock.on(QueryCommand).resolves({
        Items: [mockUser]
      });

      // Mock password verification - password mismatch
      mockedVerifyPassword.mockResolvedValue(false);

      const event = createMockEvent({
        body: JSON.stringify(validLoginBody),
        httpMethod: 'POST',
        path: '/auth/login'
      });

      const result = await login(event, createMockContext());

      expect(result.statusCode).toBe(401);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.error.message).toBe('Invalid email or password');
    });

    it('should validate required login fields', async () => {
      const invalidBody = {
        email: 'test@example.com'
        // Missing password
      };

      const event = createMockEvent({
        body: JSON.stringify(invalidBody),
        httpMethod: 'POST',
        path: '/auth/login'
      });

      const result = await login(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INVALID_INPUT');
      expect(response.error.message).toContain('required');
    });

    it('should handle DynamoDB errors during user lookup', async () => {
      dynamoMock.on(QueryCommand).rejects(new Error('DynamoDB Error'));

      const event = createMockEvent({
        body: JSON.stringify(validLoginBody),
        httpMethod: 'POST',
        path: '/auth/login'
      });

      const result = await login(event, createMockContext());

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('Login failed');
    });

    it('should handle auth errors during password verification', async () => {
      dynamoMock.on(QueryCommand).resolves({
        Items: [mockUser]
      });

      mockedVerifyPassword.mockRejectedValue(new Error('Auth Error'));

      const event = createMockEvent({
        body: JSON.stringify(validLoginBody),
        httpMethod: 'POST',
        path: '/auth/login'
      });

      const result = await login(event, createMockContext());

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('Login failed');
    });
  });
});