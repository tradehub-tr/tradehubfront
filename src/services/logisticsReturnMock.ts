/**
 * İade akışı mock'u — 15-FE (storefront tarafı).
 *
 * NE İŞE YARIYOR: 15-BE'nin uçlarının hiçbiri yazılmadı — `Return Request`
 * DocType'ı bile yok (ölçüldü 31 Ağu). Bu modül o uçların yerine geçen
 * **çalışan bir taklit**: alıcı kalem ve miktar seçip talep açar, talep
 * listeye düşer, satıcı kararı ve depo kontrolü görünür, iade etiketi
 * gerçekten açılır. Sayfa yenilendiğinde iş kaybolmaz.
 *
 * NEDEN VAR OLMASI GEREKİYORDU: iade talebi formu **13 Ağustos'tan beri
 * çalışmıyor**. `alpine/logisticsBuyer.ts` `window.__thCreateReturn` arıyor,
 * hiçbir yerde tanımlı değil; alıcı kalemleri seçiyor, açıklama yazıyor,
 * gönder'e basıyor ve hiçbir şey olmuyor. Aynı kalıp 07-FE'de teslim onayı
 * formunda, 12-FE'de bildirim anahtarında vardı.
 *
 * `FE-MOCK-DISIPLINI.md` §2'nin dört zorunluluğu:
 *   §2.1 kalıcılık           → `localStorage` + "Demo verisini sıfırla"
 *   §2.2 durum geçişleri     → tek kaynak: `readState()`; listeler ondan türer
 *   §2.3 gerçek çıktı        → iade etiketi açılabilir `data:` URI
 *   §2.4 tetiklenebilir hata → `?senaryo=` anahtarları
 *
 * ── VERİ NEREDEN GELİYOR ──
 *
 * `src/mocks/logistics/return_request.json` — sözleşmeden ÜRETİLMİŞ fixture
 * (`gen_logistics_types.py`). Alan adları backend yazıldığında da aynı kalır.
 *
 * **İki override var, ikisi de gerekçeli:**
 *
 *   1. `return_label_url` — fixture bir dosya YOLU taşıyor, backend olmadığı
 *      için 404. `returnLabelSeed.ts` açılabilir bir belge üretiyor (§2.3).
 *   2. Rol süzgeci — fixture İKİ alıcının kaydını taşıyor (`alici@ornek.com`,
 *      `kurumsal@ornek.com`). Fixture üretilmiş dosya, DEĞİŞTİRİLMEZ; süzgeç
 *      burada uygulanıyor (sözleşme §6.1). Sunucu da uygulamalı — bu bir
 *      gösterim tercihi değil, yetki kapısı.
 */
import { t } from "../i18n";
import returnRequestJson from "../mocks/logistics/return_request.json";

import { isMockMode } from "./logisticsMock";
import { iadeEtiketiUrl } from "./returnLabelSeed";
import * as api from "./shipmentService";

/**
 * Ucu yazıldıkça `false` olur; hepsi `false` olunca bu dosya silinir.
 *
 * Bayrak SADECE bir yorum değil: `false` olduğunda aşağıdaki fonksiyonlar
 * gerçek ucu (`shipmentService`) çağırıyor. Sıra `15-FE-VERI-SOZLESMESI.md`
 * §8 ile birebir.
 */
export const MOCK = {
  eligibility: true,
  create: true,
  list: true,
  detail: true,
};

/**
 * Mock YALNIZ örnek veri ortamlarında devreye girer.
 *
 * 🔴 Bu kapı olmadan **canlıda örnek veri görünür**: 12-FE'de ölçüldü,
 * fonksiyonlar yalnız `MOCK` bayrağına bakıyordu ve o bayrak üretimde de
 * `true`. Kapı çağıran ekranın dikkatine bırakılmıyor.
 *
 * Kapalıyken gerçek uç çağrılıyor; uç yoksa `NotWiredError` fırlıyor ve ekran
 * "henüz bağlı değil" çiziyor — doğru davranış bu.
 */
function mockAcik(bayrak: boolean): boolean {
  return bayrak && isMockMode();
}

const STORAGE_KEY = "istoc_return_mock";

/** Oturumdaki alıcı — fixture'daki iki alıcıdan biri (rol süzgeci §6.1). */
const ALICI = "alici@ornek.com";

/** İade penceresi — `Logistics Settings.return_window_days` varsayılanı. */
const PENCERE_GUN = 15;

// ── Tipler ──────────────────────────────────────────────────────────────

