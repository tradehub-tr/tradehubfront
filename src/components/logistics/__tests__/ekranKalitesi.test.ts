/**
 * Teslim alma ekranlarının EKSİKSİZLİK denetimi (storefront · 07-FE).
 *
 * NEDEN VAR: admin-panel'de `router/__tests__/logisticsScreenQuality.test.js`
 * bu işi yıllardır yapıyor; storefront'ta karşılığı yoktu. 07-FE'nin kapanış
 * denetiminde dört eksik ancak elle bakınca ortaya çıktı — uç yokken ölü
 * düğme çiziliyordu, boş slot listesi "randevu kalmadı" diyordu, mock hata
 * mesajları sabit Türkçeydi, hata kutuları ekran okuyucuya duyurulmuyordu.
 * Hiçbiri build'i, `tsc`'yi veya mevcut testleri kırmıyordu.
 *
 * NE DEĞİL: tasarım denetimi değil. "Düğme doğru yerde mi" sormaz;
 * "düğme çalışır mı, metni okunur mu, kime duyurulur mu" sorar.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { DeliveryConfirm } from "../DeliveryConfirm";
import { LabelDownload } from "../LabelDownload";
import { NotificationCenter } from "../NotificationCenter";
import { PickupAppointment } from "../PickupAppointment";
import { ProofOfDelivery } from "../ProofOfDelivery";
import { ReturnRequest } from "../ReturnRequest";
import { SellerPacking } from "../SellerPacking";
import { SellerReturnQueue } from "../SellerReturnQueue";
import { SellerShipmentForm } from "../SellerShipmentForm";
import { ShipmentGroupList } from "../ShipmentGroupList";
import { TrackingTimeline } from "../TrackingTimeline";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "../../..");

const oku = (rel: string) => readFileSync(join(SRC, rel), "utf8");

const TEMEL = {
  shipmentName: "SHP-2026-00035",
  status: "Ready for Pickup",
  pickupLocation: "İkitelli OSB",
};

const SLOTLAR = [
  { value: "09-12", label: "09:00 – 12:00", available: true },
  { value: "12-15", label: "12:00 – 15:00", available: false },
];

// ── 1. i18n bütünlüğü ───────────────────────────────────────────────────

describe("i18n bütünlüğü", () => {
  const diller = ["tr", "en", "ar", "ru"] as const;

  /** Bir sözlük dosyasındaki blok anahtarlarını çıkarır. */
  function anahtarlar(dil: string, blok: string): string[] {
    const s = oku(`i18n/locales/${dil}.ts`);
    const m = new RegExp(`\\n(\\s+)${blok}:\\s*\\{(.*?)\\n\\1\\},`, "s").exec(s);
    if (!m) return [];
    return [...m[2].matchAll(/^\s*(\w+):/gm)].map((x) => x[1]).sort();
  }

  it.each(["appointment", "confirm", "notifyPref", "pod"])(
    "`shipment.%s` bloğu DÖRT dilde aynı anahtarları taşır",
    (blok) => {
      const temel = anahtarlar("tr", blok);
      expect(temel.length).toBeGreaterThan(5);
      for (const dil of diller) expect(anahtarlar(dil, blok)).toEqual(temel);
    }
  );

  /**
   * Küçük sözlükler — eşik ayrı çünkü ikisi de beşten az anahtar taşıyor.
   *
   * `notifyChannel` 12-FE'de AÇILDI: bildirim kanalı (`email`/`in_app`/`sms`)
   * eskiden `shipment.channel.*`'tan çevriliyordu ama o blok SEVKİYAT
   * kanalları için (`CARGO`, `COURIER`…). Karşılık bulunamadığı için ekranda
   * çevrilmemiş ham `email` yazıyordu.
   */
  it.each(["notifyChannel", "notifyEvent"])(
    "`shipment.%s` bloğu DÖRT dilde aynı anahtarları taşır",
    (blok) => {
      const temel = anahtarlar("tr", blok);
      expect(temel.length).toBeGreaterThan(2);
      for (const dil of diller) expect(anahtarlar(dil, blok)).toEqual(temel);
    }
  );

  /**
   * Bildirim kanalı ile sevkiyat kanalı AYRI ad alanlarında kalmalı.
   *
   * İkisi aynı bloğa sıkıştırılırsa biri diğerinin anahtarlarını gölgeler ve
   * ekran sessizce ham değer basar — 28 Ağustos 2026'da ölçülen kusur buydu.
   */
  it("bildirim kanalı sevkiyat kanalı bloğuna sızmamış", () => {
    const sevkiyatKanali = anahtarlar("tr", "channel");
    expect(sevkiyatKanali).not.toContain("email");
    expect(sevkiyatKanali).not.toContain("in_app");
    expect(sevkiyatKanali).not.toContain("sms");
    // Ve bildirim kanalı kendi bloğunda gerçekten var.
    expect(anahtarlar("tr", "notifyChannel")).toEqual(["email", "in_app", "sms"]);
  });

  it("bileşen çıktısında ham anahtar sızmaz", () => {
    const ciktilar = [
      PickupAppointment({ ...TEMEL, slots: SLOTLAR, today: "2026-08-27" }),
      DeliveryConfirm({ ...TEMEL, deliveryCodeStatus: "pending" }),
      DeliveryConfirm({ ...TEMEL, deliveryCodeStatus: "not_required" }),
      DeliveryConfirm({ ...TEMEL, deliveryCodeStatus: "failed", deliveryCodeAttempts: 3 }),
    ];
    for (const html of ciktilar) {
      // `shipment.confirm.title` gibi çevrilmemiş bir anahtar ekranda görünürse
      // i18next anahtarı bulamamış demektir.
      expect(html).not.toMatch(/>\s*shipment\.[\w.]+\s*</);
    }
  });
});

