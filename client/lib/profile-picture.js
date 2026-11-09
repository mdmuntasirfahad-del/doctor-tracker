const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const OUTPUT_QUALITY = 0.85;

export const PROFILE_PICTURE_ACCEPT = ACCEPTED_TYPES.join(",");

export const PROFILE_PICTURE_HINT = "JPEG, PNG, or WebP up to 8 MB. Cropped to a square.";

export async function fileToProfilePicture(file) {
  if (!file) {
    throw new Error("Choose a profile picture.");
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("The profile picture must be 8 MB or smaller.");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That image could not be read. Try a different file.");
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sourceX = (bitmap.width - side) / 2;
    const sourceY = (bitmap.height - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Your browser could not process that image.");
    }

    // Fill first so transparent PNG areas do not turn black in the JPEG output.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    return canvas.toDataURL("image/jpeg", OUTPUT_QUALITY);
  } finally {
    bitmap.close?.();
  }
}
