import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.REGION || 'us-east-2'
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
  const stylePrompts = {
    cartoon: 'cartoon style, colorful, child-friendly, simple illustration',
    realistic: 'photorealistic, high quality, detailed',
    simple: 'minimalist, simple design, clean lines, basic shapes'
  };
  
  const prompt = `A variety of "${request.theme}" in ${stylePrompts[request.style]}, suitable for children's memory game, isolated on white background, no text`;
  const seed = Math.floor(Math.random() * 1000000);
  
  const payload = {
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: prompt,
      negativeText: "text, words, letters, inappropriate content, scary, violent"
    },
    imageGenerationConfig: {
      numberOfImages: request.imageCount,
      height: 512,
      width: 512,
      cfgScale: 8.0,
      seed: seed
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
      return responseBody.images.map((base64Data: string, index: number) => ({
        base64Data,
        seed: seed + index // Slightly vary seed for each image
      }));
    } else {
      throw new Error('No images returned from Bedrock');
    }
  } catch (error) {
    console.error('Failed to generate images:', error);
    throw new Error(`Image generation failed for ${request.theme}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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