// ── 2. Sabit dilde metin yok ────────────────────────────────────────────

describe("kullanıcıya görünen metin i18n'den gelir", () => {
  /** Türkçe'ye özgü harfler — sabit Türkçe metnin parmak izi. */
  const TURKCE = /[çğıöşüÇĞİÖŞÜ]/;

  it("mock katmanı sabit Türkçe hata mesajı fırlatmaz", () => {
    const s = oku("services/logisticsPickupMock.ts");
    // Yorumlar ve `data-testid` hariç: `throw new Error("…")` içindeki metin.
    const mesajlar = [...s.matchAll(/new Error\(\s*"([^"]+)"/g)].map((m) => m[1]);
    const sabitTurkce = mesajlar.filter((m) => TURKCE.test(m));
    expect(sabitTurkce).toEqual([]);
  });
});

// ── 3. Ölü buton yok ────────────────────────────────────────────────────

describe("ölü buton yok", () => {
  it("uç bağlı değilken teslim onayı düğmesi çizilmez", () => {
    const html = DeliveryConfirm({ ...TEMEL, deliveryCodeStatus: "not_required", wired: false });
    expect(html).not.toContain('data-testid="confirm-no-code"');
    expect(html).not.toContain('data-testid="confirm-submit"');
  });

  it("uç bağlı değilken randevu formu çizilmez", () => {
    const html = PickupAppointment({ ...TEMEL, slots: [], today: "2026-08-27", wired: false });
    expect(html).not.toContain('data-testid="appointment-submit"');
  });
});

// ── 4. Boş durum ile "bağlı değil" karışmaz ─────────────────────────────

describe("boş durum yanlış cümle kurmaz", () => {
  it("uç bağlı değilken 'uygun randevu kalmadı' DENMEZ", () => {
    const html = PickupAppointment({ ...TEMEL, slots: [], today: "2026-08-27", wired: false });
    // "Randevu kalmadı" sistemin baktığını ve bulamadığını söyler; oysa
    // hiç bakmadı. Aradaki farkı silmek `NotWiredNotice`'in var oluş sebebi.
    expect(html).not.toContain('data-testid="appointment-no-slots"');
    // `NotWiredNotice` beklenen ucun adını basıyor — ekran görüntüsünü alan
    // geliştirici "hangi uç eksik" sorusunu oradan cevaplıyor.
    expect(html).toContain("api.v1.pickup.list_appointment_slots");
  });

  it("gerçekten dolu bir gün için 'uygun randevu kalmadı' DENİR", () => {
    const dolu = SLOTLAR.map((s) => ({ ...s, available: false }));
    const html = PickupAppointment({ ...TEMEL, slots: dolu, today: "2026-08-27" });
    expect(html).toContain('data-testid="appointment-no-slots"');
  });
});

// ── 5. Hata ve durum kutuları duyurulur ─────────────────────────────────

describe("erişilebilirlik", () => {
  it("kilit uyarısı ekran okuyucuya duyurulur", () => {
    const html = DeliveryConfirm({
      ...TEMEL,
      deliveryCodeStatus: "failed",
      deliveryCodeAttempts: 3,
    });
    expect(html).toMatch(/role="alert"/);
  });

  it("ödeme kapısı ekran okuyucuya duyurulur", () => {
    const html = DeliveryConfirm({
      ...TEMEL,
      deliveryCodeStatus: "pending",
      paymentRequired: true,
      paymentStatus: "unpaid",
    });
    expect(html).toMatch(/role="alert"/);
  });

  it("süre dolumu kutusu duyurulur", () => {
    const html = DeliveryConfirm({
      ...TEMEL,
      deliveryCodeStatus: "pending",
      expiresAt: "2020-01-01 00:00:00",
    });
    expect(html).toMatch(/data-testid="confirm-expired"[^>]*role="status"/);
  });

  it("randevu formundaki hata mesajı duyurulur", () => {
    const html = PickupAppointment({ ...TEMEL, slots: SLOTLAR, today: "2026-08-27" });
    expect(html).toMatch(/role="alert"/);
  });

  it("kod girişi ipucuyla ilişkilendirilmiş", () => {
    const html = DeliveryConfirm({ ...TEMEL, deliveryCodeStatus: "pending" });
    expect(html).toMatch(/aria-describedby=/);
  });
});

// ── 6. Ekran ulaşılabilir ───────────────────────────────────────────────

describe("ulaşılmaz ekran yok", () => {
  it("teslim alma ekranına sipariş listesinden bağlantı var", () => {
    expect(oku("components/orders/OrderListItem.ts")).toContain("pickupUrl(order)");
    expect(oku("services/pickupEntry.ts")).toContain("shipment-tracking.html");
  });
});

// ── 7. Ölü köprü yok ────────────────────────────────────────────────────
//
// Alpine modülleri davranışı `window.__th*` üzerinden alıyor. Köprü
// tanımlanmazsa ekran çizilir, düğme tıklanır ve HİÇBİR ŞEY OLMAZ — build,
// `tsc` ve birim testleri bunu görmez. 07-FE'de tam bu oldu: teslim onayı
// formu haftalarca ölü durdu, ancak E2E yakaladı.
//
// Bu denetim kaynak tarıyor: aranan her köprünün bir tanımı olmalı.

describe("ölü köprü yok", () => {
  /** `src/` altındaki tüm .ts dosyalarını okur. */
  function tumKaynak(): { yol: string; icerik: string }[] {
    const sonuc: { yol: string; icerik: string }[] = [];
    const gez = (dizin: string) => {
      for (const e of readdirSync(dizin, { withFileTypes: true })) {
        const tam = join(dizin, e.name);
        if (e.isDirectory()) gez(tam);
        else if (e.name.endsWith(".ts"))
          sonuc.push({ yol: tam, icerik: readFileSync(tam, "utf8") });
      }
    };
    gez(SRC);
    return sonuc;
  }

  const kaynak = tumKaynak();
  const aranan = new Map<string, string>();
  const tanimli = new Set<string>();

  for (const { yol, icerik } of kaynak) {
    for (const m of icerik.matchAll(/\.(__th\w+)\s+as/g)) {
      if (!aranan.has(m[1])) aranan.set(m[1], yol);
    }
    for (const m of icerik.matchAll(/\bw\.(__th\w+)\s*=/g)) tanimli.add(m[1]);
    for (const m of icerik.matchAll(/\bwindow\.(__th\w+)\s*=/g)) tanimli.add(m[1]);
  }

  /**
   * BİLİNEN EKSİKLER — sahipleri belli, 07-FE'nin kapsamı dışında.
   *
   * `it.fails` kullanılıyor: test bugün başarısız olmalı ve suite yeşil
   * kalmalı. Sahibi köprüyü bağladığı gün bu test KIRMIZI verir ("beklenen
   * başarısızlık gerçekleşmedi") ve satır `it`'e çevrilir. Yani eksik ne
   * unutuluyor ne de gürültü yapıyor.
   */
  //: `__thCreateShipment` ve `__thSavePackage` 2026-08-26'da bağlandı
  //: (`services/logisticsSellerMock.ts`) ve bu listeden düştüler — test o gün
  //: "beklenen başarısızlık gerçekleşmedi" diyerek uyardı. Mekanizmanın
  //: çalıştığının kanıtı.
  //:
  //: `__thSetNotificationPref` 2026-08-28'de bağlandı
  //: (`services/logisticsNotificationMock.ts`, 12-FE) ve aynı şekilde düştü —
  //: mekanizma ikinci kez kanıtlandı. Bildirim tercihleri ekranı 13 Ağustos'tan
  //: beri çiziliyordu ama anahtar hiçbir modda kaydetmiyordu.
  const BILINEN_EKSIKLER: Record<string, string> = {
    __thCreateReturn: "15-FE — storefront iade talebi akışı (MOGEM-543)",
  };

  const koprular = [...aranan.keys()].sort();

  /**
   * TERS YÖN: tanımlı ama HİÇ ÇAĞRILMAYAN köprü.
   *
   * Yukarıdaki denetim "aranan köprü tanımlı mı" diye soruyor; bu boşluk
   * 28 Ağustos 2026'da ölçüldü. `__thMarkNotificationRead` kurulmuştu ama
   * ekranda hiç çağrılmıyordu — bildirimler asla okundu işaretlenmiyor,
   * okunmamış rozeti hiç sönmüyordu. Kod çalışıyor görünüyor, iş akışı
   * kapanmıyor.
   *
   * `*Bound` ile bitenler dahili tekrar-bağlama bayrağı, köprü değil.
   */
  it("tanımlı her köprü ekranda gerçekten çağrılıyor", () => {
    const bayrak = (k: string) => k.endsWith("Bound");
    const oluKoprular = [...tanimli].filter((k) => !bayrak(k) && !aranan.has(k));
    expect(oluKoprular).toEqual([]);
  });

  it("taranan köprü sayısı beklenenin altına düşmedi", () => {
    // Alt sınır: regex bozulup 0 köprü bulursa test sessizce yeşil kalırdı.
    expect(koprular.length).toBeGreaterThanOrEqual(7);
  });

  for (const kopru of koprular) {
    const sahibi = BILINEN_EKSIKLER[kopru];
    if (sahibi) {
      it.fails(`${kopru} tanımlı (BİLİNEN EKSİK — ${sahibi})`, () => {
        expect(tanimli.has(kopru)).toBe(true);
      });
    } else {
      it(`${kopru} tanımlı`, () => {
        expect(tanimli.has(kopru)).toBe(true);
      });
    }
  }
});

// ── 7.5 FE MOCK DİSİPLİNİ — otomatik denetimler ─────────────────────────
//
// NEDEN VAR: 12-FE kapanışında yapılan öz-denetim yedi kusur buldu ve DÖRDÜ
// otomatik teste dönüşebiliyordu. En ciddisi canlıya sızmaydı: mock modülü
// ortamı hiç sormuyordu, `MOCK` bayrağı üretimde de `true`. Bu blok o
// kusurların genel hâlini TÜM mock yüzeyinde arıyor — yalnız 12-FE'de değil,
// geçmiş görevlerde de.

describe("FE mock disiplini", () => {
  /** `src/services` altındaki mock modülleri. */
  const moduller = readdirSync(join(SRC, "services"))
    .filter((f) => /Mock\.ts$/.test(f))
    .map((f) => ({ ad: f, icerik: readFileSync(join(SRC, "services", f), "utf8") }));

  it("taranan mock modülü sayısı beklenenin altına düşmedi", () => {
    // Regex bozulup 0 modül bulursa aşağıdaki testler sessizce yeşil kalırdı.
    expect(moduller.length).toBeGreaterThanOrEqual(3);
  });

  /**
   * Mock CANLIYA sızmamalı.
   *
   * Ölçüldü (2026-08-28): `logisticsNotificationMock` yalnız `MOCK` bayrağına
   * bakıyordu ve o bayrak üretimde de `true`; canlıda bir alıcı sahte teslim
   * kanıtını kendi kanıtı sanacaktı. Koruma sayfa katmanında aranırsa her yeni
   * çağrıda hatırlanması gerekir — bir kez unutuldu, yine unutulur.
   */
  it.each(moduller.map((m) => [m.ad, m] as const))(
    "%s ortam kapısı taşıyor (isMockMode)",
    (_ad, m) => {
      expect(/isMockMode|isPreviewHost/.test(m.icerik)).toBe(true);
    }
  );

  /**
   * Mock'un ürettiği medya GERÇEKTEN açılabilmeli (`FE-MOCK-DISIPLINI` §2.3).
   *
   * Ölçüldü: POD imza ve fotoğrafı `/files/pod/imza-41.png` yollarını
   * taşıyordu; backend olmadığı için ekranda kırık kutu çıkıyordu. Hiçbir test
   * yakalamamıştı çünkü hepsi "alan dolu mu" diye bakıyordu.
   */
  it.each(moduller.map((m) => [m.ad, m] as const))(
    "%s var olmayan yerel dosyaya işaret etmiyor",
    (_ad, m) => {
      const supheli = [...m.icerik.matchAll(/"(\/files\/[^"]*)"/g)].map((x) => x[1]);
      expect(supheli).toEqual([]);
    }
  );

  /** Ölü bağlantı yasak — `#yer-tutucu` da bir yer tutucudur. */
  it.each(moduller.map((m) => [m.ad, m] as const))("%s yer tutucu bağlantı üretmiyor", (_ad, m) => {
    expect(/href="#/.test(m.icerik)).toBe(false);
  });
});

// ── 8. Sabit dilde metin yok (lojistik modülleri) ───────────────────────

describe("lojistik modülleri sabit dilde metin taşımaz", () => {
  const TURKCE = /[çğıöşüÇĞİÖŞÜ]/;
  const MODULLER = [
    "services/logisticsPickupMock.ts",
    "services/logisticsNotificationMock.ts",
    "services/pickupEntry.ts",
    "alpine/logisticsBuyer.ts",
    "alpine/logisticsDelivery.ts",
    "alpine/logisticsSeller.ts",
  ];

  it.each(MODULLER)("%s içinde sabit Türkçe hata mesajı yok", (rel) => {
    const s = oku(rel);
    const mesajlar = [...s.matchAll(/new Error\(\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(mesajlar.filter((m) => TURKCE.test(m))).toEqual([]);
  });
});

// ── 9. Tüm lojistik bileşenleri: çıktı denetimi ────────────────────────
//
// 07-FE'nin iki bileşeni yukarıda ayrıntılı deneniyor. Bu blok, lojistik
// yüzeyinin GERİ KALANINI aynı üç soruya tabi tutuyor:
//   · ekranda çevrilmemiş ham anahtar görünüyor mu?
//   · boş durum "kayıt yok" ile "bağlı değil"i karıştırıyor mu?
//   · uyarı kutuları ekran okuyucuya duyuruluyor mu?
//
// Bileşenler farklı görevlerin (12-FE, 13-FE, 15-FE, sahipsiz seller ekranı)
// kapsamında; burada YALNIZ denetleniyorlar, davranışları değiştirilmiyor.

const SECENEK = [{ value: "A", label: "A" }];

/** Her bileşen için dolu ve boş birer örnek. */
const BILESENLER: { ad: string; dolu: () => string; bos?: () => string }[] = [
  {
    ad: "SellerShipmentForm",
    dolu: () =>
      SellerShipmentForm({
        orderName: "ORD-1",
        remainingItems: [{ item: "I1", item_name: "Ürün", remaining_qty: 2, uom: "adet" }],
        channels: SECENEK,
        carriers: SECENEK,
      }),
    // Sevk edilecek kalem kalmadıysa form açılmıyor — bu bir BOŞ DURUM.
    bos: () =>
      SellerShipmentForm({
        orderName: "ORD-1",
        remainingItems: [],
        channels: SECENEK,
        carriers: SECENEK,
      }),
  },
  {
    ad: "SellerPacking",
    dolu: () =>
      SellerPacking({
        shipmentName: "SHP-1",
        packages: [{ package_code: "PK-1" } as never],
        packageTypes: SECENEK,
      }),
    bos: () => SellerPacking({ shipmentName: "SHP-1", packages: [], packageTypes: SECENEK }),
  },
  {
    ad: "LabelDownload",
    dolu: () =>
      LabelDownload({
        shipmentName: "SHP-1",
        packages: [{ package_code: "PK-1", label_url: "/x.pdf" } as never],
      }),
    bos: () => LabelDownload({ shipmentName: "SHP-1", packages: [] }),
  },
  {
    ad: "ReturnRequest",
    dolu: () =>
      ReturnRequest({
        shipmentName: "SHP-1",
        items: [{ item: "I1", item_name: "Ürün", qty: 1 } as never],
        reasons: SECENEK,
        windowOpen: true,
      }),
    // İade penceresi kapalı — form yok, gerekçe var.
    bos: () =>
      ReturnRequest({
        shipmentName: "SHP-1",
        items: [],
        reasons: SECENEK,
        windowOpen: false,
        windowDays: 14,
      }),
  },
  {
    ad: "SellerReturnQueue",
    dolu: () =>
      SellerReturnQueue({
        rows: [
          {
            name: "RET-1",
            order: "ORD-1",
            status: "requested",
            reason: "damaged",
            requested_at: "2026-08-20 10:00:00",
          } as never,
        ],
        now: "2026-08-21 10:00:00",
      }),
    bos: () => SellerReturnQueue({ rows: [] }),
  },
  {
    ad: "NotificationCenter",
    dolu: () =>
      NotificationCenter({
        rows: [
          {
            name: "NTF-1",
            event: "shipment_shipped",
            title: "Yola çıktı",
            created_at: "2026-08-20 10:00:00",
            read: 0,
          } as never,
        ],
      }),
    bos: () => NotificationCenter({ rows: [] }),
  },
  {
    ad: "ShipmentGroupList",
    dolu: () =>
      ShipmentGroupList({
        orderName: "ORD-1",
        shipments: [{ name: "SHP-1", status: "In Transit" } as never],
      }),
    bos: () => ShipmentGroupList({ orderName: "ORD-1", shipments: [] }),
  },
  {
    ad: "TrackingTimeline",
    dolu: () =>
      TrackingTimeline({
        shipmentName: "SHP-1",
        events: [{ event_time: "2026-08-20 10:00:00", status: "In Transit" } as never],
      }),
    bos: () => TrackingTimeline({ shipmentName: "SHP-1", events: [] }),
  },
  {
    ad: "ProofOfDelivery",
    dolu: () =>
      ProofOfDelivery({
        pod: {
          delivered_at: "2026-08-15 09:14:00",
          received_by: "Mehmet Yıldız",
          received_by_title: "Depo sorumlusu",
          delivery_code_used: 1,
          signature_url: "/files/pod/imza.png",
          delivered_package_count: 8,
          total_package_count: 8,
          waybill_number: "MNG-2210554",
          delivery_point: "MNG-35004",
        },
      }),
    // POD'un boş hâli "kanıt yok" — hata değil, eksik veri.
    bos: () => ProofOfDelivery({ pod: null }),
  },
];

describe("lojistik bileşenleri — çıktı denetimi", () => {
  it.each(BILESENLER.map((b) => [b.ad, b] as const))(
    "%s: ham i18n anahtarı sızdırmaz",
    (_ad, b) => {
      // `>shipment.foo.bar<` — i18next anahtarı bulamadığında ekranda
      // anahtarın kendisi görünür. Kullanıcı "shipment.notify.empty" okur.
      expect(b.dolu()).not.toMatch(/>\s*shipment\.[\w.]+\s*</);
    }
  );

  it.each(BILESENLER.filter((b) => b.bos).map((b) => [b.ad, b] as const))(
    "%s: boş durumda anlamlı bir cümle kurar",
    (_ad, b) => {
      const html = b.bos!();
      expect(html).not.toMatch(/>\s*shipment\.[\w.]+\s*</);
      // Boş durum SESSİZ olmamalı: en az bir okunabilir metin bulunmalı.
      const metin = html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      expect(metin.length).toBeGreaterThan(10);
    }
  );

  /**
   * Uyarı kutuları duyurulmalı.
   *
   * Üçü de "işlem yapamazsın" diyor: paketleme kilidi, kapanmış iade
   * penceresi, etiketsiz koli uyarısı. Ekran okuyucu kullanan biri bunları
   * duymazsa formun neden olmadığını anlayamaz.
   */
  it("SellerPacking kilidi duyurulur", () => {
    const html = SellerPacking({
      shipmentName: "SHP-1",
      packages: [],
      packageTypes: SECENEK,
      locked: true,
    });
    expect(html).toMatch(/role="(alert|status)"/);
  });

  it("ReturnRequest kapalı pencere uyarısı duyurulur", () => {
    const html = ReturnRequest({
      shipmentName: "SHP-1",
      items: [],
      reasons: SECENEK,
      windowOpen: false,
      windowDays: 14,
    });
    expect(html).toMatch(/role="(alert|status)"/);
  });

  it("LabelDownload eksik etiket uyarısı duyurulur", () => {
    const html = LabelDownload({
      shipmentName: "SHP-1",
      packages: [
        { package_code: "PK-1", label_url: null } as never,
        { package_code: "PK-2", label_url: null } as never,
      ],
    });
    expect(html).toMatch(/role="(alert|status)"/);
  });
});
