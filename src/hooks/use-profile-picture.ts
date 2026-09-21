import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { api, ApiError } from "@/src/lib/api";
import {
  normalizeContentType,
  validateProfileImage,
} from "@/src/lib/profile-image";
import { uploadProfilePictureFile } from "@/src/lib/profile-picture-storage";

export function useProfilePicture(onUpdated: () => Promise<void>) {
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const pickAndUpload = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photos access needed",
        "Allow photo library access to update your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const validationError = validateProfileImage(asset.fileSize, asset.mimeType);
    if (validationError) {
      Alert.alert("Could not use photo", validationError);
      return;
    }

    const contentType = normalizeContentType(asset.mimeType);
    if (!contentType) {
      Alert.alert("Could not use photo", "Please choose a JPG or PNG image.");
      return;
    }

    setUploading(true);
    setPreviewUri(asset.uri);

    try {
      const fileSize = asset.fileSize ?? 0;
      if (fileSize > 2 * 1024 * 1024) {
        throw new Error("Image must be 2MB or smaller.");
      }

      const presign = await api.presignProfilePicture({
        contentType,
        fileSize: fileSize > 0 ? fileSize : 1,
      });

      await uploadProfilePictureFile(presign, asset.uri, contentType);

      await api.updateProfilePicture({ key: presign.key });
      await onUpdated();
      setPreviewUri(null);
    } catch (err) {
      setPreviewUri(null);
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed";
      Alert.alert("Upload failed", message);
    } finally {
      setUploading(false);
    }
  }, [onUpdated]);

  return {
    uploading,
    previewUri,
    pickAndUpload,
  };
}
