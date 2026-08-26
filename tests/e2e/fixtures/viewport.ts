import { test } from "@playwright/test";

/**
 * Masaüstü düzenine bağlı testler için viewport kapısı.
 *
 * NEDEN VAR: 2026-08-26'da suite'e mobil proje eklendi (`chromium-mobile`,
 * Pixel 5). On dokuz test düştü ve **hiçbiri gerçek bir uygulama hatası
 * değildi** — hepsi masaüstü DOM'unu arıyordu:
 *
 *   · `product-detail.ts:322` viewport'u 1024px'ten böler; masaüstünde
 *     `ProductBuyBox` + `ProductTabs`, mobilde `MobileLayout` mount edilir.
 *     `#pd-variations-section`, `#product-tabs-section`, `#gallery-main-image`
 *     mobilde HİÇ yok.
 *   · Dil/para birimi seçici masaüstünde header popover'ı, mobilde hesap
 *     overlay'i (mobil karşılığı `mobile-currency.spec.ts`'te ve GEÇİYOR).
 *   · Üretici/ürün filtreleri masaüstünde yan panel (`aside`), mobilde
 *     çekmece.
 *
 * NE DEĞİL: "mobilde çalışmıyor" demek değil. Ekran mobilde ÇALIŞIYOR, farklı
 * bir bileşenle. O bileşenlerin kendi testleri ayrı bir iş —
 * `docs/lojistik/KALAN-ISLER.md` → DevOps'ta kayıtlı.
 *
 * KULLANIM: `describe` gövdesinin ilk satırı olarak çağır.
 */
export function yalnizMasaustu(sebep: string): void {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, `Masaüstü düzenine bağlı: ${sebep}`);
}
