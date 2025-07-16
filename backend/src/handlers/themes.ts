import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
const uuidv4 = randomUUID;
import Joi from 'joi';
import { docClient, TABLE_NAMES } from '../config/database';
import { extractUserFromEvent } from '../utils/auth';
import { generateImages, createMockImages } from '../services/imageGeneration';
import { generateThemeDescriptions, createMockThemeDescriptions } from '../services/llmService';
import { uploadImageToS3 } from '../services/s3Service';
// Temporarily commented out to isolate dependency issue
// import { Theme, ThemeImage, ThemeGenerationRequest } from 'memory-game-shared';

// Inline types for testing
interface ThemeImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText: string;
  description: string;
  safetyScore: number;
  selected: boolean;
}

interface Theme {
  id: string;
  userId: string;
  name: string;
  images: ThemeImage[];
  createdAt: string;
  lastUsed?: string;
}

interface ThemeGenerationRequest {
  theme: string;
  style: 'cartoon' | 'realistic' | 'simple';
}

const generateSchema = Joi.object({
  theme: Joi.string().min(1).max(50).pattern(/^[a-zA-Z0-9\s]+$/).required(),
  style: Joi.string().valid('cartoon', 'realistic', 'simple').required()
});

export const generateTheme: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('generateTheme called with event:', JSON.stringify(event, null, 2));
    // TODO: Re-enable authentication in production
    // const user = extractUserFromEvent(event);
    // if (!user) {
    //   return {
    //     statusCode: 401,
    //     headers: { 'Access-Control-Allow-Origin': '*' },
    //     body: JSON.stringify({
    //       error: {
    //         code: 'AUTHENTICATION_REQUIRED',
    //         message: 'Valid authentication token required'
    //       }
    //     })
    //   };
    // }

    const body: ThemeGenerationRequest = JSON.parse(event.body || '{}');
    
    const { error } = generateSchema.validate(body);
    if (error) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: {
            code: 'INVALID_INPUT',
            message: error.details[0].message
          }
        })
      };
    }

    const themeStyle = `${body.theme.toLowerCase()}-${body.style}`;
    
    // Use mock AI for local development only
    const useMock = process.env.USE_MOCK_AI === 'true';
    if (!useMock) {
      // Check if theme already exists
      const existingTheme = await docClient.send(new QueryCommand({
        TableName: TABLE_NAMES.THEMES,
        IndexName: 'ThemeStyleIndex',
        KeyConditionExpression: 'themeStyle = :themeStyle',
        ExpressionAttributeValues: {
          ':themeStyle': themeStyle
        }
      }));

      if (existingTheme.Items && existingTheme.Items.length > 0) {
        // Return existing theme
        const theme = existingTheme.Items[0] as Theme;
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            generationId: theme.id,
            status: 'completed',
            theme: body.theme,
            images: theme.images
          })
        };
      }
    }

    // Step 1: Generate diverse subjects using LLM
    console.log('Generating theme descriptions...');
    const imageCount = parseInt(process.env.IMAGE_GENERATION_COUNT || '25');
    const themeDescriptions = useMock 
      ? createMockThemeDescriptions({ theme: body.theme, style: body.style, count: imageCount })
      : await generateThemeDescriptions({ theme: body.theme, style: body.style, count: imageCount });
    
    // Step 2: Generate images for each specific subject
    console.log('Generating images for subjects...');
    const subjects = themeDescriptions.map(desc => desc.subject);
    const imageRequest = { subjects, style: body.style };
    const generatedImages = useMock 
      ? createMockImages(imageRequest)
      : await generateImages(imageRequest);

    // Upload images to S3 and create theme images concurrently
    const themeImagePromises = generatedImages.map(async (generated, i) => {
      const themeDesc = themeDescriptions[i];
      
      if (useMock) {
        // Mock upload for development - using placeholder images
        return {
          id: uuidv4(),
          url: `https://picsum.photos/300/300?random=${Date.now()}-${i}`,
          thumbnailUrl: `https://picsum.photos/150/150?random=${Date.now()}-${i}`,
          altText: themeDesc.subject,
          description: themeDesc.description,
          safetyScore: 0.95,
          selected: false
        };
      } else {
        const uploadResult = await uploadImageToS3(
          generated.base64Data,
          themeDesc.subject,
          body.style,
          i
        );
        
        return {
          id: uploadResult.imageId,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          altText: themeDesc.subject,
          description: themeDesc.description,
          safetyScore: 0.95, // TODO: Implement safety scoring
          selected: false
        };
      }
    });

    const themeImages = await Promise.all(themeImagePromises);

    // Save theme to database (skip in mock mode)
    const theme: Theme = {
      id: uuidv4(),
      userId: '', // Empty since themes are shared
      name: body.theme,
      images: themeImages,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    if (!useMock) {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAMES.THEMES,
        Item: {
          ...theme,
          themeStyle
        }
      }));
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        generationId: theme.id,
        status: 'completed',
        theme: body.theme,
        images: themeImages
      })
    };

  } catch (error) {
    console.error('Theme generation error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: {
          code: 'THEME_GENERATION_FAILED',
          message: 'Failed to generate theme images'
        }
      })
    };
  }
};

export const getThemes: APIGatewayProxyHandler = async (event) => {
  try {
    const user = extractUserFromEvent(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Valid authentication token required'
          }
        })
      };
    }

    // For now, return all themes since they're shared
    // In production, might want pagination
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.THEMES,
      ScanIndexForward: false, // Most recent first
      Limit: 50
    }));

    const themes = (result.Items || []).map(item => ({
      id: item.id,
      name: item.name,
      imageCount: item.images?.length || 0,
      createdAt: item.createdAt,
      lastUsed: item.lastUsed,
      thumbnailUrl: item.images?.[0]?.thumbnailUrl || ''
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        themes
      })
    };

  } catch (error) {
    console.error('Get themes error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve themes'
        }
      })
    };
  }
};