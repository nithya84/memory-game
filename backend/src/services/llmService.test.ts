import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { 
  generateThemeDescriptions, 
  createMockThemeDescriptions, 
  ThemeDescriptionRequest 
} from './llmService';

const bedrockMock = mockClient(BedrockRuntimeClient);

describe('LLM Service', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  describe('generateThemeDescriptions', () => {
    const mockRequest: ThemeDescriptionRequest = {
      theme: 'dinosaurs',
      style: 'cartoon',
      count: 3
    };

    it('should generate theme descriptions with correct count', async () => {
      const mockResponse = [
        {"subject": "T-Rex", "description": "T-Rex, a large dinosaur with tiny arms"},
        {"subject": "Triceratops", "description": "Triceratops, a dinosaur with three horns"},
        {"subject": "Stegosaurus", "description": "Stegosaurus, a dinosaur with spikes on its back"}
      ];

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: `Here are the descriptions:\n${JSON.stringify(mockResponse)}\n\nThese should work well for your memory game.`
          }]
        }))
      });

      const result = await generateThemeDescriptions(mockRequest);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        subject: "T-Rex",
        description: "T-Rex, a large dinosaur with tiny arms"
      });
      expect(result[2]).toEqual({
        subject: "Stegosaurus", 
        description: "Stegosaurus, a dinosaur with spikes on its back"
      });
    });

    it('should use correct model and prompt structure', async () => {
      const mockResponse = [
        {"subject": "Lion", "description": "Lion, a big cat with a mane"}
      ];

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify(mockResponse) }]
        }))
      });

      const animalRequest: ThemeDescriptionRequest = {
        theme: 'animals',
        style: 'realistic',
        count: 1
      };

      await generateThemeDescriptions(animalRequest);

      const call = bedrockMock.calls()[0];
      expect(call.args[0].input.modelId).toBe('anthropic.claude-3-haiku-20240307-v1:0');
      
      const payload = JSON.parse(call.args[0].input.body);
      expect(payload.anthropic_version).toBe('bedrock-2023-05-31');
      expect(payload.max_tokens).toBe(2000);
      expect(payload.messages[0].role).toBe('user');
      expect(payload.messages[0].content).toContain('animals');
      expect(payload.messages[0].content).toContain('Count: 1');
    });

    it('should default to 25 descriptions when count not specified', async () => {
      const mockResponse = Array.from({length: 25}, (_, i) => ({
        subject: `Animal ${i + 1}`,
        description: `Animal ${i + 1}, a test animal`
      }));

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify(mockResponse) }]
        }))
      });

      const requestWithoutCount = {
        theme: 'animals',
        style: 'cartoon' as const
      };

      const result = await generateThemeDescriptions(requestWithoutCount);

      expect(result).toHaveLength(25);
      
      const call = bedrockMock.calls()[0];
      const payload = JSON.parse(call.args[0].input.body);
      expect(payload.messages[0].content).toContain('Count: 25');
    });

    it('should handle JSON extraction from LLM response', async () => {
      const mockResponse = [
        {"subject": "Car", "description": "Car, a vehicle with four wheels"}
      ];

      // Test with extra text around JSON
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: `Here are the vehicle descriptions you requested:\n\n${JSON.stringify(mockResponse)}\n\nI hope these work well for your children's game!`
          }]
        }))
      });

      const result = await generateThemeDescriptions({
        theme: 'vehicles',
        style: 'simple',
        count: 1
      });

      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Car');
    });

    it('should slice to exact count when LLM returns more', async () => {
      const mockResponse = Array.from({length: 30}, (_, i) => ({
        subject: `Item ${i + 1}`,
        description: `Item ${i + 1}, a test item`
      }));

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify(mockResponse) }]
        }))
      });

      const result = await generateThemeDescriptions({
        theme: 'test',
        style: 'cartoon',
        count: 5
      });

      expect(result).toHaveLength(5);
      expect(result[4].subject).toBe('Item 5');
    });

    it('should handle Bedrock API errors', async () => {
      bedrockMock.on(InvokeModelCommand).rejects(new Error('Bedrock LLM Error'));

      await expect(generateThemeDescriptions(mockRequest)).rejects.toThrow(
        'Failed to generate theme descriptions'
      );
    });

    it('should handle invalid JSON response', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'This response does not contain valid JSON array'
          }]
        }))
      });

      await expect(generateThemeDescriptions(mockRequest)).rejects.toThrow(
        'Failed to generate theme descriptions'
      );
    });

    it('should handle malformed JSON in response', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'Here is your data: [{"subject": "Test", "description": "Test desc"'  // Missing closing bracket
          }]
        }))
      });

      await expect(generateThemeDescriptions(mockRequest)).rejects.toThrow(
        'Failed to generate theme descriptions'
      );
    });
  });

  describe('createMockThemeDescriptions', () => {
    it('should create correct number of mock descriptions', () => {
      const request: ThemeDescriptionRequest = {
        theme: 'robots',
        style: 'cartoon',
        count: 5
      };

      const mockDescriptions = createMockThemeDescriptions(request);

      expect(mockDescriptions).toHaveLength(5);
      expect(mockDescriptions[0]).toHaveProperty('subject');
      expect(mockDescriptions[0]).toHaveProperty('description');
    });

    it('should include theme in mock descriptions', () => {
      const request: ThemeDescriptionRequest = {
        theme: 'space',
        style: 'realistic',
        count: 3
      };

      const mockDescriptions = createMockThemeDescriptions(request);

      expect(mockDescriptions[0].subject).toBe('space 1');
      expect(mockDescriptions[0].description).toBe('space 1, a space themed item');
      expect(mockDescriptions[2].subject).toBe('space 3');
    });

    it('should default to 25 descriptions when count not specified', () => {
      const request = {
        theme: 'test',
        style: 'cartoon' as const
      };

      const mockDescriptions = createMockThemeDescriptions(request);

      expect(mockDescriptions).toHaveLength(25);
    });

    it('should generate unique subjects', () => {
      const request: ThemeDescriptionRequest = {
        theme: 'colors',
        style: 'simple',
        count: 10
      };

      const mockDescriptions = createMockThemeDescriptions(request);
      const subjects = mockDescriptions.map(desc => desc.subject);

      expect(new Set(subjects).size).toBe(10); // All subjects should be unique
    });
  });
});