import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const REGION = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({
  region: REGION
});

const BUCKET_NAME = process.env.S3_BUCKET || 'memory-game-images';
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry-run for safety
const BATCH_SIZE = 1000; // S3 DeleteObjects max is 1000

interface OrphanData {
  timestamp: string;
  bucket: string;
  table: string;
  stats: {
    totalS3Images: number;
    totalS3Thumbnails: number;
    referencedImages: number;
    referencedThumbnails: number;
    orphanImages: number;
    orphanThumbnails: number;
  };
  orphans: {
    images: string[];
    thumbnails: string[];
  };
}

// Interactive prompt
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Delete objects in batches
async function deleteObjectsBatch(keys: string[]): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  // Split into batches of 1000 (S3 limit)
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);

    try {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would delete batch of ${batch.length} objects`);
        succeeded += batch.length;
      } else {
        const response = await s3Client.send(new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: batch.map(key => ({ Key: key })),
            Quiet: false
          }
        }));

        const deletedCount = response.Deleted?.length || 0;
        const errorCount = response.Errors?.length || 0;

        succeeded += deletedCount;
        failed += errorCount;

        if (errorCount > 0) {
          console.log(`  ⚠️  ${errorCount} errors in this batch:`);
          response.Errors?.forEach(err => {
            console.log(`     ${err.Key}: ${err.Code} - ${err.Message}`);
          });
        }

        console.log(`  ✓ Deleted ${deletedCount} objects (${i + batch.length}/${keys.length})`);
      }
    } catch (error) {
      console.error(`  ✗ Batch deletion failed:`, error);
      failed += batch.length;
    }
  }

  return { succeeded, failed };
}

async function deleteOrphans(): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log('S3 ORPHAN DELETION SCRIPT');
  console.log(`${'='.repeat(60)}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no actual deletions)' : 'LIVE DELETION'}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Load orphan data
    const orphanFilePath = join(__dirname, 'orphan-images.json');
    console.log(`Loading orphan data from: ${orphanFilePath}`);

    const orphanData: OrphanData = JSON.parse(readFileSync(orphanFilePath, 'utf-8'));

    console.log(`\nOrphan analysis from: ${orphanData.timestamp}`);
    console.log(`Original bucket: ${orphanData.bucket}`);
    console.log(`Original table: ${orphanData.table}`);

    if (orphanData.bucket !== BUCKET_NAME) {
      console.log(`\n⚠️  WARNING: Orphan data was generated for bucket "${orphanData.bucket}"`);
      console.log(`   but you're about to delete from bucket "${BUCKET_NAME}"`);
      const answer = await promptUser('\nContinue anyway? (yes/no): ');
      if (answer !== 'yes') {
        console.log('Aborted.');
        return;
      }
    }

    const orphanImages = orphanData.orphans.images;
    const orphanThumbnails = orphanData.orphans.thumbnails;
    const totalOrphans = orphanImages.length + orphanThumbnails.length;

    console.log(`\n${'='.repeat(60)}`);
    console.log('ORPHAN SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Orphan Images: ${orphanImages.length}`);
    console.log(`Orphan Thumbnails: ${orphanThumbnails.length}`);
    console.log(`Total Orphans: ${totalOrphans}`);
    console.log(`${'='.repeat(60)}\n`);

    if (totalOrphans === 0) {
      console.log('✓ No orphans to delete!');
      return;
    }

    // Show sample of what will be deleted
    console.log('Sample of objects to be deleted:');
    console.log('-'.repeat(60));
    orphanImages.slice(0, 5).forEach(key => console.log(`  ${key}`));
    if (orphanImages.length > 5) {
      console.log(`  ... and ${orphanImages.length - 5} more images`);
    }
    orphanThumbnails.slice(0, 5).forEach(key => console.log(`  ${key}`));
    if (orphanThumbnails.length > 5) {
      console.log(`  ... and ${orphanThumbnails.length - 5} more thumbnails`);
    }
    console.log('-'.repeat(60));

    // Confirm deletion
    if (!DRY_RUN) {
      console.log(`\n⚠️  WARNING: You are about to PERMANENTLY DELETE ${totalOrphans} objects from S3!`);
      console.log(`   Bucket: ${BUCKET_NAME}`);
      console.log(`   This action CANNOT be undone.\n`);

      const answer = await promptUser('Type "DELETE" to confirm: ');
      if (answer !== 'delete') {
        console.log('Deletion cancelled.');
        return;
      }
    }

    console.log(`\nStarting deletion...`);

    // Delete images
    let totalSucceeded = 0;
    let totalFailed = 0;

    if (orphanImages.length > 0) {
      console.log(`\nDeleting ${orphanImages.length} orphan images...`);
      const result = await deleteObjectsBatch(orphanImages);
      totalSucceeded += result.succeeded;
      totalFailed += result.failed;
    }

    // Delete thumbnails
    if (orphanThumbnails.length > 0) {
      console.log(`\nDeleting ${orphanThumbnails.length} orphan thumbnails...`);
      const result = await deleteObjectsBatch(orphanThumbnails);
      totalSucceeded += result.succeeded;
      totalFailed += result.failed;
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('DELETION SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total objects processed: ${totalOrphans}`);
    console.log(`Successfully deleted: ${totalSucceeded}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`${'='.repeat(60)}\n`);

    if (DRY_RUN) {
      console.log('✓ DRY RUN COMPLETE - No actual deletions were made');
      console.log('\nTo perform actual deletion, run:');
      console.log('  DRY_RUN=false npm run orphan:delete\n');
    } else {
      console.log('✓ DELETION COMPLETE');
    }

  } catch (error) {
    console.error('\n✗ Deletion script failed:', error);
    process.exit(1);
  }
}

// Run deletion
deleteOrphans().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
