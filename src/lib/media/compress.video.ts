// Video sıkıştırma: mediabunny ile VP9/WebM tercih edilir, tarayıcı VP9 encode
// desteklemiyorsa H.264/MP4'e düşülür. Süre >60sn veya boyut >100MB ise
// dönüştürmeden orijinali geçilir — WP2'deki sunucu transcode kuyruğu devralır.
import {
	ALL_FORMATS,
	BlobSource,
	BufferTarget,
	Conversion,
	Input,
	Mp4OutputFormat,
	Output,
	WebMOutputFormat,
	getEncodableVideoCodecs,
} from "mediabunny";

import type { PreparedMedia } from "./compress";

const MAX_SURE_SANIYE = 60;
const MAX_BOYUT_BYTES = 100 * 1024 * 1024;
const HEDEF_GENISLIK = 1280;
const HEDEF_BITRATE = 2_000_000; // 2 Mbps

function tabanAd(name: string): string {
	const idx = name.lastIndexOf(".");
	return idx > 0 ? name.slice(0, idx) : name;
}

function orijinaliGec(file: File): PreparedMedia {
	return { blob: file, name: file.name, converted: "none" };
}

export async function prepareVideo(file: File): Promise<PreparedMedia> {
	// Büyük dosyada probe/transcode'a hiç girmeden orijinali sunucuya bırak.
	if (file.size > MAX_BOYUT_BYTES) return orijinaliGec(file);

	try {
		const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });

		const sure = await input.computeDuration();
		if (sure > MAX_SURE_SANIYE) return orijinaliGec(file);

		// getEncodableVideoCodecs'in `bitrate` seçeneği mediabunny 1.53.1'de
		// deprecated (`quality` tercih ediliyor) — probe'da yalnız genişlik
		// veriyoruz, gerçek bitrate hedefi Conversion.init'e gidiyor.
		const desteklenen = await getEncodableVideoCodecs(["vp9", "avc"], {
			width: HEDEF_GENISLIK,
		});
		const vp9Var = desteklenen.includes("vp9");
		const avcVar = desteklenen.includes("avc");
		if (!vp9Var && !avcVar) return orijinaliGec(file);

		const target = new BufferTarget();
		const output = new Output({
			format: vp9Var ? new WebMOutputFormat() : new Mp4OutputFormat(),
			target,
		});

		const conversion = await Conversion.init({
			input,
			output,
			video: {
				width: HEDEF_GENISLIK,
				codec: vp9Var ? "vp9" : "avc",
				bitrate: HEDEF_BITRATE,
			},
		});

		if (!conversion.isValid) return orijinaliGec(file);

		await conversion.execute();
		if (!target.buffer) return orijinaliGec(file);

		const taban = tabanAd(file.name);
		if (vp9Var) {
			return {
				blob: new Blob([target.buffer], { type: "video/webm" }),
				name: `${taban}.webm`,
				converted: "webm",
			};
		}
		return {
			blob: new Blob([target.buffer], { type: "video/mp4" }),
			name: `${taban}.mp4`,
			converted: "mp4",
		};
	} catch (err) {
		// Probe veya transcode hatası — orijinali sunucuya bırak (sunucudaki
		// koşullu ffmpeg güvenlik ağı devralır). Hata SESSİZCE yutulmasın:
		// client encode neden başarısız oldu görünür olsun (teşhis + izleme).
		console.warn("[media] video sıkıştırma başarısız, orijinal yükleniyor:", err);
		return orijinaliGec(file);
	}
}
