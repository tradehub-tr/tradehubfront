---
paths:
  - "**/*.html"
  - "**/*.ts"
  - "**/*.css"
---

# Tailwind v4 utility kuralları

## Border-radius standardı — `rounded-md`

> **Tüm köşe yuvarlamaları `rounded-md`.** Kart, kutu, panel, görsel, slide, input, dropdown, modal gibi dikdörtgen container'larda varsayılan radius `rounded-md`'dir. Daha küçük (`rounded`, `rounded-sm`) veya daha büyük (`rounded-lg/xl/2xl`) **kullanma** — tasarım dili tek tip kalsın.

- **Yeni component oluştururken** container köşeleri için doğrudan `rounded-md` kullan.
- **İstisna — daireler/pill'ler:** Buton, badge, avatar, dot, toggle, arama çubuğu gibi tam yuvarlak öğelerde `rounded-full` kalır (bunlar radius standardının dışında).
- Mevcut `rounded-lg/xl/2xl/sm` gördüğünde dokunduğun yerde fırsatçı şekilde `rounded-md`'ye çevir.

## Buton press/inset-shadow hover'ı — press SADECE gerçek CTA'da

> `style.css`'te global bir "press efekti" var (~satır 1835): tüm `button` / `[role="button"]` öğelerine hover'da **inset box-shadow**, active'de daha güçlü inset + `scale(0.98)`. Selector **opt-out** (varsayılan açık, dev hariç-tutma listesiyle kapatır) olduğu için **yeni eklediğin her `<button>` otomatik press alır** — fark etmezsen link/yazı/toggle gibi öğelerde çirkin basık-kutu çıkar.

**Karar kuralı — press kime KALIR, kime `th-no-press` eklenir:**

| Press KALIR (efekt anlamlı) | `th-no-press` ZORUNLU (efekt çirkin) |
|---|---|
| Dolu/renkli **CTA** butonları: `.th-btn`, `.th-btn-primary`, `.th-btn-dark`, `.th-btn-outline`, `[type="submit"]`, "Siparişi ver", "Uygula", "Onayla" | **Accordion / section toggle header'ları** (`checkout-section__header--toggle`, kart başlığı aç/kapa) |
| | **Satır/ürün genişletici** toggle'lar (ürün başlığına tıkla-aç, `co-product-head`) |
| | **Link-stil yazı butonları**: `underline`/düz-metin, "Düzenle", "Değiştir", "Tedarikçiye not ekle", "Daha fazla göster", "Varsayılan yap" (`co-link-btn`) |
| | **İkincil/dashed "+ Ekle" affordance'ları** ("Adres Ekle" `co-add-row`, kesikli kenarlı kutu) |
| | **İkon-only butonlar**: close-X, düzenle/sil ikonu, ok, dot, toggle, paginator (aria-label `close`/`kapat`/`sil` zaten hariç ama emin değilsen ekle) |
| | **Mağaza/satıcı adı header satırları** (tıklanabilir başlık) |

- **Test:** Buton dolu zeminli bir aksiyon mu (basılınca "tık" hissi doğru), yoksa link/başlık/ikon mu? Link/başlık/ikonsa **`th-no-press` ekle** — global efekt o öğede `box-shadow:none + transform:none` ile kapanır (resmi opt-out, `style.css:2052`).
- `th-no-press`'i **class listesinin başına** koy (mevcut paylaşılan class'larla — `co-link-btn`, `co-add-row` — birlikte).
- Press dışı buton'da hover geri bildirimi gerekiyorsa sadece `color/bg/opacity` değiştir (layout shift yok) — inset gölge/scale **ekleme**.
- Paylaşılan bir link/toggle class'ı (`co-link-btn` gibi) birden çok yerde kullanılıyorsa, o class'ı kullanan **her** örneğe `th-no-press` ekle — biri unutulursa o ekranda yeniden çıkar.

**Custom CSS yazmadan önce 4 soru:**

1. Bu stil **saf utility kombinasyonuyla** ifade edilebilir mi? → Evet ise HTML/TS içine `class="..."` yaz, CSS'e ASLA ekleme.
2. CSS değişkeni içeriyor mu? → v4 arbitrary value: `class="border-[var(--pd-spec-border)]"`. Bu da utility.
3. Bilmiyorsan Context7: `libraryId: /tailwindlabs/tailwindcss.com`.
4. Sadece şu 4 durumda `style.css`'e ekle: 3rd-party override • `@theme` token • `@keyframes` • `@layer base` reset.

