/**
 * DİL SEÇİMİ TEK NOKTADAN GEÇER — kaynak denetimi.
 *
 * Bu test kodun davranışını değil, **mimarisini** korur: dil seçimi
 * `setLanguageManually()` dışında hiçbir yerden `localStorage`'a yazılamaz.
 *
 * Neden test, neden kontrol listesi değil: seçim dört ayrı yerde (header
 * popover, footer bölge menüsü, mobil hesap menüsü, yardım merkezi) ayrı ayrı
 * yazılıyordu. Beşincisi eklendiğinde kimse bu dosyayı hatırlamayacak — ama
 * bu test kırmızı olacak. Kaçan tek bir nokta, o yoldan seçen kullanıcının
 * tercihini "otomatik" gösterir ve ülke tespiti onu ezer (MOGEM-642).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// vitest proje kökünden koşuyor; import.meta.url jsdom ortamında güvenilir değil.
const SRC = join(process.cwd(), "src");

/** Dil seçimi sunan dört ekran. */
const SECICI_DOSYALARI = [
  "components/header/TopBar.ts",
  "components/footer/FooterLinks.ts",
  "components/floating/BottomNav.ts",
  "components/help-center/HelpCenterHeader.ts",
];

/** Merkezi karar noktasının kendisi ve testleri denetim dışıdır. */
const MUAF = ["i18n/languageChoice.ts", "i18n/index.ts", "i18n/__tests__/"];

function tsDosyalari(dizin: string, biriken: string[] = []): string[] {
  for (const ad of readdirSync(dizin)) {
    const tam = join(dizin, ad);
    if (statSync(tam).isDirectory()) {
      tsDosyalari(tam, biriken);
    } else if (ad.endsWith(".ts") && !ad.endsWith(".d.ts")) {
      biriken.push(tam);
    }
  }
  return biriken;
}

const dosyalar = tsDosyalari(SRC)
  .map((f) => relative(SRC, f))
  .filter((f) => !MUAF.some((m) => f.startsWith(m)));

describe("dil seçimi kaynak denetimi", () => {
  it("denetlenecek dosya bulundu (tarama gerçekten çalışıyor)", () => {
    expect(dosyalar.length).toBeGreaterThan(100);
  });

  it("hiçbir dosya dil anahtarına DOĞRUDAN yazmıyor", () => {
    const ihlaller: string[] = [];
    for (const dosya of dosyalar) {
      const icerik = readFileSync(join(SRC, dosya), "utf8");
      icerik.split("\n").forEach((satir, i) => {
        if (/localStorage\.setItem\(\s*["'`](i18nextLng|th-lang-source)["'`]/.test(satir)) {
          ihlaller.push(`${dosya}:${i + 1}`);
        }
      });
    }
    expect(
      ihlaller,
      `Dil seçimi doğrudan yazılmış. setLanguageManually() kullan:\n${ihlaller.join("\n")}`
    ).toEqual([]);
  });

  it("dil seçiciler merkezi fonksiyonu çağırıyor", () => {
    for (const dosya of SECICI_DOSYALARI) {
      const icerik = readFileSync(join(SRC, dosya), "utf8");
      // import satırı değil, gerçek ÇAĞRI aranıyor — import edip kullanmamak
      // bu testi boş yere yeşil yapardı.
      const cagriSayisi = (icerik.match(/setLanguageManually\(/g) || []).length;
      expect(cagriSayisi, `${dosya} setLanguageManually() çağırmıyor`).toBeGreaterThan(0);
    }
  });

  it("dil seçiciler kendi sabit dil listesini TANIMLAMIYOR", () => {
    // Liste dört ayrı yerde ayrı yazılıydı; AR/RU eklendiğinde yalnız header
    // güncellendi ve mobil kullanıcı iki dile kilitlendi (ölçüldü 16 Eyl 2026).
    // Artık hepsi LANGUAGE_OPTIONS'tan türetiliyor.
    const ihlaller: string[] = [];
    for (const dosya of SECICI_DOSYALARI) {
      const icerik = readFileSync(join(SRC, dosya), "utf8");
      // Kendi içinde hem "Türkçe" hem "English" etiketi tanımlayan bir dizi/HTML
      // bloğu varsa, liste merkezden gelmiyor demektir.
      const kendiListesi = /["'`]Türkçe["'`]/.test(icerik) && /["'`]English["'`]/.test(icerik);
      if (kendiListesi) ihlaller.push(dosya);
    }
    expect(
      ihlaller,
      `Dil listesi merkezden gelmeli (LANGUAGE_OPTIONS):\n${ihlaller.join("\n")}`
    ).toEqual([]);
  });

  it("dil seçiciler merkezi listeyi kullanıyor", () => {
    for (const dosya of SECICI_DOSYALARI) {
      const icerik = readFileSync(join(SRC, dosya), "utf8");
      expect(icerik, `${dosya} LANGUAGE_OPTIONS kullanmıyor`).toContain("LANGUAGE_OPTIONS");
    }
  });
});
