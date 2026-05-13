# TradeHub Frontend — Proje Rehberi (CLAUDE.md)

Bu dosya `tradehubfront/` dizininde çalışan Claude oturumlarının her seferinde
okuduğu tek kaynak belgedir. Kod yazmadan önce buradaki kurallara uy.

> **TEMEL FELSEFE:** Bu projede **kod yazmaktan ÖNCE araştırma yapılır.**
> Tailwind sınıfı varken custom CSS yazma. Alpine API'sini hatırdan yazma —
> her seferinde Context7'den doğrula. Yeni dosya açmadan önce mevcut kodu
> refactor etmeyi düşün.

---

## 0. ZORUNLU PRE-FLIGHT CHECKLIST

Aşağıdaki üç madde, **her** kullanıcı görevinde sırayla yapılır.
Atlamak yasak — atlanan adım hatalı/eski koda yol açıyor.

### 0.0 İZİN KAPISI — CSS dosyalarına yazma

`tradehubfront/.claude/settings.json` aşağıdaki yollar için izin sorması
ayarlanmıştır:

- `src/style.css`
- `src/styles/**`

Bu dosyalara Edit/Write yapılmak istendiğinde **Claude Code harness'ı
kullanıcıdan izin ister**. Bu rastgele bir bariyer değil, refactor sonrası
tutulan disiplinin teknik karşılığı.

**İzin istemeden önce hazır olmanız gerekenler:**