## Anti-örnek

```css
/* ❌ style.css'e ekleme — bunlar zaten utility */
.rv-sort-dropdown-trigger {
  padding: 6px 14px;          /* → px-3.5 py-1.5 */
  font-size: 12px;            /* → text-xs */
  font-weight: 500;           /* → font-medium */
  border-radius: 20px;        /* → rounded-full */
  background: #ffffff;        /* → bg-white */
  cursor: pointer;            /* → cursor-pointer */
  display: flex;              /* → flex */
  align-items: center;        /* → items-center */
  gap: 4px;                   /* → gap-1 */
  white-space: nowrap;        /* → whitespace-nowrap */
}
```

```ts
// ✅ Doğru
const cls = "px-3.5 py-1.5 text-xs font-medium rounded-full " +
            "border border-[var(--pd-spec-border,#e5e5e5)] " +
            "bg-[var(--color-surface,#fff)] text-[var(--pd-rating-text-color,#6b7280)] " +
            "cursor-pointer flex items-center gap-1 transition-all duration-150 " +
            "whitespace-nowrap";
```

> **Neden:** `src/style.css` Mayıs 2026 refactor sonrası 4878 → ~4300. Sınırı koruyun. `src/styles/` dizini **tamamen silindi**, yeni dosya açma.

## `@media` → Tailwind responsive variant

CSS'te `@media (...)` yazmadan önce karar matrisi:

| `@media` pattern | v4 karşılığı |
|---|---|
| `(min-width: 640px)` | `sm:` (40rem standard) |
| `(min-width: 768px)` | `md:` (48rem) |
| `(min-width: 1024px)` | `lg:` (64rem) |
| `(min-width: 1280px)` | `xl:` (80rem) |
| `(min-width: 1536px)` veya `(width >= 1536px)` | `2xl:` (96rem) |
| `(min-width: Npx)` (Npx standart değil) | `min-[Npx]:` |
| `(max-width: Npx)` | `max-[Npx]:` |
| `(min-width: A) and (max-width: B)` | `min-[A]:max-[B]:` zincir |
| `(hover: none), (pointer: coarse)` | `pointer-coarse:` |
| `(prefers-reduced-motion: reduce)` | `motion-reduce:` |
| `(prefers-color-scheme: dark)` | `dark:` |

**`@media` KORUNUR sadece:**
1. Global `*` reset (`@media (prefers-reduced-motion) { * { animation: none } }`)
2. 3rd-party class hedefi (`.swiper-slide-active`, `.swiper-pagination-bullet`)
3. `@media print` ve içindeki çok-element kuralları
4. Body-level JS-toggled class (`body.gallery-lightbox-open` gibi)

## Pseudo / nth-child / descendant → utility

| CSS pattern | v4 utility |
|---|---|
| `::after { content: '' }` | `after:content-['']` |
| `::before { content: '' }` | `before:content-['']` |
| `::-webkit-scrollbar { width: 0 }` | `[&::-webkit-scrollbar]:w-0` veya `scrollbar-hide` |
| `::placeholder { color }` | `placeholder:text-...` |
| `:nth-child(even)` | `even:` |
| `:nth-child(odd)` | `odd:` |
| `:first-child` | `first:` |
| `:last-child` | `last:` |
| `:nth-last-child(-n+2)` | `[&:nth-last-child(-n+2)]:` |
| `.parent .child` (descendant) | `[&_.child]:utility` veya child'a direkt |
| `.parent > .child` (direct) | `[&>.child]:utility` |
| `.x + .x` (sibling) | `[&+.x]:utility` |
| `.x:hover:not(.active)` | `[&:hover:not(.active)]:utility` |
| `.parent .child:state` | `[&_.child:state]:utility` |
| `var(--x, #default)` | `bg-[var(--x,#default)]` (theme-var responsive ✓) |
| `@variant xl { .x.state {} }` | `xl:[&.state]:utility` |
| `input:checked + .slider` | **Peer:** `<input class="peer">` + `<span class="peer-checked:bg-x peer-checked:before:translate-x-[22px]">` |

> **Neden:** Mayıs 2026 refactor'da çok sayıda `@media` bloğu (product-list-mode, gallery, pd-mobile-bar, lightbox, attribute table) ve pseudo-element pattern'leri utility'e çevrildi. `style.css` 4878 → 3748 (-1130). Eski "CSS'te yaz, JS-toggled descendant cascade" pattern'i **yasak**.
