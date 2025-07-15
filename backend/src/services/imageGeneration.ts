import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  // REVERT!! region: process.env.REGION || 'us-east-1'
  region: 'us-east-1'
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
  const baseSeed = Math.floor(Math.random() * 1000000);
  
  const allImages: GeneratedImage[] = [];
  const maxImagesPerBatch = 5;
  const totalBatches = Math.ceil(request.imageCount / maxImagesPerBatch);
  
  for (let batch = 0; batch < totalBatches; batch++) {
    console.log(`Generating batch ${batch + 1} of ${totalBatches}`);
    const remainingImages = request.imageCount - (batch * maxImagesPerBatch);
    const batchSize = Math.min(maxImagesPerBatch, remainingImages);
    const batchSeed = baseSeed + (batch * 1000); // Vary seed per batch
    
    const payload = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: prompt,
        negativeText: "text, words, letters, inappropriate content, scary, violent"
      },
      imageGenerationConfig: {
        numberOfImages: batchSize,
        height: 512,
        width: 512,
        cfgScale: 8.0,
        seed: batchSeed
      }
    };

    try {
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-image-generator-v2:0',
        body: JSON.stringify(payload),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log(`Received response for batch ${batch + 1}:`, responseBody);
      if (responseBody.images && responseBody.images.length > 0) {
        const batchImages = responseBody.images.map((base64Data: string, index: number) => ({
          base64Data,
          seed: batchSeed + index
        }));
        allImages.push(...batchImages);
      } else {
        throw new Error(`No images returned from Bedrock for batch ${batch + 1}`);
      }
    } catch (error) {
      console.error(`Failed to generate images for batch ${batch + 1}:`, error);
      throw new Error(`Image generation failed for ${request.theme} batch ${batch + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return allImages;
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