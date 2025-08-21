import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  // REVERT!! region: process.env.REGION || 'us-east-1'
  region: 'us-east-1'
});

export interface ImageGenerationRequest {
  subjects: string[];
  descriptions?: string[]; // Optional detailed descriptions for image generation
  style: 'cartoon' | 'realistic' | 'simple';
}

export interface GeneratedImage {
  base64Data: string;
  seed: number;
  subjectIndex: number; // Index of the original subject that this image corresponds to
}

export interface ImageGenerationResult extends Array<GeneratedImage> {
  failureCount: number;
}

export const generateImages = async (request: ImageGenerationRequest): Promise<ImageGenerationResult> => {
  const stylePrompts = {
    cartoon: 'cartoon style, colorful, child-friendly, simple illustration',
    realistic: 'photorealistic, high quality, detailed',
    simple: 'minimalist, simple design, clean lines, basic shapes'
  };
  
  const baseSeed = Math.floor(Math.random() * 1000000);
  const successfulImages: GeneratedImage[] = [];
  let failureCount = 0;
  
  // Process images in batches to avoid throttling
  const BATCH_SIZE = 5; // Generate 5 images at a time
  const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches
  
  console.log(`Starting image generation for ${request.subjects.length} subjects in batches of ${BATCH_SIZE}`);
  
  for (let i = 0; i < request.subjects.length; i += BATCH_SIZE) {
    const batch = request.subjects.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(request.subjects.length / BATCH_SIZE)}: subjects ${i + 1}-${Math.min(i + BATCH_SIZE, request.subjects.length)}`);
    
    const batchPromises = batch.map(async (subject, batchIndex) => {
      const globalIndex = i + batchIndex;
      const description = request.descriptions?.[globalIndex];
      const prompt = description 
        ? `${subject}: ${description} in ${stylePrompts[request.style]}, friendly, non-threatening, suitable for children's memory game, isolated on white background, no text`
        : `${subject} in ${stylePrompts[request.style]}, friendly, non-threatening, suitable for children's memory game, isolated on white background, no text`;
      const seed = baseSeed + globalIndex;
      
      console.log(`Generating image for: ${subject}${description ? ` | Description: ${description}` : ''}`);
      
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
          console.log(`✓ Successfully generated image for: ${subject}`);
          return {
            base64Data: responseBody.images[0],
            seed: seed,
            subjectIndex: globalIndex
          };
        } else {
          throw new Error(`No image returned from Bedrock for ${subject}`);
        }
      } catch (error) {
        console.error(`✗ Failed to generate image for ${subject}:`, error);
        return null;
      }
    });
    
    // Wait for current batch to complete
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process batch results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        successfulImages.push(result.value);
      } else {
        failureCount++;
      }
    });
    
    console.log(`Batch completed. Success: ${successfulImages.length}, Failures: ${failureCount}`);
    
    // Add delay between batches (except for the last batch)
    if (i + BATCH_SIZE < request.subjects.length) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log(`Image generation complete. Total success: ${successfulImages.length}, Total failures: ${failureCount}`);
  
  // Check if failure count exceeds threshold
  if (failureCount > 10) {
    throw new Error(`Too many image generation failures (${failureCount}). Maximum allowed: 10`);
  }
  
  // Create result array with failureCount property
  const result = successfulImages as ImageGenerationResult;
  result.failureCount = failureCount;
  
  return result;
};

export const createMockImages = (request: ImageGenerationRequest): GeneratedImage[] => {
  const mockImages: GeneratedImage[] = [];
  
  for (let i = 0; i < request.subjects.length; i++) {
    mockImages.push({
      base64Data: `mock-base64-data-${request.subjects[i]}-${request.style}-${i}`,
      seed: Math.floor(Math.random() * 1000000),
      subjectIndex: i
    });
  }
  
  return mockImages;
};