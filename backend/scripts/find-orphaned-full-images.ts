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

async function findOrphanedFullImages(): Promise<void> {
  console.log(`\nFinding full images that exist but missing thumbnails`);
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

    const s3ImageKeys = new Set<string>();
    const s3ThumbKeys = new Set<string>();

    (imageListResponse.Contents || []).forEach(obj => {
      if (obj.Key && obj.Key.endsWith('.webp')) {
        s3ImageKeys.add(obj.Key);
      }
    });
    (thumbListResponse.Contents || []).forEach(obj => {
      if (obj.Key && obj.Key.endsWith('.webp')) {
        s3ThumbKeys.add(obj.Key);
      }
    });

    console.log(`Found ${s3ImageKeys.size} images and ${s3ThumbKeys.size} thumbnails in S3\n`);

    // Get all database URLs
    console.log('Scanning themes from DynamoDB...');
    let lastEvaluatedKey: Record<string, any> | undefined;

    interface ImagePair {
      themeName: string;
      imageUrl: string;
      thumbnailUrl: string;
      imageKey: string;
      thumbnailKey: string;
      imageExistsInS3: boolean;
      thumbnailExistsInS3: boolean;
    }

    const imagePairs: ImagePair[] = [];

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
            if (image.url && image.thumbnailUrl) {
              const imageKey = urlToKey(image.url);
              const thumbnailKey = urlToKey(image.thumbnailUrl);

              imagePairs.push({
                themeName: theme.name,
                imageUrl: image.url,
                thumbnailUrl: image.thumbnailUrl,
                imageKey,
                thumbnailKey,
                imageExistsInS3: s3ImageKeys.has(imageKey),
                thumbnailExistsInS3: s3ThumbKeys.has(thumbnailKey)
              });
            }
          });
        }
      });

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Analyze pairs
    const bothExist = imagePairs.filter(p => p.imageExistsInS3 && p.thumbnailExistsInS3);
    const bothMissing = imagePairs.filter(p => !p.imageExistsInS3 && !p.thumbnailExistsInS3);
    const imageExistsThumbMissing = imagePairs.filter(p => p.imageExistsInS3 && !p.thumbnailExistsInS3);
    const thumbExistsImageMissing = imagePairs.filter(p => !p.imageExistsInS3 && p.thumbnailExistsInS3);

    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total image pairs in database: ${imagePairs.length}`);
    console.log(`Both image and thumbnail exist: ${bothExist.length}`);
    console.log(`Both image and thumbnail missing: ${bothMissing.length}`);
    console.log(`Image exists BUT thumbnail missing: ${imageExistsThumbMissing.length}`);
    console.log(`Thumbnail exists BUT image missing: ${thumbExistsImageMissing.length}`);
    console.log('='.repeat(60));

    if (imageExistsThumbMissing.length > 0) {
      console.log(`\nIMAGES WITH MISSING THUMBNAILS (first 20):`);
      console.log('-'.repeat(60));
      imageExistsThumbMissing.slice(0, 20).forEach((pair, idx) => {
        console.log(`${idx + 1}. ${pair.themeName}`);
        console.log(`   Image: ${pair.imageKey}`);
        console.log(`   Thumb: ${pair.thumbnailKey} [MISSING]`);
      });
    }

    if (thumbExistsImageMissing.length > 0) {
      console.log(`\nTHUMBNAILS WITH MISSING IMAGES (first 20):`);
      console.log('-'.repeat(60));
      thumbExistsImageMissing.slice(0, 20).forEach((pair, idx) => {
        console.log(`${idx + 1}. ${pair.themeName}`);
        console.log(`   Image: ${pair.imageKey} [MISSING]`);
        console.log(`   Thumb: ${pair.thumbnailKey}`);
      });
    }

    console.log();

  } catch (error) {
    console.error('\nAnalysis failed:', error);
    process.exit(1);
  }
}

findOrphanedFullImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
