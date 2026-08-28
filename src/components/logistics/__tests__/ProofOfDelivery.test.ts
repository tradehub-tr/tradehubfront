/**
 * S10 · Teslim kanıtı — alıcı görünümünün ÜÇ HÂLİ.
 *
 * Bu testin koruduğu iddia: **"kanıt yok", "yetkin yok" ve "bağlı değil"
 * birbirine karışmıyor.** Üçü de "ekranda kanıt görünmüyor" ile sonuçlanır
 * ama sebepleri farklıdır; kullanıcıya aynı cümleyi göstermek yanlış bilgi
 * vermek olur.
 *
 * Kabul senaryoları K8…K11 → `12-FE-bildirim-takip-ANALIZ.md` §4.
 */
import { describe, expect, it } from "vitest";

import { POD_ORNEK_ALANLAR } from "../../../services/podMediaSeed";
import { ProofOfDelivery, type ProofOfDeliveryRow } from "../ProofOfDelivery";

const TAM: ProofOfDeliveryRow = {
  delivered_at: "2026-08-15 09:14:00",
  received_by: "Mehmet Yıldız",
  received_by_title: "Depo sorumlusu",
  delivery_code_used: 1,
  signature_url: "/files/pod/imza.png",
  photo_url: "/files/pod/foto.jpg",
  document_url: "/files/pod/tutanak.pdf",
  delivered_package_count: 8,
  total_package_count: 8,
  has_discrepancy: 0,
  exception_code: null,
  discrepancy_note: null,
  waybill_number: "MNG-2210554",
  delivery_point: "MNG-35004",
};

