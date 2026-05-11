# Refactor Planı — `.th-btn*` Bloku

> **Kapsam:** `src/style.css` satır 4640-4771 (136 satır, 13 varyant, 184 kullanım yeri)
> **Hedef:** ~136 satır → ~55 satır (~80 satır azalma) + okunabilirlik artışı
> **Risk:** Düşük — görsel değişim sıfır, sadece CSS reorganizasyonu

---

## Mevcut durum (özet)

`.th-btn`, `.th-btn-dark`, `.th-btn-gradient`, `.th-btn-outline` butonları aynı sarı 3D look'a hizalanmış. Ek varyantlar: `-sm`, `-lg`, `-block`, `-icon`, `-link`, `-ghost`, `-success`, `-danger`, `-danger-ghost`.

**Sorunlar:**

1. **`!important` enflasyonu** — neredeyse her property'de var. Sebep: admin panel theme override'ını ezmek.
2. **`:not(#search-submit-button):not(#topbar-compact-search-submit)` zinciri** — search butonu ayrı pill stili istediği için her selector'a eklenmiş. Çirkin ve kırılgan.
3. **Tekrar eden box-shadow/transition/background değerleri** — hover/active state'lerinde aynı RGBA tonları 3-4 kez kopya.
4. **3 ayrı blok aynı kuralı tekrar ediyor** (4646, 4662, 4708, 4721) — search butonu için ayrılmış 60+ satır pratikte normal `.th-btn` ile aynı, sadece `border-radius` farklı.

---

## Strateji

CLAUDE.md kuralı 4.1 hiyerarşisine göre **`@layer components`** uygundur:
- 184 kullanım yeri var → "3'ten fazla yerde aynı isimle anılan compound pattern" eşiği rahat aşılıyor.
- Tam utility'e indirmek mantıksız (HTML'de her butonda 10+ class olur).
- **Hibrit yaklaşım:**
  1. `@theme` blokuna token ekle (renk + gölge → admin panel override edilebilir).
  2. `@layer components` içinde `.th-btn` ailesi `@apply` + token referansı ile tanımlanır.
  3. `!important` kaldırılır — Tailwind v4'te `@layer` hiyerarşisi (utilities > components) bu sorunu zaten çözer.
  4. Search butonu pill stili ayrı `.th-btn-pill` modifier'ı olur, `:not(...)` zinciri ortadan kalkar.

---

## Önce / Sonra

### Önce — `src/style.css` (özet, satır 4646-4771)

```css
.th-btn:not(#search-submit-button):not(#topbar-compact-search-submit),
.th-btn-dark:not(#search-submit-button):not(#topbar-compact-search-submit),
.th-btn-gradient:not(#search-submit-button):not(#topbar-compact-search-submit) {
  background: #f5b800 !important;
  background-image: none !important;
  color: #1a1a1a !important;
  border: 1px solid #d39c00 !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  box-shadow:
    0 1px 0 #d39c00,
    inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
  transition: all 0.15s ease;
}

button#search-submit-button,
button#topbar-compact-search-submit,
button#search-submit-button.th-btn,
button#topbar-compact-search-submit.th-btn,
button#search-submit-button.th-btn-gradient,
button#topbar-compact-search-submit.th-btn-gradient {
  background: #f5b800 !important;
  /* ...aynı kurallar tekrar, sadece border-radius: 9999px... */
}

.th-btn:not(...):hover:not(:disabled),
.th-btn-dark:not(...):hover:not(:disabled),
.th-btn-gradient:not(...):hover:not(:disabled) {
  background: #e8ad00 !important;
  /* ... 5 satır box-shadow ... */
}

/* +5 blok daha: active, outline, outline:hover, outline:active, disabled */
```

**Toplam:** 136 satır, 8 selector grubu, 22 `!important` direktifi.

---

### Sonra — `src/style.css`

#### 1) `@theme` bloguna eklenecek token'lar (~10 satır)

```css
@theme {
  /* ...mevcut token'lar... */

  /* iSTOC sarı 3D buton sistemi (admin panel override edilebilir) */
  --color-th-btn-bg:            #f5b800;
  --color-th-btn-bg-hover:      #e8ad00;
  --color-th-btn-bg-active:     #d8a000;
  --color-th-btn-border:        #d39c00;
  --color-th-btn-text:          #1a1a1a;
  --color-th-btn-outline-tint:  #fff8e1;
  --color-th-btn-outline-active:#ffefb5;

  --shadow-th-btn:        0 1px 0 var(--color-th-btn-border), inset 0 1px 0 rgb(255 255 255 / 0.3);
  --shadow-th-btn-hover:  inset 2px 2px 5px rgb(0 0 0 / 0.2),  inset -1px -1px 2px rgb(255 255 255 / 0.25);
  --shadow-th-btn-active: inset 3px 3px 7px rgb(0 0 0 / 0.3),  inset -1px -1px 2px rgb(255 255 255 / 0.18);
}
```

#### 2) `@layer components` bloğu (~45 satır)

