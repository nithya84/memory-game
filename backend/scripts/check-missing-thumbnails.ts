import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
const dynamoClient = new DynamoDBClient({
  region: REGION
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const THEMES_TABLE = process.env.THEMES_TABLE || 'memory-game-themes';

async function checkMissingThumbnails(): Promise<void> {
  console.log(`\nChecking for missing thumbnailUrl fields`);
  console.log(`Table: ${THEMES_TABLE}\n`);
  console.log('='.repeat(60));

  try {
    let lastEvaluatedKey: Record<string, any> | undefined;
    let totalImages = 0;
    let imagesWithThumbnails = 0;
    let imagesWithoutThumbnails = 0;
    const missingExamples: any[] = [];

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
            totalImages++;

            if (image.url && image.thumbnailUrl) {
              imagesWithThumbnails++;
            } else if (image.url && !image.thumbnailUrl) {
              imagesWithoutThumbnails++;
              // Collect examples
              if (missingExamples.length < 10) {
                missingExamples.push({
                  themeId: theme.id,
                  themeName: theme.name,
                  imageId: image.id,
                  url: image.url,
                  thumbnailUrl: image.thumbnailUrl
                });
              }
            }
          });
        }
      });

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total images in database: ${totalImages}`);
    console.log(`Images WITH thumbnailUrl: ${imagesWithThumbnails}`);
    console.log(`Images WITHOUT thumbnailUrl: ${imagesWithoutThumbnails}`);
    console.log('='.repeat(60));

    if (missingExamples.length > 0) {
      console.log('\nEXAMPLES OF MISSING THUMBNAILS:');
      console.log('-'.repeat(60));
      missingExamples.forEach((ex, idx) => {
        console.log(`\n${idx + 1}. Theme: ${ex.themeName} (${ex.themeId})`);
        console.log(`   Image ID: ${ex.imageId}`);
        console.log(`   URL: ${ex.url}`);
        console.log(`   Thumbnail: ${ex.thumbnailUrl || 'MISSING'}`);
      });
    }

    console.log();

  } catch (error) {
    console.error('\nAnalysis failed:', error);
    process.exit(1);
  }
}

checkMissingThumbnails().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
