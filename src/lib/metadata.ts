import exifr from "exifr";
import sharp from "sharp";

type ImageMetadata = {
  width?: number;
  height?: number;
  exif?: Record<string, unknown>;
};

export async function extractImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const imageInfo = await sharp(buffer).metadata();
  const exif = await exifr.parse(buffer).catch(() => undefined);

  return {
    width: imageInfo.width,
    height: imageInfo.height,
    exif: exif ? (exif as Record<string, unknown>) : undefined,
  };
}
