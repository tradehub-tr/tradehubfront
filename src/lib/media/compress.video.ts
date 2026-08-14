// Video sıkıştırma: mediabunny ile VP9/WebM tercih edilir, tarayıcı VP9 encode
// desteklemiyorsa H.264/MP4'e düşülür.
//
// İLKE (kullanıcı kararı): amaç MB azaltmak — yalnızca gerçekten küçülüyorsa
// çevir, kaliteyi bozmadan. Zaten verimli (düşük bitrate) bir videoyu çevirmek
// onu BÜYÜTÜR; bu yüzden çift koruma var:
//   1) Ön kontrol: kaynak çözünürlük ≤ 1280px VE bitrate ≤ ~2 Mbps ise dokunma.
//   2) Son kontrol: encode çıktısı orijinalden küçük değilse orijinali kullan.
// Çok uzun + verimsiz videolar client'ta dakikalarca encode edilip sekmeyi
// dondurmasın diye sunucudaki ffmpeg güvenlik ağına devredilir.
import {
	ALL_FORMATS,
	BlobSource,
	BufferTarget,
	Conversion,
	Input,
	Mp4OutputFormat,
	Output,
	Quality,
	WebMOutputFormat,
	getEncodableVideoCodecs,
} from "mediabunny";

import type { PreparedMedia } from "./compress";

const MAX_BOYUT_BYTES = 100 * 1024 * 1024; // 100MB üstü client'ta işlenmez → sunucu
const MAX_SURE_SANIYE = 180; // 3dk üstü verimsiz video → sunucu (client donmasın)
const HEDEF_GENISLIK = 1280;
// "Zaten verimli" tavanı: bu değerin altındaki bitrate'i çevirmek MB düşürmez,
// büyütebilir. 9mb.mp4 (720p / 0.14 Mbps / 9dk) tam bu yüzden atlanır.
const VERIMLI_BITRATE = 2_000_000; // ~2 Mbps

function tabanAd(name: string): string {
	const idx = name.lastIndexOf(".");
	return idx > 0 ? name.slice(0, idx) : name;
}

function orijinaliGec(file: File): PreparedMedia {
	return { blob: file, name: file.name, converted: "none" };
}

export async function prepareVideo(file: File): Promise<PreparedMedia> {
	// Çok büyük dosyada probe/encode'a hiç girmeden sunucuya bırak.
	if (file.size > MAX_BOYUT_BYTES) return orijinaliGec(file);

	try {
		const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });

		const sure = await input.computeDuration();
		if (!sure || sure <= 0) return orijinaliGec(file);

		// Kaynak kalitesi: ortalama bitrate ≈ boyut(bit) / süre(sn). Çözünürlük de
		// düşükse video zaten verimli demektir — çevirmek MB düşürmez → dokunma.
		const kaynakBitrate = (file.size * 8) / sure;
		const track = await input.getPrimaryVideoTrack();
		const genislik = track ? await track.getDisplayWidth() : 0;
		if (genislik && genislik <= HEDEF_GENISLIK && kaynakBitrate <= VERIMLI_BITRATE) {
			return orijinaliGec(file);
		}

		// Verimsiz ama çok uzun: client encode dakikalar sürer ve sekmeyi dondurur.
		// Sunucudaki ffmpeg (async, kullanıcıyı bekletmez) devralsın.
		if (sure > MAX_SURE_SANIYE) return orijinaliGec(file);

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
				// Kalite-bazlı encode (sabit bitrate DEĞİL): düşük-bitrate kaynağı
				// şişirmez, yüksek-bitrate kaynağı görsel kaliteyi koruyarak küçültür.
				quality: new Quality("medium"),
			},
		});
		if (!conversion.isValid) return orijinaliGec(file);

		await conversion.execute();
		if (!target.buffer) return orijinaliGec(file);

		// SON KORUMA: çıktı orijinalden küçük değilse çevirme — asla şişirme.
		if (target.buffer.byteLength >= file.size) return orijinaliGec(file);

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
