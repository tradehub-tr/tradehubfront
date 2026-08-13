import { beforeEach, describe, expect, it, vi } from "vitest";

// mediabunny gerçek encode'u CI'da çalışmaz (VideoEncoder/WebCodecs happy-dom'da
// yok) — modülü baştan sona stub'luyoruz, sadece prepareVideo'nun karar
// mantığını (codec seçimi, süre/boyut eşiği, hata durumunda 'none') test ediyoruz.
const mocks = vi.hoisted(() => ({
	computeDuration: vi.fn(async () => 10),
	getEncodableVideoCodecs: vi.fn(async () => ["vp9", "avc"]),
	execute: vi.fn(async () => undefined),
}));

vi.mock("mediabunny", () => {
	class Input {
		computeDuration = mocks.computeDuration;
	}
	class BlobSource {}
	class BufferTarget {
		buffer: ArrayBuffer | null = new ArrayBuffer(8);
	}
	class Output {
		target: InstanceType<typeof BufferTarget>;
		constructor(opts: { target: InstanceType<typeof BufferTarget> }) {
			this.target = opts.target;
		}
	}
	class WebMOutputFormat {}
	class Mp4OutputFormat {}
	class Conversion {
		isValid = true;
		execute = mocks.execute;
		static init = vi.fn(async () => new Conversion());
	}
	return {
		Input,
		Output,
		BlobSource,
		BufferTarget,
		WebMOutputFormat,
		Mp4OutputFormat,
		Conversion,
		ALL_FORMATS: [],
		getEncodableVideoCodecs: mocks.getEncodableVideoCodecs,
	};
});

import { prepareVideo } from "./compress.video";

function dosyaOlustur(name: string, sizeBytes: number, type = "video/mp4"): File {
	return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("prepareVideo", () => {
	beforeEach(() => {
		mocks.computeDuration.mockClear();
		mocks.getEncodableVideoCodecs.mockClear();
		mocks.execute.mockClear();
	});

	it("VP9 destekleniyorsa WebM üretir", async () => {
		mocks.getEncodableVideoCodecs.mockResolvedValueOnce(["vp9", "avc"]);
		mocks.computeDuration.mockResolvedValueOnce(10);
		const out = await prepareVideo(dosyaOlustur("klip.mp4", 1_000_000));
		expect(out.converted).toBe("webm");
		expect(out.name.endsWith(".webm")).toBe(true);
	});

	it("VP9 yoksa H.264/MP4 üretir", async () => {
		mocks.getEncodableVideoCodecs.mockResolvedValueOnce(["avc"]);
		mocks.computeDuration.mockResolvedValueOnce(10);
		const out = await prepareVideo(dosyaOlustur("klip.mov", 1_000_000));
		expect(out.converted).toBe("mp4");
		expect(out.name.endsWith(".mp4")).toBe(true);
	});

	it("hiçbir hedef codec desteklenmiyorsa dokunmadan geçer", async () => {
		mocks.getEncodableVideoCodecs.mockResolvedValueOnce([]);
		mocks.computeDuration.mockResolvedValueOnce(10);
		const out = await prepareVideo(dosyaOlustur("klip.mov", 1_000_000));
		expect(out.converted).toBe("none");
	});

	it("süre 60sn üzerindeyse dokunmadan geçer", async () => {
		mocks.computeDuration.mockResolvedValueOnce(90);
		const out = await prepareVideo(dosyaOlustur("uzun.mp4", 1_000_000));
		expect(out.converted).toBe("none");
	});

	it("boyut 100MB üzerindeyse probe'a hiç girmeden dokunmadan geçer", async () => {
		const out = await prepareVideo(dosyaOlustur("buyuk.mp4", 101 * 1024 * 1024));
		expect(out.converted).toBe("none");
		expect(mocks.computeDuration).not.toHaveBeenCalled();
	});

	it("probe hata verirse dokunmadan geçer", async () => {
		mocks.computeDuration.mockRejectedValueOnce(new Error("bozuk dosya"));
		const out = await prepareVideo(dosyaOlustur("bozuk.mp4", 1_000_000));
		expect(out.converted).toBe("none");
	});
});
