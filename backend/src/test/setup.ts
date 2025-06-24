// Test setup for backend
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { beforeEach } from '@jest/globals';

// Mock AWS clients
export const dynamoDbMock = mockClient(DynamoDBClient);

// Reset mocks before each test
beforeEach(() => {
  dynamoDbMock.reset();
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_TABLE_PREFIX = 'test-memory-game-';
process.env.JWT_SECRET = 'test-jwt-secret';