/**
 * Camera capture utility — KYC/KYB belge doğrulama için native kamera erişimi.
 *
 * Sadece Capacitor native platformda (iOS/Android) çalışır; web'de no-op (null
 * döner) — çağıran taraf web'de mevcut dosya upload akışına düşmeli.
 */

import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export interface CapturedPhoto {
  dataUrl: string;
  blob: Blob;
  fileName: string;
}

export async function captureDocument(): Promise<CapturedPhoto | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Let user choose camera or gallery
      width: 1600,
      height: 1200,
      correctOrientation: true,
    });

    if (!photo.dataUrl) return null;

    const blob = dataUrlToBlob(photo.dataUrl);
    const ext = photo.format === "png" ? "png" : "jpg";
    const fileName = `document_${Date.now()}.${ext}`;

    return { dataUrl: photo.dataUrl, blob, fileName };
  } catch {
    return null;
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}