```css
@layer components {
  /* iSTOC sarı 3D buton temeli — th-btn / th-btn-dark / th-btn-gradient
     hepsi aynı look. Search butonu için .th-btn-pill modifier'ı.       */
  .th-btn,
  .th-btn-dark,
  .th-btn-gradient {
    @apply inline-flex items-center justify-center
           px-4 py-2 text-sm font-semibold rounded-lg
           border border-th-btn-border bg-th-btn-bg text-th-btn-text
           shadow-th-btn transition-all duration-150 ease-out;
    background-image: none;
  }

  .th-btn:hover:not(:disabled),
  .th-btn-dark:hover:not(:disabled),
  .th-btn-gradient:hover:not(:disabled) {
    @apply bg-th-btn-bg-hover shadow-th-btn-hover;
  }

  .th-btn:active:not(:disabled),
  .th-btn-dark:active:not(:disabled),
  .th-btn-gradient:active:not(:disabled) {
    @apply bg-th-btn-bg-active shadow-th-btn-active scale-[0.98] duration-75;
  }

  /* Outline varyantı */
  .th-btn-outline {
    @apply inline-flex items-center justify-center
           px-4 py-2 text-sm font-semibold rounded-lg
           border-[1.5px] border-th-btn-bg bg-transparent text-th-btn-border
           transition-all duration-150 ease-out;
  }
  .th-btn-outline:hover:not(:disabled) {
    @apply bg-th-btn-outline-tint border-th-btn-border;
    box-shadow: inset 2px 2px 4px rgb(0 0 0 / 0.08), inset -1px -1px 2px rgb(255 255 255 / 0.5);
  }
  .th-btn-outline:active:not(:disabled) {
    @apply bg-th-btn-outline-active scale-[0.98] duration-75;
    box-shadow: inset 3px 3px 6px rgb(0 0 0 / 0.14), inset -1px -1px 2px rgb(255 255 255 / 0.4);
  }

  /* Pill modifier — search butonları ve istek üzerine */
  .th-btn-pill { @apply !rounded-full; }

  /* Disabled — tüm varyantlar */
  .th-btn:disabled,
  .th-btn-dark:disabled,
  .th-btn-gradient:disabled,
  .th-btn-outline:disabled {
    @apply opacity-50 cursor-not-allowed transform-none;
    filter: none;
  }
}
```

**Toplam:** ~55 satır (10 token + 45 layer kuralı).

---

## HTML/TS tarafında değişiklikler

### Search butonu (önceden `:not(...)` ile dışlanıyordu)

`pages/index.html` ve `src/components/header/TopBar.ts` benzeri yerler:

```html
<!-- Önce -->
<button id="search-submit-button" class="th-btn">Ara</button>

<!-- Sonra — modifier ekle -->
<button id="search-submit-button" class="th-btn th-btn-pill">Ara</button>
```

→ `:not(#search-submit-button):not(#topbar-compact-search-submit)` zinciri tüm CSS'ten silinir.

### Diğer 184 kullanım yeri

**Hiçbiri değişmez** — `class="th-btn"`, `class="th-btn-outline"` aynen kalır. Sadece search butonlarına `th-btn-pill` modifier'ı eklenir (2 yer).

---

## Adım listesi (1-2 saatlik PR)

1. **Token ekle** — `src/style.css` `@theme` bloguna 10 satırlık eklemeyi yap. (5 dk)
2. **Eski blok'u sil** — satır 4640-4771 arası 136 satırı kaldır. (5 dk)
3. **Yeni `@layer components` blok'u ekle** — uygun yere (mevcut `@layer components` bloğu varsa içine). (10 dk)
4. **Search butonlarına `th-btn-pill` ekle** — 2 yer:
   - `pages/index.html` veya hero search component'i
   - `src/components/header/TopBar.ts` compact search submit
   ```bash
   grep -rn "search-submit-button\|topbar-compact-search-submit" src/ pages/
   ```
   (10 dk)
5. **Visual smoke test** — `npm run dev`, şu sayfaları gözle kontrol:
   - Anasayfa (hero search butonu pill mi?)
   - Sticky header (compact search butonu pill mi?)
   - Sepet, Checkout (`.th-btn`, `.th-btn-outline` aynı mı?)
   - Subscription, ProductInfo, KYB widget — ana butonlar
   (30-60 dk)
6. **Build kontrolü** — `npm run build` hata vermeli. CSS bundle boyutu küçülmeli.
7. **Commit** — `refactor(css): consolidate th-btn variants into @layer components (-80 lines)`

---

## Kazanç ölçütleri

| Metrik | Önce | Sonra | Fark |
|--------|-----:|------:|-----:|
| Satır sayısı | 136 | ~55 | **-81** |
| `!important` direktifi | 22 | 1 (`th-btn-pill`) | **-21** |
| `:not(...)` zinciri | 8 selector × 2 zincir | 0 | **temiz** |
| Selector grubu | 8 | 5 | -3 |
| Theme override gücü | düşük (sabit `#f5b800`) | yüksek (admin panel `--color-th-btn-bg`'yi değiştirebilir) | ✅ |

---

## Riskler ve dikkat noktaları

- **`!important` kaldırma**: Mevcut admin theme bazı yerlere `--btn-bg` token'ı yazıyor (style.css 4779 civarı). Layer hiyerarşisi `components < utilities`, ama admin token'ı nereden geldiğine göre çakışabilir. Test sırasında admin panel'den temaya bakmak gerekir.
- **Search butonu visual fark**: `.th-btn-pill` eklenmeden bırakılırsa search butonu yuvarlak değil köşeli olur — bu yüzden 4. adım atlanmamalı.
- **Eski admin panel `.th-btn-gradient` kullanıcısı**: 19 yerde `th-btn-gradient` kullanılıyor; gradient artık yok (zaten önceki blokta da `background-image: none !important` ile gradient'i öldürmüştü). Class adı backward-compat için korundu, görsel fark sıfır.

---

## Sonraki adım

Bu PR onaylanırsa benzer pattern `.rv-*` (review, 80 selector, ~512 satır) ve `.pd-*` (product detail, ~570 satır) blokları için tekrarlanır. Aynı strateji: token + `@layer components` → ~%30 satır azalma.
