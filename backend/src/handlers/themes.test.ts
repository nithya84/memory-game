import { generateTheme } from './themes';
import { createMockEvent, createMockContext } from '../test/test-utils';

// Mock all external dependencies
jest.mock('../services/llmService', () => ({
  createMockThemeDescriptions: jest.fn(() => [
    { subject: 'Dino 1', description: 'Dino 1, a test dinosaur' },
    { subject: 'Dino 2', description: 'Dino 2, another dinosaur' }
  ])
}));
jest.mock('../services/imageGeneration', () => ({
  createMockImages: jest.fn(() => [
    { base64Data: 'mock1', seed: 123 },
    { base64Data: 'mock2', seed: 124 }
  ])
}));
jest.mock('../services/s3Service');
jest.mock('../config/database');

describe('Themes Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.USE_MOCK_AI = 'true';
  });

  describe('generateTheme', () => {
    it('should handle valid theme request', async () => {
      const event = createMockEvent({
        body: JSON.stringify({
          theme: 'dinosaurs',
          style: 'cartoon'
        })
      });

      const result = await generateTheme(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const response = JSON.parse(result.body);
      expect(response.status).toBe('completed');
      expect(response.theme).toBe('dinosaurs');
      expect(response.images).toBeDefined();
      expect(Array.isArray(response.images)).toBe(true);
    });

    it('should reject invalid input', async () => {
      const event = createMockEvent({
        body: JSON.stringify({
          theme: '',
          style: 'invalid'
        })
      });

      const result = await generateTheme(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error.code).toBe('INVALID_INPUT');
    });
  });
});