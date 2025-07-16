#!/usr/bin/env node

/**
 * Test script for Bedrock API and DynamoDB operations
 * Run with: node test-bedrock-dynamo.js
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

// AWS Configuration
const REGION = process.env.REGION || 'us-east-1';
const bedrockClient = new BedrockRuntimeClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table names
const TABLE_NAMES = {
  THEMES: process.env.THEMES_TABLE || 'memory-game-themes',
  USERS: process.env.USERS_TABLE || 'memory-game-users'
};

async function testBedrockAPI() {
  console.log('\n🔬 Testing Bedrock API Call...');
  
  const theme = 'dinosaurs';
  const style = 'cartoon';
  const prompt = `A variety of "${theme}" in cartoon style, colorful, child-friendly, simple illustration, suitable for children's memory game, isolated on white background, no text`;
  
  const payload = {
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: prompt,
      negativeText: "text, words, letters, inappropriate content, scary, violent"
    },
    imageGenerationConfig: {
      numberOfImages: 2, // Test with just 2 images to save costs
      height: 512,
      width: 512,
      cfgScale: 8.0,
      seed: Math.floor(Math.random() * 1000000)
    }
  };

  try {
    const command = new InvokeModelCommand({
      modelId: 'amazon.titan-image-generator-v2:0',
      body: JSON.stringify(payload),
    });

    console.log('📤 Sending request to Bedrock...');
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.images && responseBody.images.length > 0) {
      console.log('✅ Bedrock API Success!');
      console.log(`📊 Generated ${responseBody.images.length} images`);
      console.log(`🎯 Theme: ${theme}, Style: ${style}`);
      console.log(`📏 Image size: ${responseBody.images[0].length} bytes (base64)`);
      return {
        success: true,
        images: responseBody.images,
        theme,
        style
      };
    } else {
      throw new Error('No images returned from Bedrock');
    }
  } catch (error) {
    console.error('❌ Bedrock API Failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testDynamoDBWrite(testData) {
  console.log('\n📝 Testing DynamoDB Write Operations...');
  
  const themeId = randomUUID();
  const themeStyle = `${testData.theme}-${testData.style}`;
  
  const themeItem = {
    id: themeId,
    userId: '', // Empty since themes are shared
    name: testData.theme,
    themeStyle: themeStyle,
    images: testData.images.map((base64Data, index) => ({
      id: randomUUID(),
      url: `https://test-bucket.s3.amazonaws.com/${themeId}/${index}.jpg`,
      thumbnailUrl: `https://test-bucket.s3.amazonaws.com/${themeId}/${index}_thumb.jpg`,
      altText: `${testData.theme} ${index + 1}`,
      safetyScore: 0.95,
      selected: false
    })),
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };

  try {
    const putCommand = new PutCommand({
      TableName: TABLE_NAMES.THEMES,
      Item: themeItem
    });

    console.log('📤 Writing theme to DynamoDB...');
    await docClient.send(putCommand);
    
    console.log('✅ DynamoDB Write Success!');
    console.log(`🆔 Theme ID: ${themeId}`);
    console.log(`🎨 Theme Style: ${themeStyle}`);
    console.log(`🖼️  Images: ${themeItem.images.length}`);
    
    return { success: true, themeId, themeStyle };
  } catch (error) {
    console.error('❌ DynamoDB Write Failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testDynamoDBRead(themeId, themeStyle) {
  console.log('\n📖 Testing DynamoDB Read Operations...');
  
  try {
    // Test 1: Get item by ID
    console.log('🔍 Testing GetItem by ID...');
    const getCommand = new GetCommand({
      TableName: TABLE_NAMES.THEMES,
      Key: { id: themeId }
    });
    
    const getResponse = await docClient.send(getCommand);
    if (getResponse.Item) {
      console.log('✅ GetItem Success!');
      console.log(`📄 Retrieved theme: ${getResponse.Item.name}`);
    } else {
      console.log('❌ GetItem Failed: No item found');
      return { success: false, error: 'Item not found' };
    }

    // Test 2: Query by themeStyle (GSI)
    console.log('🔍 Testing Query by themeStyle...');
    const queryCommand = new QueryCommand({
      TableName: TABLE_NAMES.THEMES,
      IndexName: 'ThemeStyleIndex',
      KeyConditionExpression: 'themeStyle = :themeStyle',
      ExpressionAttributeValues: {
        ':themeStyle': themeStyle
      }
    });
    
    const queryResponse = await docClient.send(queryCommand);
    if (queryResponse.Items && queryResponse.Items.length > 0) {
      console.log('✅ Query Success!');
      console.log(`📊 Found ${queryResponse.Items.length} items with themeStyle: ${themeStyle}`);
    } else {
      console.log('❌ Query Failed: No items found');
      return { success: false, error: 'Query returned no results' };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ DynamoDB Read Failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Bedrock and DynamoDB Tests...');
  console.log(`📍 Region: ${REGION}`);
  console.log(`🗄️  Themes Table: ${TABLE_NAMES.THEMES}`);
  
  // Test 1: Bedrock API
  const bedrockResult = await testBedrockAPI();
  if (!bedrockResult.success) {
    console.log('\n❌ Bedrock test failed, skipping DynamoDB tests');
    process.exit(1);
  }

  // Test 2: DynamoDB Write
  const writeResult = await testDynamoDBWrite(bedrockResult);
  if (!writeResult.success) {
    console.log('\n❌ DynamoDB write test failed, skipping read tests');
    process.exit(1);
  }

  // Test 3: DynamoDB Read
  const readResult = await testDynamoDBRead(writeResult.themeId, writeResult.themeStyle);
  if (!readResult.success) {
    console.log('\n❌ DynamoDB read test failed');
    process.exit(1);
  }

  console.log('\n🎉 All tests passed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('  ✅ Bedrock API - Image generation working');
  console.log('  ✅ DynamoDB Write - Theme storage working');
  console.log('  ✅ DynamoDB Read - Theme retrieval working');
  console.log('\n✨ Your backend is ready for production!');
}

// Run the tests
main().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});