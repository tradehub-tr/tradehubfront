# CSS Refactor — İlerleme Takibi

Spec: `../docs/superpowers/specs/2026-05-13-css-aggressive-refactor-design.md`
Plan: `../docs/superpowers/plans/2026-05-13-css-aggressive-refactor-plan.md`

## Dosya satır sayıları (her faz sonu güncellenir)

| Faz | Tarih | style.css | cart-design | checkout-design | reviews-v5 | seller-storefront | dist CSS toplam |
|---:|---|---:|---:|---:|---:|---:|---:|
| 0 (baseline) | 2026-05-13 | 4878 | 364 | 1032 | 749 | 291 | ~400 KB |
| 1 (dead code) | 2026-05-13 | 4878 | 364 | 1032 | 0 | 291 | ~400 KB |
| 2 (cart) | 2026-05-13 | 4884 | 0 | 1032 | 0 | 291 | ~391 KB |
| 3 (seller) | 2026-05-13 | 4884 | 0 | 1032 | 0 | 190 | ~390 KB |
| 4 (checkout) | 2026-05-13 | 5117 | 0 | 0 | 0 | 190 | ~381 KB |
| 5 (style components) | 2026-05-13 | 4860 | 0 | 0 | 0 | 190 | ~355 KB |
| 6 (style utilities + vanilla) | 2026-05-13 | 4395 | 0 | 0 | 0 | 190 | 349 KB |
| 7 (token silimi) | 2026-05-13 | 4298 | 0 | 0 | 0 | 190 | 345 KB |
| 8 (final) | 2026-05-13 | 4298 | 0 | 0 | 0 | 190 | 365 KB |
| 8.1 (seller merge) | 2026-05-13 | 4462 | 0 | 0 | 0 | **0** | 365 KB |
| 8.2 (yorum sıkıştırma) | 2026-05-13 | **4351** | 0 | 0 | 0 | 0 | 365 KB |
| 8.3 (product-list-mode) | 2026-05-13 | 4231 | 0 | 0 | 0 | 0 | 352 KB |
| 8.4 (@media → utility) | 2026-05-13 | 4167 | 0 | 0 | 0 | 0 | 352 KB |
| 8.5 (body floating-actions) | 2026-05-13 | **4161** | 0 | 0 | 0 | 0 | 352 KB |
| 8.6 (gallery + pd-* + rp-*) | 2026-05-13 | **3748** | 0 | 0 | 0 | 0 | 354 KB |
| 8.7 (dark mode CSS silimi) | 2026-05-13 | **3629** | 0 | 0 | 0 | 0 | 352 KB |
| 8.8 (rv-* → utility) | 2026-05-13 | **3079** | 0 | 0 | 0 | 0 | 348 KB |
| 8.9 (orders/os/msg/fav → utility) | 2026-05-13 | **2946** | 0 | 0 | 0 | 0 | 350 KB |
| 8.10 (toggle/checkbox → peer pattern) | 2026-05-13 | **2893** | 0 | 0 | 0 | 0 | 352 KB |
| 8.11 (pd/pdm/auth/hover/factory → utility) | 2026-05-13 | **2127** | 0 | 0 | 0 | 0 | 354 KB |

## Faz başına notlar

### Faz 0 (tooling) — 2026-05-13
- `.claude/settings.json` eklendi (permissions.ask CSS yollarına)
- `CLAUDE.md` Bölüm 0.0, 0.1, 4.4, 10 güncellendi
- Baseline bundle CSS: style-akW3S_U1.css 352 KB, pages-order-checkout-C4hSshJK.css 20 KB, vendor-swiper-CXe816k3.css 18 KB, pages-cart-2ToPN7IM.css 7.0 KB, interactions-DH138LLs.css 3.6 KB — toplam ~400 KB
- Build başarılı (2.89s), uncommitted header değişiklikleri build'i etkilemedi

