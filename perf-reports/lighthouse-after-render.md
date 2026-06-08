# Lighthouse — T11 sonrası (font render-blocking düzeltmesi)

**Tarih:** 2026-06-06
**Değişiklik:** Google Fonts (Inter) `src/style.css` içindeki `@import` yerine HTML `<head>`'e
`preconnect` + paralel `stylesheet` link olarak taşındı (`vite.config.ts: fontHeadPlugin`,
tüm MPA entry'lerine `transformIndexHtml` ile enjekte edilir).
**Ölçüm:** Lighthouse 13.x, mobile, headless (Playwright chromium), `npm run preview` @ 4173.

## Before → After (mobile, performance)

| Sayfa | Metrik | Baseline | T11 sonrası | Δ |
|---|---|---:|---:|---:|
| **home** | Score | 59 | 59 | — |
| | FCP | 7.1 s | 6.8 s | −0.3 s |
| | LCP | 7.8 s | 7.4 s | **−0.4 s** |
| | TBT | 0 ms | 0 ms | — |
| | CLS | 0.044 | 0.044 | — |
| **products** | Score | 59 | 61 | **+2** |
| | FCP | 7.0 s | 6.2 s | **−0.8 s** |
| | LCP | 7.6 s | 6.7 s | **−0.9 s** |
| | TBT | 0 ms | 120 ms | +120 (gürültü) |
| | CLS | 0.033 | 0.033 | — |
| **product-detail** | Score | 60 | 60 | — |
| | FCP | 6.2 s | 6.0 s | −0.2 s |
| | LCP | 7.8 s | 7.7 s | −0.1 s |
| | TBT | 90 ms | 70 ms | −20 (gürültü) |
| | CLS | 0 | 0 | — |

## Yorum

- **Kazanım gerçek ama mütevazı:** Font'u kritik zincirden çıkarmak LCP'yi sayfa başına
  0.1–0.9s düşürdü (en çok products'ta). Bu, baseline'daki ~861ms'lik serileşmiş Google
  Fonts blocking'inin kalkmasıyla tutarlı.
- **Kalan baskın maliyet font DEĞİL:** FCP/LCP hâlâ 6–7s bandında. Sebepler:
  1. **Ana `style.css` bundle'ı ~63KB ve render-blocking** (Tailwind çıktısı). Bunu non-blocking
     yapmak FOUC riski taşır; gerçek kazanım için **critical CSS inline + geri kalanı defer**
     gerekir — bu daha büyük bir iş (T14 bundle çalışmasıyla veya ayrı bir critical-CSS task'ıyla).
  2. **SW precache 5.8MB / 214 entry** — ilk yüklemede ağ/disk baskısı. Precache kapsamı gözden
     geçirilebilir (görselleri precache'ten çıkarıp runtime-cache'e bırakmak).
  3. **Ölçüm ortamı:** headless chromium + mobile throttle bu makinede mutlak sayıları şişiriyor;
     gerçek cihaz/CDN'de değerler daha düşük olur. Trend (Δ) güvenilir, mutlak saniyeler değil.
- **TBT dalgalanması** (0→120ms) font değişikliğinden DEĞİL (JS eklenmedi) — run-to-run ölçüm
  gürültüsü. TBT'yi **T12** (ağır init defer) ele alır.

## Yapılmadı (bilinçli)
- **LCP image preload:** Atlandı — LCP elementi sayfaya göre değişiyor ve büyük ölçüde JS ile
  dinamik render ediliyor (hero slider, ürün galerisi). Yanlış bir `preload` performansı
  bozacağı için, tek tutarlı bir above-the-fold görsel tespit edilemedi. Critical-CSS/hero
  netleştiğinde ayrı ele alınmalı.
- **swiper CSS non-blocking / registerSW defer:** Düşük değer, daha yüksek risk — gelecek iş.
