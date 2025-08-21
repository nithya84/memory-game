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

  it('should generate theme descriptions', async () => {
    const mockResponse = [
      {"subject": "T-Rex", "description": "T-Rex, a large dinosaur"},
      {"subject": "Triceratops", "description": "Triceratops, a horned dinosaur"}
    ];

    bedrockMock.on(InvokeModelCommand).resolves({
      body: new TextEncoder().encode(JSON.stringify({
        content: [{ text: JSON.stringify(mockResponse) }]
      }))
    });

    const result = await generateThemeDescriptions({
      theme: 'dinosaurs',
      style: 'cartoon',
      count: 2
    });

    expect(result).toHaveLength(2);
    expect(result[0].subject).toBe("T-Rex");
  });

  it('should handle API errors', async () => {
    bedrockMock.on(InvokeModelCommand).rejects(new Error('API Error'));

    await expect(generateThemeDescriptions({
      theme: 'test',
      style: 'cartoon',
      count: 1
    })).rejects.toThrow('Failed to generate theme descriptions');
  });

  it('should create mock descriptions', () => {
    const result = createMockThemeDescriptions({
      theme: 'robots',
      style: 'cartoon',
      count: 3
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty('subject');
    expect(result[0]).toHaveProperty('description');
  });
});