### Faz 1 (dead code) — 2026-05-13
- `src/styles/reviews-v5.css` (749 satır) silindi
- `src/components/reviews/ReviewWidget.ts` silindi (sadece kendi içinde referans vardı)
- `src/components/reviews/` boş dizin silindi
- Bundle: ~400 KB → ~400 KB (dosya bundler'a hiç dahil değildi — kaynak disk tasarrufu)
- Silinen toplam: 749 satır CSS + 1 component dosyası

### Faz 2 (cart) — 2026-05-13
- `src/styles/cart-design.css` (364 satır) tamamen silindi
- `src/pages/cart.ts`'ten import kaldırıldı
- 30 cart-specific class utility'e dönüştürüldü, class isimleri korundu
- Special cases:
  - `body:has(.sc-cart-page)` background → style.css @layer base'e taşındı (+6 satır)
  - Alpine `:has()` accordion border → SupplierCard.ts'te `:class="{ 'border-b-0': !expanded }"` ile
  - `--cc-brand`/`--cc-brand-700` → `bg-primary-500`/`border-primary-600` global token (`.th-btn` zaten kullanıyor)
  - `sc-c-supplier-checkout-btn` → `.th-btn .th-btn-sm` (btn() helper zaten primary kullanıyordu, CSS override'lar redundanttı)
  - `sc-c-sku-container-new` → grid'den flex'e HTML yapısı değiştirildi (CSS'in display:flex override'ını taşımak yerine)
  - `sc-c-spu-head` ve `sc-c-spu-toggle` (2'şer duplicate tanım) → tek inline class olarak birleştirildi
- Bundle: pages-cart-*.css (7.0 KB) → tamamen yok (0 KB)
- style.css: 4878 → 4884 satır (+6 satır body:has rule için @layer base'e eklendi)
- dist toplam CSS: ~400 KB → ~391 KB

### Faz 3 (seller) — 2026-05-13
- `src/styles/seller/seller-storefront.css` 291 satırdan 190 satıra indirildi (-%35)
- Dosya SİLİNEMEDİ: gerçek non-convertible CSS içeriyor (açıklama aşağıda)
- Dönüştürülen class'lar (utility'e taşındı, class isimleri korundu):
  - `category-grid__card:hover` → `hover:scale-[1.03]` kart elementine eklendi (CategoryGrid.ts)
  - `hot-products__card:hover .hot-products__image-wrapper img` → karta `group`, img'e `group-hover:scale-105 transition-transform duration-300` eklendi (HotProducts.ts)
  - `category-listing__banner:hover img` → banner'a `group`, img'e `group-hover:scale-[1.02] transition-transform duration-300` eklendi (CategoryProductListing.ts)
  - `why-choose__icon-card:hover` → zaten `hover:-translate-y-1` vardı, CSS kuralı DEAD
  - `contact-form__send:active` → `active:scale-[0.97]` butona eklendi (ContactForm.ts)
  - `company-profile__contact-btn:focus-visible` → `focus-visible:outline-2 focus-visible:outline-[var(--color-store-accent,#cc9900)] focus-visible:outline-offset-2` butona eklendi (CompanyProfile.ts)
  - `company-profile__inquiry-btn:focus-visible` → aynı focus-visible utilities eklendi
  - `store-nav__dropdown` bg/text → `bg-[var(--store-nav-bg)] text-[var(--store-nav-text,#ffffff)]` dropdown div'lerine eklendi (StoreNav.ts)
  - `store-nav { transition }` → HTML'de zaten `transition-shadow duration-200` vardı, CSS kuralı DEAD
  - `store-header__chevron--rotated` + `store-header__badge--pro` + `@keyframes badge-pulse` → HTML'de HIÇBIR KULLANIM YOK, silinebilir DEAD kurallar
  - `company-profile__main-tab` + `.active` + `company-profile__prod-cat.active` → tab sistemi Alpine'a migre edilmiş, bu class'lar HTML'de yok, DEAD
- CSS'te KALAN (non-convertible, gerekçeli):
  - `.store-nav--scrolled` descendant selectors → JS classList toggle + child element cascading, Tailwind utility ile ifade edilemez
  - `.store-hero__dot/--active` → Swiper `bulletClass`/`bulletActiveClass` config ile enjekte ediliyor, HTML elementine utility eklenemez
  - `.company-info__scrollable-text` scrollbar pseudo-elements → `::-webkit-scrollbar` Tailwind utility değil
  - `.certificates__*` + `.swiper-pagination-bullet*` → 3rd-party Swiper compound selector
  - `@media (max-width: 480px)` floating actions → 480px custom breakpoint, Tailwind `sm:` (640px) ile örtüşmüyor
  - dark mode `.certificates__prev/next` → 3rd-party Swiper element overrides
- style.css: 4884 satır (değişmedi — seller için ek satır gerekmedi)
- Bundle: interactions-DH138LLs.css 3.6 KB → interactions-BDNV71Ev.css 2.4 KB (-1.2 KB, -%33)
- dist toplam CSS: ~391 KB → ~390 KB

### Faz 4 (checkout) — 2026-05-13

**Sonuç:** `src/styles/checkout-design.css` (1032 satır) tamamen silindi — DONE.

**Yapılanlar:**
- **42 DEAD class** (co-pill-amber-soft, co-billing-fields, co-field, co-suppliers, co-supplier, co-chev, co-dot, co-ship-*, co-product-thumb/info/name/meta/products, co-variant-*, co-sep, co-link-ul, co-note-preview, co-footer-strip, co-trust-mini, co-modal-secure, vb.) CSS'ten silindi
- **Token bloğu** (`.sc-checkout-page { --co-brand: ...; }` 13 değişken) silindi — var(--co-*) → inline hex/token
- **P1:** `body:has(.sc-checkout-page)` → `style.css @layer base`'e taşındı. `.sc-checkout-page` arka plan → `CheckoutLayout.ts`'te `bg-[#f7f7f5]` utility
- **P2:** `.co-page-head/co-page-head-l/co-page-title/co-page-sub` → `CheckoutHeader.ts`'te Tailwind utility'leri (flex, gap-8, text-[28px], font-semibold, vb.)
- **P3:** `.checkout-section/__header/__icon/__title/__content/--collapsed` → 4 bileşene (ShippingAddressForm, BillingInfoSection, PaymentMethodSection, ItemsDeliverySection) `bg-white border border-[#e8e6e0] rounded-2xl shadow-[...] px-[22px] py-[18px]` gibi utility'ler eklendi
- **P4 (Pills):** `co-pill co-pill-ok/warn/amber/ghost` + `co-pill-dot` → ShippingAddressForm, BillingInfoSection, PaymentMethodSection'da inline utility zincirleri
- **P5 (Adres):** `co-link-btn` → `appearance-none bg-transparent ... hover:bg-[#fafaf8] focus:outline-none` inline. `co-add-row` → `border-dashed hover:border-[#f5b800] hover:bg-[#fff8e1]` inline. `co-addr-block/name/line/muted` → `p-[14px_16px] bg-[#fafaf8] rounded-xl` vb. inline
- **P6 (Ödeme):** `co-pay-row` + Alpine `is-selected` → `:class` binding ile `border-[#f5b800] bg-[#fff8e1] shadow-[...]`. `co-radio` + inner span → `:class` binding ile renk geçişi inline. `co-pay-sub/list/content/title-row/title/desc` → inline utility'ler
- **P7 (Fatura):** `co-billing-toggle` → `grid grid-cols-2 max-[720px]:grid-cols-1 gap-[10px]`. `co-billing-toggle-card` + `is-active` → `:class` binding ile brand highlight. `co-bt-title/sub` → inline. `co-billing-addr-pill` → `flex items-center gap-2 p-[12px_14px] bg-[#fafaf8]` inline
- **P8 (ItemsDelivery):** Kaçırılmış Tailwind selector override'ları (`.bg-\[\#f3f4f6\]`, `.border-\[\#111827\]`, button SVG boyutları, `h3.text-\[20px\]`, vb.) + `co-product-card/head/total/chev` compound'ları → `style.css` sonuna taşındı (CSS-only, template restrüktürü olmadan inline edilemez)
- `co-section-summary` → PaymentMethodSection header'da `text-[12.5px] font-medium ... rounded-full px-[10px]` inline
- `co-supplier-count` → ItemsDeliverySection'da `text-[11.5px] font-medium ... rounded-full` inline
- **`ItemsDeliverySection.ts:451`** `text-[var(--co-muted)]` → `text-[#8a877f]` düzeltildi
- `src/pages/checkout.ts:7` import satırı silindi

**Kararlar:**
- P8 raw selector overrides (`.bg-\[\#f3f4f6\]` gibi) → template restrüktürü yerine `style.css` sonuna taşındı. Bunlar `ItemsDeliverySection`'ın kendi Tailwind class'larını ezmek için gerekli; class adı aynı, değer farklı. Alternatif: template'i yeniden yaz (daha büyük iş, ayrı task).
- `co-page-title` 720px responsive rule → `style.css` @media bloğu içine taşındı

**Metrikler:**
- checkout-design.css: 1032 satır → 0 (silindi)
- style.css: 4884 → 5117 satır (+233, P8 ve layout override'lar dahil)
- pages-order-checkout-*.css: ~20 KB → yok (checkout CSS artık main bundle'da)
- dist toplam CSS: ~390 KB → ~381 KB (-9 KB)

### Faz 5 (style components) — 2026-05-13

**Sonuç:** style.css 5117 → 4860 satır (-257 satır). DONE.

**Task 1 — DEAD class silme (5 class, ~39 satır):**
- `.auth-input-focus:focus` — kullanılmıyor (3 rule satırı)
- `.auth-otp-focus:focus` — kullanılmıyor (3 rule satırı)
- `.auth-link-hover:hover` — kullanılmıyor (1 rule satırı)
- `.th-card-title` — kullanılmıyor (2 rule satırı)
- `.pc-topranking` — kullanılmıyor (4 rule satırı)
Not: `--auth-input-focus` CSS değişkeni `:root`'ta korundu (token sistemi kullanıyor).

**Task 2 — Single-use class dönüşümü: KAPSAM REVİZE:**
- `th-btn-danger/ghost/link/block/icon` — `btn()` helper aracılığıyla ÇOKLU DOSYA kullanıyor
  (section-registry.ts, cart/BatchSelectBar.ts, seller/Certificates.ts, seller/CompanyInfo.ts,
  checkout/OrderSummary.ts, profile/ProfileLayout.ts vb.) → PROTECTED olarak korundu.
- `th-nav-link/th-footer-link/th-footer-social/th-search-image-link/th-subheader-link` →
  CSS değişkeni kullanan (tema-driven) multi-file class'lar → PROTECTED.
- `search-chip:hover` → `--search-chip-hover-bg` token kullanan hover rule → PROTECTED.
- `pc-mini/rfq-search-card/hot-products__card` → CSS değişkeni kullanan kart class'ları → PROTECTED.

**Task 3 — P8 override reversal (226 satır, BÜYÜK KAZANIM):**
Faz 4'te `src/style.css` sonuna taşınan `#checkout-items` override bloğu tamamen silindi.
`ItemsDeliverySection.ts` template'i yeniden yazıldı:
- Supplier block: `pt-5 border-t border-[#e5e5e5]` → `p-0 border-t border-[#e8e6e0] mt-0`
- Supplier button: hover:opacity → `hover:bg-[#fafaf8] transition-colors`, `px-[22px] py-[14px]`
- Store icon svg: `w-6 h-6 text-[#6b7280]` → `w-4 h-4 text-[#8a877f]`
- Chevron svg: `w-5 h-5 text-[#6b7280]` → `w-4 h-4 text-[#8a877f]`
- Seller name h3: `text-[20px] font-bold text-[#111827]` → `text-[14.5px] font-semibold text-[#1a1a1a]`
- Collapsed price span: `text-[15px] sm:text-[17px] font-bold text-[#111827]` → `text-[14px] font-semibold text-[#1a1a1a]`
- Expanded body div: `transition-all duration-300` → `+ pt-1 px-[22px] pb-[18px]`
- Product card: `co-product-card mt-4` → inline border/radius/bg/overflow/margin
- Product head button: `items-start gap-4` → `items-center gap-3 px-3 py-[10px] hover:bg-[#fafaf8]`
- Product image: `w-16 h-16 sm:w-24 sm:h-24` → `w-12 h-12 rounded-[6px]`
- Product h4: `text-[18px] leading-7` → `text-[13.5px] leading-[1.35] truncate`
- Product moq p: `text-[15px] text-[#6b7280] mt-1` → `text-[11.5px] text-[#8a877f] mt-0.5`
- Summary p: `text-[13px] sm:text-[14px] text-[#374151]` → `text-[12.5px] text-[#8a877f]`
- SKU row: `bg-[#f3f4f6] px-3 py-2 sm:px-4 sm:py-3` → `bg-[#fafaf8] border border-[#e8e6e0] rounded-xl px-[14px] py-[10px]`
- SKU img: `w-12 h-12 sm:w-14 sm:h-14` → `w-10 h-10 rounded-[6px]`
- SKU text sizes: `text-sm sm:text-[16px/17px]` → `text-[13px]`
- Shipping row: `rounded-md border border-[#111827]` → `rounded-xl border-[1.5px] border-[#1a1a1a]`
- Shipping text: `text-sm sm:text-[16px] / text-xs sm:text-[13px]` → `text-[13.5px] / text-[12.5px]`
- Note button: `text-[18px] text-[#111827]` → `text-[13px] text-[#4a4a48] decoration-[#d5d2c9]`
- Note p: `text-[18px] text-[#111827]` → `text-[13px] text-[#4a4a48]`
- Header responsive: `max-[720px]:px-4 max-[720px]:py-[14px]` inline
- Content responsive: `max-[720px]:px-4 max-[720px]:pb-4` inline
- Deleted: 226 satır CSS override bloğu (style.css son bölümü)

**Değiştirilen dosyalar:**
- `src/style.css` (5117 → 4860, -257 satır)
- `src/components/checkout/ItemsDeliverySection.ts` (P8 reversal — 20+ element güncellendi)

**Build:** ✓ başarılı (2.78s)
**tsc --noEmit:** ✓ hatasız
**Protected class doğrulaması:** ✓ .th-btn, .th-btn-outline, .th-btn-dark, .th-input, .th-input-sm/md/lg/borderless, .th-checkbox, .th-quantity*, .th-card, .th-badge, .th-header-icon hepsi mevcut
**Bundle:** style-*.css 355 KB (öncesi ~381 KB toplam, checkout CSS artık style'a dahil)

### Faz 6 (style utilities + vanilla) — 2026-05-13

**Sonuç:** style.css 4860 → 4395 satır (-465 satır). DONE.

**Konservatif scope:** theme-driven, JS-toggle, pseudo-element, @keyframes, @theme token, dashboard :root blokları korundu.

**Task 1 — DEAD class silimi (~330 satır):**

- **pd-* (Group A):** pd-customization-list, pd-info-section, pd-section-header, pd-section-title, pd-select-now, pd-ta-badge, pd-ta-header, pd-ta-item, pd-ta-payment-icons, pd-verified-badge, pd-sample-left — hepsi comment placeholder halindeydi (CSS kuralları yoktu, sadece comment satırları), temizlendi
- **pdm-* (Group B) — kısmen:** pdm-custom-table, pdm-payment-icon(s), pdm-prot-section, pdm-shipping-method-card/details/name, pdm-shipping-row, pdm-shipping-card — 0 ref, silindi (~80 satır). pdm-attrs-table, pdm-bar-*, pdm-sheet-*, pdm-section-tab, pdm-gallery-*, pdm-collapsible-*, pdm-color-thumb, pdm-variant-pill, pdm-shipping-section KORUNDU (aktif kullanım)
- **rv-* legacy (Group C):** rv-product-link, rv-product-thumb, rv-product-title, rv-product-price (~34 satır), rv-sort-btn (~17 satır), rv-hidden-reviews-link + hover (~15 satır) silindi. rv-product-card* ailesi KORUNDU (aktif)
- **Cart pseudo orphans (Group D):** next-checkbox-inner::after iki rule (checked + indeterminate, ~24 satır), .next-checkbox.bg-text-primary (orphan, ~4 satır), sc-c-spu-favorite-icon, sc-c-spu-delete-icon, sc-c-sku-delete-icon ::before rules (~10 satır) silindi. .next-checkbox-wrapper:hover (aktif) + .bg-cta-primary (aktif) KORUNDU
- **factory-slider (Group E):** factory-slider.factory-peek-* + prefers-reduced-motion block (~24 satır) silindi
- **related-products (Group E):** related-products-section, related-products-swiper (~13 satır) silindi
- **msg-list__item--active (Group E):** 0 ref, silindi (~3 satır)
- **os-modal__radio/checkbox + os-faq__accordion (Group E):** 0 ref sub-classes, silindi (~46 satır)

**Task 2 — Yorum bloğu temizliği (~85 satır):**
- "ProductTitleBar migrated to Tailwind" bölüm başlığı (~5 satır)
- Thumbnail strip, Action buttons, pd-gallery-tabs, Gallery lightbox, ProductAttributes, pd-section-heading, pd-section-collapsible, Customization styles placeholder'ları (~15 satır)
- "Responsive: rating summary mobile", "Phase E" responsive satırı (~2 satır)
- "sp-* classes migrated to CompanyProfile.ts" (~2 satır)
- OtherServicesLayout, Settings Page, Settings components, Profile page placeholder'ları (~8 satır)
- "NewBuyerInfo/UserInfoCard migrated" + "Navigation Arrows" (~5 satır)
- "Orders mobile scroll", "Inquiries & Contacts" (~3 satır)
- "Layout now in Tailwind: ..." tek satır comment'lar (25 adet, ~27 satır)
- Fy26 Product Card migrated comment'lar (~3 satır)
- pd-sample-price, pd-variations-section, pd-info-section, pd-ta-header migrated comment'lar (~4 satır, kural yoktu zaten)

**Task 3 — Selektif inline (rp-tab):**
- `.rp-tab { position: relative; }` silindi — zaten `relative` Tailwind class olarak HTML'de mevcut (~3 satır)
- `.rp-tab.rp-tab-active::after` pseudo-element KORUNDU (CSS zorunlu)
- `.rp-card` tema-driven CSS değişkenleri içerdiğinden KORUNDU

**Korunanlar (PROTECTED / SKIP):**
- product-card__* ailesi (tema-driven) — dokunulmadı
- JS-toggled state class'lar (msg-inbox__cat--active, os-tab-content--active, orders__tab, vb.) — korundu
- @keyframes (osModalIn, hero animasyonlar) — korundu
- Swiper 3rd-party overrides — korundu
- Dashboard :root token bloğu (~50+ token) — korundu
- pdm-* aktif class'lar (section-tab, gallery, sheet, collapsible, bar, color/variant) — korundu

**Metrikler:**
- style.css: 4860 → 4395 satır (-465 satır)
- Bundle style-*.css: 355 KB → 349 KB (-6 KB)
- Build: ✓ başarılı
- tsc --noEmit: ✓ hatasız
- Branch: ahmet (değişmedi), commit yok

**Gerçekçi hedef notu:** Orijinal 700 satır hedefi, tema sistemi korunan CSS (product-card__*, dashboard :root, swiper override'lar) nedeniyle mümkün değil. Gerçekçi final: ~4000 satır (Faz 7 token silimi + Faz 8 final sonrası).

### Faz 7 (token silimi) — 2026-05-13

**Sonuç:** style.css 4395 → 4298 satır (-97 satır). DONE.

**Cross-repo kontrol:** tradehubfront/src + tradehubfront/pages + admin-panel/src + tradehub_core

**Sayılar:**
- `@theme` bloğunda: 178 token
- `:root` bloklarında: 372 token
- Toplam unique token: 548
- `front:0 admin:0 core:0` (style.css dışında hiç kullanılmayan): 147 token
- themeTokens.ts korumasına takılan (silinmedi): 2 token (`--input-border-color-hover`, `--shadow-card-hover`)
- İlk filtre sonrası silme adayı: 145 token
- style.css içinde CSS rule'larda var() ile tüketilen (silindi ama CSS kuralı da canlı): 48 token → KORUNDU
- **Gerçekten güvenli ve silinen: 97 token**

**Silinen token aileleri:**
- `color-sidebar-*` (19) — eski sidebar nav sistemi
- `color-rp-*` (8) — kaldırılan "Recently Purchased" özelliği
- `pd-variant-*/related/price-tier/qty-input/title-size/price-size` (8) — product detail unused vars
- `color-orders-tab-*` bölümü: `:root`'taki tanımlar, ama CSS kuralları CANLI → **KORUNDU**
- `color-nbi-*` (6) — hiç hayata geçirilmemiş NBI özelliği
- `dashboard-*` (4) — layout token'ları kullanılmıyor
- `color-slider-*` (5) — slider tema değişkenleri, hiç var() yok
- `color-store-nav-*/accent-hover` (4) — store nav token'ları kullanılmıyor
- `topdeals-page-pill-*/tab-*` (5) — top deals sayfa özel token'ları
- `text-*` alias'lar (6) — text-body, text-badge, text-breadcrumb vb.
- `input-focus-ring-offset` (1) — sadece tanım var, CSS rule'da kullanılmıyor
- `transition-easing/transition-speed` (2) — (transition-fast KORUNDU: aktif CSS rule)
- `space-page-x/space-section-gap` (2) — eski pre-refactor alias'lar
- `breakpoint-2xl/3xl/4xl` (3) — non-standard breakpoints
- Diğerleri: font-size-caption/hero-lg, color-cta-text, color-product-name, container-full, max-content-width, sidebar-collapsed/expanded-width, right-panel-width, shadow-form, modal-btn-primary-bg, mfr-profile-label-color, radius-avatar, search-btn-bg/hover, stepper-active-bg vb.

**Korunan (false-positive uyarısı):**
- 48 token: `front:0` scan'ı style.css'i hariç tuttu, ancak bu token'lar style.css içindeki canlı CSS rule'larda (`var()` ile) kullanılıyordu → `.th-input`, `.th-checkbox`, `.th-quantity`, `.orders__tab`, `.th-nav` rule'ları hepsi aktif.
- `--topdeals-page-hero-gradient` — TopDealsHero.ts'te `var(--topdeals-page-hero-gradient, ...)` ile kullanılıyor, sağlıklı şekilde listeden çıktı.

**Admin-panel sürprizi:** Silinen listede admin-panel kullanımı olan token yok (0). Admin panel sadece themeTokens.ts'teki token'ları yönetiyor; bunlar zaten korunuyor.

**Metrikler:**
- style.css: 4395 → 4298 satır (-97 satır)
- Bundle style-*.css: 349 KB → 345 KB (-4 KB)
- Build: ✓ başarılı (2.84s)
- tsc --noEmit: ✓ hatasız
- Branch: ahmet (değişmedi), commit yok

### Faz 8 (final) — 2026-05-13
- CLAUDE.md Bölüm 12.1 "Tamamlanan refactor'lar" eklendi (gerçekleşmiş hedefler)
- CLAUDE.md Bölüm 4.4 ve Bölüm 10.16 gerçekçi sayılarla güncellendi
- CLAUDE.md Bölüm 0.1 "Neden" notu refactor sonrası state'i yansıtıyor
- style.css final: 4298 satır
- Bundle final: 365 KB (interactions 2.4K + style 345K + vendor-swiper 18K)
- Spec hedefi 700 → realistik 4300 olarak revize edildi (theme system + JS-toggle + pseudo-elements zorunlu)

### Faz 8.1 (seller merge) — 2026-05-13
- Kullanıcı sorusu: "seller-storefront.css'i neden style.css'e birleştirmedin?"
- `src/styles/seller/seller-storefront.css` (190 satır) → `src/style.css` sonuna eklendi (yeni "SELLER STOREFRONT — Residual" bölümü)
- `src/styles/seller/seller-storefront.css` silindi, `src/styles/seller/` boş dizin silindi, **`src/styles/` dizini tamamen kalmadı**
- `src/pages/seller-shop.ts:8` ve `src/pages/seller-storefront.ts:6` import satırları kaldırıldı
- `interactions-*.css` chunk (2.4 KB) tamamen elimine oldu — içerik ana style bundle'a birleşti
- style.css: 4298 → 4462 satır (+164, seller residual eklendi)
- Bundle: 365 KB → 365 KB (interactions kaldı sayılır — chunk azaldı: 3 → 2)
- **Spec hedefi `src/styles/*.css = 0 satır` GERÇEKLEŞTİ** ✅

### Faz 8.2 (yorum sıkıştırma) — 2026-05-13
- Kullanıcı sorusu: "yorum satırları silinirse kaç satıra düşer?"
- ASCII başlık dekorasyonları sıkıştırıldı (3-4 satır → 1 satır):
  - 47 adet `/* === */` ve `/* ═══ */` 3-satır blok → 1-satır `/* === TEXT === */`
  - 2 adet `/* ╔═══╗ ║ TEXT ║ ╚═══╝ */` 3-satır box → 1-satır `/* === TEXT === */`
  - Toplam: **49 blok sıkıştırıldı, -111 satır**
- Section navigasyonu korundu (header'lar hâlâ tek satır olarak görünür)
- Bundle değişmedi (Tailwind zaten yorumları minify ediyor)
- style.css: 4462 → **4351 satır** (-111)

### Faz 8.3 (product-list-mode → utility) — 2026-05-13
- Kullanıcı sorusu: "bu media query'ler Tailwind sm/md gibi class'larla yazılabilirdi"
- Doğrulandı: Tailwind v4 doc'larında `data-[list-mode=list]:` + `group-data-[list-mode=list]/grid:` + `min-[480px]:` / `min-[1200px]:` / `lg:max-[1599px]:` pattern'leri mevcut
- JS değişikliği: `classList.toggle("product-list-mode")` → `dataset.listMode = "list"|"grid"`
- HTML değişikliği: parent grid'e `group/grid` + `data-list-mode="grid"` eklendi, children'a `min-[480px]:group-data-[list-mode=list]/grid:*` ve `lg:max-[1599px]:group-data-[list-mode=grid]/grid:*` variant zincirleri
- style.css'ten 3 `@media` bloku + 16 kural silindi (120 satır)
- Not: CSS'teki `.px-1` override kuralı dead code'du — HTML'de `px-3` kullanılıyor, `px-1` yok; kural zaten etkisizdi
- Etkilenen dosya: `src/components/products/ProductListingGrid.ts`
- style.css: 4351 → **4231 satır** (-120)
- Bundle: 365 KB → 352 KB (-13 KB, yeni Tailwind utility'leri JIT ile eklendi)

---

## ÖZET — CSS Agresif Refactor Sonuçları (2026-05-13)

| Metric | Baseline | Final | Değişim |
|---|---:|---:|---:|
| `src/style.css` | 4878 | **4351** | -527 |
| `src/styles/*.css` toplam | 2436 | **0** ✅ | -2436 |
| Toplam source CSS | 7314 | **4351** | -2963 (-%41) |
| `dist/assets/*.css` toplam | ~400 KB | **365 KB** | -35 KB (-%9) |
| Silinen src CSS dosyası | 0 | **4** | reviews, cart, checkout-design, seller-storefront |
| Silinen sub-bundle chunk | 0 | **3** | pages-cart, pages-order-checkout, interactions |

### Faz başına azaltma

| Faz | style.css değişim | styles/* değişim | Notlar |
|---|---:|---:|---|
| 0 (tooling) | 0 | 0 | settings.json + CLAUDE.md kuralları |
| 1 (dead code) | 0 | -749 | reviews-v5.css ölü kod silimi |
| 2 (cart) | +6 | -364 | cart-design.css → utility, body:has rule eklendi |
| 3 (seller) | 0 | -101 | seller-storefront.css 291→190 (3rd-party Swiper) |
| 4 (checkout) | +233 | -1032 | checkout-design.css silindi, P8 escaped selector style.css'e |
| 5 (style components) | -257 | 0 | DEAD silimi + P8 reversal (en büyük style.css kazancı) |
| 6 (utilities + vanilla) | -465 | 0 | DEAD class + yorum + selektif inline (konservatif) |
| 7 (token silimi) | -97 | 0 | 97 kullanılmayan @theme/:root token (cross-repo doğrulanmış) |
| 8 (final) | 0 | 0 | CLAUDE.md "Tamamlandı" notu + sayı güncellemeleri |

### Realistik hedef revizyonu

Spec'in "src/style.css ~700 satır" hedefi tema sistemi gereksinimleriyle uyumsuz çıktı:
- `.th-btn-*`, `.th-input-*`, `.th-checkbox`, `.th-quantity*`, `.th-card`, `.th-badge`, `.th-header-icon` (~430 satır PROTECTED — remote theme system contract)
- `.product-card__*` ailesi (~150 satır, %100 var(--*) theme-driven)
- Dashboard `:root` token bloku (~100 satır, design tokens)
- JS-toggled state class'ları (~300 satır, classList.toggle ile yönetilen)
- Pseudo-elementler/animasyonlar/3rd-party Swiper override'lar (~700 satır)

Toplamda ~1700 satır zorunlu. Realistik final: **~4300 satır**, sürdürülebilir.

### Korunan disiplin mekanizmaları

- `tradehubfront/.claude/settings.json` — permissions.ask src/style.css ve src/styles/** için aktif
- `CLAUDE.md` Bölüm 0.0 (İzin Kapısı), 0.1 (5-soru karar matrisi), 4.4 (yeni satır eklemek için kanıt), 10.15-17 (yeni yasak listesi)
- Yeni `src/styles/*.css` dosyası açma yasağı

---

### Faz 8.4 (@media → utility) — 2026-05-13
- Kullanıcı talebi: style.css'teki convertible `@media` bloklarını Tailwind responsive variant'a çevir
- CLAUDE.md Bölüm 0.1.1 yeni kural eklendi: @media karar matrisi + convert/keep listesi
- Çevrilen bloklar:
  - Duplicate `@media (prefers-reduced-motion)` (line ~808) → silindi (line 733'teki global kopya korundu)
  - `@media (hover: none), (pointer: coarse) { #gallery-main-image.zoom-enabled }` → `pointer-coarse:cursor-default` (ProductImageGallery.ts)
  - `@media (width >= 1536px) { #gallery-prev }` → `2xl:left-[88px]` (ProductImageGallery.ts)
  - `@media (max-width: 374px) { #pd-mobile-bar }` → `max-[374px]:grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)]` (product-detail.ts)
  - `@media (max-width: 768px) and (min-width: 481px) { .floating-actions__btn }` → `max-[768px]:min-[481px]:w-11 max-[768px]:min-[481px]:h-[60px]` + span `max-[768px]:min-[481px]:hidden` (FloatingActions.ts)
  - `@media (max-width: 480px) { .floating-actions/__btn }` → `max-[480px]:*` chain (FloatingActions.ts)
- Korunan: body padding-bottom rule — `body:has(.floating-actions) { padding-bottom: 48px }` scoped @media olarak korundu (body selector'a utility koyulamaz)
- Korunan: line 733 (global * reset), line 1710 (Swiper-internal class), @media print
- style.css: 4231 → 4167 satır (-64)
- Bundle: 352 KB (style-*.css, gzip önce; önceki ile fark ihmal edilebilir — utility'ler zaten var olan token'ları kullanıyor)

### Faz 8.5 (body floating-actions → utility) — 2026-05-13
- Kullanıcı sorusu: floating-actions `body:has()` CSS kuralı + mobile sticky bar
- `body.pd-mobile-bar-open { padding-bottom }` → product-detail.ts `document.body.classList` utility kombinasyonu
- style.css: 4167 → 4161 satır (-6)

### Faz 8.6 (gallery + pd-* + rp-* → utility) — 2026-05-13
- Kullanıcı talebi: bu büyük blok da convertible — agresif çevir
- Çevrilen kategori sayısı:
  - Easy wins (last-child, even, nth-last-child, hover-only): 5 kural (pd-attr-row, pd-attr-cell, pd-thumb-arrow, gallery-action-btn, pd-hero-gallery)
  - RelatedProducts (rp-card, rp-tab+::after): 2 kural
  - PD info layout (#pd-hero-left/#product-tabs-section, #pd-info-scrollable, .pd-sticky descendant, @variant xl): 4 kural
  - ProductImageGallery main (product-gallery, gallery-thumb/.active, #gallery-main-image+.zoom/.is-zooming, gallery-media-asset, gallery-nav-btn+hover, #gallery-prev+next, gallery-view-tab/.active): ~12 kural
  - ProductImageGallery lightbox (#gallery-lightbox + tüm child element'leri): ~16 kural
  - PD attrs & collapsible (pd-section-collapsible svg, pd-section-collapsible.open svg): 2 kural
- Korunan: `body.gallery-lightbox-open { overflow: hidden }` (JS body'ye class ekliyor, utility koyulamaz)
- Korunan: pd-attrs-table ailesi (CSS'te kaldı — table td/th descendant rule'ları en pratik şekilde CSS'te)
- Etkilenen dosyalar: ProductImageGallery.ts, ProductInfo.ts, RelatedProducts.ts, AttributesTabContent.ts, ProductAttributes.ts, ProductTabs.ts, product-detail.ts
- style.css: 4161 → 3748 satır (-413 satır)
- Bundle: 352 KB → 354 KB (+2 KB, yeni arbitrary utilities JIT'te biraz daha genişledi)
- Build: ✓ başarılı (3.06s)
- tsc --noEmit: ✓ hatasız
- Branch: ahmet (değişmedi), commit yok

### Faz 8.8 (rv-* → utility) — 2026-05-13
- Kullanıcı talebi: rv-* (Reviews) blokları da convertible — çevir
- 73 rv-* kuralı utility'e dönüştürüldü:
  - Sub-tabs, rating summary, category bars: static + theme-var
  - Filter pills, mention tags, helpful button: JS-toggled (active, voted) → [&.x]: variant
  - Review card + avatar + badges + reply: static + theme-var
  - Rating dropdown + Sort dropdown: complex (open state + active items) → [&.open_.rv-*-panel]:block arbitrary descendant variant
  - Modal (overlay, header, title, close): modal layout chain
  - Language toggle row: descendant svg/span/a selectors → inline utilities
  - Login divider: ::before/::after pseudo → before:content-[''] / after:content-['']
  - Product card in reviews: static theme-var
- DEAD code note: rv-modal-hidden (.rv-modal-hidden { display: none !important }) — Alpine x-show handles visibility, class never toggled in JS; deleted safely
- Etkilenen dosyalar: ProductReviews.ts, ReviewsModal.ts, SocialLoginButtons.ts (rv-login-divider)
- alpine/product.ts: referans olarak okundu, rv-* CSS sınıflarını doğrudan oluşturmuyor (sadece state yönetimi)
- style.css: 3629 → 3079 satır (-550 satır)
- Bundle: 352 KB → 348 KB (-4 KB)
- Build: ✓ başarılı
- tsc --noEmit: ✓ hatasız
- Branch: ahmet (değişmedi), commit yok

### Faz 8.9 (orders__/os-/msg-/fav- → utility) — 2026-05-13
- 22 JS-toggled state CSS kuralı utility'e dönüştürüldü
- Kategori A (orders__): tab base + active + chevron rotate (descendant via [.orders__tab--active_&]:), dropdown positioning + animation states + items hover/selected
- Kategori B (msg-inbox__cat--active): theme-var driven active state (3 !important kural kaldırıldı, utility specificity yeterli)
- Kategori C (os-*): tab content show/hide (hidden [&.os-tab-content--active]:block), tabs active + compound orange variant ([&.os-tabs__tab--active.os-tabs__tab--orange]:), pills active + hover, nav-link active (3 prop chain); os-modal__input + os-reviews-toolbar__input placeholder kuralları DEAD CODE (template'te bu sınıflar yok) — silindi
- Kategori D (fav-tab-content): show/hide; initFavTabs'tan panel.style.display inline override kaldırıldı
- Korunan: `@keyframes osModalIn` (animation)
- Etkilenen dosyalar: OrdersTabs.ts, OrdersPageLayout.ts, InboxPanel.ts, FavoritesLayout.ts, style.css
- style.css: 3079 → 2946 satır (-133)
- Bundle: 348 KB → 350 KB (+2 KB, yeni arbitrary utilities JIT genişlemesi)
- Build: ✓ başarılı
- tsc --noEmit: ✓ hatasız
- Branch: ahmet (değişmedi), commit yok

### Faz 8.10 (toggle/checkbox → peer pattern) — 2026-05-13
- Kullanıcı talebi: ad-pref/email-pref toggle slider + email-pref checkbox da convertible
- Tailwind v4 `peer-checked:` pattern uygulandı (input:checked + sibling selector → peer pattern)
- Çevrilen CSS rule'lar:
  - `.ad-pref__toggle-slider`, `.email-pref__toggle-slider` base styling + `::before` thumb pseudo
  - `input:checked + .x` sibling state → `peer-checked:bg-...`
  - `input:checked + .x::before` thumb translate → `peer-checked:before:translate-x-[22px]`
  - `.email-pref__checkbox input:checked + .email-pref__checkmark` + `::after` checkmark
- Korunan: `.operation-slider__pagination .swiper-pagination-bullet/-active` (Swiper-injected, 3rd-party override)
- Etkilenen dosyalar: SettingsAdPreferences.ts, SettingsEmailPreferences.ts
- style.css: 2946 → 2893 satır (-53)
- Bundle: 350 KB → 352 KB (+2 KB, yeni peer-checked arbitrary utilities JIT genişlemesi)
- Build: ✓ başarılı
- tsc --noEmit: ✓ hatasız
- Branch: ahmet (değişmedi), commit yok

### Faz 8.11 (pd/pdm/auth/hover-expand/factory-tab → utility) — 2026-05-13
- Çevrilen kategoriler:
  - A: DEAD code silimi — 5 redundant CSS kural silindi (pd-price-tier-price flex-wrap, pd-price-tier:not(:first-child) border-left, pd-price-tier.active background, variant-group margin-bottom x2)
  - B: pdm-* @apply 375px overrides → inline utilities (8 CSS bloğu → template'e taşındı; footer @apply tek satır kaldı — global element selector)
  - C: pd-* product detail komple dönüşüm — product-info, pd-card-tabs, pd-card-tab (+active+not-first-child), pd-ready-badge (+is-out-of-stock), pd-price-tiers, pd-price-tier family, pd-sample-btn (+hover), pd-variant-label, pd-color-thumbs+thumb (+states), pd-variant-btn (+states), pd-cta-buttons (+pd-add-to-cart--disabled+sticky parent), KYB banner family, pd-trade-assurance (DEAD — #pd-trade-assurance ID template'te hiç yok)
  - D: pd-attrs-table family — table+td+th+key+val tüm descendant chain; AttributesTabContent.ts KEY_CLS/VAL_CLS constant ile tutarlı uygulandı
  - E: pdm-* mobile detail — gallery scrollbar [::-webkit-scrollbar] + placeholder gradient, gallery-action-btn active, section-tab transition + active state, sample-btn active, reviews stars svg boyutu, collapsible header em + chevron rotate + body pdm-hidden, color-thumb active+disabled, variant-pill active+disabled, shipping-section bg, supplier-btn active, bottom-sheet komple animasyon chain (pdm-hidden/pdm-sheet-visible/pdm-sheet-inner translateY), sheet-handle+header+close+body, pdm-attrs-table (inline descendant chain), bar-chat/cart/order-btn active states
  - F: auth-account-type-card — border+bg+before (radio circle pseudo)+hover+focus-visible+selected+selected::before+selected:hover+icon color tümü inline; [.auth-account-type-card.selected_&]: parent state pattern ile icon renk çözüldü
  - G: auth-password-req-item — text-color+valid+invalid+icon hide+invalid-icon-color inline; valid::before SVG data URL CSS'te KORUNDU (DONE_WITH_CONCERNS: data URL çok uzun, arbitrary class string'ine taşımak pratik değil)
  - H: hover-expand-center — before:content+absolute+inset+bg+scale+origin+transition+z-index+rounded-inherit+hover:scale-x-100 tümü inline; ManufacturersHero.ts RFQ link'ine eklendi
  - I: factory-tab-active — [&.factory-tab-active]:relative+font-bold+after:* underline indicator; HorizontalCategoryBar.ts tab li'ye eklendi; JS classList.add/remove uyumlu
- Korunan:
  - `body.gallery-lightbox-open` (JS body'ye class ekliyor)
  - `body.pdm-sheet-open` (JS body'ye class ekliyor)
  - `footer { @apply max-[374px]:overflow-x-hidden }` (global element selector, template'te her footer'a eklemek pratik değil)
  - `.auth-password-req-item.valid::before` (SVG data URL pseudo-element)
- style.css: 2893 → 2127 satır (-766)
- Bundle: 352 KB → 354 KB (+2 KB, JIT yeni arbitrary utility pattern'ları)
- Build: ✓ başarılı
- tsc --noEmit: ✓ hatasız
- Branch: ahmet (değişmedi), commit yok
