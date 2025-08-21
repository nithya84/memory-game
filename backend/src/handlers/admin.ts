import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand, QueryCommand, UpdateCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import Joi from 'joi';
import { docClient, TABLE_NAMES } from '../config/database';
import { generateImages, createMockImages } from '../services/imageGeneration';
import { generateThemeDescriptions, createMockThemeDescriptions } from '../services/llmService';
import { uploadImageToS3, deleteImageFromS3 } from '../services/s3Service';

const uuidv4 = randomUUID;

// Admin authentication - requires secure token
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN || ADMIN_TOKEN === 'INSECURE_DEFAULT_CHANGE_ME') {
  throw new Error('ADMIN_TOKEN environment variable must be set to a secure value');
}

function isAuthorizedAdmin(event: any): boolean {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  return authHeader === `Bearer ${ADMIN_TOKEN}`;
}

const generateThemeSchema = Joi.object({
  theme: Joi.string().min(1).max(50).required(),
  style: Joi.string().valid('cartoon', 'realistic', 'simple').required(),
  count: Joi.number().min(1).max(50).default(35)
});

const curateThemeSchema = Joi.object({
  selectedImages: Joi.array().items(Joi.string()).min(20).max(35).required(),
  finalTheme: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    previewImageId: Joi.string().required()
  }).required()
});

// Generate theme for curation (35+ images)
export const generateThemeForCuration: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('🚀 ADMIN GENERATE START: Function called');
    console.log('📝 EVENT BODY:', event.body);
    
    if (!isAuthorizedAdmin(event)) {
      console.log('❌ AUTH FAILED: Admin authentication required');
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin authentication required' })
      };
    }
    console.log('✅ AUTH SUCCESS: Admin authenticated');

    const body = JSON.parse(event.body || '{}');
    console.log('📋 PARSED BODY:', body);
    
    const { error } = generateThemeSchema.validate(body);
    if (error) {
      console.log('❌ VALIDATION FAILED:', error.details[0].message);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: error.details[0].message })
      };
    }
    console.log('✅ VALIDATION SUCCESS: Request body validated');

    const { theme, style, count } = body;
    console.log(`📊 EXTRACTED PARAMS: theme="${theme}", style="${style}", count=${count}`);
    const useMock = process.env.USE_MOCK_AI === 'true';

    // Check if theme+style combination already exists (normalize case and whitespace)
    const normalizedTheme = theme.toLowerCase().trim();
    const normalizedStyle = style.toLowerCase().trim();
    
    console.log(`🔍 DEDUP CHECK: Checking for existing theme: "${normalizedTheme}" with style: "${normalizedStyle}"`);
    
    try {
      const existingThemeResult = await docClient.send(new ScanCommand({
        TableName: TABLE_NAMES.THEMES,
        FilterExpression: 'theme = :theme AND #style = :style',
        ExpressionAttributeNames: {
          '#style': 'style'
        },
        ExpressionAttributeValues: {
          ':theme': normalizedTheme,
          ':style': normalizedStyle
        }
      }));

      console.log(`🔍 DEDUP RESULT: Found ${existingThemeResult.Items?.length || 0} matching themes`);

      if (existingThemeResult.Items && existingThemeResult.Items.length > 0) {
        // If multiple matching themes exist, combine all their images
        if (existingThemeResult.Items.length > 1) {
          console.log(`🔄 MERGING: Combining images from ${existingThemeResult.Items.length} matching themes`);
          
          const allImages: any[] = [];
          const imageIds = new Set<string>(); // Track unique image IDs to avoid duplicates
          let newestTheme = existingThemeResult.Items[0];
          
          // Find the newest theme and collect all unique images
          existingThemeResult.Items.forEach(theme => {
            if (theme.createdAt > newestTheme.createdAt) {
              newestTheme = theme;
            }
            
            if (theme.images && Array.isArray(theme.images)) {
              theme.images.forEach((img: any) => {
                if (img.id && !imageIds.has(img.id)) {
                  imageIds.add(img.id);
                  allImages.push(img);
                }
              });
            }
          });
          
          console.log(`✅ MERGED EXISTING: Combined ${allImages.length} unique images from ${existingThemeResult.Items.length} themes for ${theme}-${style}`);
          
          return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              themeId: newestTheme.id,
              theme: newestTheme.originalTheme || newestTheme.theme,
              style: newestTheme.originalStyle || newestTheme.style,
              imageCount: allImages.length,
              images: allImages,
              message: `Returning merged theme with ${allImages.length} images from ${existingThemeResult.Items.length} generations (newest: ${newestTheme.createdAt})`
            })
          };
        } else {
          // Single matching theme - use as before
          const existingTheme = existingThemeResult.Items[0];
          console.log(`✅ FOUND EXISTING: theme ID ${existingTheme.id} for ${theme}-${style}`);
          
          return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              themeId: existingTheme.id,
              theme: existingTheme.originalTheme || existingTheme.theme,
              style: existingTheme.originalStyle || existingTheme.style,
              imageCount: existingTheme.images?.length || 0,
              images: existingTheme.images || [],
              message: `Returning existing theme (created: ${existingTheme.createdAt})`
            })
          };
        }
      }

      console.log(`❌ NO MATCH: No existing theme found for ${theme}-${style}, generating new one...`);
    } catch (dedupError) {
      console.error(`🚨 DEDUP ERROR: Failed to check for existing theme:`, dedupError);
      console.log(`Proceeding with generation despite dedup error...`);
    }

    // Generate diverse subjects
    const themeDescriptions = useMock 
      ? createMockThemeDescriptions({ theme, style, count })
      : await generateThemeDescriptions({ theme, style, count });
    
    // Generate images
    const subjects = themeDescriptions.map(desc => desc.subject);
    const descriptions = themeDescriptions.map(desc => desc.description);
    const imageRequest = { subjects, descriptions, style };
    const generatedImages = useMock 
      ? createMockImages(imageRequest)
      : await generateImages(imageRequest);

    // Upload images and create theme record
    const themeImagePromises = generatedImages.map(async (generated) => {
      const themeDesc = themeDescriptions[generated.subjectIndex];
      
      if (useMock) {
        return {
          id: uuidv4(),
          url: `https://picsum.photos/300/300?random=${Date.now()}-${generated.subjectIndex}`,
          thumbnailUrl: `https://picsum.photos/150/150?random=${Date.now()}-${generated.subjectIndex}`,
          altText: themeDesc.subject,
          description: themeDesc.description,
          safetyScore: 0.95,
          selected: false
        };
      } else {
        const uploadResult = await uploadImageToS3(
          generated.base64Data,
          themeDesc.subject,
          style,
          generated.subjectIndex
        );
        
        return {
          id: uploadResult.imageId,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          altText: themeDesc.subject,
          description: themeDesc.description,
          safetyScore: 0.95,
          selected: false
        };
      }
    });

    const themeImages = await Promise.all(themeImagePromises);

    // Save as draft theme for curation
    const draftTheme = {
      id: uuidv4(),
      theme: normalizedTheme,
      style: normalizedStyle,
      originalTheme: theme, // Keep original for display purposes
      originalStyle: style,
      status: 'draft',
      images: themeImages,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.THEMES,
      Item: draftTheme
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        themeId: draftTheme.id,
        theme,
        style,
        imageCount: themeImages.length,
        images: themeImages
      })
    };

  } catch (error) {
    console.error('Admin theme generation error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to generate theme for curation' })
    };
  }
};

