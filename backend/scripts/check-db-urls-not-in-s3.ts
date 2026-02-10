import {
  S3Client,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({
  region: REGION
});

const dynamoClient = new DynamoDBClient({
  region: REGION
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.S3_BUCKET || 'memory-game-images';
const THEMES_TABLE = process.env.THEMES_TABLE || 'memory-game-themes';

function urlToKey(url: string): string {
  try {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.pathname.substring(1));
  } catch {
    const parts = url.split('/');
    const lastTwoParts = parts.slice(-2);
    return decodeURIComponent(lastTwoParts.join('/'));
  }
}

async function checkDbUrlsNotInS3(): Promise<void> {
  console.log(`\nChecking database URLs that don't exist in S3`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Table: ${THEMES_TABLE}\n`);
  console.log('='.repeat(60));

  try {
    // Get all S3 keys
    console.log('Listing objects in S3...');
    const [imageListResponse, thumbListResponse] = await Promise.all([
      s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: 'images/' })),
      s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: 'thumbs/' }))
    ]);

    const s3Keys = new Set<string>();
    (imageListResponse.Contents || []).forEach(obj => {
      if (obj.Key && obj.Key.endsWith('.webp')) {
        s3Keys.add(obj.Key);
      }
    });
    (thumbListResponse.Contents || []).forEach(obj => {
      if (obj.Key && obj.Key.endsWith('.webp')) {
        s3Keys.add(obj.Key);
      }
    });

    console.log(`Found ${s3Keys.size} total objects in S3\n`);

    // Get all database URLs
    console.log('Scanning themes from DynamoDB...');
    let lastEvaluatedKey: Record<string, any> | undefined;

    const dbImageUrls: string[] = [];
    const dbThumbnailUrls: string[] = [];
    const missingImageUrls: string[] = [];
    const missingThumbnailUrls: string[] = [];

    do {
      const scanCommand = new ScanCommand({
        TableName: THEMES_TABLE,
        ExclusiveStartKey: lastEvaluatedKey
      });

      const result = await docClient.send(scanCommand);
      const themes = result.Items || [];

      themes.forEach(theme => {
        if (theme.images && Array.isArray(theme.images)) {
          theme.images.forEach((image: any) => {
            if (image.url) {
              dbImageUrls.push(image.url);
              const key = urlToKey(image.url);
              if (!s3Keys.has(key)) {
                missingImageUrls.push(`${image.url} -> ${key}`);
              }
            }
            if (image.thumbnailUrl) {
              dbThumbnailUrls.push(image.thumbnailUrl);
              const key = urlToKey(image.thumbnailUrl);
              if (!s3Keys.has(key)) {
                missingThumbnailUrls.push(`${image.thumbnailUrl} -> ${key}`);
              }
            }
          });
        }
      });

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total image URLs in database: ${dbImageUrls.length}`);
    console.log(`Image URLs missing from S3: ${missingImageUrls.length}`);
    console.log();
    console.log(`Total thumbnail URLs in database: ${dbThumbnailUrls.length}`);
    console.log(`Thumbnail URLs missing from S3: ${missingThumbnailUrls.length}`);
    console.log('='.repeat(60));

    if (missingImageUrls.length > 0) {
      console.log(`\nFIRST 10 MISSING IMAGE URLS:`);
      console.log('-'.repeat(60));
      missingImageUrls.slice(0, 10).forEach(url => console.log(`  ${url}`));
    }

    if (missingThumbnailUrls.length > 0) {
      console.log(`\nFIRST 10 MISSING THUMBNAIL URLS:`);
      console.log('-'.repeat(60));
      missingThumbnailUrls.slice(0, 10).forEach(url => console.log(`  ${url}`));
    }

    console.log();

  } catch (error) {
    console.error('\nAnalysis failed:', error);
    process.exit(1);
  }
}

checkDbUrlsNotInS3().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
