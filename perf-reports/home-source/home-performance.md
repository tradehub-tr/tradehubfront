# Ana Sayfa Performans Ölçümü

- Hedef: http://localhost:5173
- Rota DOM: 321
- Gizli DOM: 126
- Görsel byte: 53.870
- API payload byte: 6.000
- Tekrarlı API endpoint: 6
- Tekrarlı DOM ID: 0
- JS/CSS byte: 5.114.064 / 703.075
- Koşu: 3
- Oluşturulma: 2026-07-25T07:38:07.401Z
- Not: LCP, CLS ve long task değerleri laboratuvar trendidir; E2E geçme/kalma kuralı değildir.

## Koşular

| Koşu | DOM | SVG | Görsel | API | JS | CLS | LCP (ms) | Long task | Transfer (B) | Konsol hatası |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 822 | 54 | 2 | 20 | 115 | 0,03 | 1.488 | 1 | 5.342.861 | 1 |
| 2 | 822 | 54 | 2 | 20 | 115 | 0,03 | 276 | 1 | 5.342.861 | 1 |
| 3 | 822 | 54 | 2 | 20 | 115 | 0,03 | 340 | 1 | 5.342.861 | 1 |

## Ortanca değerler

| DOM | SVG | Görsel | API | JS | Kapalı overlay DOM | CLS | LCP (ms) | Long task süresi (ms) | Transfer (B) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 822 | 54 | 2 | 20 | 115 | 54 | 0,03 | 340 | 87 | 5.342.861 |

## Başlangıç bütçesi

| Ölçüt | Ölçülen ortanca | Limit | Durum |
| --- | ---: | ---: | --- |
| nodes | 822 | 5250 | geçti |
| svg | 54 | 680 | geçti |
| api | 20 | 22 | geçti |
| js | 115 | 35 | aştı |
| cls | 0.025477706909179686 | 0.1 | geçti |

## Baseline regresyonu

- Baseline: henüz yok
- Kabul edilmiş ölçüm: 0
- Olgunluk eşiği: 2
- Uygulama modu: warn

| Ölçüt | Baseline | Güncel | Regresyon | Limit | Durum |
| --- | ---: | ---: | ---: | ---: | --- |
| Karşılaştırılabilir ölçüt yok | — | — | — | — | — |
