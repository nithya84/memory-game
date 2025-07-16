import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { generateImages, createMockImages, ImageGenerationRequest } from './imageGeneration';

const bedrockMock = mockClient(BedrockRuntimeClient);

describe('Image Generation Service', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  describe('generateImages', () => {
    const mockRequest: ImageGenerationRequest = {
      subjects: ['T-Rex', 'Triceratops', 'Stegosaurus', 'Pterodactyl', 'Brontosaurus', 'Velociraptor', 'Ankylosaurus'],
      style: 'cartoon'
    };

    it('should generate one image per subject', async () => {
      // Mock individual responses for each subject
      bedrockMock
        .on(InvokeModelCommand)
        .resolves({
          body: new TextEncoder().encode(JSON.stringify({
            images: ['mock-image-data']
          }))
        });

      const result = await generateImages(mockRequest);

      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('base64Data', 'mock-image-data');
      expect(result[6]).toHaveProperty('base64Data', 'mock-image-data');
      expect(bedrockMock.calls()).toHaveLength(7); // One call per subject
    });

    it('should handle small requests with few subjects', async () => {
      const smallRequest: ImageGenerationRequest = {
        subjects: ['Sports car', 'Truck', 'Motorcycle'],
        style: 'realistic'
      };

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          images: ['mock-car-image']
        }))
      });

      const result = await generateImages(smallRequest);

      expect(result).toHaveLength(3);
      expect(bedrockMock.calls()).toHaveLength(3); // One call per subject
    });

    it('should use correct model ID and payload structure', async () => {
      const request: ImageGenerationRequest = {
        subjects: ['Lion', 'Elephant'],
        style: 'simple'
      };

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          images: ['animal-image']
        }))
      });

      await generateImages(request);

      const call = bedrockMock.calls()[0];
      expect(call.args[0].input.modelId).toBe('amazon.titan-image-generator-v2:0');
      
      const payload = JSON.parse(call.args[0].input.body);
      expect(payload.taskType).toBe('TEXT_IMAGE');
      expect(payload.textToImageParams.text).toContain('Lion');
      expect(payload.textToImageParams.text).toContain('minimalist, simple design');
      expect(payload.imageGenerationConfig.numberOfImages).toBe(1);
      expect(payload.imageGenerationConfig.height).toBe(512);
      expect(payload.imageGenerationConfig.width).toBe(512);
    });

    // Verifies that each subject uses a different seed (incremented by 1) to ensure 
    // image variety across subjects - prevents all images from being too similar
    it('should vary seeds between subjects to ensure image diversity', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          images: ['subject-image']
        }))
      });

      const twoSubjectRequest: ImageGenerationRequest = {
        subjects: ['Subject1', 'Subject2'],
        style: 'cartoon'
      };

      await generateImages(twoSubjectRequest);

      const calls = bedrockMock.calls();
      const payload1 = JSON.parse(calls[0].args[0].input.body);
      const payload2 = JSON.parse(calls[1].args[0].input.body);
      
      expect(payload1.imageGenerationConfig.seed).not.toBe(payload2.imageGenerationConfig.seed);
      expect(payload2.imageGenerationConfig.seed - payload1.imageGenerationConfig.seed).toBe(1);
    });

    it('should handle Bedrock API errors', async () => {
      bedrockMock.on(InvokeModelCommand).rejects(new Error('Bedrock API Error'));

      const singleSubjectRequest: ImageGenerationRequest = {
        subjects: ['T-Rex'],
        style: 'cartoon'
      };

      await expect(generateImages(singleSubjectRequest)).rejects.toThrow(
        'Image generation failed for T-Rex: Bedrock API Error'
      );
    });

    it('should handle empty response from Bedrock', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          images: []
        }))
      });

      const singleSubjectRequest: ImageGenerationRequest = {
        subjects: ['Lion'],
        style: 'realistic'
      };

      await expect(generateImages(singleSubjectRequest)).rejects.toThrow(
        'No image returned from Bedrock for Lion'
      );
    });

    it('should handle missing images property in response', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({}))
      });

      const singleSubjectRequest: ImageGenerationRequest = {
        subjects: ['Car'],
        style: 'simple'
      };

      await expect(generateImages(singleSubjectRequest)).rejects.toThrow(
        'No image returned from Bedrock for Car'
      );
    });

    it('should use correct style prompts', async () => {
      const cartoonRequest: ImageGenerationRequest = {
        subjects: ['Robot'],
        style: 'cartoon'
      };

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          images: ['robot1']
        }))
      });

      await generateImages(cartoonRequest);

      const call = bedrockMock.calls()[0];
      const payload = JSON.parse(call.args[0].input.body);
      expect(payload.textToImageParams.text).toContain('Robot');
      expect(payload.textToImageParams.text).toContain('cartoon style, colorful, child-friendly');
    });

    it('should include negative prompts', async () => {
      const request: ImageGenerationRequest = {
        subjects: ['Rose'],
        style: 'realistic'
      };

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          images: ['flower1']
        }))
      });

      await generateImages(request);

      const call = bedrockMock.calls()[0];
      const payload = JSON.parse(call.args[0].input.body);
      expect(payload.textToImageParams.negativeText).toBe(
        'text, words, letters, inappropriate content, scary, violent'
      );
    });
  });

  describe('createMockImages', () => {
    it('should create correct number of mock images', () => {
      const request: ImageGenerationRequest = {
        subjects: ['Cat', 'Dog', 'Bird', 'Fish', 'Rabbit'],
        style: 'cartoon'
      };

      const mockImages = createMockImages(request);

      expect(mockImages).toHaveLength(5);
      expect(mockImages[0]).toHaveProperty('base64Data');
      expect(mockImages[0]).toHaveProperty('seed');
    });

    it('should include subject and style in mock data', () => {
      const request: ImageGenerationRequest = {
        subjects: ['Dragon', 'Phoenix'],
        style: 'realistic'
      };

      const mockImages = createMockImages(request);

      expect(mockImages[0].base64Data).toContain('Dragon');
      expect(mockImages[0].base64Data).toContain('realistic');
      expect(mockImages[1].base64Data).toContain('Phoenix');
      expect(mockImages[1].base64Data).toContain('realistic');
    });

    it('should generate unique seeds for each image', () => {
      const request: ImageGenerationRequest = {
        subjects: ['Test1', 'Test2', 'Test3', 'Test4', 'Test5'],
        style: 'cartoon'
      };

      const mockImages = createMockImages(request);
      const seeds = mockImages.map(img => img.seed);

      expect(new Set(seeds).size).toBe(5); // All seeds should be unique
    });
  });
});