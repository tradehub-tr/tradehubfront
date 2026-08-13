import Alpine from "alpinejs";

import { t } from "../i18n";

/**
 * S2 satıcı sevkiyat formu.
 *
 * Kanal seçimi formun şeklini belirliyor: taşıyıcı gerektirmeyen kanalda
 * (satıcı aracı / alıcı teslim alma) taşıyıcı ve takip alanları DOM'dan
 * çıkıyor, yerine plaka ve sürücü geliyor. `x-if` ile — `x-show` olsaydı
 * gizli alanlar form gönderiminde taşınırdı.
 */
/**
 * Taşıyıcı GEREKTİRMEYEN kanallar (`constants.py` → `ShippingChannel`).
 *
 * Şablondan `x-data` içine geçilmiyor: dizi `JSON.stringify` ile yazılınca
 * çift tırnak üretiyor, öznitelik de çift tırnakla sınırlı — öznitelik erken
 * kapanıyor ve `x-data` hiç kurulmuyordu (form tümüyle ölü kalıyordu).
 * Liste zaten değişmez, yeri burası.
 */
const CARRIER_LESS_CHANNELS = ["SELLER_VEHICLE", "BUYER_PICKUP"];

interface SellerShipmentFormState {
  carrierLess: string[];
  channel: string;
  carrier: string;
  tracking: string;
  plate: string;
  driver: string;
  selected: string[];
  submitting: boolean;
  error: string;
  readonly needsCarrier: boolean;
  clampQty(event: Event, max: number): void;
  submit(): Promise<void>;
}

Alpine.data("sellerShipmentForm", (options: { channel?: string }) => ({
  carrierLess: CARRIER_LESS_CHANNELS,
  // Açılış kanalı şablondan geliyor; burada sabitlemek satıcının varsayılan
  // kanalını her seferinde elle düzeltmesi demekti.
  channel: options.channel ?? "CARGO",
  carrier: "",
  tracking: "",
  plate: "",
  driver: "",
  selected: [] as string[],
  submitting: false,
  error: "",

  get needsCarrier(): boolean {
    return !this.carrierLess.includes(this.channel);
  },

  /**
   * Miktar kalan miktarı AŞAMAZ (TUR-106 invariant'ı).
   *
   * `max` niteliği tek başına yetmiyor: kullanıcı elle yazınca tarayıcı
   * değeri kabul ediyor, yalnız form doğrulamasında şikâyet ediyor. Burada
   * anında geri çekiliyor ki gönderilecek değer hep geçerli olsun.
   */
  clampQty(this: SellerShipmentFormState, event: Event, max: number): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (Number.isNaN(value) || value < 1) input.value = "1";
    else if (value > max) input.value = String(max);
  },

  async submit(this: SellerShipmentFormState): Promise<void> {
    if (this.submitting || !this.selected.length) return;
    if (this.needsCarrier && !this.carrier) {
      this.error = t("shipment.sellerForm.carrierRequired");
      return;
    }

    this.submitting = true;
    this.error = "";
    try {
      // Faz F: tradehub_core.api.v1.shipment.create_shipment
      const createFn = (window as unknown as Record<string, unknown>).__thCreateShipment as
        | ((payload: Record<string, unknown>) => Promise<{ name: string }>)
        | undefined;

      if (!createFn) {
        // Uç yokken "oluşturuldu" demek satıcıyı yanıltır — sevkiyat yok
        // ama o gönderdiğini sanır.
        this.error = t("shipment.sellerForm.notAvailable");
        return;
      }

      const created = await createFn({
        channel: this.channel,
        carrier: this.needsCarrier ? this.carrier : null,
        tracking_number: this.needsCarrier ? this.tracking : null,
        vehicle_plate: this.needsCarrier ? null : this.plate,
        driver_name: this.needsCarrier ? null : this.driver,
        items: this.selected,
      });
      window.location.href = `/pages/seller/shipment.html?name=${encodeURIComponent(created.name)}`;
    } catch (e) {
      this.error = (e as Error)?.message || t("shipment.sellerForm.failed");
    } finally {
      this.submitting = false;
    }
  },
}));

/**
 * S8 satıcı paketleme.
 *
 * Desi HESAPLANMIYOR — formül ve bölen backend'de
 * (`services/desi.py` + `Logistics Settings.default_desi_divisor`).
 * İstemcide hesaplasaydık ayar değiştiğinde iki yer sürüklenirdi ve
 * satıcıya yanlış ücret gösterirdik.
 */
interface PackingDraft {
  package_type: string;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
}

interface SellerPackingState {
  shipment: string;
  draft: PackingDraft;
  submitting: boolean;
  error: string;
  readonly isValid: boolean;
  addPackage(): Promise<void>;
}

const emptyDraft = (): PackingDraft => ({
  package_type: "",
  weight_kg: null,
  length_cm: null,
  width_cm: null,
  height_cm: null,
});

Alpine.data("sellerPacking", (options: { shipment: string }) => ({
  shipment: options.shipment,
  draft: emptyDraft(),
  submitting: false,
  error: "",

  get isValid(): boolean {
    const d = this.draft;
    // Ölçüler eksikse desi hesaplanamaz; ağırlık tek başına yetmiyor.
    return [d.weight_kg, d.length_cm, d.width_cm, d.height_cm].every(
      (v) => typeof v === "number" && v > 0
    );
  },

  async addPackage(this: SellerPackingState): Promise<void> {
    if (this.submitting || !this.isValid) return;
    this.submitting = true;
    this.error = "";
    try {
      // Faz F: tradehub_core.api.v1.shipment.save_shipment_packages
      const saveFn = (window as unknown as Record<string, unknown>).__thSavePackage as
        | ((payload: Record<string, unknown>) => Promise<void>)
        | undefined;

      if (!saveFn) {
        this.error = t("shipment.packing.notAvailable");
        return;
      }

      await saveFn({ shipment: this.shipment, ...this.draft });
      this.draft = emptyDraft();
      window.location.reload();
    } catch (e) {
      this.error = (e as Error)?.message || t("shipment.packing.failed");
    } finally {
      this.submitting = false;
    }
  },
}));
