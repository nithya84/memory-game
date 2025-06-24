import { describe, it, expect } from '@jest/globals';
import { handler } from './health';
import { createMockEvent, createMockContext, expectValidApiResponse } from '../test/test-utils';

describe('Health Handler', () => {
  it('should return 200 status', async () => {
    const event = createMockEvent();
    const context = createMockContext();
    
    const response = await handler(event, context);
    
    expectValidApiResponse(response, 200);
    
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
  });
});