---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.css"
  - "**/*.html"
  - "**/*.vue"
---

# İş akışı — refactor-before-write, yasaklar, kaynak doğrulama

## 1. Refactor-before-write kontrolü

Yeni kod yazmadan önce **mevcut kodu oku ve sor:**

1. Bu işlevsellik için zaten bir component / Alpine module / utility var mı?
   → `grep`/`Glob` ile ara: `src/components/`, `src/alpine/`, `src/utils/`, `src/services/`
2. Var olan kod güncel mi?
   - Eski Alpine kullanımı (V2 pattern)?
   - Custom CSS yığını (utility'e çevrilebilir)?
   - `any` type kullanımı (eslint warn)?
   - `console.log` bırakılmış (eslint warn)?
3. Yanıt "evet, eski/iyileştirilebilir" ise **önce refactor et, sonra yeni feature ekle.** Görevi iki commit'e ayır:
   - Commit 1: `refactor(<area>): replace custom CSS with Tailwind utilities`
   - Commit 2: `feat(<area>): <yeni özellik>`

> **Neden:** Frontend parça parça temizlenecek. Her görev hem yeni özellik ekler hem de o dokunduğu alanı clean koda yaklaştırır. Bu kural opsiyonel değil.

## 2. KESİNLİKLE YAPILMAMASI GEREKENLER

1. **Tailwind utility ile yazılabilen stili `style.css`'e koymak** → `tailwind-utility-rules.md`'yi tekrar oku
2. **Alpine API'sini hatırdan yazmak** → her oturumda Context7 doğrula
3. **Mevcut kodu incelemeden yeni dosya açmak** → §1
4. `Alpine.start()`'ı `src/alpine/index.ts:startAlpine()` dışında çağırmak
5. `x-init="init()"` yazmak (V3'te `init()` otomatik)
6. Kullanıcı içeriğini `innerHTML`'e **DOMPurify'sız** vermek (XSS)
7. `console.log` ile commit (ESLint uyarı veriyor — `lint:fix` çalıştır)
8. `any` type ile commit
9. `@theme` token'ı 3'ten az yerde kullanmak (arbitrary value yeterli)
10. CSS değişkeni utility'de fallback'siz yazmak (`bg-[var(--x)]` yerine `bg-[var(--x,#fff)]`)
11. `pages/*.html` dosyalarına ESLint kapalı diye temiz olmayan inline JS yazmak
12. `vite.config.ts` plugin sırasını değiştirmek (`tailwindcss()` ilk olmalı)
13. Yeni HTML entry eklediğinde `rollupOptions.input`'a **manuel** ekleme
14. Build'te chunk olmaması gereken bir lib'i `manualChunks`'a eklemeden bırakmak (>50KB ise `vendor-*` yap)
15. `src/styles/*.css` altında **yeni dosya açmak** (Mayıs 2026 refactor sonrası dizin temizlendi)
16. `src/style.css`'i 4500 satırın üzerine çıkartmak — eklemek istediğin satırı utility'leştir
17. `.claude/settings.json` "ask" izin listesine takılan istek için gerekçesiz "izin ver" istemek — `css-architecture.md`'deki 3 soruya cevabın hazır olmadan izin sorma

## 3. Context7 / Web doğrulama referans tablosu

Görev türüne göre hangi kaynağa bakmalı:

| Görev | Kaynak | Tool |
|---|---|---|
| Tailwind utility/directive doğrulama | `/tailwindlabs/tailwindcss.com` | `mcp__plugin_context7_context7__query-docs` |
| Tailwind v4 Vite kurulum | `/websites/tailwindcss_installation_using-vite` | aynı |
| Alpine.js direktif/magic | `/websites/alpinejs_dev` | aynı |
| Alpine.js breaking changes | `https://alpinejs.dev/upgrade-guide` | `WebFetch` |
| Vite plugin API | `/vitejs/vite` (resolve önce) | aynı |
| Flowbite component | `https://flowbite.com/docs/...` | `WebFetch` |
| Swiper API | `/nolimits4web/swiper` | resolve + query |
| Frappe API endpoint'leri | `../tradehub_core/CLAUDE.md` | `Read` |

**Kural:** Bu sayfaları **session başına en az bir kez** doğrulamadan o teknolojiye ait kod yazma. Eski belleğe güvenme — sürümler hızlı değişiyor.

## 4. Aktif refactor hedefleri (fırsatçı temizlik)

Dokunduğun görevde **fırsatçı şekilde** temizlenecek alanlar:

1. `any` type kullanımları (`grep -r ": any" src/`)
2. `console.log` bırakılmış noktalar
3. Alpine V2 pattern kalıntısı (`x-init="init()"`, `x-spread`, `x-show.transition`)
4. Component dosyası **sadece** HTML string döndürüyor ve hiç state'i yok → düz template literal'a düşürülebilir mi?

Refactor commit'i daima ayrı: `refactor(<area>): <neyi neye çevirdin>`.

## 5. Tamamlanan refactor'lar (Mayıs 2026 referansı)

CSS Agresif Refactor (2026-05-13):
- `src/style.css` 4878 → ~4300 satır
- `src/styles/` dizini tamamen silindi
- `src/styles/cart-design.css` (364), `checkout-design.css` (1032), `reviews-v5.css` (749), `seller/seller-storefront.css` (291) — hepsi silindi
- Bundle CSS: 400 KB → 365 KB (-9%)
- Detay: `css-optimization-reports/refactor-progress.md`
- Spec: `docs/superpowers/specs/2026-05-13-css-aggressive-refactor-design.md`
