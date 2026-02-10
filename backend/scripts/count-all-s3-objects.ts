import {
  S3Client,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';

const REGION = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({
  region: REGION
});

const BUCKET_NAME = process.env.S3_BUCKET || 'memory-game-images';

async function countAllS3Objects(): Promise<void> {
  console.log(`\nCounting ALL objects in S3 (with pagination)`);
  console.log(`Bucket: ${BUCKET_NAME}\n`);
  console.log('='.repeat(60));

  try {
    // Count images with pagination
    let imageCount = 0;
    let imageContinuationToken: string | undefined;
    let imagePages = 0;

    console.log('Counting images/...');
    do {
      const response = await s3Client.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'images/',
        ContinuationToken: imageContinuationToken
      }));

      const pageCount = (response.Contents || []).filter(obj => obj.Key?.endsWith('.webp')).length;
      imageCount += pageCount;
      imagePages++;

      console.log(`  Page ${imagePages}: ${pageCount} images (total so far: ${imageCount})`);

      imageContinuationToken = response.NextContinuationToken;
    } while (imageContinuationToken);

    // Count thumbnails with pagination
    let thumbnailCount = 0;
    let thumbnailContinuationToken: string | undefined;
    let thumbnailPages = 0;

    console.log('\nCounting thumbs/...');
    do {
      const response = await s3Client.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'thumbs/',
        ContinuationToken: thumbnailContinuationToken
      }));

      const pageCount = (response.Contents || []).filter(obj => obj.Key?.endsWith('.webp')).length;
      thumbnailCount += pageCount;
      thumbnailPages++;

      console.log(`  Page ${thumbnailPages}: ${pageCount} thumbnails (total so far: ${thumbnailCount})`);

      thumbnailContinuationToken = response.NextContinuationToken;
    } while (thumbnailContinuationToken);

    console.log('\n' + '='.repeat(60));
    console.log('FINAL COUNT');
    console.log('='.repeat(60));
    console.log(`Total images in images/: ${imageCount} (${imagePages} pages)`);
    console.log(`Total thumbnails in thumbs/: ${thumbnailCount} (${thumbnailPages} pages)`);
    console.log(`Total objects: ${imageCount + thumbnailCount}`);
    console.log('='.repeat(60));
    console.log();

  } catch (error) {
    console.error('\nCount failed:', error);
    process.exit(1);
  }
}

countAllS3Objects().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
