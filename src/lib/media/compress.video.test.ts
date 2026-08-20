import { beforeEach, describe, expect, it, vi } from "vitest";

// mediabunny gerçek encode'u CI'da çalışmaz (VideoEncoder/WebCodecs happy-dom'da
// yok) — modülü baştan sona stub'luyoruz, sadece prepareVideo'nun KARAR mantığını
// test ediyoruz: verimlilik ön-kontrolü (yalnız MB düşürüyorsa çevir), codec seçimi,
// süre/boyut eşiği, anti-inflate son kontrolü, hata durumunda 'none'.
const mocks = vi.hoisted(() => ({
	computeDuration: vi.fn(async () => 10),
	getEncodableVideoCodecs: vi.fn(async () => ["vp9", "avc"]),
	getDisplayWidth: vi.fn(async () => 1920), // varsayılan: geniş = verimsiz → çevrilir
	execute: vi.fn(async () => undefined),
	bufferBytes: 8, // çıktı boyutu; anti-inflate testinde büyütülür
}));

vi.mock("mediabunny", () => {
	class Input {
		computeDuration = mocks.computeDuration;
		getPrimaryVideoTrack = async () => ({ getDisplayWidth: mocks.getDisplayWidth });
	}
	class BlobSource {}
	class BufferTarget {
		get buffer(): ArrayBuffer {
			return new ArrayBuffer(mocks.bufferBytes);
		}
	}
	class Output {
		target: InstanceType<typeof BufferTarget>;
		constructor(opts: { target: InstanceType<typeof BufferTarget> }) {
			this.target = opts.target;
		}
	}
	class WebMOutputFormat {}
	class Mp4OutputFormat {}
	class Quality {
		constructor(public level: string) {}
	}
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
		Quality,
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
		mocks.computeDuration.mockClear().mockResolvedValue(10);
		mocks.getEncodableVideoCodecs.mockClear().mockResolvedValue(["vp9", "avc"]);
		mocks.getDisplayWidth.mockClear().mockResolvedValue(1920);
		mocks.execute.mockClear();
		mocks.bufferBytes = 8;
	});

	it("verimsiz (geniş) video, VP9 destekleniyorsa WebM üretir", async () => {
		mocks.getDisplayWidth.mockResolvedValueOnce(1920); // >1280 → verimsiz
		const out = await prepareVideo(dosyaOlustur("klip.mp4", 5_000_000));
		expect(out.converted).toBe("webm");
		expect(out.name.endsWith(".webm")).toBe(true);
	});

	it("verimsiz video, VP9 yoksa H.264/MP4 üretir", async () => {
		mocks.getEncodableVideoCodecs.mockResolvedValueOnce(["avc"]);
		mocks.getDisplayWidth.mockResolvedValueOnce(1920);
		const out = await prepareVideo(dosyaOlustur("klip.mov", 5_000_000));
		expect(out.converted).toBe("mp4");
		expect(out.name.endsWith(".mp4")).toBe(true);
	});

	it("zaten verimli video (720p, düşük bitrate) dokunmadan geçer", async () => {
		// 1MB / 10sn ≈ 0.8 Mbps, genişlik 1280 → verimli → çevirmek MB düşürmez
		mocks.getDisplayWidth.mockResolvedValueOnce(1280);
		const out = await prepareVideo(dosyaOlustur("verimli.mp4", 1_000_000));
		expect(out.converted).toBe("none");
		expect(mocks.execute).not.toHaveBeenCalled();
	});

	it("verimli genişlik ama yüksek bitrate ise yine çevrilir", async () => {
		// 720p ama 4 Mbps (5MB/10sn) → bitrate eşiğini aşar → verimsiz
		mocks.getDisplayWidth.mockResolvedValueOnce(1280);
		const out = await prepareVideo(dosyaOlustur("yuksek-bitrate.mp4", 5_000_000));
		expect(out.converted).toBe("webm");
	});

	it("çıktı orijinalden küçük değilse çevirmez (anti-inflate)", async () => {
		mocks.getDisplayWidth.mockResolvedValueOnce(1920); // verimsiz → encode denenir
		mocks.bufferBytes = 5_000_000; // çıktı == girdi → küçülmedi
		const out = await prepareVideo(dosyaOlustur("sismis.mp4", 5_000_000));
		expect(out.converted).toBe("none");
	});

	it("hiçbir hedef codec desteklenmiyorsa dokunmadan geçer", async () => {
		mocks.getEncodableVideoCodecs.mockResolvedValueOnce([]);
		mocks.getDisplayWidth.mockResolvedValueOnce(1920);
		const out = await prepareVideo(dosyaOlustur("klip.mov", 5_000_000));
		expect(out.converted).toBe("none");
	});

	it("verimsiz ama çok uzun video (180sn üzeri) sunucuya bırakılır", async () => {
		mocks.getDisplayWidth.mockResolvedValueOnce(1920);
		mocks.computeDuration.mockResolvedValueOnce(200);
		const out = await prepareVideo(dosyaOlustur("uzun.mp4", 5_000_000));
		expect(out.converted).toBe("none");
	});

	it("boyut 100MB üzerindeyse probe'a hiç girmeden dokunmadan geçer", async () => {
		const out = await prepareVideo(dosyaOlustur("buyuk.mp4", 101 * 1024 * 1024));
		expect(out.converted).toBe("none");
		expect(mocks.computeDuration).not.toHaveBeenCalled();
	});

	it("probe hata verirse dokunmadan geçer", async () => {
		mocks.computeDuration.mockRejectedValueOnce(new Error("bozuk dosya"));
		const out = await prepareVideo(dosyaOlustur("bozuk.mp4", 5_000_000));
		expect(out.converted).toBe("none");
	});
});
