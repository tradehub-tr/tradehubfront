# Performance Baseline — TradeHub Frontend

**Date:** 2026-06-06  
**Method:** Lighthouse 13.3.0 (mobile, headless) — ran successfully  
**Reason:** Playwright's Chromium was available at `/Users/ahmet/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/...`. Lighthouse ran against `http://localhost:4173` (Vite preview of `dist/`) via `CHROME_PATH` env override with `--headless --no-sandbox --disable-dev-shm-usage`.  
**Commit intent:** Pre-fix baseline. No source files changed in this task.

---

## Summary Table

| Metric | Home (`/index.html`) | Products (`/pages/products.html`) | Product-Detail (`/pages/product-detail.html`) |
|---|:---:|:---:|:---:|
| **Perf Score** | **59** | **59** | **60** |
| FCP | 7.1 s | 7.0 s | 6.2 s |
| LCP | 7.8 s | 7.6 s | 7.8 s |
| TBT | 0 ms | 0 ms | 90 ms |
| CLS | 0.044 | 0.033 | 0.000 |
| Speed Index | 7.1 s | 7.0 s | 6.2 s |
| TTI | 7.8 s | 7.6 s | 7.8 s |

> All three pages score in the **Poor** range. FCP and LCP are the dominant issues — both measuring 6–8 seconds on mobile. TBT is near-zero on home and products (good), 90 ms on product-detail (still acceptable). CLS is minimal.

---

## Per-Page Detail

### 1. Home (`/index.html`)

**Performance Score: 59**

| Core Web Vital | Value | Score |
|---|---|:---:|
| FCP | 7.1 s | 0.01 (Poor) |
| LCP | 7.8 s | 0.03 (Poor) |
| TBT | 0 ms | 1.00 (Good) |
| CLS | 0.044 | 0.99 (Good) |
| Speed Index | 7.1 s | 0.31 |
| TTI | 7.8 s | 0.44 |

**Render-blocking resources (total ~3,590 ms wasted):**

| Resource | Wasted (ms) | Transfer |
|---|---:|---:|
| `assets/style-9eIQg3bQ.css` | 2,251 ms | 63 KB |
| `fonts.googleapis.com` (Inter CSS) | 886 ms | 1.1 KB → triggers 2 woff2 fetches |
| `assets/vendor-swiper-CXe816k3.css` | 301 ms | 3.3 KB |
| `registerSW.js` | 151 ms | 0.4 KB |

**Key findings:**
- No `<link rel=preload as=image>` for any LCP candidate
- No `fetchpriority=high` on any above-fold image
- Google Fonts loaded as blocking `@import` inside the built CSS (`style-9eIQg3bQ.css` line 1) — no `preconnect`, no `font-display: swap` override
- Alpine.js chunk (`alpine-B7Fj0tID.js`, 726 KB / 201 KB gzip) is eagerly loaded with 159 KB unused
- Main thread work: 2,053 ms total (Other: 851 ms, Script Eval: 567 ms, Style+Layout: 439 ms)
- Forced reflow detected: `vendor-flowbite-CVgr6Ajb.js` and `alpine-B7Fj0tID.js`
- 3 long tasks recorded

**Top 3 opportunities/diagnostics:**
1. `render-blocking-insight` — Est. savings 1,650 ms (CSS + Google Fonts chain)
2. `unused-javascript` — Est. savings 159 KB (`alpine-B7Fj0tID.js` 79% unused)
3. `network-dependency-tree-insight` — CSS → Google Fonts CSS → 2× woff2 = 4-hop critical chain; longest chain 492 ms

---

### 2. Products (`/pages/products.html`)

**Performance Score: 59**

| Core Web Vital | Value | Score |
|---|---|:---:|
| FCP | 7.0 s | 0.01 (Poor) |
| LCP | 7.6 s | 0.03 (Poor) |
| TBT | 0 ms | 1.00 (Good) |
| CLS | 0.033 | 0.99 (Good) |
| Speed Index | 7.0 s | 0.33 |
| TTI | 7.6 s | 0.46 |

**Render-blocking resources (total ~3,264 ms wasted):**

