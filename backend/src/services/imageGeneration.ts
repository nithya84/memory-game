import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  // REVERT!! region: process.env.REGION || 'us-east-1'
  region: 'us-east-1'
});

export interface ImageGenerationRequest {
  subjects: string[];
  style: 'cartoon' | 'realistic' | 'simple';
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
  
  const baseSeed = Math.floor(Math.random() * 1000000);
  
  // Generate images concurrently for all subjects
  const imagePromises = request.subjects.map(async (subject, i) => {
    const prompt = `${subject} in ${stylePrompts[request.style]}, friendly, non-threatening, suitable for children's memory game, isolated on white background, no text`;
    const seed = baseSeed + i;
    
    console.log(`Preparing to generate image for: ${subject}`); // Log before sending request
    
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
        seed: seed
      }
    };

    try {
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-image-generator-v2:0',
        body: JSON.stringify(payload),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (responseBody.images && responseBody.images.length > 0) {
        console.log(`Successfully generated image for: ${subject}`); // Log on success
        return {
          base64Data: responseBody.images[0],
          seed: seed
        };
      } else {
        throw new Error(`No image returned from Bedrock for ${subject}`);
      }
    } catch (error) {
      console.error(`Failed to generate image for ${subject}:`, error);
      // Re-throw to ensure Promise.all rejects if any fails
      throw new Error(`Image generation failed for ${subject}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  const allImages = await Promise.all(imagePromises);
  return allImages;
};

export const createMockImages = (request: ImageGenerationRequest): GeneratedImage[] => {
  const mockImages: GeneratedImage[] = [];
  
  for (let i = 0; i < request.subjects.length; i++) {
    mockImages.push({
      base64Data: `mock-base64-data-${request.subjects[i]}-${request.style}-${i}`,
      seed: Math.floor(Math.random() * 1000000)
    });
  }
  
  return mockImages;
};