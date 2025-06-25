import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { docClient, TABLE_NAMES } from '../config/database';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { User, LoginRequest, RegisterRequest } from '../../../shared/src/types';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  userType: Joi.string().valid('parent', 'child').required(),
  parentPin: Joi.string().length(4).when('userType', {
    is: 'parent',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const register: APIGatewayProxyHandler = async (event) => {
  try {
    const body: RegisterRequest = JSON.parse(event.body || '{}');
    
    const { error } = registerSchema.validate(body);
    if (error) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: {
            code: 'INVALID_INPUT',
            message: error.details[0].message
          }
        })
      };
    }

    // Check if user already exists
    const existingUser = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': body.email
      }
    }));

    if (existingUser.Items && existingUser.Items.length > 0) {
      return {
        statusCode: 409,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already registered'
          }
        })
      };
    }

    const hashedPassword = await hashPassword(body.password);
    const userId = uuidv4();
    
    const user: User = {
      id: userId,
      email: body.email,
      userType: body.userType,
      createdAt: new Date().toISOString(),
      settings: {
        soundEnabled: true,
        soundVolume: 0.7,
        colorTheme: 'calm',
        fontSize: 'medium',
        animationsEnabled: true,
        autoSave: true
      }
    };

    // Store user with hashed password
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USERS,
      Item: {
        ...user,
        password: hashedPassword,
        ...(body.parentPin && { parentPin: await hashPassword(body.parentPin) })
      }
    }));

    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType
    });

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        user,
        token
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Registration failed'
        }
      })
    };
  }
};

export const login: APIGatewayProxyHandler = async (event) => {
  try {
    const body: LoginRequest = JSON.parse(event.body || '{}');
    
    const { error } = loginSchema.validate(body);
    if (error) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: {
            code: 'INVALID_INPUT',
            message: error.details[0].message
          }
        })
      };
    }

    // Find user by email
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': body.email
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        })
      };
    }

    const userData = result.Items[0];
    const passwordValid = await verifyPassword(body.password, userData.password);
    
    if (!passwordValid) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        })
      };
    }

    // Remove sensitive data
    const { password, parentPin, ...user } = userData;
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        user,
        token
      })
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed'
        }
      })
    };
  }
};