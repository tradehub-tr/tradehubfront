// Client-side medya sıkıştırma orkestrasyonu (görsel→WebP, video→WebM).
// Türe göre prepareImage/prepareVideo'ya yönlendirir; desteklenmeyen türde
// (pdf, doc, vb.) dosyayı dokunmadan geçirir.
import { prepareImage } from "./compress.image";
import { prepareVideo } from "./compress.video";

export type PreparedMedia = {
	blob: Blob;
	name: string;
	converted: "webp" | "jpeg" | "webm" | "mp4" | "none";
};

export async function prepareMedia(file: File): Promise<PreparedMedia> {
	if (file.type.startsWith("image/")) return prepareImage(file);
	if (file.type.startsWith("video/")) return prepareVideo(file);
	return { blob: file, name: file.name, converted: "none" };
}
