# Bundle — T14 sonrası

**Tarih:** 2026-06-06
**Değişiklik:** `manualChunks`'a `vendor-tanstack` eklendi (@tanstack/* + idb-keyval).

## vendor-tanstack chunk

| Chunk | Raw | Gzip |
|---|---:|---:|
| `vendor-tanstack-*.js` | 27.68 KB | **8.42 KB** |

Önceden cache katmanı (TanStack Query Core + idb-keyval) servisleri import eden sayfa
chunk'larına dağılma riskindeydi; artık tek paylaşılan vendor chunk'ında — sayfalar arası
tekrar yok, uzun-vadeli cache (içerik-hash) dostu. **TanStack'in toplam maliyeti yalnızca
~8.4KB gzip** — Faz 1'deki "library mı custom mu" kararının makul olduğunu doğruluyor.

## Genel durum (T12+T14 birlikte)
- `alpine` chunk: 743 → 681 KB (motion lazy, T12).
- `vendor-tanstack`: yeni, 8.4 KB gzip (kabul edilebilir cache katmanı maliyeti).
- `vendor-echarts` 194 KB gzip: lazy (yalnızca dashboard). ✓

## Bilinçli bırakılan — en büyük kazanç ayrı task'ta
**`locales` 396 KB gzip (her sayfada, 4 dil)** bu PR'da DOKUNULMADI. Aktif-dil lazy-load
~297 KB gzip/sayfa tasarruf sağlar ama i18n init'ini async'e çevirip ~40 sayfa bootstrap'ını
etkileyen riskli bir refactor — kendi spec/plan/review döngüsünü hak ediyor. **Takip: T16.**
Detay ve gerekçe: `bundle-baseline.md` §Bulgular.
