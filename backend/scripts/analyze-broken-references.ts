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

async function analyzeBrokenReferences(): Promise<void> {
  console.log(`\nAnalyzing themes with broken thumbnail references`);
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

    // Get all database themes and check references
    console.log('Scanning themes from DynamoDB...');
    let lastEvaluatedKey: Record<string, any> | undefined;

    interface ThemeAnalysis {
      themeId: string;
      themeName: string;
      status: string;
      totalImages: number;
      brokenImages: number;
      brokenThumbnails: number;
      brokenImageList: string[];
    }

    const themeAnalysis: ThemeAnalysis[] = [];
    let totalBrokenImages = 0;
    let totalBrokenThumbnails = 0;

    do {
      const scanCommand = new ScanCommand({
        TableName: THEMES_TABLE,
        ExclusiveStartKey: lastEvaluatedKey
      });

      const result = await docClient.send(scanCommand);
      const themes = result.Items || [];

      themes.forEach(theme => {
        const analysis: ThemeAnalysis = {
          themeId: theme.id,
          themeName: theme.name,
          status: theme.status,
          totalImages: 0,
          brokenImages: 0,
          brokenThumbnails: 0,
          brokenImageList: []
        };

        if (theme.images && Array.isArray(theme.images)) {
          theme.images.forEach((image: any) => {
            analysis.totalImages++;

            const imageKey = urlToKey(image.url);
            const thumbnailKey = urlToKey(image.thumbnailUrl);

            const imageExists = s3ImageKeys.has(imageKey);
            const thumbnailExists = s3ThumbKeys.has(thumbnailKey);

            // Track cases where image exists but thumbnail is missing
            if (imageExists && !thumbnailExists) {
              analysis.brokenThumbnails++;
              analysis.brokenImageList.push(imageKey);
              totalBrokenThumbnails++;
            }

            // Track cases where image is missing
            if (!imageExists) {
              analysis.brokenImages++;
              totalBrokenImages++;
            }
          });
        }

        // Only add themes with broken references
        if (analysis.brokenImages > 0 || analysis.brokenThumbnails > 0) {
          themeAnalysis.push(analysis);
        }
      });

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Sort by most broken thumbnails first
    themeAnalysis.sort((a, b) => b.brokenThumbnails - a.brokenThumbnails);

    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total themes with broken references: ${themeAnalysis.length}`);
    console.log(`Total broken images (missing from S3): ${totalBrokenImages}`);
    console.log(`Total broken thumbnails (image exists, thumbnail missing): ${totalBrokenThumbnails}`);
    console.log('='.repeat(60));

    console.log('\nTHEMES WITH BROKEN REFERENCES:');
    console.log('-'.repeat(60));
    themeAnalysis.forEach(theme => {
      console.log(`\n${theme.themeName} (${theme.status})`);
      console.log(`  ID: ${theme.themeId}`);
      console.log(`  Total images: ${theme.totalImages}`);
      console.log(`  Missing images: ${theme.brokenImages}`);
      console.log(`  Missing thumbnails: ${theme.brokenThumbnails}`);
    });

    // Write detailed report to file
    const outputData = {
      timestamp: new Date().toISOString(),
      bucket: BUCKET_NAME,
      table: THEMES_TABLE,
      summary: {
        totalThemesWithBrokenRefs: themeAnalysis.length,
        totalBrokenImages,
        totalBrokenThumbnails
      },
      themes: themeAnalysis
    };

    const outputPath = join(__dirname, 'broken-references.json');
    writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n✓ Detailed report written to: ${outputPath}`);

    console.log();

  } catch (error) {
    console.error('\nAnalysis failed:', error);
    process.exit(1);
  }
}

analyzeBrokenReferences().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
