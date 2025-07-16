#!/usr/bin/env node

/**
 * Test script for DynamoDB operations only
 * Run with: node test-dynamo-only.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

// AWS Configuration
const REGION = 'us-east-1'; // Keep DynamoDB in us-east-1
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table names
const TABLE_NAMES = {
  THEMES: process.env.THEMES_TABLE || 'memory-game-themes',
  USERS: process.env.USERS_TABLE || 'memory-game-users'
};

async function testDynamoDBWrite() {
  console.log('\n📝 Testing DynamoDB Write Operations...');
  
  const themeId = randomUUID();
  const theme = 'dinosaurs';
  const style = 'cartoon';
  const themeStyle = `${theme}-${style}`;
  
  const themeItem = {
    id: themeId,
    userId: '', // Empty since themes are shared
    name: theme,
    themeStyle: themeStyle,
    images: [
      {
        id: randomUUID(),
        url: `https://test-bucket.s3.amazonaws.com/${themeId}/0.jpg`,
        thumbnailUrl: `https://test-bucket.s3.amazonaws.com/${themeId}/0_thumb.jpg`,
        altText: `${theme} 1`,
        safetyScore: 0.95,
        selected: false
      },
      {
        id: randomUUID(),
        url: `https://test-bucket.s3.amazonaws.com/${themeId}/1.jpg`,
        thumbnailUrl: `https://test-bucket.s3.amazonaws.com/${themeId}/1_thumb.jpg`,
        altText: `${theme} 2`,
        safetyScore: 0.95,
        selected: false
      }
    ],
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
      console.log(`🖼️  Images in theme: ${getResponse.Item.images?.length || 0}`);
    } else {
      console.log('❌ GetItem Failed: No item found');
      return { success: false, error: 'Item not found' };
    }

    // Test 2: Query by themeStyle (GSI)
    console.log('🔍 Testing Query by themeStyle GSI...');
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
      console.log(`📄 First result: ${queryResponse.Items[0].name}`);
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
  console.log('🚀 Starting DynamoDB Tests...');
  console.log(`📍 Region: ${REGION}`);
  console.log(`🗄️  Themes Table: ${TABLE_NAMES.THEMES}`);
  
  // Test 1: DynamoDB Write
  const writeResult = await testDynamoDBWrite();
  if (!writeResult.success) {
    console.log('\n❌ DynamoDB write test failed');
    console.log('💡 Make sure the DynamoDB table exists and you have proper permissions');
    process.exit(1);
  }

  // Test 2: DynamoDB Read
  const readResult = await testDynamoDBRead(writeResult.themeId, writeResult.themeStyle);
  if (!readResult.success) {
    console.log('\n❌ DynamoDB read test failed');
    process.exit(1);
  }

  console.log('\n🎉 DynamoDB tests passed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('  ✅ DynamoDB Write - Theme storage working');
  console.log('  ✅ DynamoDB Read - Theme retrieval working');
  console.log('  ✅ GSI Query - ThemeStyleIndex working');
  console.log('\n✨ Your DynamoDB setup is ready!');
  console.log('\n💡 Next step: Enable Bedrock model access in AWS console');
}

// Run the tests
main().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});