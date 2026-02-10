import {
  S3Client,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { writeFileSync } from 'fs';
import { join } from 'path';

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

interface OrphanStats {
  totalS3Images: number;
  totalS3Thumbnails: number;
  referencedImages: number;
  referencedThumbnails: number;
  orphanImages: number;
  orphanThumbnails: number;
}

// Extract S3 key from full URL
// URL format: https://domain.com/images/filename.webp or https://domain.com/thumbs/filename.webp
function urlToKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // Get pathname, remove leading slash, and decode URL-encoded characters (like %20 to space)
    return decodeURIComponent(urlObj.pathname.substring(1));
  } catch {
    // Fallback: if URL parsing fails, try to extract key manually
    const parts = url.split('/');
    const lastTwoParts = parts.slice(-2);
    return decodeURIComponent(lastTwoParts.join('/'));
  }
}

// Get all image URLs referenced in themes
async function getReferencedImageKeys(): Promise<Set<string>> {
  const referencedKeys = new Set<string>();
  let lastEvaluatedKey: Record<string, any> | undefined;

  console.log('Scanning themes from DynamoDB...');

  let sampleUrls: string[] = [];

  do {
    const scanCommand = new ScanCommand({
      TableName: THEMES_TABLE,
      ExclusiveStartKey: lastEvaluatedKey
    });

    const result = await docClient.send(scanCommand);
    const themes = result.Items || [];

    console.log(`Found ${themes.length} themes in this batch...`);

    // Extract image URLs from each theme
    themes.forEach(theme => {
      if (theme.images && Array.isArray(theme.images)) {
        theme.images.forEach((image: any) => {
          if (image.url) {
            const key = urlToKey(image.url);
            referencedKeys.add(key);
            // Collect first few sample URLs for debugging
            if (sampleUrls.length < 3) {
              sampleUrls.push(image.url);
            }
          }
          if (image.thumbnailUrl) {
            const key = urlToKey(image.thumbnailUrl);
            referencedKeys.add(key);
          }
        });
      }
    });

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  // Debug output
  if (sampleUrls.length > 0) {
    console.log('\nSample URLs from database:');
    sampleUrls.forEach(url => {
      console.log(`  URL: ${url}`);
      console.log(`  Key: ${urlToKey(url)}`);
    });
    console.log();
  }

  console.log(`Total referenced image keys: ${referencedKeys.size}\n`);
  return referencedKeys;
}

// Get all S3 object keys with pagination
async function getAllS3Keys(): Promise<{ imageKeys: string[], thumbnailKeys: string[] }> {
  console.log('Listing objects in S3 (with pagination)...');

  // Get all images with pagination
  const imageKeys: string[] = [];
  let imageContinuationToken: string | undefined;
  do {
    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'images/',
      ContinuationToken: imageContinuationToken
    }));

    (response.Contents || [])
      .filter(obj => obj.Key && obj.Key.endsWith('.webp'))
      .forEach(obj => imageKeys.push(obj.Key!));

    imageContinuationToken = response.NextContinuationToken;
  } while (imageContinuationToken);

  // Get all thumbnails with pagination
  const thumbnailKeys: string[] = [];
  let thumbnailContinuationToken: string | undefined;
  do {
    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'thumbs/',
      ContinuationToken: thumbnailContinuationToken
    }));

    (response.Contents || [])
      .filter(obj => obj.Key && obj.Key.endsWith('.webp'))
      .forEach(obj => thumbnailKeys.push(obj.Key!));

    thumbnailContinuationToken = response.NextContinuationToken;
  } while (thumbnailContinuationToken);

  console.log(`Found ${imageKeys.length} images and ${thumbnailKeys.length} thumbnails in S3\n`);

  return { imageKeys, thumbnailKeys };
}

// Find orphan images
async function findOrphanImages(): Promise<void> {
  console.log(`\nOrphan Image Finder`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Table: ${THEMES_TABLE}\n`);
  console.log('='.repeat(60));

  const stats: OrphanStats = {
    totalS3Images: 0,
    totalS3Thumbnails: 0,
    referencedImages: 0,
    referencedThumbnails: 0,
    orphanImages: 0,
    orphanThumbnails: 0
  };

  try {
    // Get all referenced keys from themes
    const referencedKeys = await getReferencedImageKeys();

    // Get all S3 keys
    const { imageKeys, thumbnailKeys } = await getAllS3Keys();

    stats.totalS3Images = imageKeys.length;
    stats.totalS3Thumbnails = thumbnailKeys.length;

    // Find orphan images
    const orphanImages: string[] = [];
    const orphanThumbnails: string[] = [];

    console.log('Analyzing images for orphans...\n');

    // Check images
    imageKeys.forEach(key => {
      if (referencedKeys.has(key)) {
        stats.referencedImages++;
      } else {
        stats.orphanImages++;
        orphanImages.push(key);
      }
    });

    // Check thumbnails
    thumbnailKeys.forEach(key => {
      if (referencedKeys.has(key)) {
        stats.referencedThumbnails++;
      } else {
        stats.orphanThumbnails++;
        orphanThumbnails.push(key);
      }
    });

    // Print summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Images in S3: ${stats.totalS3Images}`);
    console.log(`Referenced Images: ${stats.referencedImages}`);
    console.log(`Orphan Images: ${stats.orphanImages}`);
    console.log();
    console.log(`Total Thumbnails in S3: ${stats.totalS3Thumbnails}`);
    console.log(`Referenced Thumbnails: ${stats.referencedThumbnails}`);
    console.log(`Orphan Thumbnails: ${stats.orphanThumbnails}`);
    console.log();
    console.log(`Total Orphans: ${stats.orphanImages + stats.orphanThumbnails}`);
    console.log('='.repeat(60));

    // Print orphan lists if any found
    if (orphanImages.length > 0) {
      console.log('\nORPHAN IMAGES:');
      console.log('-'.repeat(60));
      orphanImages.forEach(key => console.log(`  ${key}`));
    }

    if (orphanThumbnails.length > 0) {
      console.log('\nORPHAN THUMBNAILS:');
      console.log('-'.repeat(60));
      orphanThumbnails.forEach(key => console.log(`  ${key}`));
    }

    if (orphanImages.length === 0 && orphanThumbnails.length === 0) {
      console.log('\n✓ No orphan images found! All S3 objects are referenced by themes.');
    }

    // Write orphans to file
    const outputData = {
      timestamp: new Date().toISOString(),
      bucket: BUCKET_NAME,
      table: THEMES_TABLE,
      stats,
      orphans: {
        images: orphanImages,
        thumbnails: orphanThumbnails
      }
    };

    const outputPath = join(__dirname, 'orphan-images.json');
    writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n✓ Results written to: ${outputPath}`);

    console.log();

  } catch (error) {
    console.error('\nAnalysis failed:', error);
    process.exit(1);
  }
}

// Run analysis
findOrphanImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