1. Hangi class'ı/değişkeni ekliyorsunuz, neden utility'e çevirilemiyor?
2. Karar matrisinin 5 sorusundan (CLAUDE.md 0.1'de) hangisine "evet" cevap
   bu satırı buraya koyuyor?
3. Bu satır olmadan tasarım nasıl bozulur? (somut görsel/işlevsel etki)

Bu üç sorunun **net cevabı yoksa izin istemeyin**, önce yine utility ile
denemeyi düşünün.

### 0.1 Tailwind kontrolü (CSS yazacaksan)

**Custom CSS yazmadan önce şu sorulara cevap ver:**

1. Bu stil saf utility class kombinasyonuyla ifade edilebilir mi?
   → Cevap "evet" ise **TS/HTML içine `class="..."` olarak yaz, CSS dosyasına ASLA ekleme.**
2. CSS değişkeni (`var(--pd-spec-border)` gibi) içeriyor mu?
   → Tailwind v4'te arbitrary value ile yazılır: `class="border-[var(--pd-spec-border)]"`.
   Bu da **utility'dir, custom CSS değil.**
3. Cevabı bilmiyorsan Context7'den doğrula:
   ```
   mcp__plugin_context7_context7__query-docs
   libraryId: /tailwindlabs/tailwindcss.com
   query: "<elindeki spesifik CSS özelliği>"
   ```
4. Sadece şu durumlarda `style.css`'e ekleme yap:
   - 3rd-party kütüphane override (Flowbite, Swiper iç class'ları)
   - `@theme` token tanımı (renk, spacing, font değişkeni)
   - Karmaşık `@keyframes` animasyonu
   - `@layer base` global element reset (h1, h2, body…)

**Anti-örnek (YAPMA):**
```css
/* style.css'e ekleme — bunlar zaten utility */
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

**Doğru:**
```ts
const cls = "px-3.5 py-1.5 text-xs font-medium rounded-full " +
            "border border-[var(--pd-spec-border,#e5e5e5)] " +
            "bg-[var(--color-surface,#fff)] text-[var(--pd-rating-text-color,#6b7280)] " +
            "cursor-pointer flex items-center gap-1 transition-all duration-150 " +
            "whitespace-nowrap";
```

> **Neden:** `src/style.css` Mayıs 2026 refactor'undan sonra 4878 → ~4300 satıra
> indirildi. İçinde sadece şunlar kaldı: @import, @theme tokenları, :root
> değişkenleri, @keyframes, @layer base, @layer components (PROTECTED `.th-*`
> sınıfları), @layer utilities, theme-driven `product-card__*` ailesi,
> JS-toggled state class'ları, pseudo-element CSS'leri, 3rd-party
> override'lar (Swiper, Flowbite). **Bu sınırı koruyun.** Yeni "compound
> class" eklemek 5000+ satıra geri dönüş yolu açar.
>
> `src/styles/` dizini **tamamen silindi**. Tüm CSS `src/style.css` içinde.
> **Yeni `src/styles/` dosya/dizin açmayın.** Sayfaya özel stil utility class
> olarak HTML/TS içine yazılır; gerçekten zorunlu CSS (3rd-party override,
> pseudo-element, JS-toggled descendant cascade) `src/style.css` sonuna eklenir.

### 0.1.1 `@media` kuralı: CSS yerine Tailwind responsive variant

**CSS'te `@media (...)` bloğu yazmaktan ÖNCE şu karar matrisinden geç:**

| `@media` pattern | Tailwind v4 karşılığı | Karar |
|---|---|---|
| `@media (min-width: 640px)` | `sm:` (40rem standard) | UTILITY |
| `@media (min-width: 768px)` | `md:` (48rem standard) | UTILITY |
| `@media (min-width: 1024px)` | `lg:` (64rem standard) | UTILITY |
| `@media (min-width: 1280px)` | `xl:` (80rem standard) | UTILITY |
| `@media (min-width: 1536px)` veya `(width >= 1536px)` | `2xl:` (96rem standard) | UTILITY |
| `@media (min-width: Npx)` (Npx standart değil) | `min-[Npx]:` arbitrary | UTILITY |
| `@media (max-width: Npx)` | `max-[Npx]:` | UTILITY |
| `@media (min-width: Apx) and (max-width: Bpx)` | `min-[Apx]:max-[Bpx]:` zincir | UTILITY |
| `@media (hover: none), (pointer: coarse)` | `pointer-coarse:` (veya `pointer-fine:` tersi) | UTILITY |
| `@media (prefers-reduced-motion: reduce)` (spesifik element) | `motion-reduce:` | UTILITY |
| `@media (prefers-color-scheme: dark)` | `dark:` variant | UTILITY |

**Descendant selector + JS-toggled state** pattern'i için (anti-pattern!):
```css
/* ❌ YASAK — eski pattern */
.product-grid.product-list-mode .child {
  grid-column: 2;
}
@media (min-width: 480px) {
  .product-grid.product-list-mode .child { padding: 0; }
}
```

Doğru yaklaşım:
1. JS'te `classList.toggle` yerine `dataset.x = ...` kullan
2. Parent'a `group/name` ekle
3. Çocuğa `group-data-[x=val]/name:` variant zincirleri

```ts
// ✅ JS değişikliği
grid.dataset.listMode = isList ? "list" : "grid";
```

```html
<!-- ✅ HTML — parent grid -->
<div class="group/grid grid grid-cols-4
            data-[list-mode=list]:!grid-cols-1"
     data-list-mode="grid">

<!-- ✅ HTML — child element -->
<div class="px-3
            group-data-[list-mode=list]/grid:col-start-2
            min-[480px]:group-data-[list-mode=list]/grid:p-0
            lg:max-[1599px]:group-data-[list-mode=grid]/grid:text-xs">
```

**CSS'te `@media` KORUNUR sadece şu durumlarda:**

1. Global `*` reset (örn. `@media (prefers-reduced-motion) { * { animation: none } }`)
2. 3rd-party kütüphane class'larını hedefliyor (`.swiper-slide-active`, `.swiper-pagination-bullet`) — utility eklenecek HTML elementi yok
3. `@media print` ve içindeki çok-element kuralları
4. Body-level JS-toggled class (`body.gallery-lightbox-open` gibi — JS body'ye class ekliyor, template'te değil)

### 0.1.2 Pseudo-element / nth-child / descendant / theme-var → utility kuralı

`@media` dışındaki yaygın CSS pattern'leri de Tailwind v4 utility'e çevrilmeli. CSS'te şu pattern'ı yazmadan önce kontrol et:

| CSS Pattern | Tailwind v4 Utility |
|---|---|
| `.x::after { content: '' }` | `after:content-['']` |
| `.x::before { content: '' }` | `before:content-['']` |
| `.x::-webkit-scrollbar { width: 0 }` | `[&::-webkit-scrollbar]:w-0` veya mevcut `scrollbar-hide` class |
| `.x::placeholder { color: ... }` | `placeholder:text-...` |
| `.x:nth-child(even)` | `even:` |
| `.x:nth-child(odd)` | `odd:` |
| `.x:first-child` | `first:` |
| `.x:last-child` | `last:` |
| `.x:nth-last-child(-n+2)` | `[&:nth-last-child(-n+2)]:` |
| `.parent .child` (descendant) | `[&_.child]:utility` parent'a koy, veya child'a doğrudan utility |
| `.parent > .child` (direct child) | `[&>.child]:utility` |
| `.x + .x` (sibling) | `[&+.x]:utility` |
| `.x:hover:not(.active)` | `[&:hover:not(.active)]:utility` |
| `.parent .child:state` | `[&_.child:state]:utility` |
| `var(--x, #default)` | `bg-[var(--x,#default)]`, `text-[var(--x)]`, `border-[var(--x)]` (theme-var responsive ✓) |
| `@variant xl { .x.state {} }` | `xl:[&.state]:utility` |
| `input:checked + .slider { ... }` (sibling state) | **Peer pattern:** `<input class="peer ...">` + `<span class="peer-checked:bg-x peer-checked:before:translate-x-[22px]">`. Toggle/checkbox custom styling için klasik yol. |

### 0.1.3 JS-toggled state class → data-attribute + variant

CSS'te `.parent.state .child` pattern'i (parent class JS ile toggle ediliyorsa) **yasak**. Doğru yol:

**Adım 1 — JS değişikliği:**
```ts
// ❌ ESKİ
el.classList.toggle("active", isActive);

// ✅ YENİ
el.dataset.state = isActive ? "active" : "inactive";
```

**Adım 2 — Parent'a `group/name` ekle, child'a `group-data-[*]/name:` variant:**
```html
<div class="group/myThing" data-state="inactive">
  <div class="text-gray-500 group-data-[state=active]/myThing:text-blue-500">
```

**Veya Alpine `:class` binding (daha basit durumlar için):**
```html
<div :class="{ 'border-blue-500 bg-blue-50': isActive, 'border-gray-200 bg-white': !isActive }">
```

**Veya class adını koruyup `[&.class]:` arbitrary parent variant** (eğer JS toggle eski kod ve refactor maliyeti yüksekse):
```html
<div class="border [&.active]:border-blue-500 [&.active]:bg-blue-50">
```

> **Neden:** Mayıs 2026 refactor'unda style.css'teki çok sayıda `@media` bloğu
> (product-list-mode, gallery, pd-mobile-bar, floating-actions, lightbox, attribute table)
> ve pseudo-element/nth-child/descendant pattern'leri Tailwind v4 utility'lerine
> çevrildi. style.css 4878 → 3748 satır (-1130). Eski "CSS'te yaz, JS-toggled
> descendant cascade kullan" pattern'i bundan sonra **yasak**. Yeni CSS kuralı
> eklemek için yukarıdaki KORUNUR listesinden birine uymak zorunda.

### 0.2 Alpine.js doc kontrolü (Alpine kodu yazacaksan)

**Alpine.js API'si hatırdan yazılmaz.** Her oturumda en az bir kez doğrula:

1. Mevcut sürümü `package.json`'dan oku → şu an `alpinejs ^3.15.8`.
2. Yazacağın direktif/magic property'yi Context7'den çek:
   ```
   mcp__plugin_context7_context7__query-docs
   libraryId: /websites/alpinejs_dev
   query: "<x-directive veya $magic kullanımı>"
   ```
3. Sürüm eskiyse veya kullanım deprecated görünüyorsa
   `https://alpinejs.dev/upgrade-guide` adresini WebFetch ile oku.
4. **V3 kurallarının özeti aşağıda 5.2'de** — orada tablo halinde, `alpinejs.dev/upgrade-guide` ile birebir doğrulanmış.

### 0.3 Refactor-before-write kontrolü

Yeni kod yazmadan önce **mevcut kodu oku ve sor:**

1. Bu işlevsellik için zaten bir component / Alpine module / utility var mı?
   → `grep`/`Glob` ile ara: `src/components/`, `src/alpine/`, `src/utils/`, `src/services/`
2. Var olan kod güncel mi?
   - Eski Alpine kullanımı (V2 pattern)?
   - Custom CSS yığını (utility'e çevrilebilir)?
   - `any` type kullanımı (eslint warn)?
   - `console.log` bırakılmış (eslint warn)?
3. Yanıt "evet, eski/iyileştirilebilir" ise **önce refactor et, sonra yeni feature ekle.**
   Görevi iki commit'e ayır:
   - Commit 1: `refactor(<area>): replace custom CSS with Tailwind utilities`
   - Commit 2: `feat(<area>): <yeni özellik>`

> **Neden:** Frontend parça parça temizlenecek. Her görev hem yeni özellik
> ekler hem de o dokunduğu alanı clean koda yaklaştırır. Bu kural opsiyonel
> değil — kullanıcının açık talebi.

---

## 1. PROJE KİMLİĞİ

- **Tip:** Multi-page Vite uygulaması (statik HTML entry'leri + Alpine.js sprinkles)
- **Hedef:** TradeHub B2B marketplace'in alıcı/satıcı tarafı (storefront)
- **Backend:** Frappe v15 (`tradehub_core` ve diğer apps), `/api` proxy ile
- **Deploy:** Docker + Nginx (`Dockerfile`, `nginx.conf.template`), beta → rc → prod akışı
- **Repo upstream:** Bu repo deploy ana branch'i `main` (cf. `tradehub_core` `version-15`)

---

## 2. STACK

| Katman | Teknoloji | Sürüm | Notlar |
|--------|-----------|-------|--------|
| Build | Vite | ^7.3.1 | Multi-entry (`pages/**/*.html` + root HTML'ler) |
| Dil | TypeScript | ~5.9.3 | `strict: true`, `noUnusedLocals`, `noUnusedParameters` |
| CSS | Tailwind CSS | ^4.1.18 | `@tailwindcss/vite` plugin, **CSS-config (no JS config)** |
| Reaktif UI | Alpine.js | ^3.15.8 | `Alpine.data()` modülleri `src/alpine/`'da |
| UI kit | Flowbite | ^4.0.1 | Tailwind plugin: `@plugin "flowbite/plugin"` |
| Slider | Swiper | ^12.1.0 | Manuel chunk: `vendor-swiper` |
| i18n | i18next | ^25.8.14 | `src/i18n/`, browser language detector |
| Animasyon | Motion | ^12.38.0 | (eski Framer Motion) |
| Sanitize | DOMPurify | ^3.3.2 | XSS koruması — kullanıcı içeriği render ederken zorunlu |
| Icons | lucide-static | ^1.14.0 | SVG string'leri |
| Linter | ESLint | ^9 (flat config) | `eslint.config.js` |
| Format | Prettier | ^3.4 | `lint:fix` script'inde otomatik |

---

## 3. DİZİN YAPISI

```
tradehubfront/
├── pages/                      # HTML entry point'leri (multi-page)
│   ├── auth/, dashboard/, help/, info/, legal/, order/, seller/
│   ├── brand.html, cart.html, categories.html, manufacturers.html
│   ├── product-detail.html, products.html, top-deals.html, ...
├── src/
│   ├── main.ts                 # Ana giriş — tüm sayfalar bunu kullanmıyor
│   ├── style.css               # ⚠ 5056 satır — şişmesin, refactor adayı
│   ├── styles/                 # Sayfa-spesifik CSS (cart, checkout, seller)
│   ├── alpine/                 # Alpine.data() modülleri (side-effect import)
│   │   └── index.ts            # startAlpine() + tüm modüllerin yan-etki importu
│   ├── components/             # TS component'leri (DOM render fonksiyonları)
│   │   ├── header/, hero/, footer/, floating/, product/, cart/, checkout/...
│   │   └── (her klasörde index.ts barrel export)
│   ├── pages/                  # Sayfa-spesifik bootstrap dosyaları
│   ├── services/               # API client'ları (cart, listing, category...)
│   ├── stores/                 # Alpine.store() veya basit reaktif state
│   ├── utils/                  # url, themeStorage, animatedPlaceholder, tracking...
│   ├── i18n/                   # locale dosyaları + init
│   ├── data/, types/, assets/
├── public/                     # Statik (favicon, kopyalanır)
├── dist/                       # Build çıktısı (gitignored)
├── docs/                       # Geliştirici dokümantasyonu
├── vite.config.ts              # Multi-entry, theme bootstrap, css-editor, 404 fallback plugin'leri
├── eslint.config.js            # Flat config
├── tsconfig.json               # strict, ES2022, bundler resolution
├── nginx.conf.template         # Prod nginx (envsubst ile backend domain)
├── Dockerfile                  # Build image
└── DEPLOYMENT.md               # Deploy notları
```

---

## 4. CSS / TAILWIND KURALLARI

### 4.1 Hiyerarşi (yukarıdan aşağı tercih sırası)

1. **Inline utility class'ları** — varsayılan, %90 vakada bu kullanılır
2. **`@theme` token** — yeni bir tasarım değişkeni eklenmesi gerekiyorsa `style.css` `@theme` bloğuna ekle
3. **`@layer base`** — global element reset (h1, body)
4. **`@layer components` + `@apply`** — sadece **3'ten fazla yerde** birebir tekrar eden, aynı isimle anılan compound pattern (örn. `.btn-primary` global olarak kullanılıyorsa)
5. **3rd-party override** — Flowbite/Swiper iç class'larını ezmek
6. **Custom CSS (vanilla)** — sadece animation, kompleks pseudo-element trick'leri

### 4.2 `@theme` Tokenları

`src/style.css` içindeki `@theme` bloğu Tailwind v4'ün tek konfigürasyon noktasıdır.
Token isimlendirmesi:

- `--color-{name}-{50..950}` → `bg-{name}-500`, `text-{name}-700` utility'leri otomatik oluşur
- `--font-{name}` → `font-{name}` utility
- `--breakpoint-{name}` → `{name}:` responsive variant

Token eklerken:
- 3'ten az yerde kullanılacaksa **token ekleme**, arbitrary value ile yaz (`bg-[#f5b800]`)
- Token, `cssEditorPlugin` (vite.config.ts) tarafından dev-time düzenlenebiliyor — token isimlerini yeniden adlandırırken bu plugin'i kontrol et

### 4.3 CSS değişkenleri (`var(--...)`)

Bu projede uzaktan tema desteği var (`themeBootstrapPlugin` vite.config.ts'te).
`localStorage` cache'ten ve `/api/method/tradehub_core.api.theme.get_public_theme`'den
gelen değerler `:root`'a inject ediliyor.

CSS değişkeni içeren bir stil yazarken:
- Tailwind utility ile arbitrary value: `class="bg-[var(--color-surface,#fff)]"`
- Fallback **mutlaka** ver (`,#fff` kısmı) — uzak tema yüklenmeden önceki paint için

### 4.4 CSS Dosyaları Şişme Yasağı

Mayıs 2026 refactor'undan sonra hedef baseline:

| Dosya | Mevcut satır | Maksimum tolerans |
|-------|-------------:|------------------:|
| `src/style.css` | ~4300 | 4500 (üstü = uyarı) |
| `src/styles/*.css` | 0 (dizin silindi) | 0 (yeni dosya/dizin yasak) |

**Yeni satır eklemek için kanıt göster:**

- Eklemek istediğin kuralı utility class'larla ifade edemediğini açıkça
  belirt (CLAUDE.md 0.1'deki 5 soruluk karar matrisi)
- 3rd-party override ise hangi kütüphaneyi/seçiciyi ezdiğini yorum satırı
  olarak yaz
- `:root` değişkeni ekliyorsan uzaktan tema sisteminde admin panelde
  ayarlanan token mı kontrol et — değilse `@theme` token'ı tercih et
- Refactor sırasında satır **artmıyorsa** mutlaka azalmalı

**Yeni `src/styles/*.css` dosyası açmak yasak.** Sayfa-spesifik stil:

- Utility class olarak HTML/TS içine yazılır (varsayılan)
- Çok karmaşık bir layout için component-local CSS modülü
  (`MyComponent.module.css`) açılır
- Global olarak gereken bir token varsa `style.css`'in `@theme` bloğuna
  eklenir

---

## 5. ALPINE.JS KURALLARI

### 5.1 Modül Pattern'i

Yeni Alpine bileşeni eklerken:

```ts
// src/alpine/myFeature.ts
import Alpine from "alpinejs";

Alpine.data("myFeature", (initial: SomeType) => ({
  // state
  open: false,
  items: [] as Item[],

  // Otomatik çağrılır — x-init="init()" YAZMA
  init() {
    // setup
  },

  // metotlar
  toggle() { this.open = !this.open; },
}));
```

Sonra `src/alpine/index.ts`'e side-effect import ekle:
```ts
import "./myFeature";
```

### 5.2 V3 Kuralları — Yanlış/Doğru Örnekleri

Aşağıdaki tüm karşılaştırmalar `alpinejs.dev/upgrade-guide` ile birebir doğrulandı.
Kod yazarken hangi tarafta olduğunu mutlaka kontrol et.

#### 5.2.1 `init()` otomatik çağrılır

```html
<!-- ❌ YANLIŞ (V2 kalıntısı) -->
<div x-data="dropdown()" x-init="init()">
  ...
</div>
```
```html
<!-- ✅ DOĞRU (V3) — init() otomatik çalışır -->
<div x-data="dropdown()">
  ...
</div>
```
```ts
// Alpine.data() içinde tanımla — Alpine bunu otomatik çağırır
Alpine.data("dropdown", () => ({
  open: false,
  init() {
    console.log("auto-called by Alpine");
  },
}));
```

#### 5.2.2 `x-spread` → `x-bind` (attribute'siz)

```html
<!-- ❌ YANLIŞ -->
<button x-spread="trigger">Toggle</button>
```
```html
<!-- ✅ DOĞRU -->
<button x-bind="trigger">Toggle</button>
```
```ts
Alpine.data("dropdown", () => ({
  trigger: {
    ["@click"]() { this.open = !this.open; },
    [":aria-expanded"]() { return this.open; },
  },
}));
```

#### 5.2.3 `x-show.transition` → `x-transition`

```html
<!-- ❌ YANLIŞ -->
<div x-show.transition="open">...</div>
<div x-show.transition.duration.500ms="open">...</div>
```
```html
<!-- ✅ DOĞRU — unified API -->
<div x-show="open" x-transition>...</div>

<!-- Kontrollü transition -->
<div
  x-show="open"
  x-transition:enter="transition ease-out duration-300"
  x-transition:enter-start="opacity-0 scale-95"
  x-transition:enter-end="opacity-100 scale-100"
  x-transition:leave="transition ease-in duration-150"
  x-transition:leave-start="opacity-100 scale-100"
  x-transition:leave-end="opacity-0 scale-95"
>...</div>
```

#### 5.2.4 `$el` artık root değil — root için `$root` kullan

```html
<!-- ❌ YANLIŞ (V2 mantığı) — $el burada artık <button>, root component değil -->
<div x-data="{ open: false }">
  <button @click="console.log($el.dataset.componentId)">
    <!-- V2'de bu component root'unu döküyordu, V3'te butonun kendisini -->
  </button>
</div>
```
```html
<!-- ✅ DOĞRU (V3) -->
<div x-data="{ open: false }" data-component-id="dropdown-1">
  <button @click="console.log($root.dataset.componentId)">
    <!-- $root → x-data'nın bulunduğu element -->
  </button>
</div>
```
```ts
// TS modülünde aynı kural — this.$el = mevcut element
Alpine.data("filterSidebar", () => ({
  init() {
    const root = this.$root as HTMLElement;       // ✅ component kökü
    const current = this.$el as HTMLElement;      // ✅ x-data'nın olduğu element
    // V2 alışkanlığıyla `this.$el` ile root'a erişmeye ÇALIŞMA
  },
}));
```

#### 5.2.5 Event handler'da `return false` çalışmaz

```html
<!-- ❌ YANLIŞ — V3'te preventDefault tetiklenmez -->
<form @submit="validate(); return false;">
  ...
</form>
```
```html
<!-- ✅ DOĞRU — açıkça preventDefault çağır -->
<form @submit="$event.preventDefault(); validate();">
  ...
</form>

<!-- veya .prevent modifier kullan -->
<form @submit.prevent="validate()">
  ...
</form>
```

#### 5.2.6 NPM import → `Alpine.start()` manuel

```ts
// ❌ YANLIŞ — V2'de otomatikti, V3'te Alpine başlatılmaz
import Alpine from "alpinejs";
window.Alpine = Alpine;
// Alpine.start() çağrılmadı → hiçbir x-data çalışmaz
```
```ts
// ✅ DOĞRU — bu projede src/alpine/index.ts:startAlpine() içinde
import Alpine from "alpinejs";
import "./products-filter";   // Alpine.data() kayıtları (side-effect)
import "./cart";

window.Alpine = Alpine;

export function startAlpine(): void {
  Alpine.start();  // ← MUTLAKA, ama DOM hazır olduktan sonra
}
```

> ⚠ **Bu projede `Alpine.start()` sadece `src/alpine/index.ts:startAlpine()`
> içinde çağrılır.** Sayfa bootstrap dosyalarında (`src/pages/*.ts` veya
> `main.ts`) `innerHTML` ile DOM yerleştirildikten **sonra** `startAlpine()`
> çağrılır. Bunu başka yerde yeniden çağırma — Alpine zaten başlamışsa
> hata verir.

#### 5.2.7 İç içe `x-data` artık parent scope'u görür

```html
<!-- V2'de child kendi scope'unda izole çalışırdı -->
<!-- V3'te parent scope cascading aktif → parent'ın state'i child'da görünür -->
<div x-data="{ user: 'ali' }">
  <div x-data="{ open: false }">
    <!-- ✅ V3: hem `user` hem `open` erişilebilir -->
    <span x-text="user + ' / ' + open"></span>
  </div>
</div>
```

> Aynı isimli property tanımlarsan child'ınki parent'ı **gölgeler** — istemiyorsan
> isimleri unique tut.

### 5.3 Arrow vs Regular Function

`Alpine.data()` callback'i:

- **Arrow function (varsayılan):** Çoğu durumda yeterli — method'ların içindeki `this` Alpine tarafından otomatik bind edilir.
  ```ts
  Alpine.data("dropdown", () => ({
    open: false,
    toggle() { this.open = !this.open; },  // this burada doğru
  }));
  ```
- **Regular function (zorunlu durumlar):** Döndürülen obje **oluşturulurken** `this.$persist`, `this.$store` gibi magic kullanılacaksa.
  ```ts
  Alpine.data("dropdown", function () {
    return {
      open: this.$persist(false),  // ← inisializasyon anında this gerekli
    };
  });
  ```

### 5.4 Genel Yapma Listesi

- `Alpine.start()`'ı modül yükleme sırasında çağırma — **sadece `startAlpine()` içinde, DOM hazırlandıktan sonra** çağrılmalı (`src/alpine/index.ts:46`)
- HTML'de `x-cloak` kullan, CSS'te `[x-cloak]{display:none!important}` zaten tanımlı (`style.css:11-13`)
- Inline `x-on`/`x-bind` ifadelerinde arrow function, template literal, destructuring, spread **kullanma** (CSP build modunda kırılır — projede şu an CSP off ama gelecekte açılabilir)

### 5.3 Doğrulama Akışı

Alpine kodu yazmadan önce **her seferinde**:

1. `package.json` → "alpinejs" sürümünü oku
2. Context7 sorgusu yap — kullanacağın direktifi/magic'i doğrula
3. Şüpheli görünen herhangi bir API için `https://alpinejs.dev/upgrade-guide` aç (WebFetch)
4. Var olan modüllerden örnek al: `src/alpine/products-filter.ts`, `src/alpine/cart.ts`

---

## 6. TYPESCRIPT KURALLARI

- `strict: true` aktif → `null`/`undefined` ayrımına dikkat
- `noUnusedLocals` + `noUnusedParameters` → kullanılmayan değişkene `_` prefix ver veya sil
- `verbatimModuleSyntax: true` → `import type { Foo } from "..."` zorunlu (sadece tip için)
- `any` ESLint warn → `unknown` ile başla, type guard ile daralt
- `console.log` warn → debug bittiğinde sil veya `console.warn`/`console.error` kullan

DOM erişimi:
```ts
const el = this.$el as HTMLElement;
const input = el.querySelector<HTMLInputElement>('input[type="text"]');
```
Type cast yerine `querySelector<T>` generic'i tercih et.

---

## 7. KOMPONENT ORGANİZASYONU

`src/components/` altında her özellik klasörü şu şablonu izler:

```
components/<feature>/
├── index.ts              # Barrel export
├── <Component>.ts        # Render fonksiyonu (HTML string döndürür) + init
└── ...
```

Component pattern:
```ts
export function MyComponent(props: Props): string {
  return /* html */ `
    <div x-data="myFeature(${JSON.stringify(props.initial)})">
      ...
    </div>
  `;
}

export function initMyComponent(): void {
  // DOM hazır olduktan sonra event listener'lar
}
```

`main.ts` veya `pages/<page>.ts` içinde:
1. `innerHTML` ile HTML'i yerleştir
2. `init*` fonksiyonlarını çağır
3. `startAlpine()` **bir kez** çağır (sayfa init'inin sonunda)

---

## 8. NPM SCRIPTLERİ

```bash
npm run dev          # Vite dev server (http://localhost:5173, /api → :8000 proxy)
npm run build        # tsc + vite build → dist/
npm run preview      # Production build önizleme
npm run lint         # ESLint check
npm run lint:fix     # ESLint --fix + Prettier write
npm run format       # Prettier write
npm run format:check # Prettier check
```

Dev'de Docker bind mount kullanıldığında inotify yetersiz kalıyor → `vite.config.ts`
`watch.usePolling: true` ayarlı, **bu satıra dokunma**.

---

## 9. VITE PLUGIN'LERİ (Bu Projeye Özel)

`vite.config.ts` içinde 4 custom plugin var:

| Plugin | Ne yapıyor | Dokunma riski |
|--------|------------|---------------|
| `tailwindcss()` | Tailwind v4 entegrasyonu | Yok |
| `themeBootstrapPlugin` | HTML `<head>`'e FOUC önleyici tema script'i inject | localStorage key `tradehub-theme-remote` — değiştirme |
| `cssEditorPlugin` | Dev-only `POST /__save-css` ile `@theme` token'larını canlı düzenler | Sadece dev'de aktif (`apply: 'serve'`) |
| `notFoundFallbackPlugin` | Bilinmeyen route'larda 404.html serve eder | Dev-only |

Build'te `manualChunks` vendor ayrıştırması: `vendor-alpine`, `vendor-flowbite`,
`vendor-swiper`, `vendor-i18next`, `vendor-dompurify`, `locales`, `alpine`.
Yeni büyük bağımlılık eklenirse buraya da ekle.

---

## 10. KESİNLİKLE YAPILMAMASI GEREKENLER

1. **Tailwind utility ile yazılabilen stili `style.css`'e koymak** → 0.1'i tekrar oku
2. **Alpine API'sini hatırdan yazmak** → 0.2'yi tekrar oku
3. **Mevcut kodu incelemeden yeni dosya açmak** → 0.3'ü tekrar oku
4. `Alpine.start()`'ı `src/alpine/index.ts:startAlpine()` dışında çağırmak
5. `x-init="init()"` yazmak (V3'te `init()` otomatik)
6. Kullanıcı içeriğini `innerHTML`'e DOMPurify'sız vermek (XSS)
7. `console.log` ile commit (ESLint uyarı veriyor — `lint:fix` çalıştır)
8. `any` type ile commit
9. `@theme` token'ı 3'ten az yerde kullanmak (arbitrary value yeterli)
10. CSS değişkeni utility'de fallback'siz yazmak (`bg-[var(--x)]` yerine `bg-[var(--x,#fff)]`)
11. `pages/*.html` dosyalarına ESLint kapalı diye temiz olmayan inline JS yazmak
12. `vite.config.ts` plugin sırasını değiştirmek (`tailwindcss()` ilk olmalı)
13. Yeni HTML entry eklediğinde `rollupOptions.input`'a manuel ekleme — `fast-glob` otomatik tarıyor, dosya `pages/` veya kök altında olmalı
14. Build'te chunk olmaması gereken bir lib'i `manualChunks`'a eklemeden bırakmak (>50KB ise vendor-* yap)
15. `src/styles/*.css` altında **yeni dosya açmak** (Mayıs 2026 refactor
    sonrası bu dizin temizlendi; sayfa-spesifik CSS yazma)
16. `src/style.css`'i 4500 satırın üzerine çıkartmak — eklemek istediğin
    satırı utility'leştirip eklemeyi düşün (Mayıs 2026 refactor sonrası
    baseline ~4300, tolerans 4500)
17. `.claude/settings.json` "ask" izin listesine takılan istek için
    gerekçesiz "izin ver" istemek — Bölüm 0.0'daki 3 soruya cevabın hazır
    olmadan izin sorma

---

## 11. CONTEXT7 / WEB DOĞRULAMA REFERANS TABLOSU

Görev türüne göre hangi kaynağa bakmalı:

| Görev | Kaynak | Tool |
|-------|--------|------|
| Tailwind utility/directive doğrulama | `/tailwindlabs/tailwindcss.com` | `mcp__plugin_context7_context7__query-docs` |
| Tailwind v4 Vite kurulum | `/websites/tailwindcss_installation_using-vite` | aynı |
| Alpine.js direktif/magic | `/websites/alpinejs_dev` | aynı |
| Alpine.js breaking changes | `https://alpinejs.dev/upgrade-guide` | `WebFetch` |
| Vite plugin API | `/vitejs/vite` (resolve önce) | aynı |
| Flowbite component | `https://flowbite.com/docs/...` | `WebFetch` |
| Swiper API | `/nolimits4web/swiper` | resolve + query |
| Frappe API endpoint'leri | `../tradehub_core/CLAUDE.md` | `Read` |

**Kural:** Bu sayfaları **session başına en az bir kez** doğrulamadan o teknolojiye
ait kod yazma. Eski belleğe güvenme — sürümler hızlı değişiyor.

---

## 12. REFACTOR HEDEF LİSTESİ

### 12.1 Tamamlanan refactor'lar (Mayıs 2026)

CSS Agresif Refactor (2026-05-13):

- ✅ `src/style.css` 4878 → ~4300 satır (utility göçü + ölü kod silimi + kullanılmayan token temizliği)
  - Not: Spec'in "~700 satır" hedefi gerçekçi olmadığı için ~4300 satıra revize edildi.
    Bunun nedeni: theme system (`.th-btn-*`, `.product-card__*` ailesi, dashboard
    `:root` token bloku) ~430 satır PROTECTED, JS-toggled state'ler ~300 satır,
    pseudo-elementler/animasyonlar/3rd-party override'lar ~700 satır kalmak zorunda.
- ✅ `src/styles/cart-design.css` (364) — SİLİNDİ
- ✅ `src/styles/checkout-design.css` (1032) — SİLİNDİ
- ✅ `src/styles/reviews-v5.css` (749) — SİLİNDİ (ölü kod idi)
- ✅ `src/styles/seller/seller-storefront.css` (291) — 190 satıra indirildi, sonra
  kalan içerik `src/style.css` sonuna birleştirildi → **dosya SİLİNDİ, src/styles/ dizini tamamen kalmadı**
- ✅ Toplam src CSS: 7314 → ~4500 satır (-%38)
- ✅ Bundle CSS: 400 KB → 365 KB (-9%, pages-cart-*.css ve pages-order-checkout-*.css
  chunk'ları tamamen elimine edildi)
- ✅ `tradehubfront/.claude/settings.json` ile permission gate aktif
- ✅ Detaylı ilerleme: `css-optimization-reports/refactor-progress.md`
- ✅ Spec/plan: `docs/superpowers/specs/2026-05-13-css-aggressive-refactor-design.md`,
  `docs/superpowers/plans/2026-05-13-css-aggressive-refactor-plan.md`

### 12.2 Aktif refactor hedefleri

Aşağıdaki alanlar dokunulan görevde **fırsatçı şekilde** temizlenmeli:

1. `any` type kullanımları (`grep -r ": any" src/`)
2. `console.log` bırakılmış noktalar
3. Alpine V2 pattern kalıntısı (`x-init="init()"`, `x-spread`,
   `x-show.transition`)
4. Component dosyası **sadece** HTML string döndürüyor ve hiç state'i yok
   → düz template literal'a düşürülebilir mi?

Refactor commit'i daima ayrı: `refactor(<area>): <neyi neye çevirdin>`.
