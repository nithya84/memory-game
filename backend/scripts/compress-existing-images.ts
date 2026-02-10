import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Readable } from 'stream';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const REGION = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({
  region: REGION
});

const BUCKET_NAME = process.env.S3_BUCKET || 'memory-game-images';

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';
const INTERACTIVE = process.env.INTERACTIVE !== 'false'; // Default to interactive
const DELAY_BETWEEN_BATCHES = parseInt(process.env.DELAY_MS || '1000', 10);

// Setup logging to file
const LOGS_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const LOG_FILE = path.join(LOGS_DIR, `migration-${timestamp}.log`);
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

// Logger function
function log(message: string): void {
  logStream.write(message + '\n');
}

// Console-only output (not logged)
function consoleOnly(message: string): void {
  process.stdout.write(message);
}

interface CompressionStats {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  totalSizeBefore: number;
  totalSizeAfter: number;
}

interface ThemeGroup {
  themeName: string;
  imageKeys: string[];
  thumbnailKeys: string[];
}

// Helper to convert stream to buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Extract theme name from S3 key
// Format: images/ThemeName-style-index-uuid.webp
function extractThemeName(key: string): string {
  const filename = key.split('/').pop() || '';
  // Remove folder prefix, then split by hyphen and take everything except last 3 parts (style-index-uuid)
  const parts = filename.replace('.webp', '').split('-');
  // Find the style part (cartoon, realistic, simple) and take everything before it
  const styleIndex = parts.findIndex(p => ['cartoon', 'realistic', 'simple'].includes(p));
  if (styleIndex > 0) {
    return parts.slice(0, styleIndex).join('-');
  }
  // Fallback: take everything except last 3 parts
  return parts.slice(0, -3).join('-');
}

// Group images by theme
function groupByTheme(imageKeys: string[], thumbnailKeys: string[]): ThemeGroup[] {
  const themeMap = new Map<string, ThemeGroup>();

  // Group images
  imageKeys.forEach(key => {
    const themeName = extractThemeName(key);
    if (!themeMap.has(themeName)) {
      themeMap.set(themeName, { themeName, imageKeys: [], thumbnailKeys: [] });
    }
    themeMap.get(themeName)!.imageKeys.push(key);
  });

  // Group thumbnails
  thumbnailKeys.forEach(key => {
    const themeName = extractThemeName(key);
    if (!themeMap.has(themeName)) {
      themeMap.set(themeName, { themeName, imageKeys: [], thumbnailKeys: [] });
    }
    themeMap.get(themeName)!.thumbnailKeys.push(key);
  });

  return Array.from(themeMap.values()).sort((a, b) => a.themeName.localeCompare(b.themeName));
}

