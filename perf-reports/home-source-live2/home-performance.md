# Ana Sayfa Performans Ölçümü

- Hedef: http://localhost:5173
- Rota DOM: 843
- Gizli DOM: 177
- Görsel byte: 1.995.120
- API payload byte: 21.750
- Tekrarlı API endpoint: 0
- Tekrarlı DOM ID: 0
- JS/CSS byte: 5.114.596 / 703.075
- Koşu: 3
- Oluşturulma: 2026-07-25T07:39:34.413Z
- Not: LCP, CLS ve long task değerleri laboratuvar trendidir; E2E geçme/kalma kuralı değildir.

## Koşular

| Koşu | DOM | SVG | Görsel | API | JS | CLS | LCP (ms) | Long task | Transfer (B) | Konsol hatası |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1445 | 149 | 21 | 12 | 115 | 0 | 1.992 | 1 | 7.307.293 | 0 |
| 2 | 1445 | 149 | 21 | 12 | 115 | 0 | 776 | 1 | 7.307.293 | 0 |
| 3 | 1445 | 149 | 21 | 12 | 115 | 0 | 764 | 1 | 7.307.293 | 0 |

## Ortanca değerler

| DOM | SVG | Görsel | API | JS | Kapalı overlay DOM | CLS | LCP (ms) | Long task süresi (ms) | Transfer (B) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1.445 | 149 | 21 | 12 | 115 | 255 | 0 | 776 | 104 | 7.307.293 |

## Başlangıç bütçesi

| Ölçüt | Ölçülen ortanca | Limit | Durum |
| --- | ---: | ---: | --- |
| nodes | 1445 | 5250 | geçti |
| svg | 149 | 680 | geçti |
| api | 12 | 22 | geçti |
| js | 115 | 35 | aştı |
| cls | 0 | 0.1 | geçti |

## Baseline regresyonu

- Baseline: henüz yok
- Kabul edilmiş ölçüm: 0
- Olgunluk eşiği: 2
- Uygulama modu: warn

| Ölçüt | Baseline | Güncel | Regresyon | Limit | Durum |
| --- | ---: | ---: | ---: | ---: | --- |
| Karşılaştırılabilir ölçüt yok | — | — | — | — | — |