/** Etiketleri değil, VERİYİ arıyoruz — i18n metni değişince test kırılmasın. */
function metin(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("K8 · kanıt var", () => {
  it("teslim alan, zaman ve paket sayısı görünür", () => {
    const html = ProofOfDelivery({ pod: TAM });
    expect(metin(html)).toContain("Mehmet Yıldız");
    expect(metin(html)).toContain("Depo sorumlusu");
    expect(html).toContain('data-state="ok"');
  });

  it("K-E · taşıyıcı bilgisi gösterilir", () => {
    const html = ProofOfDelivery({ pod: TAM });
    expect(metin(html)).toContain("MNG-2210554");
    expect(metin(html)).toContain("MNG-35004");
  });

  it("K-E · iç operasyon damgaları BASILMAZ", () => {
    // Sunucu bunları döndürse bile ekran göstermemeli.
    const html = ProofOfDelivery({
      pod: { ...TAM, ...({ source: "carrier", recorded_by: "MNG Kargo (webhook)" } as object) },
    });
    expect(metin(html)).not.toContain("webhook");
    expect(metin(html)).not.toContain("carrier");
  });

  it("belge bağlantısı gerçek bir adres — yer tutucu değil", () => {
    const html = ProofOfDelivery({ pod: TAM });
    // `FE-MOCK-DISIPLINI` §2.3: `#yer-tutucu` bağlantı yasak.
    expect(html).toContain('href="/files/pod/tutanak.pdf"');
    expect(html).not.toMatch(/href="#/);
  });

  it("imza ve fotoğrafın alt metni var", () => {
    const html = ProofOfDelivery({ pod: TAM });
    const imgSayisi = [...html.matchAll(/<img\b/g)].length;
    const altSayisi = [...html.matchAll(/\balt="[^"]+"/g)].length;
    expect(imgSayisi).toBe(2);
    expect(altSayisi).toBe(imgSayisi);
  });
});

describe("K9 · kanıt yok — hata DEĞİL", () => {
  const html = ProofOfDelivery({ pod: null });

  it("boş durum işaretlenir", () => {
    expect(html).toContain('data-state="empty"');
  });

  it("hata kutusu ÇİZİLMEZ", () => {
    // `role="alert"` yalnız gerçek uyarılarda; eksik veri uyarı değildir.
    expect(html).not.toContain('role="alert"');
    expect(html).not.toMatch(/border-red|text-red/);
  });

  it("ne olduğunu açıklayan bir cümle var", () => {
    expect(metin(html).length).toBeGreaterThan(20);
    expect(html).not.toMatch(/>\s*shipment\.[\w.]+\s*</);
  });
});

describe("K10 · medya yetkisi yok", () => {
  const { signature_url: _s, photo_url: _p, document_url: _d, ...MEDYASIZ } = TAM;
  const html = ProofOfDelivery({ pod: MEDYASIZ });

  it("kırık görsel çizilmez", () => {
    expect(html).not.toContain("<img");
  });

  it("belge düğmesi çizilmez", () => {
    expect(html).not.toContain('data-testid="pod-document"');
  });

  it("geri kalan bilgi DURUYOR — ekran boşalmıyor", () => {
    expect(metin(html)).toContain("Mehmet Yıldız");
    expect(metin(html)).toContain("MNG-2210554");
  });

  it("nedeni tek cümleyle söyleniyor", () => {
    expect(html).toContain('data-testid="pod-media-hidden"');
  });
});

describe("K11 · eksik teslim", () => {
  const EKSIK: ProofOfDeliveryRow = {
    ...TAM,
    delivered_package_count: 6,
    has_discrepancy: 1,
    exception_code: "DAMAGED",
    discrepancy_note: "İki koli ıslanmış, şubede tutuldu.",
  };
  const html = ProofOfDelivery({ pod: EKSIK });

  it("uyarı ekran okuyucuya duyurulur", () => {
    expect(html).toContain('role="alert"');
    expect(html).toContain('data-testid="pod-discrepancy"');
  });

  it("kaç kolinin eksik olduğu yazıyor", () => {
    const t = metin(html);
    expect(t).toContain("6");
    expect(t).toContain("8");
  });

  it("gerekçe ve kurye notu görünür", () => {
    expect(metin(html)).toContain("ıslanmış");
  });

  it("uyarı kartın EN ÜSTÜNDE — teslim saatinden önce", () => {
    const uyariIdx = html.indexOf('data-testid="pod-discrepancy"');
    const detayIdx = html.indexOf("<dl");
    expect(uyariIdx).toBeGreaterThan(-1);
    expect(uyariIdx).toBeLessThan(detayIdx);
  });
});

/**
 * Örnek kayıt TEK KAYNAKTAN gelmeli.
 *
 * 28 Ağustos görsel denetimi: sayfada medya ve unvan düzeltilmişti ama
 * Storybook'ta üç kusur duruyordu, çünkü story kendi kopyasını tutuyordu.
 * `build-storybook` geçiyordu — derleme bu sapmayı görmez.
 */
describe("örnek POD kaydı tek kaynaktan", () => {
  it("medya alanları gerçek bir kaynak taşıyor — kırık yol değil", () => {
    for (const alan of ["signature_url", "photo_url", "document_url"] as const) {
      const deger = POD_ORNEK_ALANLAR[alan];
      expect(deger, `${alan} boş`).toBeTruthy();
      // `/files/...` gibi var olmayan bir yol kırık görsel demek.
      expect(deger.startsWith("data:"), `${alan} yükün içinde gelmiyor: ${deger}`).toBe(true);
    }
  });

  it("received_by unvanı İÇİNDE taşımıyor", () => {
    expect(POD_ORNEK_ALANLAR.received_by).not.toMatch(/[()]/);
    expect(POD_ORNEK_ALANLAR.received_by_title).toBeTruthy();
  });

  it("bu kayıtla çizilen kartta unvan bir KEZ geçiyor", () => {
    const html = ProofOfDelivery({ pod: POD_ORNEK_ALANLAR as ProofOfDeliveryRow });
    const kez = metin(html).split("Depo sorumlusu").length - 1;
    expect(kez).toBe(1);
  });

  it("bu kayıtla belge düğmesi çiziliyor", () => {
    const html = ProofOfDelivery({ pod: POD_ORNEK_ALANLAR as ProofOfDeliveryRow });
    expect(html).toContain('data-testid="pod-document"');
  });
});

describe("kısmi veri ekranı bozmuyor", () => {
  it("yalnız teslim zamanı gelse de çiziliyor", () => {
    const html = ProofOfDelivery({ pod: { delivered_at: "2026-08-15 09:14:00" } });
    expect(html).toContain('data-state="ok"');
    expect(html).not.toMatch(/>\s*shipment\.[\w.]+\s*</);
  });

  it("unvan yoksa teslim alan yine de görünür", () => {
    const html = ProofOfDelivery({ pod: { received_by: "Ayşe Demir" } });
    expect(metin(html)).toContain("Ayşe Demir");
  });
});
