# TradeHub Frontend (`tradehubfront/`) — Proje Rehberi

Bu dosya kısa orkestrasyon kurallarını içerir. Detaylı kurallar `tradehubfront/.claude/rules/` altında path-scoped olarak duruyor — Claude o tip dosyaya dokunduğunda otomatik yüklenir.

> **TEMEL FELSEFE:** Bu projede **kod yazmaktan ÖNCE araştırma yapılır.** Tailwind sınıfı varken custom CSS yazma. Alpine API'sini hatırdan yazma — her seferinde Context7'den doğrula. Yeni dosya açmadan önce mevcut kodu refactor etmeyi düşün.

---

## 1. Proje kimliği

- **Tip:** Multi-page Vite uygulaması (statik HTML entry'leri + Alpine.js sprinkles)
- **Hedef:** TradeHub B2B marketplace'in alıcı/satıcı tarafı (storefront)
- **Backend:** Frappe v15 (`tradehub_core` ve diğer apps), `/api` proxy ile
- **Deploy:** Docker + Nginx (`Dockerfile`, `nginx.conf.template`), beta → rc → prod akışı
- **Default branch:** `main`

## 2. Stack

| Katman | Teknoloji | Sürüm | Not |
|---|---|---|---|
| Build | Vite | ^7.3.1 | Multi-entry (`pages/**/*.html` + root HTML) |
| Dil | TypeScript | ~5.9.3 | `strict: true`, `noUnusedLocals` |
| CSS | Tailwind CSS | ^4.1.18 | `@tailwindcss/vite`, **CSS-config (no JS config)** |
| Reaktif UI | Alpine.js | ^3.15.8 | `Alpine.data()` modülleri `src/alpine/` |
| UI kit | Flowbite | ^4.0.1 | `@plugin "flowbite/plugin"` |
| Slider | Swiper | ^12.1.0 | `vendor-swiper` chunk |
| i18n | i18next | ^25.8.14 | `src/i18n/`, browser language detector |
| Animasyon | Motion | ^12.38.0 | (eski Framer Motion) |
| Sanitize | DOMPurify | ^3.3.2 | XSS koruması — kullanıcı içeriği için zorunlu |
| Icons | lucide-static | ^1.14.0 | SVG string |
| Linter | ESLint | ^9 | flat config (`eslint.config.js`) |
| Format | Prettier | ^3.4 | `lint:fix` script'inde otomatik |

## 3. Dizin yapısı

```
tradehubfront/
├── pages/                      # HTML entry'leri (multi-page)
│   ├── auth/, dashboard/, help/, info/, legal/, order/, seller/
│   ├── brand.html, cart.html, categories.html, manufacturers.html
│   ├── product-detail.html, products.html, top-deals.html, ...
├── src/
│   ├── main.ts                 # Ana giriş (tüm sayfalar kullanmıyor)
│   ├── style.css               # ⚠ ~4300 satır — şişmesin
│   ├── alpine/                 # Alpine.data() modülleri (side-effect import)
│   │   └── index.ts            # startAlpine() + tüm modül importları
│   ├── components/             # TS component'leri (DOM render fonksiyonları)
│   │   ├── header/, hero/, footer/, floating/, product/, cart/, checkout/...
│   │   └── (her klasörde index.ts barrel export)
│   ├── pages/                  # Sayfa-spesifik bootstrap dosyaları
│   ├── services/               # API client'ları (cart, listing, category...)
│   ├── stores/                 # Alpine.store() veya basit reaktif state
│   ├── utils/                  # url, themeStorage, animatedPlaceholder, tracking...
│   ├── i18n/                   # locale + init
│   └── data/, types/, assets/
├── public/                     # Statik (favicon vb. kopyalanır)
├── dist/                       # Build çıktısı (gitignored)
├── docs/                       # Geliştirici dokümantasyonu
├── vite.config.ts              # 4 custom plugin (build.md'de detay)
├── eslint.config.js
├── tsconfig.json
├── nginx.conf.template
├── Dockerfile
└── DEPLOYMENT.md
```

## 4. Mutlak kurallar (özet)

> Detay her birinin `.claude/rules/*.md`'sinde. Burası özet/uyarı listesi.

1. **READ-FIRST:** Tailwind/Alpine doc'unu Context7'den doğrulamadan kod yazma.
2. **REFACTOR-BEFORE-WRITE:** Yeni dosya açmadan önce mevcut composable/util/module ara.
3. **Custom CSS yazmadan önce 4 soru** (`tailwind-utility-rules.md`).
4. **CSS izin kapısı:** `src/style.css` ve `src/styles/**` için 3 soruya cevap vermeden izin isteme.
5. **`@theme` token:** 3'ten az kullanım → token EKLEME, arbitrary value yaz.
6. **CSS değişkenleri:** Fallback ZORUNLU — `bg-[var(--x,#fff)]`.
7. **Alpine V3:** `init()` otomatik, `$el` root değil, `return false` çalışmaz.
8. **`Alpine.start()` sadece** `src/alpine/index.ts:startAlpine()` içinde.
9. **`x-cloak` kullan** — CSS hazır.
10. **DOMPurify** kullanıcı içeriği için zorunlu.
11. **`console.log` ve `any` ile commit yok** — ESLint warn.
12. **`vite.config.ts` plugin sırası:** `tailwindcss()` ilk olmalı.

## 5. Path-scoped rules

`.claude/rules/` altında 7 dosya — ilgili dosya açıldığında otomatik yüklenir:

| Dosya | Hangi dosyalar için | İçerik |
|---|---|---|
| `tailwind-utility-rules.md` | `**/*.{html,ts,css}` | Tailwind v4 utility kuralları, @media→variant, pseudo→utility |
| `css-architecture.md` | `**/*.{css,html,ts}` | İzin kapısı, CSS hiyerarşi, @theme, var(--..), JS-toggled state |
| `alpinejs-modules.md` | `src/alpine/**`, `**/*.{html,ts}` | Modül pattern, V3 temel (init, $root, x-transition, x-bind) |
| `alpinejs-v3-advanced.md` | `src/alpine/**`, `**/*.{html,ts}` | preventDefault, startAlpine, scope cascade, arrow vs regular |
| `typescript.md` | `**/*.{ts,tsx}` | strict, DOM erişimi, component pattern, XSS |
| `build.md` | `vite.config.ts`, `package.json`, `tsconfig.json` | NPM scripts, Vite plugin'leri, chunk'lar |
| `workflow.md` | `**/*.{ts,tsx,js,css,html,vue}` | Refactor-before-write, 17 yasak madde, Context7 tablosu, refactor hedefleri |

## 6. Auto memory ile ilişki

Kök auto memory (`~/.claude/projects/-home-metin-Desktop-istoc-c--cd/memory/MEMORY.md`) her oturumda yüklenir. Bu CLAUDE.md ile **tamamlayıcı**: bu dosya yazılı kural, memory biriken öğrenme.

<!-- Bakım notu: bu dosyayı <200 satırda tut. Detay rules'a, biriken öğrenme memory'ye. -->
