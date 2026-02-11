import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Jimp } from 'jimp';

const uuidv4 = randomUUID;

const s3Client = new S3Client({
  region: process.env.REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET || 'memory-game-images';

export interface UploadResult {
  imageId: string;
  url: string;
  thumbnailUrl: string;
}

export const uploadImageToS3 = async (
  base64Data: string,
  theme: string,
  style: string,
  index: number
): Promise<UploadResult> => {
  const imageId = uuidv4();
  const fileName = `${theme}-${style}-${index}-${imageId}`;

  // Convert base64 to buffer
  const rawBuffer = Buffer.from(base64Data, 'base64');

  // Load image with Jimp and compress
  const image = await Jimp.read(rawBuffer);
  const compressedBuffer = await image.getBuffer('image/jpeg', { quality: 85 });

  // Upload compressed image
  const originalKey = `images/${fileName}.jpg`;
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: originalKey,
    Body: compressedBuffer,
    ContentType: 'image/jpeg',
    CacheControl: 'max-age=31536000'
  }));

  // Create and upload thumbnail (200x200)
  const thumbnailImage = await Jimp.read(rawBuffer);
  thumbnailImage.resize({ w: 200, h: 200 });
  const thumbnailBuffer = await thumbnailImage.getBuffer('image/jpeg', { quality: 85 });

  const thumbnailKey = `thumbs/${fileName}.jpg`;
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: thumbnailKey,
    Body: thumbnailBuffer,
    ContentType: 'image/jpeg',
    CacheControl: 'max-age=31536000'
  }));

  const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
  const baseUrl = cloudFrontDomain ? `https://${cloudFrontDomain}` : `https://${BUCKET_NAME}.s3.${process.env.REGION || 'us-east-1'}.amazonaws.com`;

  return {
    imageId,
    url: `${baseUrl}/${originalKey}`,
    thumbnailUrl: `${baseUrl}/${thumbnailKey}`
  };
};

// Delete image from S3 (both original and thumbnail)
export const deleteImageFromS3 = async (imageUrl: string, thumbnailUrl: string): Promise<void> => {
  try {
    // Extract keys from URLs
    const originalKey = imageUrl.split('/').slice(-2).join('/'); // Get "images/filename.webp"
    const thumbnailKey = thumbnailUrl.split('/').slice(-2).join('/'); // Get "thumbs/filename.webp"
    
    // Delete original image
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalKey
    }));
    
    // Delete thumbnail
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailKey
    }));
    
    console.log(`Deleted S3 objects: ${originalKey}, ${thumbnailKey}`);
  } catch (error) {
    console.error('Error deleting S3 objects:', error);
    // Don't throw - curate operation should succeed even if cleanup fails
  }
};