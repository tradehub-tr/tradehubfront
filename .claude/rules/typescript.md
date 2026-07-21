---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript + Component pattern

## 1. tsconfig kuralları

- `strict: true` aktif → `null`/`undefined` ayrımına dikkat
- `noUnusedLocals` + `noUnusedParameters` → kullanılmayan değişkene `_` prefix ver veya sil
- `verbatimModuleSyntax: true` → `import type { Foo } from "..."` zorunlu (sadece tip için)
- `any` ESLint warn → `unknown` ile başla, type guard ile daralt
- `console.log` warn → debug bittiğinde sil veya `console.warn` / `console.error` kullan

## 2. DOM erişimi

```ts
const el = this.$el as HTMLElement;
const input = el.querySelector<HTMLInputElement>('input[type="text"]');
```

Type cast yerine `querySelector<T>` generic'i tercih et.

## 3. Component organizasyonu

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

## 4. XSS koruması

Kullanıcı içeriğini `innerHTML`'e DOMPurify'sız verme:

```ts
import DOMPurify from "dompurify";

el.innerHTML = DOMPurify.sanitize(userContent);
```

Backend'den gelen güvenilir içerik için bile gözden geçirilebilir.

## 5. İsim benzersizliği — cross-file export çakışması

Aynı export adını (`interface`/`type`/`function`/`const`/`class`) **birden çok dosyada** kullanma. ESLint dosya-bazlıdır, bunu yakalayamaz — bunun için `npm run check:dup` (cross-file bekçi) var; CI'da yeni çakışmayı kırmızı yapar (`scripts/check-duplicate-exports.mjs`).

**Yeni bir çakışma uyarısı alırsan ÖNCE kavramı sorgula — körü körüne "kopyadır, birleştireyim" YAPMA:**

1. **Gerçekten AYNI kod mu?** (birebir kopyala-yapıştır tip/fonksiyon) → ortak dosyaya taşı + import et, kopyayı kaldır. (ör. `FrappeResponse` API sarmalayıcısı.)
2. **FARKLI kavram, isim tesadüfen mi aynı?** → **BİRLEŞTİRME.** Ayrı, açıklayıcı isim ver:
   - `CategoryItem` (navigasyon) → `NavCategoryItem`; `CategoryItem` (ürün filtresi) → `FilterCategoryItem`
   - `SupplierCard` (sepet) → `CartSupplierCard`; (ürün detay) → `ProductSupplierCard`
   - Bileşen fonksiyonları feature-prefixed veya `render*`; çıplak jenerik ad (`Card`, `Item`, `Section`) verme.

> ⚠️ **İstoç-özel tuzak:** "Kategori" birden çok domain'e ait — `Product Category` (platform taksonomisi), `Seller Category` (satıcının açtığı, onaylı), ürün-liste filtresi, navigasyon dizini. `Listing` DocType hem `product_category` hem `category` (Seller Category) taşır — **ayrı alanlar.** Aynı isimli `CategoryItem`/`CategorySection` tiplerini **birleştirme**; farklı kavramları birleştirmek ürün filtresini + navigasyonu + RFQ görünürlüğünü + satıcı mağaza grid'ini bozar. Önce "hangi kavram?" diye sor.

Kaçınılmaz/kasıtlı çakışmada: `npm run check:dup:update` ile allowlist'e ekle (gerekçeyi commit mesajına yaz).