// Curate theme (select final 30 images)
export const curateTheme: APIGatewayProxyHandler = async (event) => {
  try {
    if (!isAuthorizedAdmin(event)) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin authentication required' })
      };
    }

    const themeId = event.pathParameters?.themeId;
    if (!themeId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Theme ID required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { error } = curateThemeSchema.validate(body);
    if (error) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: error.details[0].message })
      };
    }

    const { selectedImages, finalTheme } = body;

    // Get draft theme
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.THEMES,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: { ':id': themeId }
    }));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Theme not found' })
      };
    }

    const primaryTheme = result.Items[0];
    
    // Check if this might be a merged theme scenario
    // Find all themes with same theme+style to get full image collection
    // Handle both normalized (newer) and original (older) theme formats
    const searchTheme = (primaryTheme.originalTheme || primaryTheme.theme).toLowerCase().trim();
    const searchStyle = (primaryTheme.originalStyle || primaryTheme.style).toLowerCase().trim();
    
    console.log(`🔍 CURATION: Looking for all themes matching "${searchTheme}" + "${searchStyle}" for validation`);
    
    const allMatchingResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAMES.THEMES,
      FilterExpression: '(theme = :normalizedTheme OR theme = :originalTheme) AND (#style = :normalizedStyle OR #style = :originalStyle)',
      ExpressionAttributeNames: {
        '#style': 'style'
      },
      ExpressionAttributeValues: {
        ':normalizedTheme': searchTheme,
        ':originalTheme': searchTheme.charAt(0).toUpperCase() + searchTheme.slice(1), // Handle "Cakes" vs "cakes"
        ':normalizedStyle': searchStyle,
        ':originalStyle': searchStyle
      }
    }));
    
    // Collect all images from matching themes for validation
    const allAvailableImages: any[] = [];
    const imageIds = new Set<string>();
    
    allMatchingResult.Items?.forEach(theme => {
      if (theme.images && Array.isArray(theme.images)) {
        theme.images.forEach((img: any) => {
          if (img.id && !imageIds.has(img.id)) {
            imageIds.add(img.id);
            allAvailableImages.push(img);
          }
        });
      }
    });
    
    console.log(`🔍 CURATION: Found ${allAvailableImages.length} total available images from ${allMatchingResult.Items?.length || 0} matching themes`);
    
    // Filter to selected images from the full collection
    const curatedImages = allAvailableImages.filter((img: any) => 
      selectedImages.includes(img.id)
    );
    
    console.log(`🔍 CURATION: Selected ${selectedImages.length} images, found ${curatedImages.length} valid matches`);

    if (curatedImages.length < 20 || curatedImages.length > 35) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Must select between 20-35 valid images' })
      };
    }

    // Find rejected images to delete from S3 (from all available images)
    const rejectedImages = allAvailableImages.filter((img: any) => 
      !selectedImages.includes(img.id)
    );

    // Delete rejected images from S3 (don't await - let it run in background)
    if (rejectedImages.length > 0) {
      console.log(`Deleting ${rejectedImages.length} rejected images from S3`);
      rejectedImages.forEach((img: any) => {
        deleteImageFromS3(img.url, img.thumbnailUrl);
      });
    }

    // Update primary theme to curated status with selected images
    const curatedTheme = {
      ...primaryTheme,
      name: finalTheme.name,
      description: finalTheme.description,
      previewImageId: finalTheme.previewImageId,
      images: curatedImages,
      status: 'curated',
      curatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.THEMES,
      Item: curatedTheme
    }));

    // Delete other duplicate theme entries (keep only the curated primary theme)
    const duplicateThemes = allMatchingResult.Items?.filter(theme => theme.id !== themeId) || [];
    
    console.log(`🔍 CLEANUP ANALYSIS: Primary theme ID: ${themeId}`);
    console.log(`🔍 CLEANUP ANALYSIS: Found ${allMatchingResult.Items?.length || 0} total matching themes`);
    console.log(`🔍 CLEANUP ANALYSIS: Duplicate themes to delete: ${duplicateThemes.length}`);
    
    // Log details of each theme for debugging
    allMatchingResult.Items?.forEach((theme, index) => {
      console.log(`🔍 THEME ${index + 1}: ID=${theme.id}, theme="${theme.theme}", style="${theme.style}", status="${theme.status}", keepThis=${theme.id === themeId ? 'YES' : 'NO'}`);
    });
    
    if (duplicateThemes.length > 0) {
      console.log(`🗑️ CLEANUP: Starting deletion of ${duplicateThemes.length} duplicate theme entries`);
      
      // Delete duplicate themes sequentially with proper awaiting
      for (const duplicateTheme of duplicateThemes) {
        try {
          console.log(`🗑️ DELETING: Attempting to delete theme ${duplicateTheme.id} (theme: ${duplicateTheme.theme}, style: ${duplicateTheme.style})`);
          
          await docClient.send(new DeleteCommand({
            TableName: TABLE_NAMES.THEMES,
            Key: { id: duplicateTheme.id }
          }));
          
          console.log(`✅ DELETED: Successfully removed duplicate theme ${duplicateTheme.id}`);
        } catch (deleteError) {
          console.error(`❌ DELETE FAILED: Could not remove duplicate theme ${duplicateTheme.id}:`, deleteError);
        }
      }
      
      console.log(`🎯 CLEANUP COMPLETE: Attempted to delete ${duplicateThemes.length} duplicate themes`);
    } else {
      console.log(`ℹ️ CLEANUP: No duplicate themes found to delete`);
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        themeId,
        name: finalTheme.name,
        description: finalTheme.description,
        imageCount: curatedImages.length,
        status: 'curated',
        duplicatesRemoved: duplicateThemes.length
      })
    };

  } catch (error) {
    console.error('Theme curation error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to curate theme' })
    };
  }
};

// List all themes for admin review
export const listThemes: APIGatewayProxyHandler = async (event) => {
  try {
    if (!isAuthorizedAdmin(event)) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin authentication required' })
      };
    }

    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAMES.THEMES,
      Limit: 50
    }));

    const themes = (result.Items || []).map(item => ({
      id: item.id,
      name: item.name || `${item.theme} (${item.style})`,
      theme: item.theme,
      style: item.style,
      status: item.status,
      imageCount: item.images?.length || 0,
      createdAt: item.createdAt,
      curatedAt: item.curatedAt
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ themes })
    };

  } catch (error) {
    console.error('List themes error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to list themes' })
    };
  }
};