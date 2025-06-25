import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-2'
});

export interface ImageGenerationRequest {
  theme: string;
  style: 'cartoon' | 'realistic' | 'simple';
  imageCount: number;
}

export interface GeneratedImage {
  base64Data: string;
  seed: number;
}

export const generateImages = async (request: ImageGenerationRequest): Promise<GeneratedImage[]> => {
  const images: GeneratedImage[] = [];
  
  const stylePrompts = {
    cartoon: 'cartoon style, colorful, child-friendly, simple illustration',
    realistic: 'photorealistic, high quality, detailed',
    simple: 'minimalist, simple design, clean lines, basic shapes'
  };
  
  for (let i = 0; i < request.imageCount; i++) {
    const prompt = `A ${request.theme} in ${stylePrompts[request.style]}, suitable for children's memory game, isolated on white background, no text`;
    
    const payload = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: prompt,
        negativeText: "text, words, letters, inappropriate content, scary, violent"
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        height: 512,
        width: 512,
        cfgScale: 8.0,
        seed: Math.floor(Math.random() * 1000000)
      }
    };

    try {
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-image-generator-v1',
        body: JSON.stringify(payload),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (responseBody.images && responseBody.images.length > 0) {
        images.push({
          base64Data: responseBody.images[0],
          seed: payload.imageGenerationConfig.seed
        });
      }
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error);
      throw new Error(`Image generation failed for ${request.theme}`);
    }
  }
  
  return images;
};

export const createMockImages = (request: ImageGenerationRequest): GeneratedImage[] => {
  const mockImages: GeneratedImage[] = [];
  
  for (let i = 0; i < request.imageCount; i++) {
    mockImages.push({
      base64Data: `mock-base64-data-${request.theme}-${request.style}-${i}`,
      seed: Math.floor(Math.random() * 1000000)
    });
  }
  
  return mockImages;
};