export interface IadeKalemi {
  item: string;
  item_name: string;
  requested_qty: number;
  received_qty?: number | null;
  accepted_qty?: number | null;
  uom?: string;
  inspection_result?: string | null;
  inspection_note?: string | null;
  unit_refund?: number | null;
}

export interface IadeKaydi {
  name: string;
  order: string;
  shipment?: string | null;
  seller_profile: string;
  buyer: string;
  status: string;
  reason: string;
  requested_at: string;
  decided_at?: string | null;
  is_closed?: number | null;
  decision_note?: string | null;
  return_shipment?: string | null;
  return_label_url?: string | null;
  inspection_result?: string | null;
  inspection_note?: string | null;
  refund_amount?: number | null;
  refund_triggered_at?: string | null;
  exchange_shipment?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  items?: IadeKalemi[];
}

export interface IadeEdilebilirKalem {
  item: string;
  item_name: string;
  delivered_qty: number;
  already_returned_qty: number;
  uom?: string;
}

export interface UygunlukYaniti {
  shipment: string;
  window_open: number;
  window_days: number;
  days_left: number;
  returnable_items: IadeEdilebilirKalem[];
  reasons: { value: string; label_key: string }[];
}

interface IadeDurumu {
  senaryo: string | null;
  kayitlar: IadeKaydi[];
  /** Uygunluk ucunun döndüreceği hâl — senaryoyla değişiyor. */
  pencereAcik: boolean;
  kalanGun: number;
  iadeEdilebilir: IadeEdilebilirKalem[];
  yetkisiz: boolean;
  kayitHatasi: boolean;
}

// ── Sözleşmeden gelen sabitler ──────────────────────────────────────────

/**
 * İade nedenleri — sözleşme §5, `return_reason` kataloğu.
 *
 * `label` DEĞİL `label_key` taşınıyor: etiket dört dilde i18n'de. Sunucu da
 * `label_key` döndürecek (sözleşme §2.1) — mock aynı şekli üretiyor ki
 * gerçek uca bağlanınca ekran değişmesin.
 *
 * Değerler `shipment.returnReason.*` anahtarlarıyla birebir; uydurulmuş bir
 * neden ekranda ham anahtar olarak görünürdü (`FE-MOCK-DISIPLINI` §2).
 */
const NEDENLER: { value: string; label_key: string }[] = [
  "damaged",
  "wrong_item",
  "missing_parts",
  "not_as_described",
  "other",
].map((value) => ({ value, label_key: `shipment.returnReason.${value}` }));

// ── Fixture → başlangıç durumu ──────────────────────────────────────────

function fixtureKayitlar(): IadeKaydi[] {
  const liste = returnRequestJson.default.data.items as unknown as IadeKaydi[];
  const detay = returnRequestJson.detail.data as unknown as IadeKaydi;

  // Liste satırı yalnız LIST alanlarını taşıyor (sözleşme §1.1). Detayı olan
  // kayıt için DETAIL alanları ve kalemler ekleniyor; diğerleri liste hâlinde
  // kalıyor — `get_return_request` çağrıldığında türetiliyorlar.
  return liste.map((satir) =>
    satir.name === detay.name ? { ...satir, ...detay, ...etiketli(detay) } : { ...satir }
  );
}

/**
 * Fixture'ın dosya yolunu açılabilir belgeyle değiştirir (§2.3 override 1).
 *
 * Yalnız onaylanmış iadede etiket var: reddedilen bir iade için kargo
 * etiketi üretmek, alıcıyı olmayan bir gönderiye hazırlamak olurdu.
 */
function etiketli(kayit: IadeKaydi): Partial<IadeKaydi> {
  const onayli = kayit.status !== "requested" && kayit.status !== "rejected";
  return {
    return_label_url: onayli ? iadeEtiketiUrl(kayit.name, kayit.shipment ?? "") : null,
  };
}

/** Sevkiyat kalemleri — iade edilebilir miktarlar (sözleşme §2.1). */
function fixtureIadeEdilebilir(): IadeEdilebilirKalem[] {
  return [
    {
      item: "LST-00121",
      item_name: "Pamuklu Kumaş Topu 40m",
      delivered_qty: 12,
      already_returned_qty: 0,
      uom: "Top",
    },
    {
      item: "LST-00133",
      item_name: "Polyester Astar 50m",
      delivered_qty: 10,
      already_returned_qty: 0,
      uom: "Top",
    },
  ];
}

function tohum(): IadeDurumu {
  return {
    senaryo: null,
    kayitlar: fixtureKayitlar(),
    pencereAcik: true,
    kalanGun: 6,
    iadeEdilebilir: fixtureIadeEdilebilir(),
    yetkisiz: false,
    kayitHatasi: false,
  };
}

