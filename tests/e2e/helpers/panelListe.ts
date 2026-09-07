/**
 * Kuyruk kaydının GÖRÜNÜMDEN BAĞIMSIZ seçicisi.
 *
 * NEDEN VAR: lojistik kuyrukları dört görünüm sunuyor (tablo · ızgara ·
 * kanban · kompakt liste) ve `useResponsiveViewMode` dar ekranda başlangıç
 * modunu `list` yapıyor — bilinçli bir ürün kararı, telefonda geniş tablo
 * okunmuyor. Sonuç: `table tbody tr` ile kurulan iddialar `chromium-mobile`
 * projesinde ürün doğru çalışırken düşüyordu.
 *
 * Çözüm testi kısıtlamak değil, ürüne tek bir kanca koymak oldu: dört
 * görünümün de satır kökü `data-testid="kuyruk-satiri"` taşıyor
 * (`PackingQueueView.vue`, `PodQueueView.vue`, `LabelPrintView.vue`,
 * `DeliveryFlowScreen.vue`). Böylece aynı test masaüstünde tabloyu, mobilde
 * listeyi ölçüyor — ikisi de gerçek kullanıcı görünümü.
 *
 * NOT: bir dönem burada `kuyrukMobilModaZorlaniyor()` adlı bir kapı vardı;
 * M1/M2/M3 ürün kararları verilip düzeltilince (8 Eyl 2026) hiçbir testte
 * kullanılmaz oldu ve silindi — ölü kod bırakmamak için.
 */
export const KUYRUK_SATIRI = '[data-testid="kuyruk-satiri"]';
