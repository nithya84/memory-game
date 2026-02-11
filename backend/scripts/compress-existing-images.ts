import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import sharp from 'sharp';
import { Readable } from 'stream';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const REGION = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region: REGION });

const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.S3_BUCKET || 'memory-game-images';
const TABLE_NAME = process.env.THEMES_TABLE || 'memory-game-api-themes-dev';

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';
const INTERACTIVE = process.env.INTERACTIVE !== 'false';
const DELAY_BETWEEN_THEMES = parseInt(process.env.DELAY_MS || '1000', 10);

// Setup logging to file
const LOGS_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const LOG_FILE = path.join(LOGS_DIR, `migration-${timestamp}.log`);
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function log(message: string): void {
  logStream.write(message + '\n');
}

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

interface ThemeRecord {
  id: string;
  name?: string;
  theme: string;
  style: string;
  status: string;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    altText?: string;
  }>;
  createdAt: string;
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

// Extract S3 key from URL
function extractS3Key(url: string): string | null {
  try {
    // URL format: https://bucket.s3.region.amazonaws.com/path/to/file.webp
    // or: https://cloudfront.net/path/to/file.webp
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Remove leading slash and decode URL encoding
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    return decodeURIComponent(key);
  } catch (error) {
    log(`Failed to extract S3 key from URL: ${url}`);
    return null;
  }
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

    const savedBytes = originalSize - compressedSize;
    const percentSaved = ((savedBytes / originalSize) * 100).toFixed(1);

    log(`${key.split('/').pop()} | ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${percentSaved}% saved)`);

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
    log(`Failed: ${key} - ${error instanceof Error ? error.message : error}`);
    stats.failed++;
  }
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
async function processTheme(theme: ThemeRecord, stats: CompressionStats): Promise<void> {
  const themeName = theme.name || `${theme.theme} (${theme.style})`;
  const imageCount = theme.images?.length || 0;

  consoleOnly(`\n${'='.repeat(60)}\n`);
  consoleOnly(`Theme: ${themeName}\n`);
  consoleOnly(`Status: ${theme.status} | Images: ${imageCount}\n`);
  consoleOnly(`ID: ${theme.id}\n`);
  consoleOnly(`${'='.repeat(60)}\n`);

  log(`\n${'='.repeat(60)}`);
  log(`Theme: ${themeName}`);
  log(`Status: ${theme.status} | Images: ${imageCount} | ID: ${theme.id}`);
  log(`${'='.repeat(60)}`);

  if (!theme.images || theme.images.length === 0) {
    consoleOnly('No images to process\n');
    log('No images to process');
    return;
  }

  const themeStartStats = { ...stats };

  // Extract S3 keys from image URLs
  const imageKeys: string[] = [];
  const thumbnailKeys: string[] = [];

  for (const img of theme.images) {
    const imageKey = extractS3Key(img.url);
    const thumbnailKey = extractS3Key(img.thumbnailUrl);

    if (imageKey) imageKeys.push(imageKey);
    if (thumbnailKey) thumbnailKeys.push(thumbnailKey);
  }

  // Process full images
  if (imageKeys.length > 0) {
    consoleOnly(`Processing ${imageKeys.length} full images...\n`);
    log(`Processing ${imageKeys.length} full images...`);

    for (const key of imageKeys) {
      await compressImage(key, true, stats);
      stats.processed++;
    }
  }

  // Process thumbnails
  if (thumbnailKeys.length > 0) {
    consoleOnly(`Processing ${thumbnailKeys.length} thumbnails...\n`);
    log(`Processing ${thumbnailKeys.length} thumbnails...`);

    for (const key of thumbnailKeys) {
      await compressImage(key, false, stats);
      stats.processed++;
    }
  }

  // Show theme summary
  const themeSizeBefore = stats.totalSizeBefore - themeStartStats.totalSizeBefore;
  const themeSizeAfter = stats.totalSizeAfter - themeStartStats.totalSizeAfter;
  const themeSaved = themeSizeBefore - themeSizeAfter;
  const themePercent = themeSizeBefore > 0 ? ((themeSaved / themeSizeBefore) * 100).toFixed(1) : '0';

  consoleOnly(`\nTheme Summary:\n`);
  consoleOnly(`  Before: ${(themeSizeBefore / 1024 / 1024).toFixed(2)} MB\n`);
  consoleOnly(`  After: ${(themeSizeAfter / 1024 / 1024).toFixed(2)} MB\n`);
  consoleOnly(`  Saved: ${(themeSaved / 1024 / 1024).toFixed(2)} MB (${themePercent}%)\n`);

  log(`Theme Summary: ${(themeSizeBefore / 1024 / 1024).toFixed(2)}MB → ${(themeSizeAfter / 1024 / 1024).toFixed(2)}MB (${themePercent}% saved)`);
}

// Main migration function
async function migrateImages(): Promise<void> {
  consoleOnly(`\nS3 Image Compression - ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);
  consoleOnly(`Bucket: ${BUCKET_NAME}\n`);
  consoleOnly(`Table: ${TABLE_NAME}\n`);
  consoleOnly(`Log file: ${LOG_FILE}\n\n`);

  log(`S3 Image Compression - ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  log(`Bucket: ${BUCKET_NAME}`);
  log(`Table: ${TABLE_NAME}`);
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
    // Scan DynamoDB for all themes
    consoleOnly('Loading themes from DynamoDB...\n');
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME
    }));

    const themes = (scanResult.Items || []) as ThemeRecord[];

    if (themes.length === 0) {
      consoleOnly('No themes found in DynamoDB\n');
      log('No themes found in DynamoDB');
      return;
    }

    // Sort: newest first
    themes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    consoleOnly(`Found ${themes.length} themes\n`);
    log(`Found ${themes.length} themes`);

    if (!INTERACTIVE) {
      // Process all themes without prompts
      for (let i = 0; i < themes.length; i++) {
        await processTheme(themes[i], stats);
        if (i < themes.length - 1) {
          await sleep(DELAY_BETWEEN_THEMES);
        }
      }
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
            `\n[${i + 1}/${themes.length}] [n]ext theme / [a]ll remaining / [s]top: `
          );

          if (answer === 's' || answer === 'stop') {
            log('Stopped by user');
            consoleOnly('\nStopped by user\n');
            break;
          } else if (answer === 'a' || answer === 'all') {
            continueAll = true;
            consoleOnly('Processing all remaining themes...\n');
          }
        }

        await sleep(DELAY_BETWEEN_THEMES);
      }
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