// ── Senaryolar (§2.4) ───────────────────────────────────────────────────

const SENARYOLAR: Record<string, () => IadeDurumu> = {
  /** M-B-2 · iade penceresi kapalı — form HİÇ çizilmemeli */
  "pencere-kapali": () => ({ ...tohum(), pencereAcik: false, kalanGun: 0 }),
  /** M-B-3 · her kalem zaten iade edilmiş */
  "kalem-kalmadi": () => ({
    ...tohum(),
    iadeEdilebilir: fixtureIadeEdilebilir().map((k) => ({
      ...k,
      already_returned_qty: k.delivered_qty,
    })),
  }),
  /** M-C-2 · alıcının hiç talebi yok */
  bos: () => ({ ...tohum(), kayitlar: [] }),
  /** M-D-3 sağ · liste yetkisiz */
  yetkisiz: () => ({ ...tohum(), yetkisiz: true }),
  /** Talep oluşturma reddediliyor — form hata mesajı göstermeli */
  "kayit-hatasi": () => ({ ...tohum(), kayitHatasi: true }),
  /**
   * S12 · satıcı REDDETTİ — zaman çizgisi erken bitiyor.
   *
   * KIRMA TURU BULGUSU (31 Ağu): sözleşmenin altı durumundan üçü
   * (`rejected`, `approved`, `in_transit`) hiçbir mock'ta veri olarak
   * üretilmiyordu. `BuyerReturnTracking` üçünü de kodluyor — red kararında
   * kargo/kontrol/kapanış adımlarını HİÇ çizmiyor — ama o dal bugüne kadar
   * bir kez bile ekrana gelmemişti. Denenemeyen hâl, olmayan hâldir.
   */
  reddedildi: () => ({
    ...tohum(),
    kayitlar: fixtureKayitlar().map((k) =>
      k.buyer === ALICI && !k.is_closed
        ? {
            ...k,
            status: "rejected",
            decided_at: k.decided_at ?? "2026-08-09 15:20:00",
            decision_note: "Ürün kullanılmış olarak geri gönderilmiş; iade kabul edilmedi.",
            return_shipment: null,
            return_label_url: null,
            refund_amount: null,
          }
        : k
    ),
  }),
  /** S12 · iade kargosu YOLDA — üçüncü adım aktif, tutar henüz yok. */
  yolda: () => ({
    ...tohum(),
    kayitlar: fixtureKayitlar().map((k) =>
      k.buyer === ALICI && !k.is_closed ? { ...k, status: "in_transit", refund_amount: null } : k
    ),
  }),
  /** Kapanmış kayıt — hiçbir rolde düzenlenememeli (TUR-116) */
  kapali: () => ({
    ...tohum(),
    kayitlar: fixtureKayitlar().map((k) =>
      k.buyer === ALICI ? { ...k, status: "closed", is_closed: 1, closed_at: k.decided_at } : k
    ),
  }),
};

export function aktifSenaryo(): string | null {
  const s = new URLSearchParams(window.location.search).get("senaryo");
  return s && s in SENARYOLAR ? s : null;
}

// ── Durum: tek doğruluk kaynağı (§2.2) ──────────────────────────────────

let bellek: IadeDurumu | null = null;

/**
 * Saklanan durumu okur; yoksa tohumdan üretip yazar.
 *
 * `localStorage` erişimi patlayabiliyor (gizli sekme, site verisi kapalı) —
 * o durumda bellek içi kopyayla devam ediliyor. Ekranın çalışmaması,
 * kalıcılığın çalışmamasından daha kötü.
 */
export function readState(): IadeDurumu {
  if (bellek) return bellek;

  const senaryo = aktifSenaryo();
  let saklanan: Partial<IadeDurumu> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saklanan = JSON.parse(raw) as Partial<IadeDurumu>;
  } catch {
    // yut — aşağıda tohumdan devam
  }

  /**
   * Senaryo YALNIZ İLK GİRİŞTE durumu kuruyor.
   *
   * 07-FE'de ölçülen tuzak: anahtar URL'de kaldığı için her `reload()` durumu
   * senaryoya geri alıyor ve kalıcılık iddiası (§2.1) senaryo altında
   * çalışmıyordu.
   */
  if (senaryo && saklanan?.senaryo !== senaryo) {
    bellek = { ...SENARYOLAR[senaryo](), senaryo };
    writeState(bellek);
    return bellek;
  }

  if (saklanan) {
    bellek = { ...tohum(), ...saklanan };
    return bellek;
  }
  bellek = tohum();
  return bellek;
}

