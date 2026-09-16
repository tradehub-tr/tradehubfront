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
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
   * ✅ BORÇ KAPANDI — MOCK-SÖZ (`MOGEM-560`), 7 Eylül 2026.
   *
   * Burada altı muafiyet vardı: 15-FE denetimi yazıldığı gün kardeş
   * görevlerde aynı kusuru bulmuştu (POD · dört bildirim ucu · koli kaydetme).
   * 15-FE düzeltmedi çünkü `12-FE-VERI-SOZLESMESI.md` §8 o adları açıkça
   * resmîleştiriyordu ve başka bir görevin imzalı sözleşmesini tek taraflı
   * değiştirmek doğru olmazdı.
   *
   * MOCK-SÖZ'ün işi tam olarak sözleşmeleri hizalamak olduğu için düzeltme
   * yetkisi oradaydı. Altısı da doğru modüle taşındı
   * (`api.v1.pod` · `api.v1.notifications` · `api.v1.packaging`), 12-FE
   * sözleşmesi düzeltildi ve modül listesi `LOGISTICS-API-CONTRACT.md`
   * §3.5'e, kural §6.1'e yazıldı.
   *
   * **Muafiyetin kendisi denetlendiği için bayatlamadı:** adlar düzeltildiği
   * gün aşağıdaki ikinci test kırmızı oldu ve liste silinmek zorunda kaldı.
   * Boş bırakılıyor — yeni bir borç doğarsa aynı mekanizma yeniden işler.
   */
  const BILINEN_BORCLAR: Record<string, string> = {};

  it.each(SERVISLER)("%s guest modülüne yetkili uç yazmıyor", (rel) => {
    const s = kod(rel);
    const kacaklar = [...s.matchAll(/"(api\.v1\.logistics\.[\w.]+)"/g)]
      .map((m) => m[1])
      .filter((ad) => !MISAFIR_UCLAR.includes(ad) && !(ad in BILINEN_BORCLAR));

    expect(kacaklar, `${rel}: yetkili uç misafir modülünde`).toEqual([]);
  });

  /**
   * K4 — MOCK-SÖZ (`MOGEM-560`), 7 Eylül 2026.
   *
   * Yukarıdaki denetim yalnız *"guest modülüne yetkili uç yazma"* diyordu;
   * uç adı **başka** bir uydurma modüle yazılsaydı hiçbir şey uyarmazdı.
   * MOCK-SÖZ envanteri bunun boş bir korku olmadığını gösterdi: FE 11 lojistik
   * modül çağırıyordu, `LOGISTICS-API-CONTRACT.md` yalnız 3'ünü tanıyordu —
   * `api.v1.shipment` dahil, yani **canlı ve kullanımdaki** bir modül bile
   * sözleşmesizdi.
   *
   * Bu denetim sözleşmeyi tek doğruluk kaynağı yapar: storefront'un andığı
   * her modülün contract'ta karşılığı olmalı. Kardeş repo yoksa (CI tek repo
   * checkout ediyor) sessizce atlanır — var olmayan bir korumaya güvenmemek
   * için atlama GÖRÜNÜR olsun diye ayrı testte.
   */
  const CONTRACT = join(SRC, "../../tradehub_core/docs/LOGISTICS-API-CONTRACT.md");

  /**
   * Lojistik sözleşmesinin konusu olmayan modüller.
   *
   * Denetim ilk koşuşunda bu ikisini "sözleşmesiz" diye bildirdi ve haklıydı —
   * ama yanlış belgeye bakıyordu: `dashboard` alıcı analitiği, `public_pricing`
   * ürün fiyatı. İkisi de lojistik yüzeyi değil, `LOGISTICS-API-CONTRACT.md`
   * onları tanımak zorunda değil. Liste KISA tutulmalı: buraya bir lojistik
   * modülü eklenirse denetim işlevini kaybeder.
   */
  const KAPSAM_DISI = ["dashboard", "public_pricing"];

  it("storefront'un andığı her modül sözleşmede tanımlı", () => {
    if (!existsSync(CONTRACT)) {
      // Kardeş repo yok — bu denetim koşamaz. Yanlış yeşil vermemek için
      // durumu açıkça söylüyoruz (contract §1'in "var olmayan korumaya
      // güvenmek hiç koruma olmamasından kötüdür" notu).
      expect.soft(existsSync(CONTRACT), "kardeş repo yok, modül denetimi ATLANDI").toBe(false);
      return;
    }

    const sozlesme = readFileSync(CONTRACT, "utf8");
    const tanimli = new Set([...sozlesme.matchAll(/`api\.v1\.([a-z_]+)[.`]/g)].map((m) => m[1]));

    const anilan = new Set(
      SERVISLER.flatMap((rel) => [...kod(rel).matchAll(/api\.v1\.([a-z_]+)\./g)]).map((m) => m[1])
    );

    const sozlesmesiz = [...anilan]
      .filter((m) => !tanimli.has(m) && !KAPSAM_DISI.includes(m))
      .sort();
    expect(sozlesmesiz, "bu modüller sözleşmede yok — LOGISTICS-API-CONTRACT.md §3'e ekle").toEqual(
      []
    );
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

// ── 3b. Mock'un ürettiği alan SÖZLEŞMEDE var mı ─────────────────────
//
// MOCK-SÖZ (`MOGEM-560`), 7 Eylül 2026.
//
// `FE-MOCK-DISIPLINI` §"mock sözleşmedeki yükü BİREBİR üretir; uydurulan alan
// gerçek uca bağlanınca ekranı bozar" — ama bunu ölçen hiçbir denetim yoktu.
// MOCK-SÖZ envanteri 15 şema-dışı alan buldu; 13'ü gerçek boşluktu (14-FE POD
// alanları ve 13-FE etiket yaşam döngüsü sözleşmede hiç tanımlı değildi) ve
// `contract.py`'ye işlendi.
//
// Bu denetim o boşluğun geri gelmesini engeller: mock yeni bir alan uydurursa
// aynı gün kırmızı olur.

describe("mock alanları sözleşmede tanımlı", () => {
  const SEMA = join(SRC, "../../tradehub_core/docs/logistics-api.schema.json");

  /**
   * Sözleşmede OLMAYAN ama meşru alanlar — ikisi de bilinçli karar.
   * Liste BAYATLAMAZ: alan sözleşmeye girdiği gün aşağıdaki ikinci denetim
   * "muafiyet artık gereksiz" diyerek uyarır.
   */
  const MESRU: Record<string, string> = {
    // `waybill_number` 7 Eylül 2026'da BU LİSTEDEN DÜŞTÜ: `get_pod_queue`
    // yükünde (`rows[].waybill_number`) sözleşmeye girdi. 14-FE K-I hâlâ
    // geçerli — POD DocType'ında alan AÇILMAZ, ama yanıtta TAŞINIR; yanıt da
    // sözleşmenin parçası. Aşağıdaki bayatlama denetimi bunu aynı gün yakaladı.
    max_delivery_attempts:
      "07-BE (MOGEM-540) — Logistics Settings alanı; 07-FE §1: 'FE'de sabit 3 yazılı'",
  };

  /** Şemanın yalnız bu denetimin okuduğu parçaları. */
  interface SemaAlan {
    name: string;
  }
  interface SemaVarlik {
    list_fields: SemaAlan[];
    detail_fields: SemaAlan[];
    child_tables: Record<string, SemaAlan[]>;
  }
  interface SemaUc {
    returns: { fields?: string[] };
    params: SemaAlan[];
  }
  interface Sema {
    provisional: Record<string, SemaVarlik>;
    catalogs?: Record<string, { fields?: (string | SemaAlan)[] }>;
    endpoints?: Record<string, { endpoints: SemaUc[] }>;
  }

  function sozlesmeAlanlari(): Set<string> {
    const s = JSON.parse(readFileSync(SEMA, "utf8")) as Sema;
    const bilinen = new Set<string>();
    for (const spec of Object.values(s.provisional)) {
      for (const f of [...spec.list_fields, ...spec.detail_fields]) bilinen.add(f.name);
      for (const rows of Object.values(spec.child_tables))
        for (const f of rows) bilinen.add(f.name);
    }
    for (const cat of Object.values(s.catalogs ?? {}))
      for (const f of cat.fields ?? []) bilinen.add(typeof f === "string" ? f : f.name);
    // Uç yükleri de sözleşmedir: `returnable_items[].delivered_qty` hem dizi
    // adını hem alanı tanımlar — ikisi de meşru.
    for (const mod of Object.values(s.endpoints ?? {}))
      for (const ep of mod.endpoints) {
        for (const f of ep.returns.fields ?? [])
          for (const parca of f.split(/\[\]\.?|\./)) if (parca) bilinen.add(parca);
        for (const p of ep.params) bilinen.add(p.name);
      }
    return bilinen;
  }

  const MOCK_MODULLERI = SERVISLER.filter((f) => /Mock\.ts$/.test(f));

  it.each(MOCK_MODULLERI)("%s uydurma alan üretmiyor", (rel) => {
    if (!existsSync(SEMA)) {
      expect.soft(existsSync(SEMA), "kardeş repo yok, alan denetimi ATLANDI").toBe(false);
      return;
    }
    const bilinen = sozlesmeAlanlari();
    const anahtarlar = [...kod(rel).matchAll(/^\s*([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\s*:/gm)].map(
      (m) => m[1]
    );
    const uydurma = [...new Set(anahtarlar)].filter((a) => !bilinen.has(a) && !(a in MESRU)).sort();

    expect(
      uydurma,
      `${rel}: bu alanlar sözleşmede yok — contract.py'ye ekle ya da mock'tan çıkar`
    ).toEqual([]);
  });

  it("meşru alan listesi BAYATLAMIYOR", () => {
    if (!existsSync(SEMA)) return;
    const bilinen = sozlesmeAlanlari();
    const artikVar = Object.keys(MESRU).filter((a) => bilinen.has(a));
    expect(artikVar, "bu alanlar artık sözleşmede tanımlı — muafiyetten düş").toEqual([]);
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