| Resource | Wasted (ms) | Transfer |
|---|---:|---:|
| `assets/style-9eIQg3bQ.css` | 1,951 ms | 63 KB |
| `fonts.googleapis.com` (Inter CSS) | 861 ms | 1.1 KB |
| `assets/vendor-swiper-CXe816k3.css` | 301 ms | 3.3 KB |
| `registerSW.js` | 151 ms | 0.4 KB |

**Key findings:**
- Same render-blocking pattern as Home
- `vendor-swiper-DxJwgUZh.js` (89 KB) loaded but 26 KB unused — Swiper loaded even when no slider is visible above fold
- Main thread work: 1,772 ms (Other: 686 ms, Script Eval: 464 ms, Style+Layout: 415 ms)
- Forced reflow from `vendor-flowbite-CVgr6Ajb.js`
- 2 long tasks recorded

**Top 3 opportunities/diagnostics:**
1. `render-blocking-insight` — Est. savings 1,200 ms
2. `unused-javascript` — Est. savings 184 KB (Alpine 158 KB, Swiper 26 KB)
3. `network-dependency-tree-insight` — same 4-hop Google Fonts chain

---

### 3. Product-Detail (`/pages/product-detail.html`)

**Performance Score: 60**

| Core Web Vital | Value | Score |
|---|---|:---:|
| FCP | 6.2 s | 0.03 (Poor) |
| LCP | 7.8 s | 0.03 (Poor) |
| TBT | 90 ms | 0.99 (Good) |
| CLS | 0.000 | 1.00 (Good) |
| Speed Index | 6.2 s | 0.44 |
| TTI | 7.8 s | 0.44 |

**Render-blocking resources (total ~3,564 ms wasted):**

| Resource | Wasted (ms) | Transfer |
|---|---:|---:|
| `assets/style-9eIQg3bQ.css` | 2,251 ms | 63 KB |
| `fonts.googleapis.com` (Inter CSS) | 861 ms | 1.1 KB |
| `assets/vendor-swiper-CXe816k3.css` | 301 ms | 3.3 KB |
| `registerSW.js` | 151 ms | 0.4 KB |

**Key findings:**
- Same render-blocking pattern; CSS 2,251 ms is the worst on this page
- Unused CSS: `style-9eIQg3bQ.css` has 12 KB unused
- Unused JS: Alpine 160 KB, Swiper 26 KB
- No forced reflow on this page (score 1.00)
- TBT = 90 ms (only page with non-zero TBT — still within "Good" threshold of 200 ms)
- Main thread work: 1,020 ms — lightest of the three

**Top 3 opportunities/diagnostics:**
1. `render-blocking-insight` — Est. savings 600 ms
2. `unused-javascript` — Est. savings 186 KB
3. `unused-css-rules` — Est. savings 12 KB

---

## Root Cause Summary

### Critical path (applies to all 3 pages)

```
HTML parse
  └─ style-9eIQg3bQ.css  (63 KB, render-blocking, 2,251 ms)
       └─ @import fonts.googleapis.com  (blocks render, adds 886 ms + 2× woff2)
  └─ vendor-swiper-CXe816k3.css  (3.3 KB, render-blocking, 301 ms)
  └─ registerSW.js  (sync script, 151 ms)
```

The CSS `@import` for Google Fonts is the most damaging element: it is embedded in the built CSS file (not in `<head>`), making it impossible for the browser to preconnect or discover the font early. The full chain is: CSS download → Google Fonts CSS download → 2× woff2 download — 4 serial hops before text can paint.

### Alpine.js chunking

`alpine-B7Fj0tID.js` (726 KB raw / 201 KB gzip) is eagerly loaded with 79–80% of its code unused at load time. This is the largest single JS payload and the main contributor to main-thread script evaluation time (464–567 ms).

### Top assets by raw size

