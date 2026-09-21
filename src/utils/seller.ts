/**
 * Seller utilities — centralised routing for seller store/panel access.
 */

import type { AuthUser } from "./auth";

const SELLER_PANEL_URL = import.meta.env.VITE_SELLER_PANEL_URL || "http://localhost:8082/";

/**
 * Giriş yapmış kullanıcının satıcı PANELİNE gideceği adres.
 *
 *   - Onaylı + aktif profil → satıcı yönetim paneli (8082)
 *   - Diğerleri → başvuru bekliyor sayfası
 *
 * 2026-09-21'de `getSellerStoreUrl` iken yeniden adlandırıldı: `sellerUrl.ts`
 * içinde AYNI ADLA bambaşka bir fonksiyon vardı — o, vitrindeki herkese açık
 * dükkan sayfasını (`/magaza/<kod>/dukkan`) döndürüyor. İki fonksiyon aynı
 * alanda (satıcı adresleri), aynı türde (fonksiyon) ve aynı isimdeydi; yanlış
 * olanı içe aktarmak tamamlama listesinden tek tıkla mümkündü ve tip hatası
 * vermeden yanlış sayfaya götürebilirdi. `check:dup` bunu 7 Eylül'den beri
 * bildiriyordu ama denetim CI'da koşmuyor.
 */
export function getSellerPanelUrl(user: AuthUser): string {
  if (user.has_seller_profile) return SELLER_PANEL_URL;
  return "/pages/seller/application-pending.html";
}
