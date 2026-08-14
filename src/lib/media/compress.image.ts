// Görsel sıkıştırma: browser-image-compression ile WebP'ye çevirir.
// Safari/iOS/Capacitor'da canvas.toBlob('image/webp') desteklenmediği için
// (WebP istenmiş olsa bile gerçek çıktı webp OLMAYABİLİR) sonucu kontrol edip
// gerekirse JPEG q85 ile ikinci bir geçiş yapar. Sunucu (WP2 engine.to_webp)
// JPEG geldiğinde WebP'ye tamamlıyor, bu yüzden fallback güvenli.
import imageCompression from "browser-image-compression";

import type { PreparedMedia } from "./compress";

const HEDEF_GENISLIK = 1920;
const HEDEF_MAX_MB = 0.5;

// WebP desteği tek seferlik feature-detect edilip modül seviyesinde cache'lenir.
let webpDestekCache: boolean | null = null;

async function webpDestekliMi(): Promise<boolean> {
	if (webpDestekCache !== null) return webpDestekCache;
	webpDestekCache = await new Promise<boolean>((resolve) => {
		const canvas = document.createElement("canvas");
		canvas.width = 1;
		canvas.height = 1;
		canvas.toBlob((blob) => resolve(blob?.type === "image/webp"), "image/webp");
	});
	return webpDestekCache;
}

function tabanAd(name: string): string {
	const idx = name.lastIndexOf(".");
	return idx > 0 ? name.slice(0, idx) : name;
}

export interface PrepareImageOptions {
	/** Test/çağıran feature-detect sonucunu doğrudan verebilir; verilmezse otomatik saptanır. */
	webpSupported?: boolean;
	maxWidth?: number;
	maxSizeMB?: number;
}

export async function prepareImage(file: File, opts: PrepareImageOptions = {}): Promise<PreparedMedia> {
	const webpDestek = opts.webpSupported ?? (await webpDestekliMi());
	const maxWidthOrHeight = opts.maxWidth ?? HEDEF_GENISLIK;
	const maxSizeMB = opts.maxSizeMB ?? HEDEF_MAX_MB;
	const taban = tabanAd(file.name);

	if (!webpDestek) {
		// Tarayıcı WebP desteklemiyor (veya çağıran zaten biliyor) — doğrudan JPEG.
		const jpeg = await imageCompression(file, {
			maxWidthOrHeight,
			maxSizeMB,
			initialQuality: 0.85,
			useWebWorker: true,
			fileType: "image/jpeg",
		});
		return { blob: jpeg, name: `${taban}.jpg`, converted: "jpeg" };
	}

	const webpDenemesi = await imageCompression(file, {
		maxWidthOrHeight,
		maxSizeMB,
		initialQuality: 0.8,
		useWebWorker: true,
		fileType: "image/webp",
	});

	if (webpDenemesi.type === "image/webp") {
		return { blob: webpDenemesi, name: `${taban}.webp`, converted: "webp" };
	}

	// Safari tuzağı: canvas.toBlob('image/webp') sessizce başka type döndürdü —
	// güvenilir JPEG q85 ile ikinci geçiş yap.
	const jpeg = await imageCompression(file, {
		maxWidthOrHeight,
		maxSizeMB,
		initialQuality: 0.85,
		useWebWorker: true,
		fileType: "image/jpeg",
	});
	return { blob: jpeg, name: `${taban}.jpg`, converted: "jpeg" };
}