| Rank | File | Raw | Gzip |
|---|---|---:|---:|
| 1 | `locales-CXqOv5vX.js` | 1,345 KB | 387 KB |
| 2 | `alpine-B7Fj0tID.js` | 726 KB | 201 KB |
| 3 | `vendor-echarts-8hilh4eG.js` | 555 KB | 189 KB |
| 4 | `style-9eIQg3bQ.css` | 397 KB | 61 KB |
| 5 | `vendor-flowbite-CVgr6Ajb.js` | 127 KB | 30 KB |
| 6 | `vendor-swiper-DxJwgUZh.js` | 89 KB | 27 KB |
| 7 | `pages-product-detail-BJWlAgyu.js` | 87 KB | 22 KB |
| 8 | `index-CeD55ID1.js` | 80 KB | 21 KB |
| 9 | `TopBar-Brfnk5Hu.js` | 82 KB | 19 KB |
| 10 | `pages-seller-seller-storefront-D4yfC3Mt.js` | 96 KB | 19 KB |

---

## What T11 and T12 Should Target

### T11 (Render-blocking / LCP / Font) — highest impact

| Fix | Expected gain | How |
|---|---|---|
| Move Google Fonts `@import` out of CSS; add `<link rel=preconnect>` to `fonts.googleapis.com` + `fonts.gstatic.com` in `<head>` | ~880–900 ms LCP improvement | Remove `@import` from `src/style.css`; add preconnect `<link>` tags in source HTML |
| Add `&display=swap` (already in URL) + serve font via `<link rel=stylesheet>` with `media="print" onload` pattern or preload | Unblocks render | Replace `@import` in CSS with async font loading in HTML |
| Make `vendor-swiper-CXe816k3.css` non-blocking (`media="print" onload` or lazy load) | ~300 ms | Swiper CSS is not needed for above-fold content on home/products |
| Preload LCP image with `<link rel=preload as=image fetchpriority=high>` | Improves LCP by eliminating discovery delay | Identify LCP element per page (typically hero or first product image) |
| `registerSW.js` — defer or move after `</body>` | ~150 ms | SW registration does not need to be sync in `<head>` |

### T12 (TBT / Heavy init defer) — applies mainly to future regression prevention

| Fix | Current TBT | Expected |
|---|---|---|
| Defer Alpine.js init until after DOMContentLoaded or use `requestIdleCallback` | Home: 0 ms (no TBT baseline) | Maintain 0 ms |
| Product-detail: 90 ms TBT exists — likely from Swiper init or product data init | 90 ms | Target < 50 ms |
| Move forced-reflow code (Flowbite `line:24523` and Alpine) behind `requestIdleCallback` | Flowbite + Alpine forced-reflow on home/products | Eliminate reflows before FCP |
| `locales-CXqOv5vX.js` (1.3 MB / 387 KB gzip) is eagerly preloaded — delay until i18n needed | Reduces initial JS parse | Only load active locale chunk |

---

## Files Created

- `perf-reports/lighthouse-baseline.md` — this file
- `perf-reports/home.report.json` — 281 KB raw Lighthouse JSON (home)
- `perf-reports/home.report.html` — 393 KB Lighthouse HTML report (home)
- `perf-reports/products.report.json` — 274 KB raw Lighthouse JSON (products)
- `perf-reports/products.report.html` — 384 KB Lighthouse HTML report (products)
- `perf-reports/product-detail.report.json` — 242 KB raw Lighthouse JSON (product-detail)
- `perf-reports/product-detail.report.html` — 358 KB Lighthouse HTML report (product-detail)

All artifacts are under 1 MB; all committed.

---

## Concerns

1. **Scores measured on localhost** — real-world mobile scores (over 3G/4G) will be lower due to network latency for Google Fonts, API calls, and CDN assets. These scores are useful only for relative comparison (before vs. after T11/T12).
2. **`locales-CXqOv5vX.js` (1.3 MB)** — aggressively preloaded on every page. This likely contains all i18n locales bundled together. T14 (manualChunks) should split this into per-locale lazy chunks.
3. **`alpine-B7Fj0tID.js` (726 KB)** — this is the full Alpine including all Alpine.data() modules. 79% is unused on load. If Alpine modules are split by page, this would reduce significantly.
4. **`vendor-echarts-8hilh4eG.js` (555 KB)** — appears in the preload list but is only needed by dashboard pages. Should not be loaded on home/products/product-detail.
5. **TBT on product-detail** — 90 ms TBT at baseline means T12 must be careful not to regress this. It already has some synchronous init work.
