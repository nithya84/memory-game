import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2'
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
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  // Upload original image
  const originalKey = `images/${fileName}.webp`;
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: originalKey,
    Body: imageBuffer,
    ContentType: 'image/webp',
    CacheControl: 'max-age=31536000'
  }));
  
  // For now, use same image for thumbnail (in production, would resize)
  const thumbnailKey = `thumbs/${fileName}.webp`;
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: thumbnailKey,
    Body: imageBuffer,
    ContentType: 'image/webp',
    CacheControl: 'max-age=31536000'
  }));
  
  const baseUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`;
  
  return {
    imageId,
    url: `${baseUrl}/${originalKey}`,
    thumbnailUrl: `${baseUrl}/${thumbnailKey}`
  };
};