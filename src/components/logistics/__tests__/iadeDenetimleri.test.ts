/**
 * 15-FE'de bulunan kusurların GENEL hâlleri — otomatik denetim.
 *
 * `GOREV-TAMAMLAMA-SOZLESMESI` §6.2 son satırı: *"bulunan her kusur için
 * 'bunun genel hâli nedir, başka nerede olabilir' diye sor. Cevap çoğu zaman
 * bir teste dönüşüyor."* Bu dosya 15-FE'nin beş bulgusunun sınıfını TÜM
 * lojistik yüzeyinde arıyor — yalnız iade ekranlarında değil.
 *
 * Kontrol listesi unutulur; denetim test olur ve yeni ekran yazıldığı anda
 * kendiliğinden kapsanır.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BuyerReturnTracking } from "../BuyerReturnTracking";

const SRC = join(__dirname, "../../..");

function oku(rel: string): string {
  return readFileSync(join(SRC, rel), "utf8");
}

/**
 * Yorumları soyulmuş kaynak.
 *
 * İlk sürüm ham metni tarıyordu ve KENDİ gerekçe yorumlarını bulgu sanıyordu:
 * `presentation.ts`'in "toLocaleString(undefined) kullanıyordu" açıklaması ve
 * `fixtures.ts`'in "<select> seçenekleri" başlığı yanlış pozitif üretti
 * (31 Ağu). Bir denetim kendi belgesini ihbar ediyorsa güvenilmez olur.
 */
