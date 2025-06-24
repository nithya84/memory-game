import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Helper to create mock Lambda events
export const createMockEvent = (
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent => ({
  httpMethod: 'GET',
  path: '/',
  pathParameters: null,
  queryStringParameters: null,
  headers: {},
  multiValueHeaders: {},
  body: null,
  isBase64Encoded: false,
  stageVariables: null,
  requestContext: {
    accountId: 'test',
    apiId: 'test',
    protocol: 'HTTP/1.1',
    httpMethod: 'GET',
    path: '/',
    stage: 'test',
    requestId: 'test',
    requestTime: '01/Jan/2024:00:00:00 +0000',
    requestTimeEpoch: 1640995200,
    identity: {
      cognitoIdentityPoolId: null,
      accountId: null,
      cognitoIdentityId: null,
      caller: null,
      sourceIp: '127.0.0.1',
      principalOrgId: null,
      accessKey: null,
      cognitoAuthenticationType: null,
      cognitoAuthenticationProvider: null,
      userArn: null,
      userAgent: 'test',
      user: null,
      apiKey: null,
      apiKeyId: null,
      clientCert: null,
    },
    authorizer: null,
    resourceId: 'test',
    resourcePath: '/',
  },
  resource: '/',
  multiValueQueryStringParameters: null,
  ...overrides,
});

// Helper to create mock Lambda context
export const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
});

// Helper to assert API Gateway response format
export const expectValidApiResponse = (
  response: APIGatewayProxyResult,
  expectedStatusCode: number = 200
) => {
  expect(response).toHaveProperty('statusCode', expectedStatusCode);
  expect(response).toHaveProperty('headers');
  expect(response).toHaveProperty('body');
  
  if (response.body) {
    expect(() => JSON.parse(response.body)).not.toThrow();
  }
};