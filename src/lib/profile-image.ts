export const PROFILE_PICTURE_MAX_BYTES = 2 * 1024 * 1024;

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/jpg"]);

export function validateProfileImage(
  fileSize: number | undefined,
  mimeType: string | undefined,
): string | null {
  const contentType = normalizeContentType(mimeType);
  if (!contentType) {
    return "Please choose a JPG or PNG image.";
  }
  if (fileSize != null && fileSize > PROFILE_PICTURE_MAX_BYTES) {
    return "Image must be 2MB or smaller.";
  }
  return null;
}

export function normalizeContentType(
  mimeType: string | undefined,
): "image/jpeg" | "image/png" | null {
  if (!mimeType) return "image/jpeg";
  if (mimeType === "image/jpg" || mimeType === "image/jpeg") return "image/jpeg";
  if (mimeType === "image/png") return "image/png";
  return null;
}
