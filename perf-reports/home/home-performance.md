# Ana Sayfa Performans Ölçümü

- Hedef: http://traderup.localhost
- Rota DOM: 843
- Gizli DOM: 176
- Görsel byte: 1.962.542
- API payload byte: 21.750
- Tekrarlı API endpoint: 0
- Tekrarlı DOM ID: 0
- JS/CSS byte: 346.433 / 68.074
- Koşu: 3
- Oluşturulma: 2026-07-25T07:36:45.690Z
- Not: LCP, CLS ve long task değerleri laboratuvar trendidir; E2E geçme/kalma kuralı değildir.

## Koşular

| Koşu | DOM | SVG | Görsel | API | JS | CLS | LCP (ms) | Long task | Transfer (B) | Konsol hatası |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1477 | 149 | 21 | 12 | 32 | 0,18 | 1.472 | 1 | 2.548.256 | 0 |
| 2 | 1477 | 149 | 21 | 12 | 32 | 0,18 | 608 | 1 | 2.540.710 | 0 |
| 3 | 1477 | 149 | 21 | 12 | 32 | 0,18 | 960 | 2 | 2.548.256 | 0 |

## Ortanca değerler

| DOM | SVG | Görsel | API | JS | Kapalı overlay DOM | CLS | LCP (ms) | Long task süresi (ms) | Transfer (B) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1.477 | 149 | 21 | 12 | 32 | 255 | 0,18 | 960 | 196 | 2.548.256 |

## Başlangıç bütçesi

| Ölçüt | Ölçülen ortanca | Limit | Durum |
| --- | ---: | ---: | --- |
| nodes | 1477 | 5250 | geçti |
| svg | 149 | 680 | geçti |
| api | 12 | 22 | geçti |
| js | 32 | 35 | geçti |
| cls | 0.17581054687499997 | 0.1 | aştı |

## Baseline regresyonu

- Baseline: henüz yok
- Kabul edilmiş ölçüm: 0
- Olgunluk eşiği: 2
- Uygulama modu: warn

| Ölçüt | Baseline | Güncel | Regresyon | Limit | Durum |
| --- | ---: | ---: | ---: | ---: | --- |
| Karşılaştırılabilir ölçüt yok | — | — | — | — | — |
