> ⚠ **BU PLAN 2026-05-13 İTİBARIYLA GEÇERSİZDİR.**
>
> Yerine geçen plan: `../docs/superpowers/plans/2026-05-13-css-aggressive-refactor-plan.md`
> Spec: `../docs/superpowers/specs/2026-05-13-css-aggressive-refactor-design.md`
>
> Bu plan -%11 (~498 satır) konservatif bir hedef koyuyordu. Yeni plan
> agresif: ~7300 → ~700 satır (-%90). İçerik arşiv olarak burada bırakılır,
> uygulama referansı olarak **kullanılmaz**.

---

# style.css Optimizasyon — Uygulama Planı

**Hedef dosya:** `/home/metin/Desktop/istoc cı-cd/tradehubfront/src/style.css` (4539 satır)
**Toplam tahmini net kazanç:** ~498 satır (dosyanın **%11**'i)
**Tarih:** 2026-04-28

> Bu dosya, 8 satır-aralığı ajanı + 2 media-query/Tailwind-v4 ajanının tüm bulgularının **uygulanabilir, sıralı eylem planı** halidir.
> Her adım: **dosya + satır + eylem + tahmini kazanç**.
> style.css henüz değiştirilmedi — bu plan adım adım uygulanacak.

---

## Faz Tablosu

| Faz | İçerik | Risk | Süre | Net Kazanç |
|-----|--------|------|-----:|----------:|
| 1 | Ölü kod silme | Sıfır | 30 dk | **~64 satır** |
| 2 | Selector birleştirme | Düşük | 1 sa | **~94 satır** |
| 3 | Tailwind v4 variant göçü | Düşük-orta | 2-3 sa | **~83 satır** |
| 4 | Kullanılmayan token temizliği | Orta (`themeTokens.ts` kontrolü gerekir) | 2 sa | **~96 satır** |
| 5 | Yapısal refactor | Yüksek (test gerekir) | 4-6 sa | **~76 satır** |
| 6 | Opsiyonel temizlik | Düşük | 1 sa | **~85 satır** |
| **TOPLAM** | | | | **~498 satır** |

---

## FAZ 1 — Ölü Kod Silme (Sıfır Risk, ~64 satır)

### 1.1 `.factory-slider` blok silimi (~24 satır)
**Dosya:** `src/style.css`
**Satır:** 1764-1786 (tamamı)
**Eylem:** Tamamen sil
**Doğrulama:** `grep -rn "factory-slider\|factory-peek" --include="*.ts" --include="*.tsx" --include="*.html" .` → 0 sonuç

```css
/* SİL — bu blok hiçbir yerde kullanılmıyor */
.factory-slider.factory-peek-prev .swiper-slide-active,
.factory-slider.factory-peek-prev .swiper-slide-prev {
  transform: translateX(28px);
}
.factory-slider.factory-peek-next .swiper-slide-active,
.factory-slider.factory-peek-next .swiper-slide-next {
  transform: translateX(-28px);
}

@media (prefers-reduced-motion: reduce) {
  .factory-slider .swiper-slide { transition: none; }
  .factory-slider.factory-peek-prev .swiper-slide-active,
  .factory-slider.factory-peek-prev .swiper-slide-prev,
  .factory-slider.factory-peek-next .swiper-slide-active,
  .factory-slider.factory-peek-next .swiper-slide-next {
    transform: none;
  }
}
```

### 1.2 Duplicate `prefers-reduced-motion` silimi (~9 satır)
**Dosya:** `src/style.css`
**Satır:** 891-899
**Eylem:** Tamamen sil (Satır 812-821'deki bloğun aynısı, `@layer base` içinde gereksiz)

```css
/* SİL — satır 812-821'deki blok aynı işi yapıyor */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 1.3 `.rv-mention-tag` duplicate birleştirme (~15 satır)
**Dosya:** `src/style.css`
**Satır:** 2458-2465 (ilk tanım) + 2800-2814 (ikinci tanım)
**Eylem:** İki bloğu tek tanımda birleştir, ikincisini sil

```css
/* TEK TANIM (2458-2465 yerine konsolide et): */
.rv-mention-tag {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  background: var(--pd-spec-header-bg, #f9fafb);
  color: var(--pd-rating-text-color, #6b7280);
  border: 1px solid var(--pd-spec-border, #e5e5e5);
  cursor: pointer;
  transition: all 0.15s;
}
.rv-mention-tag:hover { border-color: var(--color-border-medium, #d1d5db); }
.rv-mention-tag.active {
  border-color: var(--pd-tab-active-border, #cc9900);
  color: var(--pd-tab-active-color, #cc9900);
  background: var(--pd-price-tier-active-bg, #fef9e7);
  font-weight: 600;
}

/* SİL: 2800-2814 arasını tamamen kaldır */
```

### 1.4 `.th-card-title` blok silimi (~4 satır)
**Dosya:** `src/style.css`
**Satır:** 1051-1054
**Eylem:** Tamamen sil
**Doğrulama:** `grep -rn "th-card-title" --include="*.ts" --include="*.html" .` → 0 sonuç

### 1.5 `--container-xl` token silimi (~3 satır)
**Dosya:** `src/style.css`
**Satır:** 242-244
**Eylem:** `--container-xl: 1840px;` ve üst yorumunu sil (`--container-lg` ile aynı değer, gereksiz)

### 1.6 Print bloğunda ölü selector silimi (~2 satır)
**Dosya:** `src/style.css`
**Satır:** 4470-4471 (yaklaşık, `@media print` bloğu içinde)
**Eylem:** Şu iki selector'ü kaldır:

```css
/* SİL — bu iki selector hiçbir HTML/TS dosyasında yok */
.floating-panel,
[data-floating-panel],
```

### 1.7 Çift fallback CSS değişkenleri (~3 satır)
**Dosya:** `src/style.css`
**Satır:** 3155, 3789, 3794

```css
/* ÖNCE (her satırda): */
border-color: var(--color-border-default, var(--color-border-default, #e5e5e5));

/* SONRA: */
border-color: var(--color-border-default, #e5e5e5);
```

### 1.8 `.product-card::before/::after` boş pseudo (~3 satır)
**Dosya:** `src/style.css`
**Satır:** ~1415
**Eylem:** Sil (`content: ""; display: block;` — herhangi bir clearfix amacı yok, modern flexbox/grid ile gerekmiyor)

### 1.9 `select.th-input` Firefox prefix (~1 satır)
**Dosya:** `src/style.css`
**Satır:** ~1140 (yaklaşık)
**Eylem:** Sadece `-moz-appearance: none;` satırını sil (modern Firefox 84+'da gerekmiyor; `appearance: none` yeterli).

---

## FAZ 2 — Selector Birleştirme (Düşük Risk, ~94 satır)

### 2.1 `.th-btn` + `.th-btn-dark` birleştirme (~25 satır)
**Dosya:** `src/style.css`
**Satır:** 908-935 (`.th-btn`) + 975-1001 (`.th-btn-dark`)
**Eylem:** İki kural birebir aynı — selector grouping ile birleştir

```css
/* SONRA: */
.th-btn,
.th-btn-dark {
  /* mevcut tüm kurallar */
}
.th-btn:disabled,
.th-btn-dark:disabled,
.th-btn-gradient:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 2.2 3 Modal Animasyon Konsolidasyonu (~30 satır)
**Dosya:** `src/style.css`
**Satır:** 4293-4323 (order-modal), 4405-4413 (fav-modal), 4438-4461 (payment-modal)
**Eylem:** 6 ayrı `@keyframes` → 2 generic keyframe

```css
/* YENİ — tek tanım */
@keyframes modal-in  { from {opacity:0; transform:translateY(20px)} to {opacity:1; transform:translateY(0)} }
@keyframes modal-out { from {opacity:1; transform:translateY(0)}    to {opacity:0; transform:translateY(20px)} }

.order-modal-in, .fav-modal-in, .payment-modal-in    { animation: modal-in 0.3s ease forwards; }
.order-modal-out, .fav-modal-out, .payment-modal-out { animation: modal-out 0.3s ease forwards; }

/* ESKİ 6 keyframe ve animation atamalarını SİL */
```

### 2.3 `.pdm-attrs-table` + `.pdm-custom-table` birleştirme (~6 satır)
**Dosya:** `src/style.css`
**Satır:** ~3544-3582
**Eylem:** Aynı tablo reset kurallarını selector grouping ile birleştir

```css
/* SONRA: */
.pdm-attrs-table,
.pdm-custom-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
```

### 2.4 `.pdm-bar-cart-btn` + `.pdm-bar-order-btn` birleştirme (~3 satır)
**Dosya:** `src/style.css`
**Satır:** ~3609, ~3617
**Eylem:** Aynı `transition: background 0.15s` → grouping

### 2.5 Toggle switch pseudo birleştirme (~7 satır)
**Dosya:** `src/style.css`
**Satır:** ~4110-4116 (email-pref) + ~4142-4148 (ad-pref)
**Eylem:**

```css
/* SONRA: */
.email-pref__toggle-slider::before,
.ad-pref__toggle-slider::before {
  /* ortak kurallar */
}
```

### 2.6 `.th-checkbox` state birleştirme (~8 satır)
**Dosya:** `src/style.css`
**Satır:** ~1169-1180
**Eylem:**

```css
/* SONRA: */
.th-checkbox.is-checked,
.th-checkbox[data-checked="true"] { /* ortak kurallar */ }
.th-checkbox.is-disabled,
.th-checkbox[aria-disabled="true"] { /* ortak kurallar */ }
```

### 2.7 `.rv-rating-dropdown-item` + `.rv-sort-dropdown-item` base class (~15 satır)
**Dosya:** `src/style.css`
**Satır:** 2704-2726 + 2774-2795
**Eylem:** Ortak `.rv-dropdown-item` base class oluştur, modifier'ları kısalt

### 2.8 Print bloğu — Tailwind ile çakışan kuralı kaldır
**Dosya:** `src/style.css`
**Satır:** ~4475 civarı
**Eylem:** `.max-w-\[1200px\] { max-width: 100% !important; }` kuralını **ya** Tailwind'in `print:max-w-full` class'ı ile yer değiştir (her ana container'a class ekle) **ya da** print için CSS'te tut. Net kayıp olmasın diye CSS'te kalması önerilir.

---

## FAZ 3 — Tailwind v4 Variant Göçü (Düşük-Orta Risk, ~83 satır)

### 3.1 Gallery cursor → `pointer-coarse:cursor-default` (~4 satır)
**CSS dosyası:** `src/style.css` satır 1947-1951 → SİL
**TS dosyası:** `src/components/product/ProductImageGallery.ts:221-223`

```ts
// ÖNCE:
:class="{ 'zoom-enabled': supportsHoverZoom && !isVideoSlide() }"

// SONRA:
:class="{ 'zoom-enabled pointer-coarse:cursor-default': supportsHoverZoom && !isVideoSlide() }"
```

### 3.2 Gallery prev button → `3xl:left-[88px]` (~8 satır)
**CSS dosyası:** `src/style.css` satır 1981-1989 + üstündeki `#gallery-prev { left: 10px }` kuralı → SİL
**TS dosyası:** `src/components/product/ProductImageGallery.ts:235`

```html
<!-- SONRA: -->
<button id="gallery-prev"
        class="gallery-nav-btn left-[10px] 3xl:left-[88px]"
        ...>
```

> Proje breakpoint sistemi: `--breakpoint-3xl: 1536px` ile eşleşiyor.

### 3.3 Compact font (1024-1599px) → `xl:max-[1599px]:` chain (~18 satır)
**CSS dosyası:** `src/style.css` satır 1710-1735 → SİL
**TS dosyası:** `src/components/products/ProductListingGrid.ts` (kart şablonu)

```html
<!-- Başlık: -->
<h3 class="searchx-product-e-title
           xl:max-[1599px]:text-[13px]
           xl:max-[1599px]:leading-[17px]
           xl:max-[1599px]:h-[51px]">

<!-- Fiyat: -->
<div class="fy26-price
            xl:max-[1599px]:text-base
            xl:max-[1599px]:leading-[1.375rem]">

<!-- MOQ/stats: -->
<div class="fy26-moq-stats
            xl:max-[1599px]:text-xs
            xl:max-[1599px]:leading-4">

<!-- Buton: -->
<button class="searchx-product-e-abutton
               xl:max-[1599px]:text-xs
               xl:max-[1599px]:px-2
               xl:max-[1599px]:h-8">
```

### 3.4 PDM mobile bar `@apply max-[374px]:` taşıması (~53 satır)
**CSS dosyası:** `src/style.css` satır 3625-3692 → SİL (`@apply` blokları + 3631-3633 `grid-template-columns`)

**TS dosyaları (4 yer):**

#### a) `src/pages/product-detail.ts:216`
```html
<!-- ÖNCE: -->
<div id="pd-mobile-bar"
     class="xl:hidden grid grid-cols-[48px_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-4 py-2.5">

<!-- SONRA: -->
<div id="pd-mobile-bar"
     class="xl:hidden grid grid-cols-[48px_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-4 py-2.5
            max-[374px]:gap-1 max-[374px]:px-2 max-[374px]:py-2
            max-[374px]:pb-[calc(8px+env(safe-area-inset-bottom))]
            max-[374px]:max-w-[100vw] max-[374px]:box-border
            max-[374px]:grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)]">
```

#### b) `src/pages/product-detail.ts:217-221` (bar buttons)
- `.pdm-bar-chat-btn` → `max-[374px]:w-9 max-[374px]:h-10` ekle
- `.pdm-bar-cart-btn` → `max-[374px]:h-10 max-[374px]:text-xs` ekle
- `.pdm-bar-order-btn` → `max-[374px]:h-10 max-[374px]:text-xs` ekle

#### c) `src/components/product/MobileLayout.ts:68,72,313`
- `.pdm-sheet-header` → `max-[374px]:px-3 max-[374px]:py-2`
- `.pdm-sheet-body` → `max-[374px]:px-3`
- `.pdm-attrs-table td` → `max-[374px]:text-xs max-[374px]:px-2`

#### d) `MobileLayout.ts` `bodyHtml` template literal'i (önce üretim noktasını doğrula)
- `.pdm-custom-table`, `.pdm-prot-section`, `.pdm-payment-icon` — runtime'da innerHTML ile geliyor olabilir
- `grep -rn "pdm-custom-table\|pdm-prot-section\|pdm-payment-icon" --include="*.ts" .` → üretim noktasını bul, oraya class ekle

#### e) Footer overflow
- `footer { overflow-x: hidden; }` global olarak zaten zararsız → media query dışına taşı veya footer komponentine doğrudan class ekle

---

## FAZ 4 — Kullanılmayan Token Temizliği (Orta Risk, ~96 satır)

> **Önce çapraz kontrol yap:** `themeTokens.ts` ve `themePresets.ts` dosyalarında listelenmiş olan token'lar admin panelde kullanılıyor olabilir. Silmeden önce şu komutu çalıştır:
> ```bash
> grep -rn "TOKEN_ADI" "/home/metin/Desktop/istoc cı-cd/tradehubfront/src" --include="*.ts" --include="*.tsx"
> ```

### 4.1 Kullanılmayan renk paletleri (~9 satır)
**Dosya:** `src/style.css` satır 65-80
**Sil:**
```css
--color-success-50, --color-success-500, --color-success-700
--color-warning-50, --color-warning-500, --color-warning-700
--color-info-50,    --color-info-500,    --color-info-700
```
(hiçbir TS/HTML'de `bg-success-*`, `text-warning-*` veya `var(--color-info-*)` yok)

### 4.2 Kullanılmayan typography token'ları (~15 satır)
**Dosya:** `src/style.css` satır 124-163
**Sil:**
- `--font-size-2xl`, `--font-size-3xl`, `--font-size-4xl`, `--font-size-5xl` (124-131)
- `--line-height-none`, `--line-height-tight`, `--line-height-snug`, `--line-height-relaxed`, `--line-height-loose` (134-144) — sadece `--line-height-normal` kullanılıyor
- `--letter-spacing-tighter`, `--letter-spacing-tight`, `--letter-spacing-wide`, `--letter-spacing-wider` (147-156) — sadece `--letter-spacing-normal` kullanılıyor
- `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`, `--font-weight-black` (159-163) — sadece `--font-weight-normal` kullanılıyor
- `--font-mono` (111)

### 4.3 Kullanılmayan z-index/duration/ease token'ları (~17 satır)
**Dosya:** `src/style.css` satır 304-333
**Sil:**
- `--duration-fast`, `--duration-default`, `--duration-slow`, `--duration-slower`
- `--ease-default`, `--ease-in`, `--ease-out`
- `--z-behind`, `--z-base`, `--z-raised`, `--z-modal`, `--z-popover`, `--z-spotlight`, `--z-max`, `--z-tooltip`

**Koru:** `--z-header`, `--z-toast`, `--z-fixed`, `--z-sidebar`

### 4.4 Kullanılmayan spacing semantic alias'ları (~13 satır)
**Dosya:** `src/style.css` satır 202-232
**Sil:**
- `--spacing-card-padding`, `--spacing-card-gap`
- `--spacing-section-y`, `--spacing-section-y-lg`
- `--spacing-stack-sm`, `--spacing-stack-md`, `--spacing-stack-lg`
- `--spacing-inline-sm`, `--spacing-inline-md`, `--spacing-inline-lg`

**Koru:** `--spacing-page-x`, `--spacing-page-x-lg`, `--spacing-input-x/y`, `--spacing-button-x/y`

### 4.5 Kullanılmayan card/input boyut token'ları (~10 satır)
**Dosya:** `src/style.css`
**Sil:**
- `--card-border-width`, `--card-border-color` (402-403)
- `--card-title-size`, `--card-title-weight` (404-405)
- `--card-price-size`, `--card-price-weight` (407-408)
- `--card-desc-size`, `--card-moq-size` (410, 412)
- `--card-badge-size`, `--card-badge-radius` (415-416)
- `--card-verified-size`, `--card-supplier-size` (418, 420)
- `--input-height-sm`, `--input-height-lg` (452, 454)

### 4.6 Kullanılmayan section/page token'ları (~22 satır)
**Dosya:** `src/style.css`
**Sil (her birini önce grep ile kontrol et):**
- `--text-page-title`, `--text-product-title`, `--text-badge`, `--text-breadcrumb`, `--text-filter`, `--text-body` (343-358)
- `--space-page-x`, `--space-section-gap` (363-369)
- `--mfr-profile-rfq-border`, `--mfr-profile-rfq-text`, `--mfr-profile-btn-bg`, `--mfr-profile-btn-hover`, `--mfr-profile-btn-text` (529-533)
- `--topdeals-card-bg`, `--topdeals-card-border` (559-560)
- `--topdeals-page-tab-text`, `--topdeals-page-pill-bg`, `--topdeals-page-pill-active-bg`, `--topdeals-page-pill-active-border` (571-574)
- `--shadow-form`, `--shadow-card-hover` (733-734)
- `--color-product-name`, `--color-cta-text` (737-738)
- `--font-size-caption`, `--font-size-hero-lg` (741-744)
- `--search-btn-bg`, `--search-btn-hover`, `--modal-btn-primary-bg`, `--stepper-active-bg` (710-716)
- `--tailored-collection-title-color`, `--tailored-price-color` (594, 597)
- `--product-font-family`, `--product-card-hover-shadow` (608-610, 606)
- `--color-surface-overlay`, `--color-surface-inverse` (86-87)
- `--color-text-link`, `--color-text-link-hover` (95-96)
- `--color-border-focus`, `--color-border-error` (101-102)
- `--radius-tooltip`, `--radius-xl` (283, 270)

### 4.7 Forward reference yeniden organizasyonu (Opsiyonel)
**Dosya:** `src/style.css` satır 700-707
**Eylem:** `--color-text-heading`, `--color-text-body` token'ları :root bloğunun üst kısmına taşı (cascade etkilemez ama okunabilirlik artar).

---

## FAZ 5 — Yapısal Refactor (Yüksek Risk, ~76 satır)

### 5.1 `.product-list-mode` → `data-list-mode` attribute (~56 satır)
**CSS dosyası:** `src/style.css` satır 1628-1706 → SİL (480px ve 1200px blokları)
**TS dosyası:** `src/components/products/ProductListingGrid.ts:491-495`

```ts
// ÖNCE:
this.gridEl.classList.toggle("product-list-mode", isList);

// SONRA:
this.gridEl.dataset.listMode = isList ? "list" : "grid";
```

**Kart wrapper'a (`fy26-product-card-wrapper`):**
```html
<div class="fy26-product-card-wrapper
            group-data-[list-mode=list]:sm:grid
            group-data-[list-mode=list]:sm:grid-cols-[200px_1fr]
            group-data-[list-mode=list]:sm:gap-x-4
            group-data-[list-mode=list]:min-[1200px]:flex
            group-data-[list-mode=list]:min-[1200px]:flex-row
            group-data-[list-mode=list]:min-[1200px]:items-start
            group-data-[list-mode=list]:min-[1200px]:gap-4">
```

**Test:** Liste/grid toggle'ı her sayfada test et (search results, category, top deals).

### 5.2 `.pd-sticky #...` ID kombinasyonları → `data-*` (~20 satır)
**Dosya:** `src/style.css` satır 2992-2998, 3230-3238, 3249-3251
**Eylem:** ID-tabanlı yüksek spesifikliği `data-sticky="true"` attribute'una çevir, ID selector'leri kaldır.

### 5.3 `!important` kullanımlarını temizle (specificity refactor)
**Yerler:**
- `src/style.css:1384` — `.search-chip:hover { background-color: #e5e7eb !important; }`
- `src/style.css:2898` — `.rv-modal-hidden { display: none !important; }`
- `src/style.css:3975-3976` — `.next-checkbox-wrapper .next-checkbox.bg-text-primary` çift `!important`

**Yöntem:** Specificity refactor — daha spesifik selector veya cascade düzeltmesi ile `!important`'ı kaldır.

### 5.4 Hardcoded `rgba()` → `color-mix()` (Opsiyonel)
**Dosya:** `src/style.css` satır 392, 435, 449
```css
/* ÖNCE: */
--btn-outline-hover-bg: rgba(204, 153, 0, 0.08);

/* SONRA: */
--btn-outline-hover-bg: color-mix(in srgb, var(--color-primary-500) 8%, transparent);
```

### 5.5 Hardcoded dark mode renkleri → CSS değişkenleri
**Dosya:** `src/style.css` satır 3774-3815 civarı
**Eylem:** `#1f2937`, `#374151`, `#263040` gibi hardcoded değerleri `--dark-bg-primary`, `--dark-border-secondary` gibi token'lara bağla.

---

## FAZ 6 — Opsiyonel Temizlik (Düşük Risk, ~85 satır)

### 6.1 Print media query silimi (kullanılmıyorsa) (~40 satır)
**Dosya:** `src/style.css` satır 4466-4502
**Eylem:** Eğer ürün ekibi print/PDF özelliği kullanılmadığını onaylarsa, tüm `@media print { ... }` bloğunu sil.

**Kontrol:** Mobil uygulamada print yok, web kullanıcılarının print ihtiyacı doğrulansın.

### 6.2 ASCII başlık yorum blokları sıkıştırma (~30 satır)
**Dosya:** `src/style.css` çeşitli (satır 18-21, 104-107, 165-168, 248-250, 261-263, 286-288, 300-302, 315-317, 336-338, 360-362, 372-374, 492-494)

```css
/* ÖNCE (4-5 satır): */
/* ============================================================
 * COLOR SYSTEM
 * ============================================================ */

/* SONRA (1 satır): */
/* === COLOR SYSTEM === */
```

### 6.3 "migrated to Tailwind" yorum kalıntıları (~15 satır)
**Dosya:** `src/style.css` çeşitli
**Eylem:** Boş yorum bloklarını sil:
- 2865 (sadece yorum, kural yok hariç border-bottom)
- 2895, 3104, 3127, 3205-3206, 3253 (boş yorum bloğu)

### 6.4 Yorum-değer tutarsızlıklarını düzelt
**Dosya:** `src/style.css` satır 202-204, 273-275
- `--spacing-card-padding: 8px` yorum `/* 24px */` → düzelt
- `--spacing-card-gap: 11px` yorum `/* 16px */` → düzelt
- `--radius-card: 8px` yorum `/* 16px */` → düzelt

### 6.5 Çok satırlı `transition` formatting (~6 satır)
**Dosya:** `src/style.css` satır 3021-3023, 3116-3119, 3286-3288
**Eylem:** Tek satıra al

```css
/* ÖNCE: */
transition:
  background 0.15s,
  color 0.15s;

/* SONRA: */
transition: background 0.15s, color 0.15s;
```

### 6.6 Boş/minimal kurallar (~9 satır)
**Dosya:** `src/style.css` satır 3075-3141
**Sil:**
- `.pd-price-tier-price { flex-wrap: wrap; }` (3075-3077) — flex container değil
- `.pd-price-tier:not(:first-child) { border-left: none; }` (3079-3080) — border-left zaten yok
- `.pd-price-tier.active { background: none; }` (3083-3084) — background zaten yok
- `.variant-group:last-child { margin-bottom: 0; }` (3139-3141) — ana kuralın aynısı

### 6.7 `-webkit-overflow-scrolling: touch;` kaldır
**Dosya:** `src/style.css` satır 3410
**Eylem:** Modern tarayıcılarda deprecated, sil.

### 6.8 `.auth-password-req-item.valid .auth-password-req-icon` overflow
**Dosya:** `src/style.css` satır 3852-3853
**Eylem:** `width: 0; height: 0; overflow: hidden;` → `display: none;` ile değiştir

---

## TÜM ADIMLAR İÇİN GENEL ÇALIŞMA AKIŞI

```bash
# 1. Yedek al
git checkout -b css-optimization
cp src/style.css src/style.css.bak

# 2. Her fazdan sonra build + visual test
npm run build
npm run dev   # → tüm sayfaları manuel test et (anasayfa, kategori, ürün detay, sepet, profil)

# 3. Faz tamamlandıktan sonra commit
git add src/style.css
git commit -m "css: faz X tamamlandı (~Y satır)"

# 4. Test edilecek senaryolar:
#    - Karanlık mod toggle
#    - Mobil ekran (374px, 480px, 768px, 1024px, 1280px, 1536px)
#    - Liste / grid view toggle (Faz 5 için)
#    - Ürün detay galeri (touch + mouse)
#    - Form submit + validation
#    - Modal animasyonları (sepet, fav, payment, order)
#    - Reduced-motion sistem ayarı (Settings → Accessibility)
```

---

## Faz Önceliklendirmesi (Pratik Tavsiye)

| Öncelik | Faz | Neden |
|---------|-----|-------|
| 🔥 Hemen | **Faz 1** | Sıfır risk, ~64 satır kazanç, 30 dk |
| ⭐ Sonra | **Faz 2** | Düşük risk, kod sadeleşmesi büyük (modal animasyonları en görünür kazanç) |
| ⭐ Sonra | **Faz 3** | Tailwind v4 modern yaklaşım, mobil-tablet sayfalar etkilenmez |
| 💡 Plan | **Faz 4** | `themeTokens.ts` + `themePresets.ts` çapraz kontrol gerektirir, dikkatli yapılmalı |
| ⏳ İleri | **Faz 5** | JS state mantığı değişikliği — ayrı PR olmalı, kapsamlı test |
| ⚙️ Opsiyonel | **Faz 6** | Genel temizlik — projenin görsel netliği ve print kullanımı kararına bağlı |

---

## Kontrol Listesi

- [ ] Faz 1: Ölü kod silme (~64 satır)
- [ ] Faz 2: Selector birleştirme (~94 satır)
- [ ] Faz 3: Tailwind v4 variant göçü (~83 satır)
- [ ] Faz 4: Token temizliği (`themeTokens.ts` çapraz kontrolü ile) (~96 satır)
- [ ] Faz 5: Yapısal refactor (`data-list-mode`, `!important` temizliği) (~76 satır)
- [ ] Faz 6: Opsiyonel temizlik (~85 satır)
- [ ] Final: Görsel regresyon testi tüm sayfalarda
- [ ] Final: `npm run build` ve bundle size karşılaştırması

---

**Beklenen Sonuç:** style.css 4539 satır → ~4041 satır (**-498 satır**, **-%11**)
