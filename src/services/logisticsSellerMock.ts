/**
 * Satıcı sevkiyat ekranı mock'u — `seller-shipment` (S2 · S8).
 *
 * NE İŞE YARIYOR: ekranın iki eylemi (`__thCreateShipment`,
 * `__thSavePackage`) hiçbir yerde tanımlı değildi. Form çiziliyor, satıcı
 * kalemleri seçiyor, düğmeye basıyor ve **hiçbir şey olmuyordu** — 07-FE'de
 * teslim onayında bulunan kalıbın aynısı (2026-08-26 ölçümü).
 *
 * KAPSAM UYARISI: bu ekran hiçbir FE görevinin kapsamında değil
 * (`KALAN-ISLER.md` → "Sahipsiz"). `MOGEM-602`'nin *"tradehubfront: satıcı
 * oluşturma"* kısmı ama `LOGISTICS-TASK-SPLIT.md`'nin 13 FE satırından
 * hiçbiri onu almıyor: 07-FE alıcı, 12-FE bildirim+takip, 15-FE iade,
 * 06-FE `admin-panel`'de. Burada YALNIZ mock akışı kapatılıyor; gerçek uçlar
 * geldiğinde bağlanma işi hâlâ sahipsiz.
 *
 * `FE-MOCK-DISIPLINI.md` §2:
 *   §2.1 kalıcılık       → `localStorage`
 *   §2.2 durum geçişleri → oluşturulan sevkiyat listede görünür
 *   §2.4 tetiklenebilir  → `?senaryo=` anahtarları
 */
import packageTypeJson from "../mocks/logistics/package_type.json";
import providerJson from "../mocks/logistics/logistics_provider.json";
import channelJson from "../mocks/logistics/shipping_channel.json";

/** Ucu yazıldıkça `false` olur; ikisi de kapanınca bu dosya silinir. */
export const MOCK = {
  create: true,
  packages: true,
};

const STORAGE_KEY = "istoc_seller_shipment_mock";

export interface SecenekSatiri {
  value: string;
  label: string;
}

/**
 * ── Seçim listeleri KATALOGDAN ──
 *
 * Eskiden `seller-shipment.ts` içinde üç sabit dizi vardı (`CHANNELS`,
 * `CARRIERS`, `PACKAGE_TYPES`). Yeni bir kargo firması katalogda açıldığında
 * bu ekran onu görmezdi; `GOREV-TAMAMLAMA-SOZLESMESI` §2'nin "seçim
 * listelerinin kaynağı" denetiminin ihlaliydi.
 *
 * Fixture'lar sözleşmeden üretiliyor (`gen_logistics_types.py`), yani alan
 * adları backend yazıldığında da aynı kalıyor. Pasif kayıtlar eleniyor —
 * katalog `set_catalog_item_active(..., 0)` ile kapatıldığında ekran da
 * kapatmalı.
 */
function aktifler<T extends { is_active?: number; name?: string }>(satirlar: T[]): T[] {
  return satirlar.filter((s) => s.is_active !== 0);
}

export function kanallar(): SecenekSatiri[] {
  return aktifler(channelJson.default.data.items).map((c) => ({
    value: c.channel_code ?? c.name,
    label: c.channel_name ?? c.name,
  }));
}

export function tasiyicilar(): SecenekSatiri[] {
  return aktifler(providerJson.default.data.items).map((p) => ({
    value: p.provider_code ?? p.name,
    label: p.provider_name ?? p.name,
  }));
}

export function paketTipleri(): SecenekSatiri[] {
  return aktifler(packageTypeJson.default.data.items).map((p) => ({
    value: p.package_code ?? p.name,
    label: p.package_name ?? p.name,
  }));
}

// ── Durum: tek doğruluk kaynağı ─────────────────────────────────────────

export interface SellerMockState {
  /** Mock'ta oluşturulan sevkiyatlar — en son oluşturulan başta. */
  sevkiyatlar: { name: string; channel: string; carrier: string | null; created_at: string }[];
  /** Sevkiyat adına göre eklenen koliler. */
  koliler: Record<string, Record<string, unknown>[]>;
}

const BOS: SellerMockState = { sevkiyatlar: [], koliler: {} };

let bellek: SellerMockState | null = null;

export function readState(): SellerMockState {
  if (bellek) return bellek;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      bellek = { ...BOS, ...(JSON.parse(raw) as Partial<SellerMockState>) };
      return bellek;
    }
  } catch {
    // Gizli sekmede `localStorage` patlayabiliyor — bellek içi kopya yeter.
  }
  bellek = { ...BOS, sevkiyatlar: [], koliler: {} };
  return bellek;
}

function writeState(next: SellerMockState): void {
  bellek = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* kalıcılık yok, ekran çalışmaya devam ediyor */
  }
}

