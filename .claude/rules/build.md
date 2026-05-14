---
paths:
  - "vite.config.ts"
  - "package.json"
  - "tsconfig.json"
  - "eslint.config.js"
  - "Dockerfile"
  - "nginx.conf.template"
---

# Build konfigürasyonu — NPM + Vite

## 1. NPM scriptleri

```bash
npm run dev          # Vite dev server (http://localhost:5173, /api → :8000 proxy)
npm run build        # tsc + vite build → dist/
npm run preview      # Production build önizleme
npm run lint         # ESLint check
npm run lint:fix     # ESLint --fix + Prettier write
npm run format       # Prettier write
npm run format:check # Prettier check
```

Dev'de Docker bind mount kullanıldığında inotify yetersiz kalıyor → `vite.config.ts` `watch.usePolling: true` ayarlı, **bu satıra dokunma**.

## 2. Vite custom plugin'leri

`vite.config.ts` içinde 4 plugin var:

| Plugin | Ne yapıyor | Dokunma riski |
|---|---|---|
| `tailwindcss()` | Tailwind v4 entegrasyonu | Yok — plugin sırasında **ilk olmalı** |
| `themeBootstrapPlugin` | HTML `<head>`'e FOUC önleyici tema script'i inject | localStorage key `tradehub-theme-remote` — değiştirme |
| `cssEditorPlugin` | Dev-only `POST /__save-css` ile `@theme` token'larını canlı düzenler | Sadece dev'de aktif (`apply: 'serve'`) |
| `notFoundFallbackPlugin` | Bilinmeyen route'larda 404.html serve eder | Dev-only |

## 3. Build chunk'ları

Build'te `manualChunks` vendor ayrıştırması:

- `vendor-alpine`, `vendor-flowbite`, `vendor-swiper`
- `vendor-i18next`, `vendor-dompurify`
- `locales`, `alpine`

Yeni büyük bağımlılık eklenirse buraya da ekle (>50KB ise `vendor-*` yap). Build'te chunk olmaması gereken bir lib'i `manualChunks`'a eklemeden bırakma.

## 4. Multi-entry HTML

`pages/**/*.html` ve kök seviyedeki HTML'ler `fast-glob` ile otomatik taranır. Yeni HTML entry eklediğinde `rollupOptions.input`'a **manuel ekleme** — dosya `pages/` veya kök altında olmalı.

## 5. Plugin sırası

`vite.config.ts`'te plugin sırası **kritik**:

1. `tailwindcss()` ← ilk olmalı (CSS extraction zincirinin başı)
2. `themeBootstrapPlugin`
3. `cssEditorPlugin` (dev-only)
4. `notFoundFallbackPlugin` (dev-only)

Sırayı değiştirme.
