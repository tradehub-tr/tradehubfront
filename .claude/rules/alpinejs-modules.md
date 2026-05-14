---
paths:
  - "src/alpine/**/*.ts"
  - "src/alpine/**/*.js"
  - "**/*.html"
  - "**/*.ts"
---

# Alpine.js modül pattern + temel V3 kuralları

Sürüm: `alpinejs ^3.15.8`. V3 ileri kurallar için `alpinejs-v3-advanced.md`.

## 1. Önce doğrula (her oturumda 1 kez)

1. Sürümü `package.json`'dan oku.
2. Yazacağın direktif/magic'i Context7'den çek:
   ```
   mcp__plugin_context7_context7__query-docs
   libraryId: /websites/alpinejs_dev
   query: "<x-directive veya $magic kullanımı>"
   ```
3. Sürüm eskiyse veya kullanım deprecated görünüyorsa `https://alpinejs.dev/upgrade-guide` WebFetch.

## 2. Modül pattern'i

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

## 3. V3 — Yanlış/Doğru (temel)

### 3.1 `init()` otomatik çağrılır

```html
<!-- ❌ V2 kalıntısı -->
<div x-data="dropdown()" x-init="init()">

<!-- ✅ V3 — init() otomatik -->
<div x-data="dropdown()">
```

```ts
Alpine.data("dropdown", () => ({
  open: false,
  init() {
    console.log("auto-called by Alpine");
  },
}));
```

### 3.2 `x-spread` → `x-bind` (attribute'siz)

```html
<!-- ❌ -->
<button x-spread="trigger">Toggle</button>

<!-- ✅ -->
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

### 3.3 `x-show.transition` → `x-transition`

```html
<!-- ❌ -->
<div x-show.transition="open">...</div>
<div x-show.transition.duration.500ms="open">...</div>

<!-- ✅ unified API -->
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

### 3.4 `$el` artık root değil — root için `$root`

```html
<!-- ❌ V2 mantığı — $el burada artık <button>, root değil -->
<div x-data="{ open: false }">
  <button @click="console.log($el.dataset.componentId)">
</div>

<!-- ✅ V3 -->
<div x-data="{ open: false }" data-component-id="dropdown-1">
  <button @click="console.log($root.dataset.componentId)">
    <!-- $root → x-data'nın bulunduğu element -->
  </button>
</div>
```

```ts
Alpine.data("filterSidebar", () => ({
  init() {
    const root = this.$root as HTMLElement;   // ✅ component kökü
    const current = this.$el as HTMLElement;  // ✅ x-data'nın olduğu element
  },
}));
```