// Compress a single image
async function compressImage(
  key: string,
  isFullImage: boolean,
  stats: CompressionStats
): Promise<void> {
  try {
    // Download image from S3
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    const response = await s3Client.send(getCommand);

    if (!response.Body) {
      stats.skipped++;
      return;
    }

    const originalBuffer = await streamToBuffer(response.Body as Readable);
    const originalSize = originalBuffer.length;
    stats.totalSizeBefore += originalSize;

    // Compress with Sharp
    let compressedBuffer: Buffer;
    if (isFullImage) {
      // Full image: compress at quality 85
      compressedBuffer = await sharp(originalBuffer)
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      // Thumbnail: resize to 200×200 and compress
      compressedBuffer = await sharp(originalBuffer)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();
    }

    const compressedSize = compressedBuffer.length;
    stats.totalSizeAfter += compressedSize;

    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    const baseUrl = cloudFrontDomain ? `https://${cloudFrontDomain}` : `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com`;
    const url = `${baseUrl}/${key}`;

    log(`${key.split('/').pop()} | ${url}`);

    if (DRY_RUN) {
      stats.succeeded++;
      return;
    }

    // Upload compressed version back to S3
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: compressedBuffer,
      ContentType: 'image/webp',
      CacheControl: 'max-age=31536000'
    });
    await s3Client.send(putCommand);

    stats.succeeded++;

  } catch (error) {
    log(`Failed: ${key}`);
    stats.failed++;
  }
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// List all S3 objects with pagination
async function listAllS3Objects(prefix: string): Promise<string[]> {
  const allKeys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      const keys = response.Contents
        .filter(obj => obj.Key && obj.Key.endsWith('.webp'))
        .map(obj => obj.Key!);
      allKeys.push(...keys);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return allKeys;
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

// Process a single theme
async function processTheme(theme: ThemeGroup, stats: CompressionStats): Promise<void> {
  // Process images
  for (const key of theme.imageKeys) {
    await compressImage(key, true, stats);
    stats.processed++;
  }

  // Process thumbnails
  for (const key of theme.thumbnailKeys) {
    await compressImage(key, false, stats);
    stats.processed++;
  }
}

// Main migration function
async function migrateImages(): Promise<void> {
  consoleOnly(`\nS3 Image Compression - ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);
  consoleOnly(`Bucket: ${BUCKET_NAME}\n`);
  consoleOnly(`Log file: ${LOG_FILE}\n\n`);

  log(`S3 Image Compression - ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  log(`Bucket: ${BUCKET_NAME}`);
  log(`Started: ${new Date().toISOString()}\n`);

  const stats: CompressionStats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    totalSizeBefore: 0,
    totalSizeAfter: 0
  };

  try {
    // List all objects with pagination
    consoleOnly('Listing all images from S3...\n');
    const [imageKeys, thumbnailKeys] = await Promise.all([
      listAllS3Objects('images/'),
      listAllS3Objects('thumbs/')
    ]);

    if (imageKeys.length === 0 && thumbnailKeys.length === 0) {
      consoleOnly('No images found\n');
      log('No images found');
      return;
    }

    // Group by theme
    const themes = groupByTheme(imageKeys, thumbnailKeys);
    const totalItems = imageKeys.length + thumbnailKeys.length;

    consoleOnly(`Processing ${totalItems} items...\n`);
    log(`Processing ${imageKeys.length} images and ${thumbnailKeys.length} thumbnails`);

    if (!INTERACTIVE) {
      // Process all themes without prompts
      for (let i = 0; i < themes.length; i++) {
        await processTheme(themes[i], stats);

        // Show progress every 10%
        const percent = Math.floor((stats.processed / totalItems) * 100);
        if (stats.processed % Math.ceil(totalItems / 10) === 0 || i === themes.length - 1) {
          consoleOnly(`Progress: ${percent}% (${stats.processed}/${totalItems})\r`);
        }

        if (i < themes.length - 1) {
          await sleep(DELAY_BETWEEN_BATCHES);
        }
      }
      consoleOnly('\n');
    } else {
      // Interactive mode: one theme at a time
      let continueAll = false;
      for (let i = 0; i < themes.length; i++) {
        await processTheme(themes[i], stats);

        // Don't prompt after last theme
        if (i === themes.length - 1) {
          break;
        }

        if (!continueAll) {
          const answer = await promptUser(
            `[${i + 1}/${themes.length}] ${stats.processed}/${totalItems} processed | [n]ext / [a]ll / [s]top: `
          );

          if (answer === 's' || answer === 'stop') {
            log('Stopped by user');
            break;
          } else if (answer === 'a' || answer === 'all') {
            continueAll = true;
            consoleOnly('Processing all remaining...\n');
          }
        } else {
          // Show progress in all mode
          const percent = Math.floor((stats.processed / totalItems) * 100);
          if (stats.processed % Math.ceil(totalItems / 10) === 0) {
            consoleOnly(`Progress: ${percent}% (${stats.processed}/${totalItems})\r`);
          }
        }

        await sleep(DELAY_BETWEEN_BATCHES);
      }
      consoleOnly('\n');
    }

    // Print final summary
    const totalSaved = stats.totalSizeBefore - stats.totalSizeAfter;
    const percentSaved = stats.totalSizeBefore > 0
      ? ((totalSaved / stats.totalSizeBefore) * 100).toFixed(1)
      : '0';

    const summary = [
      '\n' + '='.repeat(60),
      'SUMMARY',
      '='.repeat(60),
      `Processed: ${stats.processed} | Succeeded: ${stats.succeeded} | Failed: ${stats.failed}`,
      `Before: ${(stats.totalSizeBefore / 1024 / 1024).toFixed(2)} MB`,
      `After: ${(stats.totalSizeAfter / 1024 / 1024).toFixed(2)} MB`,
      `Saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB (${percentSaved}%)`,
      '='.repeat(60),
      DRY_RUN ? 'DRY RUN - No changes made' : 'Complete!',
      `Log file: ${LOG_FILE}`,
      ''
    ];

    // Write to both console and log
    summary.forEach(line => {
      consoleOnly(line + '\n');
      log(line);
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log('\nMigration failed: ' + errorMsg);
    consoleOnly('\nMigration failed: ' + errorMsg + '\n');
    logStream.end();
    process.exit(1);
  } finally {
    logStream.end();
  }
}

// Run migration
migrateImages().catch(error => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  log('Fatal error: ' + errorMsg);
  consoleOnly('Fatal error: ' + errorMsg + '\n');
  logStream.end();
  process.exit(1);
});