function writeState(next: IadeDurumu): void {
  bellek = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Kalıcılık yok ama ekran çalışmaya devam ediyor.
  }
}

/** "Demo verisini sıfırla" — `FE-MOCK-DISIPLINI` §2.1 şartı. */
export function resetReturnMock(): void {
  bellek = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yok sayılır */
  }
}

// ── Uçların taklidi ─────────────────────────────────────────────────────

/**
 * Sözleşme §2.1 · `get_return_eligibility(shipment)`
 *
 * Üç soruyu birden cevaplıyor: pencere açık mı, ne iade edilebilir, hangi
 * nedenler var. `window_open: 0` ve boş `returnable_items` **hata değil** —
 * ekran farklı kutu çiziyor.
 */
export async function getReturnEligibility(shipment: string): Promise<UygunlukYaniti> {
  if (!mockAcik(MOCK.eligibility)) return api.getReturnEligibility(shipment);

  const s = readState();
  return {
    shipment,
    window_open: s.pencereAcik ? 1 : 0,
    window_days: PENCERE_GUN,
    days_left: s.kalanGun,
    returnable_items: s.iadeEdilebilir.filter((k) => k.delivered_qty - k.already_returned_qty > 0),
    reasons: NEDENLER,
  };
}

/**
 * Sözleşme §2.2 · `list_return_requests`
 *
 * Rol süzgeci burada (§6.1) — fixture iki alıcının kaydını taşıyor.
 * Yalnız LIST alanları dönüyor: `refund_amount` ve diğer DETAIL alanları
 * liste satırında YOK (sözleşme §1.1, karar K-6).
 */
export async function listReturnRequests(): Promise<IadeKaydi[]> {
  if (!mockAcik(MOCK.list)) return api.listReturnRequests();

  const s = readState();
  if (s.yetkisiz) throw new Error(t("shipment.return.permissionDenied"));

  return s.kayitlar
    .filter((k) => k.buyer === ALICI)
    .sort((a, b) => String(b.requested_at).localeCompare(String(a.requested_at)))
    .map((k) => ({
      name: k.name,
      order: k.order,
      shipment: k.shipment,
      seller_profile: k.seller_profile,
      buyer: k.buyer,
      status: k.status,
      reason: k.reason,
      requested_at: k.requested_at,
      decided_at: k.decided_at ?? null,
      is_closed: k.is_closed ?? 0,
    }));
}

/** Sözleşme §2.3 · `get_return_request(name)` — LIST + DETAIL + kalemler. */
export async function getReturnRequest(name: string): Promise<IadeKaydi> {
  if (!mockAcik(MOCK.detail)) return api.getReturnRequest(name);

  const s = readState();
  if (s.yetkisiz) throw new Error(t("shipment.return.permissionDenied"));

  const kayit = s.kayitlar.find((k) => k.name === name);
  if (!kayit) throw new Error(t("shipment.return.notFound"));
  // Başkasının kaydı "yok" gibi değil, YETKİSİZ diye reddediliyor; ikisi
  // farklı ekran ve kayıt varlığını sızdırmamak da doğru davranış.
  if (kayit.buyer !== ALICI) throw new Error(t("shipment.return.permissionDenied"));
  return kayit;
}

/**
 * Sözleşme §2.4 · `create_return_request`
 *
 * 🔴 `qty` ZORUNLU. Bugün ekran yalnız kimlik listesi gönderiyor
 * (`logisticsBuyer.ts` → `items: this.selected`) çünkü miktar kutusunda
 * `x-model` yok. 15-FE bunu düzeltiyor; mock da `qty`siz kabul ETMİYOR ki
 * kusur gerçek uca bağlanmadan önce burada yakalansın.
 */
