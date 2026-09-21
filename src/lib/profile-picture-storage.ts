type ProfilePicturePresign = {
  uploadUrl: string;
  key: string;
  apiKey: string;
  timestamp: number;
  signature: string;
};

export async function uploadProfilePictureFile(
  presign: ProfilePicturePresign,
  uri: string,
  contentType: "image/jpeg" | "image/png",
): Promise<void> {
  const extension = contentType === "image/png" ? "png" : "jpg";
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: contentType,
    name: `profile.${extension}`,
  } as unknown as Blob);
  formData.append("api_key", presign.apiKey);
  formData.append("timestamp", String(presign.timestamp));
  formData.append("signature", presign.signature);
  formData.append("public_id", presign.key);

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload to storage failed");
  }
}