function kod(rel: string): string {
  return oku(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function dosyalar(dir: string, uzanti = ".ts"): string[] {
  return readdirSync(join(SRC, dir))
    .filter((f) => f.endsWith(uzanti) && !f.endsWith(".test.ts") && !f.endsWith(".stories.ts"))
    .map((f) => `${dir}/${f}`);
}

const BILESENLER = dosyalar("components/logistics");
const SERVISLER = dosyalar("services");
const SAYFALAR = dosyalar("pages");

// ── 1. Form alanı gönderime BAĞLI mı ────────────────────────────────
//
// 🔴 15-FE bulgusu: iade miktarı kutusunun `x-model`'i yoktu. `clampQty`
// yalnız `input.value`'yu düzeltiyor, değeri hiçbir yere yazmıyordu; gönderim
// yalnız kimlik listesi taşıyordu. Kusur 13 Ağustos'tan 31 Ağustos'a kadar
// yaşadı — build, `tsc` ve birim testleri görmedi, çünkü hepsi "alan var mı"
// diye bakıyordu, "değeri gidiyor mu" diye değil.

describe("form alanı gönderime bağlı", () => {
  it.each(BILESENLER)("%s içindeki yazılabilir girdiler bir modele bağlı", (rel) => {
    const s = kod(rel);
    const girdiler = [...s.matchAll(/<(input|textarea|select)\b[^>]*>/gs)].map((m) => m[0]);

    const bagsiz = girdiler.filter((g) => {
      // Salt-okunur ve gösterim amaçlı alanların modele ihtiyacı yok.
      if (/\b(readonly|disabled)\b/.test(g) && !/x-model/.test(g)) return false;
      if (/type="(hidden|submit|button)"/.test(g)) return false;
      // Bağlı sayılma yolları: Alpine modeli, olay yazıcısı ya da `name`
      // ile klasik form gönderimi.
      return !/x-model|@input|@change|\bname=/.test(g);
    });

    expect(bagsiz, `${rel}: gönderime bağlanmamış girdi`).toEqual([]);
  });
});

// ── 2. Rol bileşeni doğru sayfada mı ────────────────────────────────
//
// 🔴 15-FE bulgusu: alıcı sayfası `SellerReturnQueue` çiziyordu — alıcı satıcı
// başlığını, "Karara bağla" düğmelerini ve BAŞKA alıcıların kayıtlarını
// görüyordu. Aynı kalıp 12-FE'de bildirim tercihlerinde de vardı.

describe("rol sızıntısı yok", () => {
  const ALICI_SAYFALARI = SAYFALAR.filter((f) => /buyer-|return-request|shipment-tracking/.test(f));

  it.each(ALICI_SAYFALARI)("%s satıcı bileşeni import etmiyor", (rel) => {
    const s = kod(rel);
    const saticiImportlari = [...s.matchAll(/import\s*\{([^}]*)\}\s*from\s*"[^"]*"/g)]
      .flatMap((m) => m[1].split(","))
      .map((x) => x.trim())
      .filter((ad) => /^Seller[A-Z]/.test(ad));

    expect(saticiImportlari, `${rel}: alıcı sayfasında satıcı bileşeni`).toEqual([]);
  });

  it("satıcı ekranına giden bağlantı alıcı bileşeninde yok", () => {
    const alici = BILESENLER.filter((f) => /Buyer|ReturnRequest|ProofOfDelivery/.test(f));
    for (const rel of alici) {
      expect(kod(rel), `${rel}: alıcı bileşeninde /pages/seller/ bağlantısı`).not.toMatch(
        /href="\/pages\/seller\//
      );
    }
  });
});

// ── 3. Uç adı MİSAFİR modülünü işaret etmiyor ───────────────────────
//
// 🔴 15-FE bulgusu: altı iade ucu `api.v1.logistics.*` diyordu. O modülün
// kendi docstring'i *"satıcı/alıcı verisine dokunan her şey başka yerde"*
// diyor ve üç ucu da `allow_guest=True`. Aynı hata 20 Ağustos denetiminde
// POD/OPS/PRICING için düzeltilmişti; iade uçları o taramanın dışında kalmıştı.

describe("uç adı guest modülünü işaret etmiyor", () => {
  /** `api/v1/logistics.py` içindeki GERÇEK misafir uçları — beyaz liste. */
  const MISAFIR_UCLAR = [
    "api.v1.logistics.track_shipment_public",
    "api.v1.logistics.get_available_shipping_methods",
    "api.v1.logistics.estimate_shipping_cost",
  ];

  /**
   * 🔴 KARDEŞ GÖREVLERDE AYNI KUSUR — 15-FE denetimi yazıldığı gün bulundu.
   *
   * Altı yetkili uç misafir modülünü işaret ediyor ve bunlar 15-FE'nin işi
   * DEĞİL. Üstelik POD'da iki repo iki farklı ad kullanıyor: panel
   * `LOGISTICS_METHOD.POD = "…v1.pod"` derken storefront
   * `api.v1.logistics.get_proof_of_delivery` diyor — tam olarak kod
   * yorumlarının uyardığı *"backend'e iki farklı sipariş"* durumu.
   *
   * Bilerek DÜZELTİLMEDİ: `12-FE-VERI-SOZLESMESI.md` §8 o adları açıkça
   * resmîleştiriyor; başka bir görevin imzalı sözleşmesini tek taraflı
   * değiştirmek doğru olmaz. Sahibiyle birlikte `KALAN-ISLER.md`'ye düştü.
   *
   * Liste BAYATLAMIYOR: ad düzeltildiği gün aşağıdaki denetim
   * "muafiyet artık gereksiz" diyerek uyarır.
   */
  const BILINEN_BORCLAR: Record<string, string> = {
    "api.v1.logistics.get_proof_of_delivery": "14-BE (Ali) — panel v1.pod diyor",
    "api.v1.logistics.list_notification_preferences": "12-BE (Bora)",
    "api.v1.logistics.set_notification_preference": "12-BE (Bora)",
    "api.v1.logistics.list_notifications": "12-BE (Bora)",
    "api.v1.logistics.mark_notification_read": "12-BE (Bora)",
    "api.v1.logistics.save_shipment_packages": "13-BE (Ali)",
  };

  it.each(SERVISLER)("%s guest modülüne yetkili uç yazmıyor", (rel) => {
    const s = kod(rel);
    const kacaklar = [...s.matchAll(/"(api\.v1\.logistics\.[\w.]+)"/g)]
      .map((m) => m[1])
      .filter((ad) => !MISAFIR_UCLAR.includes(ad) && !(ad in BILINEN_BORCLAR));

    expect(kacaklar, `${rel}: yetkili uç misafir modülünde`).toEqual([]);
  });

  it("bilinen borç listesi BAYATLAMIYOR — ad düzeltilince liste boşalır", () => {
    // Muafiyetin kendisi denetleniyor: uç adı düzeltildiği an bu satır
    // kırmızı olur ve silinmek zorunda kalır (12-FE `I18N_KEYS_PENDING`
    // deseni). Muafiyet kalıcı borç hâline gelemez.
    const tumKaynak = SERVISLER.map(kod).join("\n");
    const artikYok = Object.keys(BILINEN_BORCLAR).filter((ad) => !tumKaynak.includes(`"${ad}"`));
    expect(artikYok, "bu uçlar artık guest modülünü işaret etmiyor — borçtan düşür").toEqual([]);
  });
});

// ── 4. Bileşen yalnız KENDİ alan kümesini çiziyor ───────────────────
//
// ⚠ 15-FE bulgusu: `SellerReturnQueue` liste satırında `refund_amount`
// çiziyordu. O alan sözleşmede DETAIL kümesinde; liste satırı onu hiç
// taşımıyor ve backend yazıldığında da taşımayacak — hiç çalışmayan bir dal.

describe("liste bileşeni DETAIL alanı okumuyor", () => {
  /** `contract.py` RETURN_REQUEST_DETAIL_FIELDS — liste satırında YOK. */
  const DETAY_ALANLARI = [
    "decision_note",
    "return_label_url",
    "inspection_result",
    "inspection_note",
    "refund_amount",
    "refund_triggered_at",
    "exchange_shipment",
    "closed_by",
  ];

  const LISTE_BILESENLERI = BILESENLER.filter((f) => /List|Queue|Group/.test(f));

  it.each(LISTE_BILESENLERI)("%s detay alanı çizmiyor", (rel) => {
    const s = kod(rel);
    // Liste bileşeni tek kaydı da çizebiliyorsa (detay bölümü) muaf.
    const kacaklar = DETAY_ALANLARI.filter((alan) =>
      new RegExp(`\\brow\\.${alan}\\b|\\bitem\\.${alan}\\b`).test(s)
    );
    expect(kacaklar, `${rel}: liste satırında DETAIL alanı`).toEqual([]);
  });
});

// ── 5. Biçimlendirme ARAYÜZ diline bağlı ────────────────────────────
//
// 🔴 15-FE görsel tur bulgusu: `toLocaleString(undefined, …)` tarayıcının
// dilini kullanıyordu. Arayüzü Türkçe seçmiş ama tarayıcısı İngilizce olan
// alıcı, Türkçe ekranda "Aug 09, 2026, 10:00 AM" ve "TRY 2,480.00"
// görüyordu. Tüm lojistik yüzeyini etkiliyordu.

describe("tarih ve para biçimi arayüz dilinden", () => {
  const HEPSI = [...BILESENLER, ...SERVISLER, ...SAYFALAR];

  it.each(HEPSI)("%s toLocaleString'e undefined yerel geçmiyor", (rel) => {
    const s = kod(rel);
    const kacaklar = [...s.matchAll(/toLocale(?:String|DateString|TimeString)\(\s*undefined/g)];
    expect(kacaklar.length, `${rel}: yerel tarayıcı diline bırakılmış`).toBe(0);
  });

  it("taranan dosya sayısı beklenenin altına düşmedi", () => {
    // Regex bozulup 0 dosya bulursa testler sessizce yeşil kalırdı.
    expect(HEPSI.length).toBeGreaterThanOrEqual(30);
  });
});

// ── 6. Şablon literali içinde backtick yok ──────────────────────────
//
// Kendi hatam (31 Ağu, İKİ KEZ): HTML yorumuna backtick yazmak şablon
// literalini bölüyor. `tsc` yakalıyor ama derleme hatası olarak — nedeni
// görmek dosyayı açmayı gerektiriyor. Denetim sebebi doğrudan söylüyor.

describe("HTML yorumunda backtick yok", () => {
  it.each([...BILESENLER, ...SAYFALAR])("%s şablon literalini bölmüyor", (rel) => {
    const yorumlar = [...oku(rel).matchAll(/<!--(.*?)-->/gs)].map((m) => m[1]);
    const bozuk = yorumlar.filter((y) => y.includes("`"));
    expect(bozuk, `${rel}: HTML yorumundaki backtick şablon literalini böler`).toEqual([]);
  });
});

// ── 7. Erken durumda GERÇEKLEŞMEMİŞ veri gösterilmiyor ──────────────
//
// 🔴 15-FE kırma turu bulgusu (31 Ağu): iade takibi, kayıt daha "yolda" ya da
// "reddedildi" iken *"6 ulaştı · 4 kabul"* yazıyordu. Hiçbir koli depoya
// ulaşmamıştı; sayılar kaydın kontrol alanlarından geliyor ve alıcıya OLMAMIŞ
// bir depo kontrolünü olmuş gibi anlatıyordu.
//
// İlk düzeltme yalnız `rejected`'ı kapattı; ikinci görüntü aynı kusurun
// kontrol öncesi HER durumda olduğunu gösterdi. Bu test genel hâli koruyor.

describe("kontrol başlamadan ulaşan/kabul gösterilmiyor", () => {
  const KALEM = {
    item_name: "Ürün",
    requested_qty: 6,
    // Sunucu bu alanları erken doldurursa bile ekran GÖSTERMEMELİ.
    received_qty: 6,
    accepted_qty: 4,
    uom: "Top",
  };

  const kayit = (status: string) => ({
    name: "RET-1",
    order: "ORD-1",
    status,
    reason: "damaged",
    requested_at: "2026-08-20 10:00:00",
    items: [KALEM],
  });

  /**
   * İddia DİLDEN BAĞIMSIZ: test ortamı i18n'i İngilizce kuruyor, ekran
   * Türkçe. Metin aramak testi dile bağlar (07-FE'de dokuz test bu yüzden
   * kırmızıydı). Ölçülen şey ÜÇLÜ ayraç: dolu kırılım "istenen · ulaşan ·
   * kabul" üç parça, erken hâl tek parça.
   */
  const ayracSayisi = (html: string) => (html.match(/·/g) ?? []).length;

  it.each(["requested", "approved", "rejected", "in_transit"])(
    "%s durumunda yalnız istenen miktar yazıyor",
    (status) => {
      const erken = ayracSayisi(BuyerReturnTracking(kayit(status)));
      const dolu = ayracSayisi(BuyerReturnTracking(kayit("inspecting")));
      expect(erken, `${status}: gerçekleşmemiş kontrol verisi sızıyor`).toBeLessThan(dolu);
    }
  );

  it.each(["inspecting", "closed"])("%s durumunda üçlü kırılım görünüyor", (status) => {
    const dolu = ayracSayisi(BuyerReturnTracking(kayit(status)));
    const erken = ayracSayisi(BuyerReturnTracking(kayit("in_transit")));
    expect(dolu, `${status}: kontrol sonucu gösterilmiyor`).toBeGreaterThan(erken);
  });
});

// ── 8. Mock yüzeyi de ÇEVRİLİ ───────────────────────────────────────
//
// 🔴 15-FE kırma turu bulgusu (31 Ağu, RTL turu): Arapça arayüzde iade takibi
// ekranının üstündeki "Örnek veri modu" şeridi TÜRKÇE görünüyordu. Mock modu
// yalnız önizleme ortamlarında açılıyor ama onaya bakan paydaş da o
// ortamlarda bakıyor — ekranın yarısı Arapça, şeridi Türkçe.
//
// Mevcut "sabit dilde metin" denetimi (ekranKalitesi.test.ts §8) yalnız
// `new Error("…")` çağrılarına bakıyor; HTML üreten fonksiyonları görmüyor.

describe("mock yüzeyindeki kullanıcı metni i18n'den geliyor", () => {
  const TURKCE_HARF = /[çğıöşüÇĞİÖŞÜ]/;

  /**
   * Sabit Türkçe taşıyan PRE-EXISTING modüller — sahipleriyle.
   *
   * Dördü de 15-FE'den önce yazıldı ve dördü de aynı şeridi kopyalamış.
   * Düzeltmek 15-FE'nin kapsamı değil; liste `KALAN-ISLER.md`'ye sahipleriyle
   * yazıldı. Muafiyet BAYATLAMIYOR: bir modül düzeltildiği gün aşağıdaki
   * ikinci denetim "artık gereksiz" diyerek uyarır.
   */
  const BILINEN_BORCLAR: Record<string, string> = {
    "logisticsMock.ts": "ortak şerit — 07-FE",
    "logisticsNotificationMock.ts": "12-FE",
    "logisticsPickupMock.ts": "07-FE",
    "logisticsSellerMock.ts": "sahipsiz (KALAN-ISLER §Sahipsiz)",
  };

  const mockModulleri = SERVISLER.filter((f) => /Mock\.ts$/.test(f));

  /** HTML şablonu içindeki, etiketler ARASINDAKİ görünür metin. */
  function gorunurMetinler(kaynak: string): string[] {
    return [...kaynak.matchAll(/>([^<>{}$`]{4,})</g)]
      .map((m) => m[1].trim())
      .filter((x) => TURKCE_HARF.test(x));
  }

  it.each(mockModulleri)("%s sabit dilde kullanıcı metni taşımıyor", (rel) => {
    const ad = rel.split("/").pop() as string;
    const bulgular = gorunurMetinler(kod(rel));
    if (ad in BILINEN_BORCLAR) return; // borç listesi aşağıda ayrıca denetleniyor
    expect(bulgular, `${rel}: metin i18n'den gelmeli`).toEqual([]);
  });

  it("borç listesi BAYATLAMIYOR — modül düzeltilince liste boşalır", () => {
    const halaBorclu = Object.keys(BILINEN_BORCLAR).filter((ad) => {
      const rel = mockModulleri.find((f) => f.endsWith(ad));
      return rel ? gorunurMetinler(kod(rel)).length > 0 : false;
    });
    expect(
      Object.keys(BILINEN_BORCLAR).filter((ad) => !halaBorclu.includes(ad)),
      "bu modüller artık sabit metin taşımıyor — borçtan düşür"
    ).toEqual([]);
  });

  it("taranan mock modülü sayısı beklenenin altına düşmedi", () => {
    expect(mockModulleri.length).toBeGreaterThanOrEqual(4);
  });
});
