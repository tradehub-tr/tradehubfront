# Bundle Baseline (T13)

**Tarih:** 2026-06-06
**Araç:** `rollup-plugin-visualizer` (build-only, treemap → `perf-reports/bundle-stats.html`, gitignore'lu)
**Build:** `npm run build` (T12 sonrası — motion lazy-load uygulanmış hâli)

## En büyük chunk'lar (raw / gzip)

| Chunk | Raw | Gzip | Her sayfada? | Not |
|---|---:|---:|:---:|---|
| **`locales-*.js`** | **1,377 KB** | **396 KB** | ✅ EVET | **4 dilin TAMAMI** (en+tr+ar+ru) tek chunk'ta, statik. Aktif dil ne olursa olsun hepsi yükleniyor. |
| `alpine-*.js` | 681 KB | 184 KB | ✅ EVET | Alpine data modülleri (motion T12'de çıkarıldı). |
| `vendor-echarts-*.js` | 568 KB | 194 KB | ❌ Hayır | Yalnızca buyer-dashboard (dinamik import). ✓ İyi. |
| `vendor-flowbite-*.js` | 130 KB | 30 KB | ✅ Çoğu sayfa | UI kit. |
| `vendor-swiper-*.js` | 91 KB | 28 KB | Slider'lı sayfalar | |
| `vendor-i18next-*.js` | 51 KB | 16 KB | ✅ EVET | i18n runtime. |
| `vendor-alpine-*.js` | 46 KB | 17 KB | ✅ EVET | Alpine core. |
| `vendor-dompurify-*.js` | 27 KB | 10 KB | Çoğu sayfa | |

## Tipik sayfada initial JS (gzip, kabaca)
`locales 396` + `alpine 184` + `flowbite 30` + `swiper 28` + `i18next 16` + `vendor-alpine 17` + sayfa chunk'ı
≈ **~670 KB+ gzip** — bunun **%59'u tek başına `locales`**.

## Bulgular / hedefler

1. **`locales` 396 KB gzip — #1 sorun.** 4 dil her sayfada yükleniyor; kullanıcı tek dil kullanıyor.
   Aktif-dil-bazlı lazy-load ile sayfa başına ~**297 KB gzip** (≈%75) tasarruf edilebilir.
   - **ANCAK riskli:** `src/i18n/index.ts` init'i SENKRON (`initImmediate:false`, 4 dil statik
     `resources`'a inline). `t()` ilk render'da template literal'lerde senkron çağrılıyor (~40 sayfa
     bootstrap'ında). Statik ESM + senkron `t()`, runtime-belirlenen dilin lazy import'uyla
     uyumsuz → init'i async yapmak ve her bootstrap'ı `await i18nReady` ile beklemek gerekir.
   - Bu, kendi spec/plan/review döngüsünü hak eden ayrı, dikkatli bir iş. **Takip task'ı T16.**
   - Mock namespace'leri (mockProduct/sellerMock/dropshipping) dosyaların yalnızca ~%9'u →
     onları çıkarmak kayda değer kazanç vermez; asıl ağırlık gerçek çeviriler.
2. **`vendor-tanstack` chunk'ı yok.** Yeni eklenen @tanstack + idb-keyval şu an nereye düştüyse
   orada; `manualChunks`'a `vendor-tanstack` eklenecek (T14, güvenli).
3. **echarts doğru** (lazy, sadece dashboard). flowbite/swiper makul.

## T14 kapsamı (bu PR'da, güvenli)
- `vendor-tanstack` manualChunk ekle (@tanstack/* + idb-keyval).
- locales lazy-load **bu PR'da YAPILMAYACAK** → T16 takip task'ı (riskli, ayrı review ister).
