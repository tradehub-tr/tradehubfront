import { beforeEach, describe, expect, it, vi } from "vitest";
import imageCompression from "browser-image-compression";

// browser-image-compression gerçek canvas/worker gerektirir — happy-dom'da
// sahte byte'ları gerçek görsel olarak decode edemez. CI'da deterministik
// olması için modülü stub'luyoruz; asıl amaç prepareImage'ın WebP/JPEG
// yönlendirme + fallback mantığını doğrulamak.
vi.mock("browser-image-compression", () => ({
	default: vi.fn(async (file: File, options: { fileType?: string }) => {
		return new File([file], "ignored", { type: options.fileType ?? file.type });
	}),
}));

import { prepareImage } from "./compress.image";

describe("prepareImage", () => {
	beforeEach(() => {
		vi.mocked(imageCompression).mockClear();
	});

	it("WebP destekleyen tarayıcıda WebP döner", async () => {
		const file = new File([new Uint8Array(200_000)], "foto.jpg", { type: "image/jpeg" });
		const out = await prepareImage(file, { webpSupported: true });
		expect(out.converted).toBe("webp");
		expect(out.name.endsWith(".webp")).toBe(true);
	});

	it("Safari (WebP yok) JPEG fallback döner", async () => {
		const file = new File([new Uint8Array(200_000)], "foto.png", { type: "image/png" });
		const out = await prepareImage(file, { webpSupported: false });
		expect(out.converted).toBe("jpeg");
		expect(out.name.endsWith(".jpg")).toBe(true);
	});

	it("WebP istenmiş ama tarayıcı sessizce başka tür döndürmüşse (gerçek Safari tuzağı) ikinci geçişle JPEG üretir", async () => {
		const file = new File([new Uint8Array(200_000)], "foto.jpg", { type: "image/jpeg" });
		// canvas.toBlob('image/webp') bazı Safari sürümlerinde hatasız ama
		// yanlış type ile döner — feature-detect true dese bile gerçek encode
		// webp vermeyebilir. İlk çağrıyı bilerek yanlış type ile yanıtlıyoruz.
		vi.mocked(imageCompression).mockImplementationOnce(
			async (f) => new File([f], "ignored", { type: "image/jpeg" }),
		);
		const out = await prepareImage(file, { webpSupported: true });
		expect(out.converted).toBe("jpeg");
		expect(out.name.endsWith(".jpg")).toBe(true);
		expect(vi.mocked(imageCompression)).toHaveBeenCalledTimes(2);
	});
});
