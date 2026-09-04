/**
 * Shrinks an image before upload.
 *
 * OCR on the AI service runs on CPU, and its cost scales with pixel
 * count - a 12MP phone photo took over four minutes, while the same
 * content at a sane size takes a fraction of that. Text in a homework
 * photo stays perfectly readable at 1600px on the long edge, so the
 * extra pixels buy nothing and cost a lot.
 *
 * Runs entirely in the browser, so it also cuts upload time on a phone
 * connection.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

export async function resizeImage(file: File): Promise<File> {
  // Only bitmap images benefit. Anything else is returned untouched.
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);

    // Already small enough - re-encoding would only lose quality.
    if (bitmap.width <= MAX_EDGE && bitmap.height <= MAX_EDGE) {
      bitmap.close();
      return file;
    }

    const scale = MAX_EDGE / Math.max(bitmap.width, bitmap.height);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );

    if (!blob) return file;

    // Keep the original name but correct the extension, since the
    // canvas always re-encodes as JPEG.
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch (err) {
    // If anything goes wrong, upload the original rather than failing.
    console.warn("Image resize failed, uploading original:", err);
    return file;
  }
}