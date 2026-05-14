---
paths:
  - "src/alpine/**/*.ts"
  - "src/alpine/**/*.js"
  - "**/*.html"
  - "**/*.ts"
---

# Alpine.js V3 — İleri kurallar

Temel pattern + V3 kuralları (init, $root, x-transition) için `alpinejs-modules.md`.

## 1. Event handler'da `return false` çalışmaz

```html
<!-- ❌ V3'te preventDefault tetiklenmez -->
<form @submit="validate(); return false;">

<!-- ✅ açıkça preventDefault -->
<form @submit="$event.preventDefault(); validate();">

<!-- ✅ veya .prevent modifier -->
<form @submit.prevent="validate()">
```

## 2. NPM import → `Alpine.start()` manuel

```ts
// ❌ V2'de otomatikti, V3'te başlatılmaz
import Alpine from "alpinejs";
window.Alpine = Alpine;
// Alpine.start() çağrılmadı → hiçbir x-data çalışmaz
```

```ts
// ✅ Bu projede src/alpine/index.ts:startAlpine() içinde
import Alpine from "alpinejs";
import "./products-filter";   // Alpine.data() kayıtları (side-effect)
import "./cart";

window.Alpine = Alpine;

export function startAlpine(): void {
  Alpine.start();  // ← MUTLAKA, ama DOM hazır olduktan sonra
}
```

> ⚠ Bu projede `Alpine.start()` **sadece** `src/alpine/index.ts:startAlpine()` içinde çağrılır. Sayfa bootstrap'larda (`src/pages/*.ts` veya `main.ts`) `innerHTML` ile DOM yerleştirildikten **sonra** `startAlpine()` çağrılır. Başka yerde tekrar çağırma — hata verir.

## 3. İç içe `x-data` parent scope'u görür

V2'de child kendi scope'unda izole çalışırdı. V3'te parent scope cascade aktif:

```html
<div x-data="{ user: 'ali' }">
  <div x-data="{ open: false }">
    <!-- ✅ V3: hem `user` hem `open` erişilebilir -->
    <span x-text="user + ' / ' + open"></span>
  </div>
</div>
```

> Aynı isimli property tanımlarsan child'ınki parent'ı **gölgeler** — istemiyorsan isimleri unique tut.

## 4. Arrow vs Regular function

`Alpine.data()` callback'i:

**Arrow (varsayılan):** Method'ların içindeki `this` Alpine tarafından otomatik bind edilir.

```ts
Alpine.data("dropdown", () => ({
  open: false,
  toggle() { this.open = !this.open; },  // this burada doğru
}));
```

**Regular function (zorunlu):** Döndürülen obje **oluşturulurken** `this.$persist`, `this.$store` gibi magic kullanılacaksa.

```ts
Alpine.data("dropdown", function () {
  return {
    open: this.$persist(false),  // ← inisializasyon anında this gerekli
  };
});
```

## 5. Genel yapma listesi

- **`Alpine.start()`'ı modül yükleme sırasında çağırma** — sadece `startAlpine()` içinde, DOM hazırlandıktan sonra (`src/alpine/index.ts:46`).
- **HTML'de `x-cloak` kullan** — CSS'te `[x-cloak]{display:none!important}` zaten tanımlı (`style.css:11-13`).
- **Inline `x-on`/`x-bind`'de arrow function, template literal, destructuring, spread KULLANMA** — CSP build modunda kırılır (şu an CSP off ama gelecekte açılabilir).

## 6. Doğrulama akışı (her Alpine değişikliğinden önce)

1. `package.json` → "alpinejs" sürümünü oku
2. Context7 sorgusu — kullanacağın direktifi/magic'i doğrula
3. Şüpheli görünen herhangi bir API için `https://alpinejs.dev/upgrade-guide` aç (WebFetch)
4. Var olan modüllerden örnek al: `src/alpine/products-filter.ts`, `src/alpine/cart.ts`

## 7. Cross-feature handler'ları feature modülüne taşı

Global `document.addEventListener('click', ...)` deseniyle birden çok feature'ı tek init'e gömme. Her feature'ın kendi `init<Feature>Triggers.ts` dosyası olur:

```ts
// src/features/chat/initChatTriggers.ts
import { findConversationBySellerId } from "./chatService";

export function initChatTriggers(): void {
  document.body.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement).closest("[data-chat-trigger]");
    if (!trigger) return;
    const sellerId = trigger.getAttribute("data-seller-id");
    // chatService.findConversationBySellerId(sellerId) ile eşle
    // sellerId DOĞRUDAN conversationId DEĞİL
  });
}
```

Sayfa bootstrap (`src/pages/*.ts`) feature init fonksiyonlarını sırayla çağırır.
