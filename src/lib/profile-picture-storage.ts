import { File as ExpoFile } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";

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

  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    formData.append("file", blob, `profile.${extension}`);
  } else {
    formData.append("file", new ExpoFile(uri));
  }

  formData.append("api_key", presign.apiKey);
  formData.append("timestamp", String(presign.timestamp));
  formData.append("signature", presign.signature);
  formData.append("public_id", presign.key);

  const uploadResponse = await expoFetch(presign.uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text().catch(() => "");
    throw new Error(body || "Upload to storage failed");
  }
}
