/**
 * Sprint 2.6 — Satıcı CTA Akıllı Yönlendirme
 *
 * `sell.html`, KYB locked sayfa ve sidebar LockedFeatureModal **aynı routing
 * logic'ini** çağırır. Tutarlı UX: Draft Application varsa kullanıcı
 * application-pending sayfasına gönderilir (form Step 1'den değil).
 *
 * Karar tablosu:
 *   - Login yok → /pages/auth/register.html?type=supplier
 *   - has_seller_profile (mağazası var) → seller admin panel
 *   - seller_application_status (Draft/Submitted/Under Review/Rejected/Approved)
 *       → application-pending (durum mesajı içinde gösterilir)
 *   - Hiçbiri → supplier-setup form
 */

import { getUser, getSessionUser } from "./auth";
import { getSellerStoreUrl } from "./seller";

export async function routeToSellerFlow(): Promise<void> {
  const user = getUser() || (await getSessionUser());

  if (!user) {
    window.location.href = "/pages/auth/register.html?type=supplier";
    return;
  }

  // Mevcut mağaza veya başvuru kaydı varsa → akıllı yönlendirme.
  // Draft dahil her başvuru durumu application-pending'e gider; mağaza varsa
  // (Approved + can_sell=1) seller admin paneline gider.
  if (user.seller_application_status || user.has_seller_profile) {
    window.location.href = getSellerStoreUrl(user);
    return;
  }

  // Hiç başvuru yok → form'u aç (Draft yaratılır)
  window.location.href = "/pages/seller/supplier-setup.html";
}
