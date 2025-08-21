import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { generateImages, createMockImages } from './imageGeneration';

const bedrockMock = mockClient(BedrockRuntimeClient);

describe('Image Generation Service', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  it('should generate images for subjects', async () => {
    bedrockMock.on(InvokeModelCommand).resolves({
      body: new TextEncoder().encode(JSON.stringify({
        images: ['mock-image-data']
      }))
    });

    const result = await generateImages({
      subjects: ['Car', 'Truck'],
      style: 'cartoon'
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('base64Data', 'mock-image-data');
  });

  it('should handle API errors gracefully', async () => {
    bedrockMock.on(InvokeModelCommand).rejects(new Error('API Error'));

    const result = await generateImages({
      subjects: ['Car'],
      style: 'cartoon'
    });

    expect(result).toHaveLength(0);
    expect(result.failureCount).toBe(1);
  });

  it('should create mock images', () => {
    const result = createMockImages({
      subjects: ['Cat', 'Dog'],
      style: 'cartoon'
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('base64Data');
    expect(result[0]).toHaveProperty('seed');
  });
});