export async function createReturnRequest(payload: {
  shipment: string;
  reason: string;
  note: string;
  items: { item: string; qty: number }[];
}): Promise<{ name: string; status: string; requested_at: string }> {
  if (!mockAcik(MOCK.create)) return api.createReturnRequest(payload);

  const s = readState();
  if (s.kayitHatasi) throw new Error(t("shipment.return.failed"));
  if (!s.pencereAcik) throw new Error(t("shipment.return.windowClosedError"));

  const kalemler = payload.items ?? [];
  if (!kalemler.length) throw new Error(t("shipment.return.noItemSelected"));
  if (String(payload.note ?? "").trim().length < 10) {
    throw new Error(t("shipment.return.noteTooShort", { min: 10 }));
  }

  for (const kalem of kalemler) {
    // Miktarsız kalem sessizce "tamamı" sayılmaz — sunucu da reddedecek.
    if (!kalem.qty || kalem.qty < 1) throw new Error(t("shipment.return.qtyRequired"));
    const uygun = s.iadeEdilebilir.find((k) => k.item === kalem.item);
    if (!uygun) throw new Error(t("shipment.return.notFound"));
    if (kalem.qty > uygun.delivered_qty - uygun.already_returned_qty) {
      throw new Error(t("shipment.return.qtyExceeds"));
    }
  }
  if (!NEDENLER.some((n) => n.value === payload.reason)) {
    throw new Error(t("shipment.return.notFound"));
  }

  const name = yeniIadeNo(s.kayitlar);
  const kayit: IadeKaydi = {
    name,
    order: "ORD-2026-00871",
    shipment: payload.shipment,
    seller_profile: "SEL-00001",
    buyer: ALICI,
    status: "requested",
    reason: payload.reason,
    requested_at: simdi(),
    decided_at: null,
    is_closed: 0,
    decision_note: null,
    return_shipment: null,
    return_label_url: null,
    refund_amount: null,
    items: kalemler.map((kalem) => {
      const uygun = s.iadeEdilebilir.find((k) => k.item === kalem.item);
      return {
        item: kalem.item,
        item_name: uygun?.item_name ?? kalem.item,
        requested_qty: kalem.qty,
        received_qty: null,
        accepted_qty: null,
        uom: uygun?.uom,
        inspection_result: null,
        inspection_note: null,
        unit_refund: null,
      };
    }),
  };

  // Durum geçişi (§2.2): iade edilen miktar uygunluktan DÜŞÜYOR. Aynı kalemi
  // ikinci kez iade etmeye çalışan alıcı kalanı görüyor; ayrı bir sabit dizi
  // tutulmuyor, listeler ve sayaçlar hep bu durumdan türüyor.
  writeState({
    ...s,
    kayitlar: [kayit, ...s.kayitlar],
    iadeEdilebilir: s.iadeEdilebilir.map((k) => {
      const istenen = kalemler.find((x) => x.item === k.item);
      return istenen ? { ...k, already_returned_qty: k.already_returned_qty + istenen.qty } : k;
    }),
  });

  return { name, status: kayit.status, requested_at: kayit.requested_at };
}

/** `RET-2026-000NN` — mevcut en büyük numaranın bir fazlası. */
function yeniIadeNo(kayitlar: IadeKaydi[]): string {
  const enBuyuk = kayitlar.reduce((max, k) => {
    const n = Number(String(k.name).split("-").pop());
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `RET-2026-${String(enBuyuk + 1).padStart(5, "0")}`;
}

function simdi(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ── Köprüler ────────────────────────────────────────────────────────────

/**
 * Ekranın aradığı `window.__thCreateReturn` köprüsünü kurar.
 *
 * `alpine/logisticsBuyer.ts` bu köprüyü 13 Ağustos'tan beri arıyordu;
 * `ekranKalitesi.test.ts` eksikliği `BILINEN_EKSIKLER` listesinde `it.fails`
 * ile tutuyordu. Bu satır bağlandığı gün o test "beklenen başarısızlık
 * gerçekleşmedi" diyerek uyarır ve madde listeden düşer — mekanizma iki kez
 * çalıştı (`__thCreateShipment` 26 Ağu, `__thSetNotificationPref` 28 Ağu).
 */
export function installReturnMock(): void {
  const w = window as unknown as Record<string, unknown>;
  if (MOCK.create) w.__thCreateReturn = createReturnRequest;

  // Şerit her render'da yeniden çiziliyor; tek tek dinleyici yerine
  // delegasyon — handler feature modülünde kalıyor (kök CLAUDE.md §4.7).
  if (!w.__thReturnResetBound) {
    w.__thReturnResetBound = true;
    document.addEventListener("click", (e) => {
      const hedef = (e.target as HTMLElement | null)?.closest('[data-testid="return-mock-reset"]');
      if (!hedef) return;
      resetReturnMock();
      window.location.reload();
    });
  }
}

/** Sıfırlama şeridi — kalıcılığın görünür kanıtı ve geri dönüş yolu. */
export function returnMockBarHtml(): string {
  return `
    <div class="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3"
         data-testid="return-mock-bar">
      <span class="text-xs text-gray-600">${t("shipment.return.mockBarHint")}</span>
      <button type="button" class="th-btn-outline th-btn-sm ms-auto"
              data-testid="return-mock-reset">
        ${t("shipment.return.mockBarReset")}
      </button>
    </div>`;
}
