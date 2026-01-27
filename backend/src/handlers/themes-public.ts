import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../config/database';

// Get all curated themes for public use (no auth required)
export const getThemes: APIGatewayProxyHandler = async (event) => {
  try {
    // Scan for curated themes only
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAMES.THEMES,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'curated'
      }
      // Note: No Limit - scan all items to ensure all curated themes are found
    }));

    const themes = (result.Items || []).map(item => {
      // Find preview image
      const previewImage = item.images?.find((img: any) => img.id === item.previewImageId) 
        || item.images?.[0];

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        imageCount: item.images?.length || 0,
        previewImage: previewImage ? {
          url: previewImage.url,
          thumbnailUrl: previewImage.thumbnailUrl,
          altText: previewImage.altText
        } : null,
        // Don't include all images in list view for performance
        createdAt: item.curatedAt || item.createdAt
      };
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ themes })
    };

  } catch (error) {
    console.error('Get themes error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get themes' })
    };
  }
};

// Get specific theme with all images for gameplay
export const getThemeImages: APIGatewayProxyHandler = async (event) => {
  try {
    const themeId = event.pathParameters?.themeId;
    if (!themeId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Theme ID required' })
      };
    }

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

    const theme = result.Items[0];

    // Only return curated themes
    if (theme.status !== 'curated') {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Theme not available' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        images: theme.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          altText: img.altText,
          description: img.description
        }))
      })
    };

  } catch (error) {
    console.error('Get theme images error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get theme images' })
    };
  }
};