export function resetSellerMock(): void {
  bellek = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yok sayılır */
  }
}

/** `?senaryo=` — `FE-MOCK-DISIPLINI` §2.4. */
export function aktifSenaryo(): string | null {
  const s = new URLSearchParams(window.location.search).get("senaryo");
  return s && ["hata", "kilitli"].includes(s) ? s : null;
}

// ── Uçların taklidi ─────────────────────────────────────────────────────

/** Sıra numarası bellekteki kayıt sayısından türüyor — çakışma olmuyor. */
function yeniSevkiyatAdi(sayi: number): string {
  return `SHP-2026-9${String(sayi + 1).padStart(4, "0")}`;
}

/** `api.v1.shipment.create_shipment` (07/06-BE genişletmesi bekliyor). */
export async function createShipment(payload: {
  channel: string;
  carrier: string | null;
  items: string[];
}): Promise<{ name: string }> {
  if (aktifSenaryo() === "hata") {
    throw new Error("Sevkiyat oluşturulamadı: taşıyıcı servisi yanıt vermedi.");
  }
  if (!payload.items?.length) throw new Error("En az bir ürün seçin.");

  const s = readState();
  const ad = yeniSevkiyatAdi(s.sevkiyatlar.length);
  writeState({
    ...s,
    sevkiyatlar: [
      { name: ad, channel: payload.channel, carrier: payload.carrier, created_at: yerelZaman() },
      ...s.sevkiyatlar,
    ],
  });
  return { name: ad };
}

/** `api.v1.shipment.save_shipment_packages` */
export async function savePackage(payload: Record<string, unknown>): Promise<void> {
  if (aktifSenaryo() === "hata") throw new Error("Koli kaydedilemedi.");

  const s = readState();
  const sevkiyat = String(payload.shipment ?? "");
  const mevcut = s.koliler[sevkiyat] ?? [];
  const sira = mevcut.length + 1;
  writeState({
    ...s,
    koliler: {
      ...s.koliler,
      [sevkiyat]: [
        ...mevcut,
        {
          package_code: `${sevkiyat}-K${String(sira).padStart(2, "0")}`,
          sequence_label: `${sira}`,
          ...payload,
        },
      ],
    },
  });
}

/**
 * Bu oturumda oluşturulan bir sevkiyatın detayı.
 *
 * Yönetim ekranı `getShipment()` çağırıyor; mock modda o uç sabit bir örnek
 * kayda düşüyordu ve satıcı kendi oluşturduğu sevkiyat yerine `SHP-2026-00042`
 * görüyordu — yaptığı iş sistemin başka yerine YANSIMIYORDU
 * (`FE-MOCK-DISIPLINI` §2.2). Kayıt burada bulunursa o gösteriliyor.
 */
export function sevkiyatDetay(ad: string): Record<string, unknown> | null {
  const kayit = readState().sevkiyatlar.find((s) => s.name === ad);
  if (!kayit) return null;
  return {
    name: kayit.name,
    status: "Draft",
    shipment_type: kayit.channel === "BUYER_PICKUP" ? "Buyer Pickup" : "Standard",
    channel: kayit.channel,
    carrier: kayit.carrier,
    tracking_number: null,
    packages: paketler(kayit.name),
    items: [],
    modified: kayit.created_at,
  };
}

/** Bir sevkiyatın mock kolileri — sayfa listeyi buradan besliyor. */
export function paketler(sevkiyat: string): Record<string, unknown>[] {
  return readState().koliler[sevkiyat] ?? [];
}

function yerelZaman(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ── Alpine köprüleri ────────────────────────────────────────────────────

export function installSellerMock(): void {
  const w = window as unknown as Record<string, unknown>;
  if (MOCK.create) w.__thCreateShipment = createShipment;
  if (MOCK.packages) w.__thSavePackage = savePackage;

  if (!w.__thSellerResetBound) {
    w.__thSellerResetBound = true;
    document.addEventListener("click", (e) => {
      const hedef = (e.target as HTMLElement | null)?.closest('[data-testid="seller-mock-reset"]');
      if (!hedef) return;
      resetSellerMock();
      window.location.href = "/pages/seller/shipment.html";
    });
  }
}

/** Sıfırlama şeridi — `FE-MOCK-DISIPLINI` §2.1. */
export function sellerMockBarHtml(): string {
  return `
    <div class="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3"
         data-testid="seller-mock-bar">
      <span class="text-xs font-semibold text-gray-700">Örnek veri modu</span>
      <span class="text-xs text-gray-500">
        Oluşturduğunuz sevkiyatlar ve koliler tarayıcınızda saklanır.
      </span>
      <button type="button" class="th-btn-outline th-btn-sm ms-auto" data-testid="seller-mock-reset">
        Demo verisini sıfırla
      </button>
    </div>`;
}
