# T12 — Ağır lib defer (motion lazy-load)

**Tarih:** 2026-06-06
**Değişiklik:** `motion` (`animate`) `src/alpine/shared.ts`'de statik import'tan dinamik
`import("motion")`'a alındı. `animate` yalnızca arama-formu aç/kapa animasyonunda
(`runAnimation`, kullanıcı etkileşimi) kullanılıyor → ilk-paint-kritik değil.

## İnceleme bulguları (eager ağır import taraması)
- **echarts:** ZATEN dinamik import (`await import("../../utils/echarts")`,
  `AnalyticsOverview.ts`). Sadece buyer-dashboard'da yükleniyor → aksiyon gerekmedi. ✓
- **flowbite (`initFlowbite`):** Etkileşim-kritik (dropdown/modal). TBT zaten ~0 iken
  defer etmek dropdown'ların bir an çalışmamasına yol açar → **bilinçli dokunulmadı** (risk > kazanç).
- **motion:** Statik import `alpine/shared.ts`'de → her sayfada yüklenen `alpine` chunk'ına
  giriyordu, `vendor-motion` chunk'ı da yoktu. **Düzeltildi.**

## Etki (deterministik — bundle payload)

| Chunk | Önce | Sonra | Δ |
|---|---:|---:|---:|
| `alpine-*.js` (her sayfada) | 743 KB | 681 KB | **−62 KB (−8%)** |

motion artık ayrı bir async chunk'ta; yalnızca kullanıcı arama kutusunu açtığında yükleniyor
(sonrası modül-içi cache'li). İlk yükleme JS payload'ı her sayfada ~62KB azaldı.

## TBT (lab, mobile — gürültülü)

| Sayfa | T11 TBT | T12 TBT |
|---|---:|---:|
| products | 120 ms* | 0 ms |
| product-detail | 70 ms | 70 ms |

\* T11'deki 120ms zaten run-to-run gürültüydü. **Dürüst değerlendirme:** TBT bu sayfalarda
zaten ~0 olduğu için motion lazy-load'unun TBT'ye ölçülebilir net etkisi YOK. Bu task'ın gerçek
değeri TBT değil, her sayfada yüklenen **initial JS payload'ının küçülmesi** (yavaş ağ/cihazda
indirme+parse süresi). Throttle'lı lab TBT bunu iyi yansıtmıyor.

## Sonraki büyük hedef (T13/T14'e devir)
- **`locales-*.js` chunk'ı = 1.3 MB** — en büyük tek chunk. i18n locale dosyalarının hepsi tek
  chunk'ta; aktif dile göre lazy-load edilmeli. T14'ün birincil hedefi.
- `vendor-echarts` 556KB (lazy, sadece dashboard — OK), `vendor-flowbite` 128KB, `alpine` 681KB.
