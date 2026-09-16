/**
 * Misafir sepeti ↔ hesap sepeti birleştirme (giriş sonrası).
 *
 * Misafirken eklenen ürünler localStorage'da (CartStore.STORAGE_KEY), giriş
 * yapmış kullanıcının sepeti backend'de (Cart doctype) durur. Giriş sonrası:
 *   - hesap sepeti BOŞSA misafir ürünleri sessizce hesaba aktarılır;
 *   - hesap sepetinde de ürün VARSA kullanıcıya sorulur (GuestCartMergeModal):
 *       "merge"   → iki sepet birleşir (aynı ürün varsa adet toplanır — backend),
 *       "replace" → hesap sepeti boşaltılır, yalnız misafir ürünleri kalır,
 *       "later"   → bu oturumda bir daha sorulmaz; misafir sepeti localStorage'da kalır.
 * Aktarım başarılıysa localStorage temizlenir; çıkışta (auth-logout) bellekteki
 * hesap sepeti sıfırlanır ki misafir depolamasına sızmasın.
 *
 * Çağıran: TopBar (her sayfa, header sepeti) ve pages/cart.ts (sepet sayfası).
 * Aynı anda iki çağrı gelirse tek akış çalışır (inFlight).
 */
import type { CartSupplier } from "../../../types/cart";
import { CartStore, cartStore } from "./CartStore";
import { apiClearCart, apiMergeGuestCart, type CartItemInput } from "../../../services/cartService";
import { isLoggedIn } from "../../../utils/auth";
import { getCurrencySymbol } from "../../../utils/currency";
import { showToast } from "../../../utils/toast";
import { t } from "../../../i18n";

export type GuestCartAction = "none" | "silent-merge" | "ask";
export type GuestCartMergeMode = "merge" | "replace";

export interface GuestCartPromptContext {
  guestCount: number;
  accountCount: number;
  /** Seçim yapılınca çağrılır; API + store işini yürütür, hata fırlatmaz (toast basar). */
  choose: (mode: GuestCartMergeMode) => Promise<boolean>;
  /** "Şimdi değil": bu oturumda tekrar sorma. */
  dismiss: () => void;
}

/** sessionStorage bayrağı — kullanıcı "Şimdi değil" dediyse oturum boyunca sorma. */
const DISMISS_KEY = "tradehub_cart_merge_dismissed";

export function countSkus(suppliers: CartSupplier[]): number {
  return suppliers.reduce(
    (acc, s) => acc + s.products.reduce((sum, p) => sum + p.skus.length, 0),
    0
  );
}

interface PersistedCart {
  suppliers?: CartSupplier[];
}

function readPersistedSuppliers(): CartSupplier[] {
  try {
    const raw = localStorage.getItem(CartStore.STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as PersistedCart;
    return Array.isArray(data.suppliers) ? data.suppliers : [];
  } catch {
    return [];
  }
}

/** localStorage'daki misafir sepetini backend merge girdisine çevirir. */
export function readGuestCartItems(): CartItemInput[] {
  return readPersistedSuppliers().flatMap((s) =>
    s.products.flatMap((p) =>
      p.skus
        .filter((sku) => sku.quantity > 0)
        .map((sku) => ({
          listing: p.id,
          quantity: sku.quantity,
          ...(sku.listingVariant ? { listing_variant: sku.listingVariant } : {}),
        }))
    )
  );
}

export function readGuestCartSkuCount(): number {
  return countSkus(readPersistedSuppliers());
}

export function clearGuestCart(): void {
  try {
    localStorage.removeItem(CartStore.STORAGE_KEY);
  } catch {
    /* depolama erişilemez — sessizce geç */
  }
}

function isDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* sessizce geç */
  }
}

/** Saf karar: misafir/hesap ürün sayısına göre ne yapılacağı. */
export function decideGuestCartAction(
  guestCount: number,
  accountCount: number,
  dismissed = false
): GuestCartAction {
  if (guestCount <= 0) return "none";
  if (accountCount <= 0) return "silent-merge";
  return dismissed ? "none" : "ask";
}

/**
 * Seçilen kipe göre API'yi çağırır, store'u günceller, localStorage'ı temizler.
 * Başarıda true; hatada toast basıp false döner (misafir sepeti korunur).
 */
export async function applyGuestCartMerge(
  mode: GuestCartMergeMode,
  opts: { silent?: boolean } = {}
): Promise<boolean> {
  const items = readGuestCartItems();
  if (items.length === 0) return true;
  try {
    if (mode === "replace") await apiClearCart();
    const merged = await apiMergeGuestCart(items);
    cartStore.init(merged.suppliers, 0, getCurrencySymbol(), 0);
    clearGuestCart();
    const message =
      mode === "replace"
        ? t("cart.guestMergeReplaced")
        : opts.silent
          ? t("cart.guestMergeMoved")
          : t("cart.guestMergeDone");
    showToast({ message, type: "success" });
    return true;
  } catch {
    showToast({ message: t("cart.guestMergeFailed"), type: "error" });
    return false;
  }
}

let inFlight: Promise<void> | null = null;

/**
 * Giriş sonrası misafir sepetini çözümler. `accountSuppliers` = API'den yeni
 * alınmış hesap sepeti. `prompt` verilmezse GuestCartMergeModal açılır.
 */
export interface SyncGuestCartOptions {
  /**
   * Modal üzerinden yapılan seçim başarıyla uygulandığında çağrılır. Sepet
   * sayfası ürün listesini store aboneliğiyle yeniden çizmediği için burada
   * sayfayı yeniler; header için gerekmez (store aboneliği yeter).
   */
  onPromptApplied?: () => void;
}

export function syncGuestCartAfterLogin(
  accountSuppliers: CartSupplier[],
  prompt?: (ctx: GuestCartPromptContext) => void,
  opts: SyncGuestCartOptions = {}
): Promise<void> {
  if (inFlight) return inFlight;
  // Not: kilit `.finally` ile sıfırlanır — IIFE senkron biterse (await yok)
  // içerideki finally atamadan ÖNCE koşar ve kilit sonsuza dek dolu kalırdı.
  const run = (async () => {
    {
      if (!isLoggedIn()) return;
      const guestCount = readGuestCartSkuCount();
      const action = decideGuestCartAction(guestCount, countSkus(accountSuppliers), isDismissed());
      if (action === "none") return;
      if (action === "silent-merge") {
        await applyGuestCartMerge("merge", { silent: true });
        return;
      }
      const open =
        prompt ?? (await import("../overlay/GuestCartMergeModal")).openGuestCartMergeModal;
      open({
        guestCount,
        accountCount: countSkus(accountSuppliers),
        choose: async (mode) => {
          const ok = await applyGuestCartMerge(mode);
          if (ok) opts.onPromptApplied?.();
          return ok;
        },
        dismiss: setDismissed,
      });
    }
  })();
  inFlight = run.finally(() => {
    inFlight = null;
  });
  return inFlight;
}

let logoutResetInstalled = false;

/**
 * Çıkışta bellekteki hesap sepetini sıfırla; misafir sepeti (varsa) geri yüklenir.
 * Aksi halde bir sonraki mutasyon hesap ürünlerini localStorage'a yazar (sızıntı).
 */
export function installGuestCartLogoutReset(): void {
  if (logoutResetInstalled) return;
  logoutResetInstalled = true;
  window.addEventListener("auth-logout", () => {
    cartStore.init([], 0, getCurrencySymbol(), 0);
    cartStore.load();
  });
}
