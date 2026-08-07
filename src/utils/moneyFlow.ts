/**
 * Para değeri "odometre" animasyonu — number-flow tabanlı.
 *
 * Değer değiştiğinde tüm metin blok halinde değişmez; yalnızca **değişen
 * basamaklar** dikey olarak döner, binlik ayıraçları girip çıkar. Bekleme/
 * gecikme yok: `update()` çağrıldığı anda hareket başlar.
 *
 * React sarmalayıcısı (`@number-flow/react`) yerine çekirdek `number-flow`
 * paketi kullanılıyor; paket import edildiğinde `<number-flow>` custom
 * element'ini kendisi tanımlar, framework gerekmez.
 *
 * innerHTML ile komple yeniden render edilen bloklarda (sepet drawer'ı) çalışır:
 * `<number-flow>` örneği key bazlı saklanır, her render'da yeni slot'a taşınır.
 * Örnek aynı kaldığı için animasyon durumu korunur — element yeniden
 * yaratılsaydı her değişim sıfırdan çizilir, hiç animasyon olmazdı.
 *
 * Kullanım:
 *   el.innerHTML = `... ${moneyFlowHtml("cart:grandTotal", amount, "TRY")} ...`;
 *   mountMoneyFlows(el);            // render'dan hemen sonra
 *   resetMoneyFlows("cart:");       // drawer başka ürünle açılırken
 */

import NumberFlow, { type Format } from "number-flow";
import { getCurrencyFormatSpec } from "../services/currencyService";
import { escapeAttr } from "./sanitize";

/** Basamak dönüşü — number-flow varsayılanı 900ms; hantal durmasın diye kısaltıldı. */
const TRANSFORM_MS = 500;
const OPACITY_MS = 280;

const instances = new Map<string, NumberFlow>();
/**
 * Intl seçenek nesneleri para birimi başına önbelleklenir: number-flow
 * `format` referansını karşılaştırıp değiştiyse yeni `Intl.NumberFormat`
 * kuruyor — her render'da yeni nesne vermek gereksiz maliyet olurdu.
 */
const formats = new Map<string, Format>();

function getFormat(currency: string): Format {
  let format = formats.get(currency);
  if (!format) {
    const { decimalPlaces } = getCurrencyFormatSpec(currency);
    format = {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    };
    formats.set(currency, format);
  }
  return format;
}

/**
 * Animasyonlu tutar için boş slot HTML'i. Gerçek `<number-flow>` elemanı
 * `mountMoneyFlows()` ile içine yerleştirilir.
 *
 * @param key       Kalıcı kimlik — aynı tutarı temsil eden her render'da aynı olmalı.
 * @param value     Ham sayı; biçimlendirmeyi number-flow yapar.
 * @param currency  Para birimi kodu (ör. "TRY").
 * @param className Slot'a eklenecek ek utility sınıfları.
 */
export function moneyFlowHtml(
  key: string,
  value: number,
  currency: string,
  className = "",
): string {
  return `<span
    data-money-flow="${escapeAttr(key)}"
    data-money-value="${escapeAttr(String(value))}"
    data-money-currency="${escapeAttr(currency)}"
    class="inline-flex items-center ${className}"
  ></span>`;
}

function mountSlot(slot: HTMLElement): void {
  const key = slot.dataset.moneyFlow;
  const value = Number(slot.dataset.moneyValue);
  const currency = slot.dataset.moneyCurrency || "USD";
  if (!key || !Number.isFinite(value)) return;

  let el = instances.get(key);
  if (!el) {
    el = document.createElement("number-flow") as NumberFlow;
    el.transformTiming = { duration: TRANSFORM_MS, easing: "ease-out" };
    el.opacityTiming = { duration: OPACITY_MS, easing: "ease-out" };
    instances.set(key, el);
  }

  // Para birimi değişebilir (kullanıcı kur değiştirdiğinde) → her seferinde ata.
  const { symbol, locale } = getCurrencyFormatSpec(currency);
  el.locales = locale;
  el.format = getFormat(currency);
  el.numberPrefix = symbol;

  // Önceki render'daki slot artık DOM dışında; örneği yeni slot'a taşı.
  if (el.parentElement !== slot) slot.appendChild(el);

  el.update(value);
}

/** `root` içindeki tüm para slot'larını doldurur ve değerlerini günceller. */
export function mountMoneyFlows(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-money-flow]").forEach(mountSlot);
}

/**
 * Tek bir slot'un değerini değiştirir — DOM'u yeniden render etmeyip
 * `textContent` ile nokta atışı güncelleyen ekranlar (sepet sayfası) için.
 * `textContent` yazmak `<number-flow>` elemanını silerdi; bunun yerine
 * elemanın kendi `update()`'i çağrılıyor.
 */
export function updateMoneyFlow(
  slot: HTMLElement | null,
  value: number,
  currency?: string,
): void {
  if (!slot) return;
  slot.dataset.moneyValue = String(value);
  if (currency) slot.dataset.moneyCurrency = currency;
  mountSlot(slot);
}

/**
 * Saklanan örnekleri atar. Prefix verilirse yalnız o grup silinir — drawer
 * başka bir ürünle açıldığında yeni tutar eskisinden yuvarlanmasın diye.
 */
export function resetMoneyFlows(prefix?: string): void {
  if (!prefix) {
    instances.clear();
    return;
  }
  for (const key of [...instances.keys()]) {
    if (key.startsWith(prefix)) instances.delete(key);
  }
}
