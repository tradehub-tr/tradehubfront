## [v2.2.3] - 2026-07-23 PROD

Bu surum istoc.com'da yayindadir.

### Duzeltildi
- fix(security): update Content-Security-Policy to include GTM/GA4 domains (@TurksabYonetim)

---
## [v2.2.2-rc.1] - 2026-07-23 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Duzeltildi
- fix(security): update Content-Security-Policy to include GTM/GA4 domains (@TurksabYonetim)

---
## [v2.2.2-alpha.1] - 2026-07-23 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(security): update Content-Security-Policy to include GTM/GA4 domains (@TurksabYonetim)

---
## [v2.2.2] - 2026-07-23 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(mobile): Capacitor kamera, push notification ve deep link desteği (@boraydeger32)
  - @capacitor/camera ve @capacitor/push-notifications eklendi
  - Deep link modülü i18n/index.ts üzerinden import edildi

### Duzeltildi
- fix(seller-shop): dükkan sayfasında tüm ürünleri getir + pagination ekle (@boraydeger32)

---
## [v2.2.1-rc.1] - 2026-07-23 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(mobile): Capacitor kamera, push notification ve deep link desteği (@boraydeger32)
  - @capacitor/camera ve @capacitor/push-notifications eklendi
  - Deep link modülü i18n/index.ts üzerinden import edildi

### Duzeltildi
- fix(seller-shop): dükkan sayfasında tüm ürünleri getir + pagination ekle (@boraydeger32)

---
## [v2.2.1-alpha.3] - 2026-07-23 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(mobile): Capacitor kamera, push notification ve deep link desteği (@boraydeger32)
  - @capacitor/camera ve @capacitor/push-notifications eklendi
  - Deep link modülü i18n/index.ts üzerinden import edildi

---
## [v2.2.1-alpha.1] - 2026-07-22 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(seller-shop): dükkan sayfasında tüm ürünleri getir + pagination ekle (@boraydeger32)

---
## [v2.2.0] - 2026-07-22 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(footer): SEO bölgesi + genişletilmiş footer içeriği; ürün kartı hover cilası (@TurksabYonetim)
  - FooterSeo.ts eklendi: Trendyol tarzı "Popüler Üreticiler ve Mağazalar" + "Popüler Sayfalar" bölgesi (beyaz zemin, sarı üst çizgi). Marka/arama linkleri SEO hedefli sabit içerik; yalnızca bölüm başlıkları i18n'e çevrilir.
  - FooterLinks/FooterGroup/FooterPolicy yeniden düzenlendi; mobilde accordion yok, tüm linkler görünür. 4 dilde yeni footer i18n anahtarları (tr/en/ar/ru).
  - ListingCard: hover'da yumuşak gölge + ring geçişi.
  - products sayfası arka planı beyaza çekildi; product.ts'ten kullanılmayan escapeHtml import'u kaldırıldı.
- feat(product-detail): ürün sekmeleri anchor/scroll davranışına geçirildi (@aliiball)
  - Sekme-değiştirme (içerik gizle/göster) kaldırıldı; tüm bölümler alt alta hep görünür
  - Sekmeye tıklayınca ilgili bölüme yumuşak scroll (sticky header ofsetli)
  - Scroll-spy ile görünen bölümün sekmesi otomatik vurgulanıyor
  - Her bölüme başlık + üst ayraç eklendi (Açıklama/Özellikler/Yorumlar/Tedarikçi)
  - Açıklama ilk sıraya alındı, tüm içerik DOM'da kalınca Ctrl+F ve SEO iyileşti
  - Yalnız masaüstü; MobileLayout değişmedi
- feat(products): onaylanmış satıcı facet sayacı + fiyat histogram/slider eklendi (@aliiball)
- feat(nav): mobilde para birimi seçici eklendi (@aliiball)
- feat(ui): "Yeni ürün" rozeti ve dil/para seçicili footer eklendi (@ahmeetseker)
  - Sinyali olmayan ürünlerde "Yeni ürün" fallback rozeti eklendi (new sinyal tipi, sparkles ikonu, 4 dilde metin)
  - Footer'da statik "Ülke Değiştir" kolonu yerine işlevsel dil + para birimi seçici popover eklendi
  - Footer SEO linkleri (marka/mağaza/kategori) backend get_footer_seo_links endpoint'inden hydrate ediliyor (30 dk sessionStorage cache, gerçek pretty URL'ler)
  - Ürün galerisinde 4'ten fazla görselde "+N" karosu eklendi; lightbox tek kolonlu buzlu-cam thumbnail şeridine geçti; oklar ve favori butonu 44px WCAG hedefine büyütüldü
  - ProductGrid'deki kart kopyası silinip ortak ListingCard'a bağlandı; statik selling point/tedarikçi bloğu kaldırıldı, alan tamamen sosyal kanıta bırakıldı
  - Ürün görselleri beyaz zemin + object-contain standardına geçti; grid gap 16px, listeleme 5 kolon, ProductGrid 2xl'de 7 kolon
  - TopBar giriş butonu ikon + tooltip'e dönüştü; auth dropdown "Tekrar hoş geldiniz" düzeni ve kayıt CTA'sı eklendi
  - İçerik metinleri globalleştirildi ("Avrupa pazarı" → "Global pazar"); Help Center alt politika şeridi kaldırıldı
- feat(anasayfa): doğrulanmamış satıcı ürünleri anasayfadan gizlendi (@ahmeetseker)
  - Ürün vitrini, öneri slider'ı, fırsat gridi ve hero fırsat paneli searchListings çağrılarına verified_supplier filtresi eklendi
  - Eleme sunucu tarafında yapılıyor; grid yalnızca KYB doğrulanmış satıcı ürünleriyle tam sayıda doluyor
- feat(pdp): galeri video otomatik oynatma ve thumbnail taşması düzeltildi (@ahmeetseker)
  - Ana galeride video karesi seçilince video otomatik başlıyor: toVideoEmbedHtml artık autoplay parametresi alıyor, YouTube'a autoplay=1&mute=1, Vimeo'ya autoplay=1&muted=1 query'si ekleniyor, direkt mp4/webm dosyalarına autoplay muted attribute'u veriliyor
  - Autoplay'de muted zorunlu tutuldu — tarayıcılar sesli otomatik oynatmayı engelliyor; kullanıcı controls üzerinden sesi açabiliyor
  - withAutoplayParams helper'ı mevcut query string'i koruyarak parametre ekliyor, ürün detayı dışındaki çağrılar (autoplay varsayılan false) etkilenmiyor
  - "+N" taşma karosu deklaratif x-show yerine applyThumbOverflow ile JS'ten üretiliyor; ilk render $nextTick ile, varyant değişimi swapGalleryImages sonunda aynı fonksiyondan geçiyor
  - Varyant değiştiğinde eski görsel sayısına göre kalan stale "+N" değeri ve yanlış gizlenen thumbnail'lar düzeldi; koleps her yeni görsel setinde sıfırlanıyor
  - Özellikler thumbnail'ı sabit images.length yerine reaktif attrsIndex'e bağlandı, görsel sayısı değişince index kayması ortadan kalktı
  - Galeri ana görsel alanı 540px'ten 560px'e, 2xl kırılımında 680px'e genişletildi
  - Favorilerde tedarikçi sekmesi artık ürün metnini değil kendi boş durumunu gösteriyor: renderEmptyState kind parametresi (products/suppliers) alıyor
  - noFavoriteSuppliers ve noFavoriteSuppliersDesc anahtarları tr/en/ru/ar locale'lerine eklendi

### Duzeltildi
- fix: XSS koruması, güvenlik headerları ve open redirect düzeltmesi (@boraydeger32)
  - Cart innerHTML XSS — escapeHtml ile korundu (cart.ts)
  - Product gallery innerHTML XSS — escapeHtml eklendi (product.ts)
  - Open redirect — login catch bloğu güvenli fallback (LoginPage.ts)
  - Nginx güvenlik headerları: CSP, HSTS, X-Frame-Options, Referrer-Policy
  - CSP'ye Google Fonts izni eklendi (fonts.googleapis.com, fonts.gstatic.com)
  - CI/CD npm audit adımı eklendi (lint.yml)
  - Node 20 → 22 Dockerfile ile uyum (lint.yml)
- fix(security): Faz 1-4 frontend güvenlik düzeltmeleri (@boraydeger32)
  - Mock modları production'da devre dışı (DEV guard) (F-033) addresses.ts, orders.ts, socialProofService.ts, categoryShowcaseService.ts
  - 2FA login hatası anlaşılır mesaj ile bildiriliyor (F-014)
  - Stub chat fonksiyonları sessiz geçmek yerine hata fırlatıyor (F-058)
- fix(top-ranking): kategori dropdown'ı sıralama çubuğunun altında kalıyordu (@TurksabYonetim)
- fix(cart): sepet kargo/indirim yanlış USD çevrimi kaldırıldı (@aliiball)
- fix(seller): mağaza sayfasında 80 ürün sınırını kaldır (@boraydeger32)
- fix(manufacturers): x-data içindeki TS type annotation kaldırıldı (seller listesi Alpine init çöküyordu) (@aliiball)
- fix(i18n): x-data'ya gömülü çeviri metnindeki apostrof kaçışı (escapeJsString) (@aliiball)
- fix(orders): writeReviewModal kaydı eklendi (B-2 product split regresyonu) (@aliiball)
- fix(manufacturers): kategori başlığı backend'den çözülen ada güncelleniyor (client findCategoryBySlug hash'li slug'ları (@aliiball)

### Degistirildi
- refactor(products): ölü mock kaldırıldı, eskimiş facet yorumları güncellendi (@aliiball)
- refactor(build): bundle-stats.html prod dist'ten çıkarıldı, ANALYZE'a bağlandı (@aliiball)
- refactor(assets): kullanılmayan 13 görsel kaldırıldı (~1.6 MB) (@aliiball)
- refactor(currency): utils formatPrice → localizePriceString (isim çakışması giderildi) (@aliiball)
- refactor(categories): ölü getCategorySections kaldırıldı + hata metinleri i18n'e alındı (@aliiball)
  - data/categories.ts: getCategorySections + kullanılmayan t import silindi (tipler korundu)
  - categories.ts: 3 hardcoded string → t() (hardcoded Türkçe i18n bug'ı düzeldi)
  - test: hata UI testi i18n-uyumlu (dil TR sabit)
- refactor(i18n): sadece aktif dil lazy-load edildi (1.68 MB → ~0.4 MB parse/sayfa) (@aliiball)
- refactor(alpine): checkout modülü page-specific yapıldı (core chunk'tan çıkarıldı) (@aliiball)
- refactor(alpine): 11 modül page-specific yapıldı (core chunk 687→556 kB) (@aliiball)
- refactor(alpine): auth modülü page-specific yapıldı (core chunk 556→410 kB) (@aliiball)
- refactor(alpine): products-filter modülü page-specific yapıldı (products + manufacturers) (@aliiball)
- refactor(alpine): cart/help/product page-specific yapıldı (core chunk 407→124 kB) (@aliiball)
- refactor(alpine): sidebar modülü page-specific yapıldı (12 dashboard sayfası) (@aliiball)
- refactor(perf): sticky sidebar scroll handler rAF ile throttle edildi (@aliiball)
- refactor(perf): api/callMethod fetch'lerine 30s timeout + AbortController eklendi (@aliiball)
- refactor(legal-footer): yasal metinler sadeleştirildi, footer linkleri düzenlendi (@ahmeetseker)
  - Kullanım Koşulları: KDV cümlesi, kargo sorumluluğu paragrafı, Fikri Mülkiyet ve Uygulanacak Hukuk bölümleri kaldırıldı (4 dil)
  - Gizlilik: United Kingdom ibaresi, e-posta satırı, Uluslararası Veri Transferi ve İletişim bölümleri kaldırıldı (4 dil)
  - Footer: Hakkımızda, Kariyer, İletişim, Satıcı Akademisi ve Doğrulanmış Tedarikçi Olun linkleri kaldırıldı; Komisyon ve Ücretler "Fiyat Tablosu" olarak değiştirildi
  - seller/verification.html sayfası ve yönlendirmesi silindi
- refactor(test): smoke unscoped Alpine hata kontrolü + cart seed + ek sayfalar (@aliiball)
- refactor(build): cross-file duplicate export bekçisi + CI zorlaması eklendi (@aliiball)
- refactor(rules): isim benzersizliği adlandırma rehberi eklendi (@aliiball)
- refactor(categories): CategoryFilterSidebar → CategoryQuickNav, ölü filter dalı temizlendi (@aliiball)
- refactor(naming): farklı-kavram tipler yeniden adlandırıldı (birleştirme YOK) (@aliiball)

---
## [v2.1.0-rc.1] - 2026-07-22 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(footer): SEO bölgesi + genişletilmiş footer içeriği; ürün kartı hover cilası (@TurksabYonetim)
  - FooterSeo.ts eklendi: Trendyol tarzı "Popüler Üreticiler ve Mağazalar" + "Popüler Sayfalar" bölgesi (beyaz zemin, sarı üst çizgi). Marka/arama linkleri SEO hedefli sabit içerik; yalnızca bölüm başlıkları i18n'e çevrilir.
  - FooterLinks/FooterGroup/FooterPolicy yeniden düzenlendi; mobilde accordion yok, tüm linkler görünür. 4 dilde yeni footer i18n anahtarları (tr/en/ar/ru).
  - ListingCard: hover'da yumuşak gölge + ring geçişi.
  - products sayfası arka planı beyaza çekildi; product.ts'ten kullanılmayan escapeHtml import'u kaldırıldı.
- feat(product-detail): ürün sekmeleri anchor/scroll davranışına geçirildi (@aliiball)
  - Sekme-değiştirme (içerik gizle/göster) kaldırıldı; tüm bölümler alt alta hep görünür
  - Sekmeye tıklayınca ilgili bölüme yumuşak scroll (sticky header ofsetli)
  - Scroll-spy ile görünen bölümün sekmesi otomatik vurgulanıyor
  - Her bölüme başlık + üst ayraç eklendi (Açıklama/Özellikler/Yorumlar/Tedarikçi)
  - Açıklama ilk sıraya alındı, tüm içerik DOM'da kalınca Ctrl+F ve SEO iyileşti
  - Yalnız masaüstü; MobileLayout değişmedi
- feat(products): onaylanmış satıcı facet sayacı + fiyat histogram/slider eklendi (@aliiball)
- feat(nav): mobilde para birimi seçici eklendi (@aliiball)
- feat(ui): "Yeni ürün" rozeti ve dil/para seçicili footer eklendi (@ahmeetseker)
  - Sinyali olmayan ürünlerde "Yeni ürün" fallback rozeti eklendi (new sinyal tipi, sparkles ikonu, 4 dilde metin)
  - Footer'da statik "Ülke Değiştir" kolonu yerine işlevsel dil + para birimi seçici popover eklendi
  - Footer SEO linkleri (marka/mağaza/kategori) backend get_footer_seo_links endpoint'inden hydrate ediliyor (30 dk sessionStorage cache, gerçek pretty URL'ler)
  - Ürün galerisinde 4'ten fazla görselde "+N" karosu eklendi; lightbox tek kolonlu buzlu-cam thumbnail şeridine geçti; oklar ve favori butonu 44px WCAG hedefine büyütüldü
  - ProductGrid'deki kart kopyası silinip ortak ListingCard'a bağlandı; statik selling point/tedarikçi bloğu kaldırıldı, alan tamamen sosyal kanıta bırakıldı
  - Ürün görselleri beyaz zemin + object-contain standardına geçti; grid gap 16px, listeleme 5 kolon, ProductGrid 2xl'de 7 kolon
  - TopBar giriş butonu ikon + tooltip'e dönüştü; auth dropdown "Tekrar hoş geldiniz" düzeni ve kayıt CTA'sı eklendi
  - İçerik metinleri globalleştirildi ("Avrupa pazarı" → "Global pazar"); Help Center alt politika şeridi kaldırıldı
- feat(anasayfa): doğrulanmamış satıcı ürünleri anasayfadan gizlendi (@ahmeetseker)
  - Ürün vitrini, öneri slider'ı, fırsat gridi ve hero fırsat paneli searchListings çağrılarına verified_supplier filtresi eklendi
  - Eleme sunucu tarafında yapılıyor; grid yalnızca KYB doğrulanmış satıcı ürünleriyle tam sayıda doluyor
- feat(pdp): galeri video otomatik oynatma ve thumbnail taşması düzeltildi (@ahmeetseker)
  - Ana galeride video karesi seçilince video otomatik başlıyor: toVideoEmbedHtml artık autoplay parametresi alıyor, YouTube'a autoplay=1&mute=1, Vimeo'ya autoplay=1&muted=1 query'si ekleniyor, direkt mp4/webm dosyalarına autoplay muted attribute'u veriliyor
  - Autoplay'de muted zorunlu tutuldu — tarayıcılar sesli otomatik oynatmayı engelliyor; kullanıcı controls üzerinden sesi açabiliyor
  - withAutoplayParams helper'ı mevcut query string'i koruyarak parametre ekliyor, ürün detayı dışındaki çağrılar (autoplay varsayılan false) etkilenmiyor
  - "+N" taşma karosu deklaratif x-show yerine applyThumbOverflow ile JS'ten üretiliyor; ilk render $nextTick ile, varyant değişimi swapGalleryImages sonunda aynı fonksiyondan geçiyor
  - Varyant değiştiğinde eski görsel sayısına göre kalan stale "+N" değeri ve yanlış gizlenen thumbnail'lar düzeldi; koleps her yeni görsel setinde sıfırlanıyor
  - Özellikler thumbnail'ı sabit images.length yerine reaktif attrsIndex'e bağlandı, görsel sayısı değişince index kayması ortadan kalktı
  - Galeri ana görsel alanı 540px'ten 560px'e, 2xl kırılımında 680px'e genişletildi
  - Favorilerde tedarikçi sekmesi artık ürün metnini değil kendi boş durumunu gösteriyor: renderEmptyState kind parametresi (products/suppliers) alıyor
  - noFavoriteSuppliers ve noFavoriteSuppliersDesc anahtarları tr/en/ru/ar locale'lerine eklendi

### Duzeltildi
- fix: XSS koruması, güvenlik headerları ve open redirect düzeltmesi (@boraydeger32)
  - Cart innerHTML XSS — escapeHtml ile korundu (cart.ts)
  - Product gallery innerHTML XSS — escapeHtml eklendi (product.ts)
  - Open redirect — login catch bloğu güvenli fallback (LoginPage.ts)
  - Nginx güvenlik headerları: CSP, HSTS, X-Frame-Options, Referrer-Policy
  - CSP'ye Google Fonts izni eklendi (fonts.googleapis.com, fonts.gstatic.com)
  - CI/CD npm audit adımı eklendi (lint.yml)
  - Node 20 → 22 Dockerfile ile uyum (lint.yml)
- fix(security): Faz 1-4 frontend güvenlik düzeltmeleri (@boraydeger32)
  - Mock modları production'da devre dışı (DEV guard) (F-033) addresses.ts, orders.ts, socialProofService.ts, categoryShowcaseService.ts
  - 2FA login hatası anlaşılır mesaj ile bildiriliyor (F-014)
  - Stub chat fonksiyonları sessiz geçmek yerine hata fırlatıyor (F-058)
- fix(top-ranking): kategori dropdown'ı sıralama çubuğunun altında kalıyordu (@TurksabYonetim)
- fix(cart): sepet kargo/indirim yanlış USD çevrimi kaldırıldı (@aliiball)
- fix(seller): mağaza sayfasında 80 ürün sınırını kaldır (@boraydeger32)
- fix(manufacturers): x-data içindeki TS type annotation kaldırıldı (seller listesi Alpine init çöküyordu) (@aliiball)
- fix(i18n): x-data'ya gömülü çeviri metnindeki apostrof kaçışı (escapeJsString) (@aliiball)
- fix(orders): writeReviewModal kaydı eklendi (B-2 product split regresyonu) (@aliiball)
- fix(manufacturers): kategori başlığı backend'den çözülen ada güncelleniyor (client findCategoryBySlug hash'li slug'ları (@aliiball)

### Degistirildi
- refactor(products): ölü mock kaldırıldı, eskimiş facet yorumları güncellendi (@aliiball)
- refactor(build): bundle-stats.html prod dist'ten çıkarıldı, ANALYZE'a bağlandı (@aliiball)
- refactor(assets): kullanılmayan 13 görsel kaldırıldı (~1.6 MB) (@aliiball)
- refactor(currency): utils formatPrice → localizePriceString (isim çakışması giderildi) (@aliiball)
- refactor(categories): ölü getCategorySections kaldırıldı + hata metinleri i18n'e alındı (@aliiball)
  - data/categories.ts: getCategorySections + kullanılmayan t import silindi (tipler korundu)
  - categories.ts: 3 hardcoded string → t() (hardcoded Türkçe i18n bug'ı düzeldi)
  - test: hata UI testi i18n-uyumlu (dil TR sabit)
- refactor(i18n): sadece aktif dil lazy-load edildi (1.68 MB → ~0.4 MB parse/sayfa) (@aliiball)
- refactor(alpine): checkout modülü page-specific yapıldı (core chunk'tan çıkarıldı) (@aliiball)
- refactor(alpine): 11 modül page-specific yapıldı (core chunk 687→556 kB) (@aliiball)
- refactor(alpine): auth modülü page-specific yapıldı (core chunk 556→410 kB) (@aliiball)
- refactor(alpine): products-filter modülü page-specific yapıldı (products + manufacturers) (@aliiball)
- refactor(alpine): cart/help/product page-specific yapıldı (core chunk 407→124 kB) (@aliiball)
- refactor(alpine): sidebar modülü page-specific yapıldı (12 dashboard sayfası) (@aliiball)
- refactor(perf): sticky sidebar scroll handler rAF ile throttle edildi (@aliiball)
- refactor(perf): api/callMethod fetch'lerine 30s timeout + AbortController eklendi (@aliiball)
- refactor(legal-footer): yasal metinler sadeleştirildi, footer linkleri düzenlendi (@ahmeetseker)
  - Kullanım Koşulları: KDV cümlesi, kargo sorumluluğu paragrafı, Fikri Mülkiyet ve Uygulanacak Hukuk bölümleri kaldırıldı (4 dil)
  - Gizlilik: United Kingdom ibaresi, e-posta satırı, Uluslararası Veri Transferi ve İletişim bölümleri kaldırıldı (4 dil)
  - Footer: Hakkımızda, Kariyer, İletişim, Satıcı Akademisi ve Doğrulanmış Tedarikçi Olun linkleri kaldırıldı; Komisyon ve Ücretler "Fiyat Tablosu" olarak değiştirildi
  - seller/verification.html sayfası ve yönlendirmesi silindi
- refactor(test): smoke unscoped Alpine hata kontrolü + cart seed + ek sayfalar (@aliiball)
- refactor(build): cross-file duplicate export bekçisi + CI zorlaması eklendi (@aliiball)
- refactor(rules): isim benzersizliği adlandırma rehberi eklendi (@aliiball)
- refactor(categories): CategoryFilterSidebar → CategoryQuickNav, ölü filter dalı temizlendi (@aliiball)
- refactor(naming): farklı-kavram tipler yeniden adlandırıldı (birleştirme YOK) (@aliiball)

---
## [v2.1.0-alpha.13] - 2026-07-22 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(pdp): galeri video otomatik oynatma ve thumbnail taşması düzeltildi (@ahmeetseker)
  - Ana galeride video karesi seçilince video otomatik başlıyor: toVideoEmbedHtml artık autoplay parametresi alıyor, YouTube'a autoplay=1&mute=1, Vimeo'ya autoplay=1&muted=1 query'si ekleniyor, direkt mp4/webm dosyalarına autoplay muted attribute'u veriliyor
  - Autoplay'de muted zorunlu tutuldu — tarayıcılar sesli otomatik oynatmayı engelliyor; kullanıcı controls üzerinden sesi açabiliyor
  - withAutoplayParams helper'ı mevcut query string'i koruyarak parametre ekliyor, ürün detayı dışındaki çağrılar (autoplay varsayılan false) etkilenmiyor
  - "+N" taşma karosu deklaratif x-show yerine applyThumbOverflow ile JS'ten üretiliyor; ilk render $nextTick ile, varyant değişimi swapGalleryImages sonunda aynı fonksiyondan geçiyor
  - Varyant değiştiğinde eski görsel sayısına göre kalan stale "+N" değeri ve yanlış gizlenen thumbnail'lar düzeldi; koleps her yeni görsel setinde sıfırlanıyor
  - Özellikler thumbnail'ı sabit images.length yerine reaktif attrsIndex'e bağlandı, görsel sayısı değişince index kayması ortadan kalktı
  - Galeri ana görsel alanı 540px'ten 560px'e, 2xl kırılımında 680px'e genişletildi
  - Favorilerde tedarikçi sekmesi artık ürün metnini değil kendi boş durumunu gösteriyor: renderEmptyState kind parametresi (products/suppliers) alıyor
  - noFavoriteSuppliers ve noFavoriteSuppliersDesc anahtarları tr/en/ru/ar locale'lerine eklendi

---
## [v2.1.0-alpha.12] - 2026-07-21 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(i18n): x-data'ya gömülü çeviri metnindeki apostrof kaçışı (escapeJsString) (@aliiball)
- fix(orders): writeReviewModal kaydı eklendi (B-2 product split regresyonu) (@aliiball)
- fix(manufacturers): kategori başlığı backend'den çözülen ada güncelleniyor (client findCategoryBySlug hash'li slug'ları (@aliiball)

### Degistirildi
- refactor(test): smoke unscoped Alpine hata kontrolü + cart seed + ek sayfalar (@aliiball)
- refactor(build): cross-file duplicate export bekçisi + CI zorlaması eklendi (@aliiball)
- refactor(rules): isim benzersizliği adlandırma rehberi eklendi (@aliiball)
- refactor(categories): CategoryFilterSidebar → CategoryQuickNav, ölü filter dalı temizlendi (@aliiball)
- refactor(naming): farklı-kavram tipler yeniden adlandırıldı (birleştirme YOK) (@aliiball)

---
## [v2.1.0-alpha.11] - 2026-07-21 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(anasayfa): doğrulanmamış satıcı ürünleri anasayfadan gizlendi (@ahmeetseker)
  - Ürün vitrini, öneri slider'ı, fırsat gridi ve hero fırsat paneli searchListings çağrılarına verified_supplier filtresi eklendi
  - Eleme sunucu tarafında yapılıyor; grid yalnızca KYB doğrulanmış satıcı ürünleriyle tam sayıda doluyor

### Degistirildi
- refactor(legal-footer): yasal metinler sadeleştirildi, footer linkleri düzenlendi (@ahmeetseker)
  - Kullanım Koşulları: KDV cümlesi, kargo sorumluluğu paragrafı, Fikri Mülkiyet ve Uygulanacak Hukuk bölümleri kaldırıldı (4 dil)
  - Gizlilik: United Kingdom ibaresi, e-posta satırı, Uluslararası Veri Transferi ve İletişim bölümleri kaldırıldı (4 dil)
  - Footer: Hakkımızda, Kariyer, İletişim, Satıcı Akademisi ve Doğrulanmış Tedarikçi Olun linkleri kaldırıldı; Komisyon ve Ücretler "Fiyat Tablosu" olarak değiştirildi
  - seller/verification.html sayfası ve yönlendirmesi silindi

---
## [v2.1.0-alpha.10] - 2026-07-21 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(manufacturers): x-data içindeki TS type annotation kaldırıldı (seller listesi Alpine init çöküyordu) (@aliiball)

### Degistirildi
- refactor(alpine): sidebar modülü page-specific yapıldı (12 dashboard sayfası) (@aliiball)
- refactor(perf): sticky sidebar scroll handler rAF ile throttle edildi (@aliiball)
- refactor(perf): api/callMethod fetch'lerine 30s timeout + AbortController eklendi (@aliiball)

---
## [v2.1.0-alpha.9] - 2026-07-21 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(seller): mağaza sayfasında 80 ürün sınırını kaldır (@boraydeger32)

---
## [v2.1.0-alpha.8] - 2026-07-21 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Degistirildi
- refactor(i18n): sadece aktif dil lazy-load edildi (1.68 MB → ~0.4 MB parse/sayfa) (@aliiball)
- refactor(alpine): checkout modülü page-specific yapıldı (core chunk'tan çıkarıldı) (@aliiball)
- refactor(alpine): 11 modül page-specific yapıldı (core chunk 687→556 kB) (@aliiball)
- refactor(alpine): auth modülü page-specific yapıldı (core chunk 556→410 kB) (@aliiball)
- refactor(alpine): products-filter modülü page-specific yapıldı (products + manufacturers) (@aliiball)
- refactor(alpine): cart/help/product page-specific yapıldı (core chunk 407→124 kB) (@aliiball)

---
## [v2.1.0-alpha.7] - 2026-07-21 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(ui): "Yeni ürün" rozeti ve dil/para seçicili footer eklendi (@ahmeetseker)
  - Sinyali olmayan ürünlerde "Yeni ürün" fallback rozeti eklendi (new sinyal tipi, sparkles ikonu, 4 dilde metin)
  - Footer'da statik "Ülke Değiştir" kolonu yerine işlevsel dil + para birimi seçici popover eklendi
  - Footer SEO linkleri (marka/mağaza/kategori) backend get_footer_seo_links endpoint'inden hydrate ediliyor (30 dk sessionStorage cache, gerçek pretty URL'ler)
  - Ürün galerisinde 4'ten fazla görselde "+N" karosu eklendi; lightbox tek kolonlu buzlu-cam thumbnail şeridine geçti; oklar ve favori butonu 44px WCAG hedefine büyütüldü
  - ProductGrid'deki kart kopyası silinip ortak ListingCard'a bağlandı; statik selling point/tedarikçi bloğu kaldırıldı, alan tamamen sosyal kanıta bırakıldı
  - Ürün görselleri beyaz zemin + object-contain standardına geçti; grid gap 16px, listeleme 5 kolon, ProductGrid 2xl'de 7 kolon
  - TopBar giriş butonu ikon + tooltip'e dönüştü; auth dropdown "Tekrar hoş geldiniz" düzeni ve kayıt CTA'sı eklendi
  - İçerik metinleri globalleştirildi ("Avrupa pazarı" → "Global pazar"); Help Center alt politika şeridi kaldırıldı

### Duzeltildi
- fix(top-ranking): kategori dropdown'ı sıralama çubuğunun altında kalıyordu (@TurksabYonetim)

---
## [v2.1.0-alpha.6] - 2026-07-21 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Degistirildi
- refactor(categories): ölü getCategorySections kaldırıldı + hata metinleri i18n'e alındı (@aliiball)
  - data/categories.ts: getCategorySections + kullanılmayan t import silindi (tipler korundu)
  - categories.ts: 3 hardcoded string → t() (hardcoded Türkçe i18n bug'ı düzeldi)
  - test: hata UI testi i18n-uyumlu (dil TR sabit)

---
## [v2.1.0-alpha.5] - 2026-07-20 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(products): onaylanmış satıcı facet sayacı + fiyat histogram/slider eklendi (@aliiball)
- feat(nav): mobilde para birimi seçici eklendi (@aliiball)

### Duzeltildi
- fix(cart): sepet kargo/indirim yanlış USD çevrimi kaldırıldı (@aliiball)

### Degistirildi
- refactor(products): ölü mock kaldırıldı, eskimiş facet yorumları güncellendi (@aliiball)
- refactor(build): bundle-stats.html prod dist'ten çıkarıldı, ANALYZE'a bağlandı (@aliiball)
- refactor(assets): kullanılmayan 13 görsel kaldırıldı (~1.6 MB) (@aliiball)
- refactor(currency): utils formatPrice → localizePriceString (isim çakışması giderildi) (@aliiball)

---
## [v2.1.0-alpha.4] - 2026-07-20 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(product-detail): ürün sekmeleri anchor/scroll davranışına geçirildi (@aliiball)
  - Sekme-değiştirme (içerik gizle/göster) kaldırıldı; tüm bölümler alt alta hep görünür
  - Sekmeye tıklayınca ilgili bölüme yumuşak scroll (sticky header ofsetli)
  - Scroll-spy ile görünen bölümün sekmesi otomatik vurgulanıyor
  - Her bölüme başlık + üst ayraç eklendi (Açıklama/Özellikler/Yorumlar/Tedarikçi)
  - Açıklama ilk sıraya alındı, tüm içerik DOM'da kalınca Ctrl+F ve SEO iyileşti
  - Yalnız masaüstü; MobileLayout değişmedi

---
## [v2.1.0-alpha.3] - 2026-07-18 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(footer): SEO bölgesi + genişletilmiş footer içeriği; ürün kartı hover cilası (@TurksabYonetim)
  - FooterSeo.ts eklendi: Trendyol tarzı "Popüler Üreticiler ve Mağazalar" + "Popüler Sayfalar" bölgesi (beyaz zemin, sarı üst çizgi). Marka/arama linkleri SEO hedefli sabit içerik; yalnızca bölüm başlıkları i18n'e çevrilir.
  - FooterLinks/FooterGroup/FooterPolicy yeniden düzenlendi; mobilde accordion yok, tüm linkler görünür. 4 dilde yeni footer i18n anahtarları (tr/en/ar/ru).
  - ListingCard: hover'da yumuşak gölge + ring geçişi.
  - products sayfası arka planı beyaza çekildi; product.ts'ten kullanılmayan escapeHtml import'u kaldırıldı.

---
## [v2.1.0-alpha.2] - 2026-07-17 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(security): Faz 1-4 frontend güvenlik düzeltmeleri (@boraydeger32)
  - Mock modları production'da devre dışı (DEV guard) (F-033) addresses.ts, orders.ts, socialProofService.ts, categoryShowcaseService.ts
  - 2FA login hatası anlaşılır mesaj ile bildiriliyor (F-014)
  - Stub chat fonksiyonları sessiz geçmek yerine hata fırlatıyor (F-058)

---
## [v2.1.0-alpha.1] - 2026-07-16 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix: XSS koruması, güvenlik headerları ve open redirect düzeltmesi (@boraydeger32)
  - Cart innerHTML XSS — escapeHtml ile korundu (cart.ts)
  - Product gallery innerHTML XSS — escapeHtml eklendi (product.ts)
  - Open redirect — login catch bloğu güvenli fallback (LoginPage.ts)
  - Nginx güvenlik headerları: CSP, HSTS, X-Frame-Options, Referrer-Policy
  - CSP'ye Google Fonts izni eklendi (fonts.googleapis.com, fonts.gstatic.com)
  - CI/CD npm audit adımı eklendi (lint.yml)
  - Node 20 → 22 Dockerfile ile uyum (lint.yml)

---
## [v2.1.0] - 2026-07-14 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(auth): /davet-kabul davet kabul sayfası + E2E eklendi (@aliiball)
  - AcceptInvitePage + Alpine acceptInvitePage + acceptBuyerInvite wrapper
  - staticPageUrl + nginx route + pages/auth/accept-invite entry
  - accept-invite.spec.ts (token yok→hata, geçerli token→başarı)
- feat(storefront): mobil PDP, chat, hero ve vitrin yenilemeleri eklendi (@ahmeetseker)
  - Mobil ürün detay sayfası Alibaba tarzında yeniden tasarlandı: MediaViewer galerisi, OptionsSheet varyant seçimi, simetrik alt aksiyon barı; "Soru sor" QAModal'a bağlandı
  - Chat: konuşma okundu işaretleme (unread rozet sıfırlama) ve mesaja gömülü ürün marker'ı eklendi; sabitlenen ürün konuşma-başına izole edildi
  - Ana sayfa hero split yapıya geçirildi: Sarı İmza slider + En İyi Fırsatlar/RFQ yan paneli (HeroSidePanel)
  - Size Özel Seçimler hero'su sahne + kanal şeridi + sparkline tasarımıyla yenilendi; Swiper/coverflow bağımlılığı ve mock veri dosyası kaldırıldı
  - Paylaşılan ListingCard ve Pagination bileşenleri eklendi; Top Fırsatlar, Top Sıralama ve kategori grid'leri zengin karta geçirildi
  - Kategori Vitrini'ne mock modu (?mock_cs=1) ve redesign uygulandı
  - Siparişler: İadeler ve Değerlendirmeler sekmeleri yeniden tasarlandı; kullanılmayan kupon modülü silindi
  - KYC, KYB ve Adresler sayfaları responsive iyileştirildi; KYB başvuru durumu Pending→Draft mantık hatası düzeltildi
  - Buyer dashboard mobil düzeni düzeltildi (KYB banner, KPI grid, eksenler)
  - Mobil menü drawer'ı TopBar'dan çıkarılıp MobileDashboardNav'a taşındı
  - Mağaza başlığı rozet satırı sadeleştirildi; Tedarikçi sekmesi yalnız ikonlu kayıt satırlarına indirildi
  - Auth sayfalarında beyaz iSTOC logosu kullanıldı
  - chatPopup, ListingCard ve Pagination için testler eklendi; 4 dil dosyası güncellendi
- feat(storefront): bilgi sayfaları redesign'ı ve değerlendirme akışı tamamlandı (@ahmeetseker)
  - Yardım merkezi 3 sayfada V2.5 Split İstatistik düzenine geçirildi
  - Satış sonrası hizmetler sayfası "Taşan Kartlar" (5D) ile yenilendi
  - İade politikası bindirmeli kart (D) varyantıyla yeniden tasarlandı
  - Trade Assurance sayfası Varyant 1 ile yenilendi, videolar Vite import'una alındı
  - Satıcı Ol sayfası mobilde Sade Akış (TrustStrip + accordion + sticky CTA) oldu
  - Kargo ifadeleri Sevkiyat'a dönüştürüldü, Ambar ve Liman kartları eklendi
  - Değerlendirmelerim sekmesi bekleyen/yayınlanan yorum API'lerine bağlandı
  - PDP breadcrumb'ındaki kategoriler listeleme sayfasına link oldu
  - Native select'ler için paylaşılan SelectMenu enhancer'ı eklendi
  - Favoriler filtreleri mobilde bottom sheet olarak açılır oldu
  - Ayarlar profil kartı grid tabanlı V4 düzenine geçirildi
  - Kullanılmayan avif görseller, perf raporları ve eski task dokümanları silindi

### Duzeltildi
- fix(dashboard): doğrulanmış kullanıcıda "gönderildi" yalanı düzeltildi (@aliiball)
  - sendVerification already_verified yanıtında banner'ı kaldırır; aksi halde link maili gönderildi durumunu gösterir
- fix(rfq): RFQ oluşturmayı capability-tabanlı yetkilendirmeye çevirdi (@aliiball)
  - create_rfq artık "Buyer" rolü yerine is_buyer (Buyer rolü VEYA can_buy) VEYA admin kontrol ediyor + doc.insert(ignore_permissions=True)
  - Satıcı hesaplarında role_profile="Seller Full Access" User.save'de "Buyer" rolünü resetleyip siliyordu; can_buy=1 (KYC) hybrid satıcılar RFQ açamıyordu
  - Kodun kendi is_buyer tanımıyla (auth.py) hizalandı; okuma/hook'lar değişmedi
- fix(storefront): dev backend proxy hedefi 8001'e güncellendi (@boraydeger32)

---
## [v2.0.0-rc.1] - 2026-07-14 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(auth): /davet-kabul davet kabul sayfası + E2E eklendi (@aliiball)
  - AcceptInvitePage + Alpine acceptInvitePage + acceptBuyerInvite wrapper
  - staticPageUrl + nginx route + pages/auth/accept-invite entry
  - accept-invite.spec.ts (token yok→hata, geçerli token→başarı)
- feat(storefront): mobil PDP, chat, hero ve vitrin yenilemeleri eklendi (@ahmeetseker)
  - Mobil ürün detay sayfası Alibaba tarzında yeniden tasarlandı: MediaViewer galerisi, OptionsSheet varyant seçimi, simetrik alt aksiyon barı; "Soru sor" QAModal'a bağlandı
  - Chat: konuşma okundu işaretleme (unread rozet sıfırlama) ve mesaja gömülü ürün marker'ı eklendi; sabitlenen ürün konuşma-başına izole edildi
  - Ana sayfa hero split yapıya geçirildi: Sarı İmza slider + En İyi Fırsatlar/RFQ yan paneli (HeroSidePanel)
  - Size Özel Seçimler hero'su sahne + kanal şeridi + sparkline tasarımıyla yenilendi; Swiper/coverflow bağımlılığı ve mock veri dosyası kaldırıldı
  - Paylaşılan ListingCard ve Pagination bileşenleri eklendi; Top Fırsatlar, Top Sıralama ve kategori grid'leri zengin karta geçirildi
  - Kategori Vitrini'ne mock modu (?mock_cs=1) ve redesign uygulandı
  - Siparişler: İadeler ve Değerlendirmeler sekmeleri yeniden tasarlandı; kullanılmayan kupon modülü silindi
  - KYC, KYB ve Adresler sayfaları responsive iyileştirildi; KYB başvuru durumu Pending→Draft mantık hatası düzeltildi
  - Buyer dashboard mobil düzeni düzeltildi (KYB banner, KPI grid, eksenler)
  - Mobil menü drawer'ı TopBar'dan çıkarılıp MobileDashboardNav'a taşındı
  - Mağaza başlığı rozet satırı sadeleştirildi; Tedarikçi sekmesi yalnız ikonlu kayıt satırlarına indirildi
  - Auth sayfalarında beyaz iSTOC logosu kullanıldı
  - chatPopup, ListingCard ve Pagination için testler eklendi; 4 dil dosyası güncellendi
- feat(storefront): bilgi sayfaları redesign'ı ve değerlendirme akışı tamamlandı (@ahmeetseker)
  - Yardım merkezi 3 sayfada V2.5 Split İstatistik düzenine geçirildi
  - Satış sonrası hizmetler sayfası "Taşan Kartlar" (5D) ile yenilendi
  - İade politikası bindirmeli kart (D) varyantıyla yeniden tasarlandı
  - Trade Assurance sayfası Varyant 1 ile yenilendi, videolar Vite import'una alındı
  - Satıcı Ol sayfası mobilde Sade Akış (TrustStrip + accordion + sticky CTA) oldu
  - Kargo ifadeleri Sevkiyat'a dönüştürüldü, Ambar ve Liman kartları eklendi
  - Değerlendirmelerim sekmesi bekleyen/yayınlanan yorum API'lerine bağlandı
  - PDP breadcrumb'ındaki kategoriler listeleme sayfasına link oldu
  - Native select'ler için paylaşılan SelectMenu enhancer'ı eklendi
  - Favoriler filtreleri mobilde bottom sheet olarak açılır oldu
  - Ayarlar profil kartı grid tabanlı V4 düzenine geçirildi
  - Kullanılmayan avif görseller, perf raporları ve eski task dokümanları silindi

### Duzeltildi
- fix(dashboard): doğrulanmış kullanıcıda "gönderildi" yalanı düzeltildi (@aliiball)
  - sendVerification already_verified yanıtında banner'ı kaldırır; aksi halde link maili gönderildi durumunu gösterir
- fix(rfq): RFQ oluşturmayı capability-tabanlı yetkilendirmeye çevirdi (@aliiball)
  - create_rfq artık "Buyer" rolü yerine is_buyer (Buyer rolü VEYA can_buy) VEYA admin kontrol ediyor + doc.insert(ignore_permissions=True)
  - Satıcı hesaplarında role_profile="Seller Full Access" User.save'de "Buyer" rolünü resetleyip siliyordu; can_buy=1 (KYC) hybrid satıcılar RFQ açamıyordu
  - Kodun kendi is_buyer tanımıyla (auth.py) hizalandı; okuma/hook'lar değişmedi
- fix(storefront): dev backend proxy hedefi 8001'e güncellendi (@boraydeger32)

---
## [v2.0.0-alpha.5] - 2026-07-14 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(storefront): bilgi sayfaları redesign'ı ve değerlendirme akışı tamamlandı (@ahmeetseker)
  - Yardım merkezi 3 sayfada V2.5 Split İstatistik düzenine geçirildi
  - Satış sonrası hizmetler sayfası "Taşan Kartlar" (5D) ile yenilendi
  - İade politikası bindirmeli kart (D) varyantıyla yeniden tasarlandı
  - Trade Assurance sayfası Varyant 1 ile yenilendi, videolar Vite import'una alındı
  - Satıcı Ol sayfası mobilde Sade Akış (TrustStrip + accordion + sticky CTA) oldu
  - Kargo ifadeleri Sevkiyat'a dönüştürüldü, Ambar ve Liman kartları eklendi
  - Değerlendirmelerim sekmesi bekleyen/yayınlanan yorum API'lerine bağlandı
  - PDP breadcrumb'ındaki kategoriler listeleme sayfasına link oldu
  - Native select'ler için paylaşılan SelectMenu enhancer'ı eklendi
  - Favoriler filtreleri mobilde bottom sheet olarak açılır oldu
  - Ayarlar profil kartı grid tabanlı V4 düzenine geçirildi
  - Kullanılmayan avif görseller, perf raporları ve eski task dokümanları silindi

---
## [v2.0.0-alpha.4] - 2026-07-10 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(storefront): mobil PDP, chat, hero ve vitrin yenilemeleri eklendi (@ahmeetseker)
  - Mobil ürün detay sayfası Alibaba tarzında yeniden tasarlandı: MediaViewer galerisi, OptionsSheet varyant seçimi, simetrik alt aksiyon barı; "Soru sor" QAModal'a bağlandı
  - Chat: konuşma okundu işaretleme (unread rozet sıfırlama) ve mesaja gömülü ürün marker'ı eklendi; sabitlenen ürün konuşma-başına izole edildi
  - Ana sayfa hero split yapıya geçirildi: Sarı İmza slider + En İyi Fırsatlar/RFQ yan paneli (HeroSidePanel)
  - Size Özel Seçimler hero'su sahne + kanal şeridi + sparkline tasarımıyla yenilendi; Swiper/coverflow bağımlılığı ve mock veri dosyası kaldırıldı
  - Paylaşılan ListingCard ve Pagination bileşenleri eklendi; Top Fırsatlar, Top Sıralama ve kategori grid'leri zengin karta geçirildi
  - Kategori Vitrini'ne mock modu (?mock_cs=1) ve redesign uygulandı
  - Siparişler: İadeler ve Değerlendirmeler sekmeleri yeniden tasarlandı; kullanılmayan kupon modülü silindi
  - KYC, KYB ve Adresler sayfaları responsive iyileştirildi; KYB başvuru durumu Pending→Draft mantık hatası düzeltildi
  - Buyer dashboard mobil düzeni düzeltildi (KYB banner, KPI grid, eksenler)
  - Mobil menü drawer'ı TopBar'dan çıkarılıp MobileDashboardNav'a taşındı
  - Mağaza başlığı rozet satırı sadeleştirildi; Tedarikçi sekmesi yalnız ikonlu kayıt satırlarına indirildi
  - Auth sayfalarında beyaz iSTOC logosu kullanıldı
  - chatPopup, ListingCard ve Pagination için testler eklendi; 4 dil dosyası güncellendi

---
## [v2.0.0-alpha.3] - 2026-07-10 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(storefront): dev backend proxy hedefi 8001'e güncellendi (@boraydeger32)

---
## [v2.0.0-alpha.2] - 2026-07-09 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(rfq): RFQ oluşturmayı capability-tabanlı yetkilendirmeye çevirdi (@aliiball)
  - create_rfq artık "Buyer" rolü yerine is_buyer (Buyer rolü VEYA can_buy) VEYA admin kontrol ediyor + doc.insert(ignore_permissions=True)
  - Satıcı hesaplarında role_profile="Seller Full Access" User.save'de "Buyer" rolünü resetleyip siliyordu; can_buy=1 (KYC) hybrid satıcılar RFQ açamıyordu
  - Kodun kendi is_buyer tanımıyla (auth.py) hizalandı; okuma/hook'lar değişmedi

---
## [v2.0.0-alpha.1] - 2026-07-08 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(auth): /davet-kabul davet kabul sayfası + E2E eklendi (@aliiball)
  - AcceptInvitePage + Alpine acceptInvitePage + acceptBuyerInvite wrapper
  - staticPageUrl + nginx route + pages/auth/accept-invite entry
  - accept-invite.spec.ts (token yok→hata, geçerli token→başarı)

### Duzeltildi
- fix(dashboard): doğrulanmış kullanıcıda "gönderildi" yalanı düzeltildi (@aliiball)
  - sendVerification already_verified yanıtında banner'ı kaldırır; aksi halde link maili gönderildi durumunu gösterir

---
## [v2.0.0] - 2026-07-03 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat: soru düzenleme, marka video oynatma, dev pretty-URL'leri (@boraydeger32)
  - qa: kendi Pending sorusunda inline ✎ Düzenle (updateProductQuestion) + i18n
  - media: marka tanıtım videosu yüklenen dosyadan oynar (renderVideo → dosya URL'inde <video>, eski YouTube/Vimeo'da embed fallback)
  - dev: vite prettyUrlRewritePlugin'e /magaza, /magaza/<code>/dukkan, /kategori, /marka eklendi (dev'de bu linkler artık ana sayfaya düşmüyor)
- feat(app): doğrulama rozeti, kategori drill-down ve sonsuz kaydırma eklendi (@ahmeetseker)
  - Satıcı saha doğrulama rozeti eklendi (SupplierCard/StoreHeader/ManufacturerList)
  - VerificationBadge component'i, verification.* i18n ve SupplierInfo.verifications alanı eklendi
  - Paylaşılan BottomSheet, CategoryDrillSheet ve CategoryNavBar çıkarıldı
  - MobileCategoryBar ve HorizontalCategoryBar mobil kategori drill-down'a geçti
  - Kategori cache versiyonlama eklendi; ManufacturersHero ve TopDealsCategoryTabs merkezi loadCategories'e geçti
  - Üretici listesine sonsuz kaydırma (IntersectionObserver) ve verified filtresi eklendi
  - Manufacturers sayfasına mobil alt navigasyon (BottomNav) eklendi
- feat(manufacturers): üretici kartı yeniden tasarlandı ve mobil filtre sheet eklendi (@ahmeetseker)
  - masaüstü kartı zengin 2-bölüm layout'a geçti (istatistik paneli, ürün kartları, galeri)
  - mobil kart sade tek-sıra düzende tutuldu (@container/sc breakpoint'leri)
  - galeri panelinde foto sayacı ve hover navigasyon okları eklendi
  - mobil kategori barındaki "doğrulanmış üretici" pill'i filtre ikonuyla değiştirildi (mfr-filter-open event'i)
  - discovery görünümünden gri zemin kaldırıldı, ManufacturerFilterSheet eklendi
  - ürünler sayfası başlığından "viewingLead" ön metni kaldırıldı
  - doğrulama rozeti x-if koşulu sadeleştirildi
- feat(manufacturers): update mobile filter button and layout adjustments (@TurksabYonetim)
- feat(top-deals): mobil hero araması ve paylaşılan kategori drill-down eklendi (@ahmeetseker)
  - mobil hero'ya deal-scoped arama alanı (is_deal korunur, sonuç Top Deals'ten çıkmaz)
  - mobil kategori seçimi paylaşılan drill-down bottom-sheet'e taşındı (anasayfa/üreticiler deseni)
  - eski backdrop'lu radio sheet ve showCategorySheet state'i kaldırıldı
  - topDealsPage.searchPlaceholder + mobileCategory.allInCategory i18n
- feat(manufacturers): üreticiler hero'suna tüm kategoriler flyout'u eklendi (@ahmeetseker)
  - "Tüm kategoriler" satırı hover'da tam ağacı (6 ile sınırsız) gruplu flyout'ta gösterir
  - kategori linkleri products.html yerine manufacturers.html?cat= hedefine yönlendirildi
  - kart satırındaki pe-7 boşluğu 560px altında kaldırıldı (dar ekran taşması)
- feat(urun-detay): satıcı güven şeridi ve yeni sekme tasarımı eklendi (@ahmeetseker)
  - Galeri altına SellerTrustCard eklendi: satıcı kimliği, rating, marka, güven sinyalleri, mağaza + sohbet aksiyonları (bayrak SVG'ye çevrildi)
  - ProductTitleBar sade başlığa indirildi; satıcı bilgisi güven şeridine taşındı
  - Sekmeler segment-pill karta çevrildi; Yorumlar sekmesine adet rozeti, sticky durumda frosted (blur) zemin eklendi
  - Özellikler sekmesine öne çıkan spec bandı ve simetrik 4 sütunlu gruplu tablo eklendi; boş bölümler gizlendi, boş durum mesajı eklendi
  - Mağaza yorum özeti koyu gradyan panele taşındı
  - Bölüm başlıkları h3/h4 → h2/h3 olarak düzeltildi (başlık hiyerarşisi)
  - Sepet çekmecesinde fiyat vurgusu nötr renge alındı, gölgeler yumuşatıldı
  - public/mockups/ .gitignore'a eklendi

### Duzeltildi
- fix(currency): mobil para birimi seçici ve boş sepet sembolü düzeltildi (@aliiball)
  - mobil pill'lere data-currency-pill + #currency-pills'e event delegation eklendi (rebuild innerHTML'i ezdiği için tek-sefer delegation; doğrudan listener kaybolurdu)
  - aktif pill artık seçili para birimini yansıtıyor (eskiden hep ilk pill aktifti)
  - boş sepet header ara toplamı hardcoded "$" yerine seçili sembolle başlıyor
- fix(product): varyant seçilince fiyat doğru biçimde güncelleniyor (@aliiball)
  - ortak applyVariantPrice helper'ı (variantPrice.ts) eklendi
  - masaüstü: varyant seçilince fiyat hiç güncellenmiyordu → güncelleniyor
  - mobil: getCurrencySymbol()+toFixed yerine formatCurrency (₺1250.00 → ₺1.250,00)
- fix(favorites): favori fiyatı donmuş string yerine güncel kura çevriliyor (@aliiball)
  - FavoriteItem'a native price + currency alanları eklendi
  - FavoritesSection BrowsingHistory desenine geçti (convertPrice + formatCurrency)
  - buyer-dashboard render öncesi initCurrency() await ediyor (bayat 38.5 kuru sorunu)
  - eski kayıtlar legacy priceRange string fallback ile geriye uyumlu
- fix(checkout): sipariş onay modalı tutarları formatCurrency ile biçimlendiriliyor (@aliiball)
  - "TRY 1234.56" ham biçim yerine "₺1.234,56" (OrderSummary ile tutarlı)
  - tutar değeri zaten doğruydu, yalnız biçim hizalandı
- fix(currency): başlangıç fiyatında binlik ayraç düzeltildi (@aliiball)
  - formatStartingPrice toLocaleString ile gruplama yapıyor ("₺7700" → "₺7.700")
- fix(cart): ara toplam satır toplamlarıyla tutarlı yuvarlanıyor (@aliiball)
  - getSummary çarp-sonra-convert kullanıyor (satır gösterimiyle aynı yuvarlama)
  - satır toplamları ile ara toplam kuruşu kuruşuna tutuyor
- fix(cart): misafir sepet native fiyat + para birimiyle saklanıyor (@aliiball)
  - drawer modellerine native alanlar eklendi (tier/color/size basePrice, item baseCurrency + baseSamplePrice)
  - syncToCartStore native fiyat + native currency yazıyor (oturumlu yolla aynı); native yoksa çevrilmiş + seçili currency'ye güvenli düşüş
  - gösterim her zaman güncel kura çevriliyor → donmuş-kur / round-trip drift giderildi
  - sepetten favori ekleme yolu da native price/currency taşıyor (K3 tamamlandı)
- fix(listing): fiyat filtresi seçili para birimini backend'e gönderiyor (@aliiball)
  - searchListings min/max ile birlikte filter_currency yolluyor; backend baz birime çevirip selling_price_base ile karşılaştırır
- fix(product): varyant başlığı varyant yokken gizlendi (@ahmeetseker)
  - Variations bölümü yalnızca backend varyant döndürdüğünde render ediliyor
- fix(products): filtre facet sayaçları dinamik güncellenmiyordu (ms-auto selector uyumsuzluğu) (@aliiball)
- fix(seller-dashboard): toplanmayan adres alanları (adres2/ilçe/posta) formdan ve state'ten kaldırıldı (@aliiball)
- fix(panel-test): Mağaza Profilleri E2E doğrulama testi eklendi (@aliiball)
- fix(seller-dashboard): vergi/IBAN alanları read-only yapıldı (satıcı düzenleyemez; admin/KYB kanalı) (@aliiball)
  - tax_id / tax_office / iban: readonly + kilitli görünüm + lockedHint notu
  - 4 dilde (tr/en/ru/ar) lockedHint anahtarı eklendi
- fix(ui): hover kaynaklı tooltip titremesi ve kart sıçraması düzeltildi (@ahmeetseker)
  - VerificationBadge: hover wrapper'a taşındı, tooltip'e pt-gap (hover boşluğunda kapanmaz)
  - RecommendationSlider: hover'daki -translate-y kaldırıldı (layout shift önlendi)
- fix(seller-dashboard): güvenilmez Sağlık Skoru kartı kaldırıldı (@aliiball)
  - Hesabım sekmesindeki health_score kartı kaldırıldı (Admin panelde de hidden=1)
  - Kalan kartlar (Not/Toplam Sipariş/Puan) get_my_profile'dan gerçek değer alır
- fix(seller-test): Tedarikçi Profili self-servis profil E2E'si eklendi (@aliiball)
  - Satıcı cookie-login ile 4 senaryo: profil yükleme, vergi/IBAN read-only, toplanmayan adres alanları yok, performans kartları gerçek değer
  - Runner'a --seller bayrağı eklendi (SELLER_PASS ile)
- fix(brand): remove duplicate "Ana Sayfa" from breadcrumb (@boraydeger32)
- fix(seller): CSRF token kanonik fetchCsrfToken ile alınır oldu (@aliiball)
  - seller.ts _csrf() var olmayan csrftoken cookie'sini okuyordu → hep geçersiz "fetch" → CSRF-zorunlu ortamlarda (prod/rc/beta/alpha) tüm auth'lu satıcı çağrıları 400 CSRFTokenError → dashboard yüklenmiyordu
  - reviewsApi.ts window.csrf_token (hiç set edilmiyor) yerine fetchCsrfToken
  - ikisi de api.ts'teki kanonik fetchCsrfToken()'a bağlandı

### Degistirildi
- refactor(ui): neumorphic buton press efekti kaldırıldı (@ahmeetseker)
  - Global press selector'ından inset box-shadow ve scale(0.98) kaldırıldı
  - Tüm CTA'larda transition-all yerine açık transition listesi kullanıldı
  - --ease-drawer token'ı eklendi; --btn-shadow glossy highlight'tan arındırıldı
  - no-scrollbar yerine scrollbar-hide, link/toggle'lara th-no-press eklendi
- refactor(mega-menu): görünüm geçiş animasyonu ve radius sadeleştirmesi (@ahmeetseker)
  - görünümler arası .hidden swap'ı mega-view-enter keyframe ile yumuşatıldı (her showView tetikler)
  - feature/producer kartları ve ikon kutuları rounded-xl/lg → rounded-md
  - catpopup sidebar item'ına border-inline-start-color geçişi eklendi
- refactor(category-showcase): kategori kutuları cover görsel + gradient scrim'e geçti (@ahmeetseker)
  - contain arkaplan yerine object-cover <img> + alttan gradient scrim (tutarlı görsel ağırlık)
  - label görsel üstünde beyaz, görselsiz kutuda koyu; hover CTA scrim üstünde okunur
  - promo kutularına z-index katmanlama + hover beyaz overlay
- refactor(vite): impeccable live picker script'i serve-time enjekte edildi (@ahmeetseker)
  - impeccableLivePlugin: apply:'serve' + transformIndexHtml ile live.js'i çalışma anında ekler
  - kaynak HTML'lere yazmaz (git temiz kalır), prod build'e asla girmez, dosya yoksa no-op

---
## [v1.5.0-rc.1] - 2026-07-03 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat: soru düzenleme, marka video oynatma, dev pretty-URL'leri (@boraydeger32)
  - qa: kendi Pending sorusunda inline ✎ Düzenle (updateProductQuestion) + i18n
  - media: marka tanıtım videosu yüklenen dosyadan oynar (renderVideo → dosya URL'inde <video>, eski YouTube/Vimeo'da embed fallback)
  - dev: vite prettyUrlRewritePlugin'e /magaza, /magaza/<code>/dukkan, /kategori, /marka eklendi (dev'de bu linkler artık ana sayfaya düşmüyor)
- feat(app): doğrulama rozeti, kategori drill-down ve sonsuz kaydırma eklendi (@ahmeetseker)
  - Satıcı saha doğrulama rozeti eklendi (SupplierCard/StoreHeader/ManufacturerList)
  - VerificationBadge component'i, verification.* i18n ve SupplierInfo.verifications alanı eklendi
  - Paylaşılan BottomSheet, CategoryDrillSheet ve CategoryNavBar çıkarıldı
  - MobileCategoryBar ve HorizontalCategoryBar mobil kategori drill-down'a geçti
  - Kategori cache versiyonlama eklendi; ManufacturersHero ve TopDealsCategoryTabs merkezi loadCategories'e geçti
  - Üretici listesine sonsuz kaydırma (IntersectionObserver) ve verified filtresi eklendi
  - Manufacturers sayfasına mobil alt navigasyon (BottomNav) eklendi
- feat(manufacturers): üretici kartı yeniden tasarlandı ve mobil filtre sheet eklendi (@ahmeetseker)
  - masaüstü kartı zengin 2-bölüm layout'a geçti (istatistik paneli, ürün kartları, galeri)
  - mobil kart sade tek-sıra düzende tutuldu (@container/sc breakpoint'leri)
  - galeri panelinde foto sayacı ve hover navigasyon okları eklendi
  - mobil kategori barındaki "doğrulanmış üretici" pill'i filtre ikonuyla değiştirildi (mfr-filter-open event'i)
  - discovery görünümünden gri zemin kaldırıldı, ManufacturerFilterSheet eklendi
  - ürünler sayfası başlığından "viewingLead" ön metni kaldırıldı
  - doğrulama rozeti x-if koşulu sadeleştirildi
- feat(manufacturers): update mobile filter button and layout adjustments (@TurksabYonetim)
- feat(top-deals): mobil hero araması ve paylaşılan kategori drill-down eklendi (@ahmeetseker)
  - mobil hero'ya deal-scoped arama alanı (is_deal korunur, sonuç Top Deals'ten çıkmaz)
  - mobil kategori seçimi paylaşılan drill-down bottom-sheet'e taşındı (anasayfa/üreticiler deseni)
  - eski backdrop'lu radio sheet ve showCategorySheet state'i kaldırıldı
  - topDealsPage.searchPlaceholder + mobileCategory.allInCategory i18n
- feat(manufacturers): üreticiler hero'suna tüm kategoriler flyout'u eklendi (@ahmeetseker)
  - "Tüm kategoriler" satırı hover'da tam ağacı (6 ile sınırsız) gruplu flyout'ta gösterir
  - kategori linkleri products.html yerine manufacturers.html?cat= hedefine yönlendirildi
  - kart satırındaki pe-7 boşluğu 560px altında kaldırıldı (dar ekran taşması)
- feat(urun-detay): satıcı güven şeridi ve yeni sekme tasarımı eklendi (@ahmeetseker)
  - Galeri altına SellerTrustCard eklendi: satıcı kimliği, rating, marka, güven sinyalleri, mağaza + sohbet aksiyonları (bayrak SVG'ye çevrildi)
  - ProductTitleBar sade başlığa indirildi; satıcı bilgisi güven şeridine taşındı
  - Sekmeler segment-pill karta çevrildi; Yorumlar sekmesine adet rozeti, sticky durumda frosted (blur) zemin eklendi
  - Özellikler sekmesine öne çıkan spec bandı ve simetrik 4 sütunlu gruplu tablo eklendi; boş bölümler gizlendi, boş durum mesajı eklendi
  - Mağaza yorum özeti koyu gradyan panele taşındı
  - Bölüm başlıkları h3/h4 → h2/h3 olarak düzeltildi (başlık hiyerarşisi)
  - Sepet çekmecesinde fiyat vurgusu nötr renge alındı, gölgeler yumuşatıldı
  - public/mockups/ .gitignore'a eklendi

### Duzeltildi
- fix(currency): mobil para birimi seçici ve boş sepet sembolü düzeltildi (@aliiball)
  - mobil pill'lere data-currency-pill + #currency-pills'e event delegation eklendi (rebuild innerHTML'i ezdiği için tek-sefer delegation; doğrudan listener kaybolurdu)
  - aktif pill artık seçili para birimini yansıtıyor (eskiden hep ilk pill aktifti)
  - boş sepet header ara toplamı hardcoded "$" yerine seçili sembolle başlıyor
- fix(product): varyant seçilince fiyat doğru biçimde güncelleniyor (@aliiball)
  - ortak applyVariantPrice helper'ı (variantPrice.ts) eklendi
  - masaüstü: varyant seçilince fiyat hiç güncellenmiyordu → güncelleniyor
  - mobil: getCurrencySymbol()+toFixed yerine formatCurrency (₺1250.00 → ₺1.250,00)
- fix(favorites): favori fiyatı donmuş string yerine güncel kura çevriliyor (@aliiball)
  - FavoriteItem'a native price + currency alanları eklendi
  - FavoritesSection BrowsingHistory desenine geçti (convertPrice + formatCurrency)
  - buyer-dashboard render öncesi initCurrency() await ediyor (bayat 38.5 kuru sorunu)
  - eski kayıtlar legacy priceRange string fallback ile geriye uyumlu
- fix(checkout): sipariş onay modalı tutarları formatCurrency ile biçimlendiriliyor (@aliiball)
  - "TRY 1234.56" ham biçim yerine "₺1.234,56" (OrderSummary ile tutarlı)
  - tutar değeri zaten doğruydu, yalnız biçim hizalandı
- fix(currency): başlangıç fiyatında binlik ayraç düzeltildi (@aliiball)
  - formatStartingPrice toLocaleString ile gruplama yapıyor ("₺7700" → "₺7.700")
- fix(cart): ara toplam satır toplamlarıyla tutarlı yuvarlanıyor (@aliiball)
  - getSummary çarp-sonra-convert kullanıyor (satır gösterimiyle aynı yuvarlama)
  - satır toplamları ile ara toplam kuruşu kuruşuna tutuyor
- fix(cart): misafir sepet native fiyat + para birimiyle saklanıyor (@aliiball)
  - drawer modellerine native alanlar eklendi (tier/color/size basePrice, item baseCurrency + baseSamplePrice)
  - syncToCartStore native fiyat + native currency yazıyor (oturumlu yolla aynı); native yoksa çevrilmiş + seçili currency'ye güvenli düşüş
  - gösterim her zaman güncel kura çevriliyor → donmuş-kur / round-trip drift giderildi
  - sepetten favori ekleme yolu da native price/currency taşıyor (K3 tamamlandı)
- fix(listing): fiyat filtresi seçili para birimini backend'e gönderiyor (@aliiball)
  - searchListings min/max ile birlikte filter_currency yolluyor; backend baz birime çevirip selling_price_base ile karşılaştırır
- fix(product): varyant başlığı varyant yokken gizlendi (@ahmeetseker)
  - Variations bölümü yalnızca backend varyant döndürdüğünde render ediliyor
- fix(products): filtre facet sayaçları dinamik güncellenmiyordu (ms-auto selector uyumsuzluğu) (@aliiball)
- fix(seller-dashboard): toplanmayan adres alanları (adres2/ilçe/posta) formdan ve state'ten kaldırıldı (@aliiball)
- fix(panel-test): Mağaza Profilleri E2E doğrulama testi eklendi (@aliiball)
- fix(seller-dashboard): vergi/IBAN alanları read-only yapıldı (satıcı düzenleyemez; admin/KYB kanalı) (@aliiball)
  - tax_id / tax_office / iban: readonly + kilitli görünüm + lockedHint notu
  - 4 dilde (tr/en/ru/ar) lockedHint anahtarı eklendi
- fix(ui): hover kaynaklı tooltip titremesi ve kart sıçraması düzeltildi (@ahmeetseker)
  - VerificationBadge: hover wrapper'a taşındı, tooltip'e pt-gap (hover boşluğunda kapanmaz)
  - RecommendationSlider: hover'daki -translate-y kaldırıldı (layout shift önlendi)
- fix(seller-dashboard): güvenilmez Sağlık Skoru kartı kaldırıldı (@aliiball)
  - Hesabım sekmesindeki health_score kartı kaldırıldı (Admin panelde de hidden=1)
  - Kalan kartlar (Not/Toplam Sipariş/Puan) get_my_profile'dan gerçek değer alır
- fix(seller-test): Tedarikçi Profili self-servis profil E2E'si eklendi (@aliiball)
  - Satıcı cookie-login ile 4 senaryo: profil yükleme, vergi/IBAN read-only, toplanmayan adres alanları yok, performans kartları gerçek değer
  - Runner'a --seller bayrağı eklendi (SELLER_PASS ile)
- fix(brand): remove duplicate "Ana Sayfa" from breadcrumb (@boraydeger32)
- fix(seller): CSRF token kanonik fetchCsrfToken ile alınır oldu (@aliiball)
  - seller.ts _csrf() var olmayan csrftoken cookie'sini okuyordu → hep geçersiz "fetch" → CSRF-zorunlu ortamlarda (prod/rc/beta/alpha) tüm auth'lu satıcı çağrıları 400 CSRFTokenError → dashboard yüklenmiyordu
  - reviewsApi.ts window.csrf_token (hiç set edilmiyor) yerine fetchCsrfToken
  - ikisi de api.ts'teki kanonik fetchCsrfToken()'a bağlandı

### Degistirildi
- refactor(ui): neumorphic buton press efekti kaldırıldı (@ahmeetseker)
  - Global press selector'ından inset box-shadow ve scale(0.98) kaldırıldı
  - Tüm CTA'larda transition-all yerine açık transition listesi kullanıldı
  - --ease-drawer token'ı eklendi; --btn-shadow glossy highlight'tan arındırıldı
  - no-scrollbar yerine scrollbar-hide, link/toggle'lara th-no-press eklendi
- refactor(mega-menu): görünüm geçiş animasyonu ve radius sadeleştirmesi (@ahmeetseker)
  - görünümler arası .hidden swap'ı mega-view-enter keyframe ile yumuşatıldı (her showView tetikler)
  - feature/producer kartları ve ikon kutuları rounded-xl/lg → rounded-md
  - catpopup sidebar item'ına border-inline-start-color geçişi eklendi
- refactor(category-showcase): kategori kutuları cover görsel + gradient scrim'e geçti (@ahmeetseker)
  - contain arkaplan yerine object-cover <img> + alttan gradient scrim (tutarlı görsel ağırlık)
  - label görsel üstünde beyaz, görselsiz kutuda koyu; hover CTA scrim üstünde okunur
  - promo kutularına z-index katmanlama + hover beyaz overlay
- refactor(vite): impeccable live picker script'i serve-time enjekte edildi (@ahmeetseker)
  - impeccableLivePlugin: apply:'serve' + transformIndexHtml ile live.js'i çalışma anında ekler
  - kaynak HTML'lere yazmaz (git temiz kalır), prod build'e asla girmez, dosya yoksa no-op

---
## [v1.5.0-alpha.11] - 2026-07-03 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(urun-detay): satıcı güven şeridi ve yeni sekme tasarımı eklendi (@ahmeetseker)
  - Galeri altına SellerTrustCard eklendi: satıcı kimliği, rating, marka, güven sinyalleri, mağaza + sohbet aksiyonları (bayrak SVG'ye çevrildi)
  - ProductTitleBar sade başlığa indirildi; satıcı bilgisi güven şeridine taşındı
  - Sekmeler segment-pill karta çevrildi; Yorumlar sekmesine adet rozeti, sticky durumda frosted (blur) zemin eklendi
  - Özellikler sekmesine öne çıkan spec bandı ve simetrik 4 sütunlu gruplu tablo eklendi; boş bölümler gizlendi, boş durum mesajı eklendi
  - Mağaza yorum özeti koyu gradyan panele taşındı
  - Bölüm başlıkları h3/h4 → h2/h3 olarak düzeltildi (başlık hiyerarşisi)
  - Sepet çekmecesinde fiyat vurgusu nötr renge alındı, gölgeler yumuşatıldı
  - public/mockups/ .gitignore'a eklendi

---
## [v1.5.0-alpha.10] - 2026-07-02 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(seller): CSRF token kanonik fetchCsrfToken ile alınır oldu (@aliiball)
  - seller.ts _csrf() var olmayan csrftoken cookie'sini okuyordu → hep geçersiz "fetch" → CSRF-zorunlu ortamlarda (prod/rc/beta/alpha) tüm auth'lu satıcı çağrıları 400 CSRFTokenError → dashboard yüklenmiyordu
  - reviewsApi.ts window.csrf_token (hiç set edilmiyor) yerine fetchCsrfToken
  - ikisi de api.ts'teki kanonik fetchCsrfToken()'a bağlandı

---
## [v1.5.0-alpha.9] - 2026-07-02 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(brand): remove duplicate "Ana Sayfa" from breadcrumb (@boraydeger32)

---
## [v1.5.0-alpha.8] - 2026-07-02 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(seller-dashboard): güvenilmez Sağlık Skoru kartı kaldırıldı (@aliiball)
  - Hesabım sekmesindeki health_score kartı kaldırıldı (Admin panelde de hidden=1)
  - Kalan kartlar (Not/Toplam Sipariş/Puan) get_my_profile'dan gerçek değer alır
- fix(seller-test): Tedarikçi Profili self-servis profil E2E'si eklendi (@aliiball)
  - Satıcı cookie-login ile 4 senaryo: profil yükleme, vergi/IBAN read-only, toplanmayan adres alanları yok, performans kartları gerçek değer
  - Runner'a --seller bayrağı eklendi (SELLER_PASS ile)

---
## [v1.5.0-alpha.6] - 2026-07-01 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(manufacturers): update mobile filter button and layout adjustments (@TurksabYonetim)
- feat(top-deals): mobil hero araması ve paylaşılan kategori drill-down eklendi (@ahmeetseker)
  - mobil hero'ya deal-scoped arama alanı (is_deal korunur, sonuç Top Deals'ten çıkmaz)
  - mobil kategori seçimi paylaşılan drill-down bottom-sheet'e taşındı (anasayfa/üreticiler deseni)
  - eski backdrop'lu radio sheet ve showCategorySheet state'i kaldırıldı
  - topDealsPage.searchPlaceholder + mobileCategory.allInCategory i18n
- feat(manufacturers): üreticiler hero'suna tüm kategoriler flyout'u eklendi (@ahmeetseker)
  - "Tüm kategoriler" satırı hover'da tam ağacı (6 ile sınırsız) gruplu flyout'ta gösterir
  - kategori linkleri products.html yerine manufacturers.html?cat= hedefine yönlendirildi
  - kart satırındaki pe-7 boşluğu 560px altında kaldırıldı (dar ekran taşması)

### Duzeltildi
- fix(ui): hover kaynaklı tooltip titremesi ve kart sıçraması düzeltildi (@ahmeetseker)
  - VerificationBadge: hover wrapper'a taşındı, tooltip'e pt-gap (hover boşluğunda kapanmaz)
  - RecommendationSlider: hover'daki -translate-y kaldırıldı (layout shift önlendi)

### Degistirildi
- refactor(mega-menu): görünüm geçiş animasyonu ve radius sadeleştirmesi (@ahmeetseker)
  - görünümler arası .hidden swap'ı mega-view-enter keyframe ile yumuşatıldı (her showView tetikler)
  - feature/producer kartları ve ikon kutuları rounded-xl/lg → rounded-md
  - catpopup sidebar item'ına border-inline-start-color geçişi eklendi
- refactor(category-showcase): kategori kutuları cover görsel + gradient scrim'e geçti (@ahmeetseker)
  - contain arkaplan yerine object-cover <img> + alttan gradient scrim (tutarlı görsel ağırlık)
  - label görsel üstünde beyaz, görselsiz kutuda koyu; hover CTA scrim üstünde okunur
  - promo kutularına z-index katmanlama + hover beyaz overlay
- refactor(vite): impeccable live picker script'i serve-time enjekte edildi (@ahmeetseker)
  - impeccableLivePlugin: apply:'serve' + transformIndexHtml ile live.js'i çalışma anında ekler
  - kaynak HTML'lere yazmaz (git temiz kalır), prod build'e asla girmez, dosya yoksa no-op

---
## [v1.5.0-alpha.5] - 2026-07-01 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(products): filtre facet sayaçları dinamik güncellenmiyordu (ms-auto selector uyumsuzluğu) (@aliiball)
- fix(seller-dashboard): toplanmayan adres alanları (adres2/ilçe/posta) formdan ve state'ten kaldırıldı (@aliiball)
- fix(panel-test): Mağaza Profilleri E2E doğrulama testi eklendi (@aliiball)
- fix(seller-dashboard): vergi/IBAN alanları read-only yapıldı (satıcı düzenleyemez; admin/KYB kanalı) (@aliiball)
  - tax_id / tax_office / iban: readonly + kilitli görünüm + lockedHint notu
  - 4 dilde (tr/en/ru/ar) lockedHint anahtarı eklendi

---
## [v1.5.0-alpha.4] - 2026-06-30 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(manufacturers): üretici kartı yeniden tasarlandı ve mobil filtre sheet eklendi (@ahmeetseker)
  - masaüstü kartı zengin 2-bölüm layout'a geçti (istatistik paneli, ürün kartları, galeri)
  - mobil kart sade tek-sıra düzende tutuldu (@container/sc breakpoint'leri)
  - galeri panelinde foto sayacı ve hover navigasyon okları eklendi
  - mobil kategori barındaki "doğrulanmış üretici" pill'i filtre ikonuyla değiştirildi (mfr-filter-open event'i)
  - discovery görünümünden gri zemin kaldırıldı, ManufacturerFilterSheet eklendi
  - ürünler sayfası başlığından "viewingLead" ön metni kaldırıldı
  - doğrulama rozeti x-if koşulu sadeleştirildi

---
## [v1.5.0-alpha.3] - 2026-06-30 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(app): doğrulama rozeti, kategori drill-down ve sonsuz kaydırma eklendi (@ahmeetseker)
  - Satıcı saha doğrulama rozeti eklendi (SupplierCard/StoreHeader/ManufacturerList)
  - VerificationBadge component'i, verification.* i18n ve SupplierInfo.verifications alanı eklendi
  - Paylaşılan BottomSheet, CategoryDrillSheet ve CategoryNavBar çıkarıldı
  - MobileCategoryBar ve HorizontalCategoryBar mobil kategori drill-down'a geçti
  - Kategori cache versiyonlama eklendi; ManufacturersHero ve TopDealsCategoryTabs merkezi loadCategories'e geçti
  - Üretici listesine sonsuz kaydırma (IntersectionObserver) ve verified filtresi eklendi
  - Manufacturers sayfasına mobil alt navigasyon (BottomNav) eklendi

### Duzeltildi
- fix(product): varyant başlığı varyant yokken gizlendi (@ahmeetseker)
  - Variations bölümü yalnızca backend varyant döndürdüğünde render ediliyor

### Degistirildi
- refactor(ui): neumorphic buton press efekti kaldırıldı (@ahmeetseker)
  - Global press selector'ından inset box-shadow ve scale(0.98) kaldırıldı
  - Tüm CTA'larda transition-all yerine açık transition listesi kullanıldı
  - --ease-drawer token'ı eklendi; --btn-shadow glossy highlight'tan arındırıldı
  - no-scrollbar yerine scrollbar-hide, link/toggle'lara th-no-press eklendi

---
## [v1.5.0-alpha.2] - 2026-06-30 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat: soru düzenleme, marka video oynatma, dev pretty-URL'leri (@boraydeger32)
  - qa: kendi Pending sorusunda inline ✎ Düzenle (updateProductQuestion) + i18n
  - media: marka tanıtım videosu yüklenen dosyadan oynar (renderVideo → dosya URL'inde <video>, eski YouTube/Vimeo'da embed fallback)
  - dev: vite prettyUrlRewritePlugin'e /magaza, /magaza/<code>/dukkan, /kategori, /marka eklendi (dev'de bu linkler artık ana sayfaya düşmüyor)

---
## [v1.5.0-alpha.1] - 2026-06-30 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(currency): mobil para birimi seçici ve boş sepet sembolü düzeltildi (@aliiball)
  - mobil pill'lere data-currency-pill + #currency-pills'e event delegation eklendi (rebuild innerHTML'i ezdiği için tek-sefer delegation; doğrudan listener kaybolurdu)
  - aktif pill artık seçili para birimini yansıtıyor (eskiden hep ilk pill aktifti)
  - boş sepet header ara toplamı hardcoded "$" yerine seçili sembolle başlıyor
- fix(product): varyant seçilince fiyat doğru biçimde güncelleniyor (@aliiball)
  - ortak applyVariantPrice helper'ı (variantPrice.ts) eklendi
  - masaüstü: varyant seçilince fiyat hiç güncellenmiyordu → güncelleniyor
  - mobil: getCurrencySymbol()+toFixed yerine formatCurrency (₺1250.00 → ₺1.250,00)
- fix(favorites): favori fiyatı donmuş string yerine güncel kura çevriliyor (@aliiball)
  - FavoriteItem'a native price + currency alanları eklendi
  - FavoritesSection BrowsingHistory desenine geçti (convertPrice + formatCurrency)
  - buyer-dashboard render öncesi initCurrency() await ediyor (bayat 38.5 kuru sorunu)
  - eski kayıtlar legacy priceRange string fallback ile geriye uyumlu
- fix(checkout): sipariş onay modalı tutarları formatCurrency ile biçimlendiriliyor (@aliiball)
  - "TRY 1234.56" ham biçim yerine "₺1.234,56" (OrderSummary ile tutarlı)
  - tutar değeri zaten doğruydu, yalnız biçim hizalandı
- fix(currency): başlangıç fiyatında binlik ayraç düzeltildi (@aliiball)
  - formatStartingPrice toLocaleString ile gruplama yapıyor ("₺7700" → "₺7.700")
- fix(cart): ara toplam satır toplamlarıyla tutarlı yuvarlanıyor (@aliiball)
  - getSummary çarp-sonra-convert kullanıyor (satır gösterimiyle aynı yuvarlama)
  - satır toplamları ile ara toplam kuruşu kuruşuna tutuyor
- fix(cart): misafir sepet native fiyat + para birimiyle saklanıyor (@aliiball)
  - drawer modellerine native alanlar eklendi (tier/color/size basePrice, item baseCurrency + baseSamplePrice)
  - syncToCartStore native fiyat + native currency yazıyor (oturumlu yolla aynı); native yoksa çevrilmiş + seçili currency'ye güvenli düşüş
  - gösterim her zaman güncel kura çevriliyor → donmuş-kur / round-trip drift giderildi
  - sepetten favori ekleme yolu da native price/currency taşıyor (K3 tamamlandı)
- fix(listing): fiyat filtresi seçili para birimini backend'e gönderiyor (@aliiball)
  - searchListings min/max ile birlikte filter_currency yolluyor; backend baz birime çevirip selling_price_base ile karşılaştırır

---
## [v1.5.0] - 2026-06-29 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(product-reviews): yorum düzenlemeyi window.prompt yerine modal'a taşı (@boraydeger32)
  - yeni: components/product/EditReviewModal.ts (+ barrel/registry/render)
  - ProductReviews.ts: prompt akışı kaldırıldı, openEditReviewModal kullanılıyor
  - i18n (tr/en/ar/ru): editReviewPrompt yerine modal metinleri
- feat(reviews): yorum düzenlerken fotoğraf güncelleme (@boraydeger32)
  - EditReviewModal: mevcut fotoğrafları kaldırma + yeni foto yükleme dropzone'u
  - updateOwnReview images gönderiyor; düzenle akışı mevcut görselleri taşıyor
  - WriteReviewModal dropzone config/texts export edildi
  - i18n: editReviewCurrentPhotos / editReviewRemovePhoto (tr/en/ru/ar)

---
## [v1.4.6-rc.1] - 2026-06-29 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(product-reviews): yorum düzenlemeyi window.prompt yerine modal'a taşı (@boraydeger32)
  - yeni: components/product/EditReviewModal.ts (+ barrel/registry/render)
  - ProductReviews.ts: prompt akışı kaldırıldı, openEditReviewModal kullanılıyor
  - i18n (tr/en/ar/ru): editReviewPrompt yerine modal metinleri
- feat(reviews): yorum düzenlerken fotoğraf güncelleme (@boraydeger32)
  - EditReviewModal: mevcut fotoğrafları kaldırma + yeni foto yükleme dropzone'u
  - updateOwnReview images gönderiyor; düzenle akışı mevcut görselleri taşıyor
  - WriteReviewModal dropzone config/texts export edildi
  - i18n: editReviewCurrentPhotos / editReviewRemovePhoto (tr/en/ru/ar)

---
## [v1.4.6-beta.2] - 2026-06-29 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(reviews): yorum düzenlerken fotoğraf güncelleme (@boraydeger32)
  - EditReviewModal: mevcut fotoğrafları kaldırma + yeni foto yükleme dropzone'u
  - updateOwnReview images gönderiyor; düzenle akışı mevcut görselleri taşıyor
  - WriteReviewModal dropzone config/texts export edildi
  - i18n: editReviewCurrentPhotos / editReviewRemovePhoto (tr/en/ru/ar)

---
## [v1.4.6-alpha.2] - 2026-06-29 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(reviews): yorum düzenlerken fotoğraf güncelleme (@boraydeger32)
  - EditReviewModal: mevcut fotoğrafları kaldırma + yeni foto yükleme dropzone'u
  - updateOwnReview images gönderiyor; düzenle akışı mevcut görselleri taşıyor
  - WriteReviewModal dropzone config/texts export edildi
  - i18n: editReviewCurrentPhotos / editReviewRemovePhoto (tr/en/ru/ar)

---
## [v1.4.6-alpha.1] - 2026-06-26 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Eklendi
- feat(product-reviews): yorum düzenlemeyi window.prompt yerine modal'a taşı (@boraydeger32)
  - yeni: components/product/EditReviewModal.ts (+ barrel/registry/render)
  - ProductReviews.ts: prompt akışı kaldırıldı, openEditReviewModal kullanılıyor
  - i18n (tr/en/ar/ru): editReviewPrompt yerine modal metinleri

---
## [v1.4.6] - 2026-06-26 PROD

Bu surum istoc.com'da yayindadir.

### Duzeltildi
- fix(vite): dev proxy hedefini 8088'e güncelle (@aliturguttursab)

---
## [v1.4.5-rc.1] - 2026-06-26 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Duzeltildi
- fix(vite): dev proxy hedefini 8088'e güncelle (@aliturguttursab)

---
## [v1.4.5-alpha.1] - 2026-06-25 ALPHA

Bu surum alpha.istoc.com'da gelistirme asamasindadir.

### Duzeltildi
- fix(vite): dev proxy hedefini 8088'e güncelle (@aliturguttursab)

---
## [v1.4.2] - 2026-06-17 PROD

Bu surum istoc.com'da yayindadir.

### Duzeltildi
- fix(storefront): mağaza sayfasında satıcı ürünleri/yorumları gözükmemesi (@boraydeger32)

---
## [v1.4.1-rc.1] - 2026-06-17 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Duzeltildi
- fix(storefront): mağaza sayfasında satıcı ürünleri/yorumları gözükmemesi (@boraydeger32)

---
## [v1.4.1-beta.1] - 2026-06-17 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(storefront): mağaza sayfasında satıcı ürünleri/yorumları gözükmemesi (@boraydeger32)

---
## [v1.4.1] - 2026-06-17 PROD

Bu surum istoc.com'da yayindadir.

### Degistirildi
- refactor(manufacturers): üretici kartı ürün/galeri düzeni yeniden ayarlandı (@ahmeetseker)
  - öne çıkan ürünler başlığındaki ürün adedi rozeti kaldırıldı
  - ürün kartlarına dar ekranda da kenarlık eklendi, galeri rayı tam genişliğe alındı, sağ kolon genişlikleri (260px / 1140px+ 320px) sabitlendi
  - Tümü feat/fix/refactor prefix'leriyle, geçmiş zaman fiil, başlık ≤72 karakter (commit.md
  - tradehub_core ve tradehubfront'u tek commit olarak istersen birleştirilmiş sürümlerini de
  - İstersen git add + commit komutlarını ben hazırlayıp sana vereyim (çalıştırmam), ya da sen kendi

---
## [v1.4.0-rc.1] - 2026-06-17 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Degistirildi
- refactor(manufacturers): üretici kartı ürün/galeri düzeni yeniden ayarlandı (@ahmeetseker)
  - öne çıkan ürünler başlığındaki ürün adedi rozeti kaldırıldı
  - ürün kartlarına dar ekranda da kenarlık eklendi, galeri rayı tam genişliğe alındı, sağ kolon genişlikleri (260px / 1140px+ 320px) sabitlendi
  - Tümü feat/fix/refactor prefix'leriyle, geçmiş zaman fiil, başlık ≤72 karakter (commit.md
  - tradehub_core ve tradehubfront'u tek commit olarak istersen birleştirilmiş sürümlerini de
  - İstersen git add + commit komutlarını ben hazırlayıp sana vereyim (çalıştırmam), ya da sen kendi

---
## [v1.4.0-beta.1] - 2026-06-17 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Degistirildi
- refactor(manufacturers): üretici kartı ürün/galeri düzeni yeniden ayarlandı (@ahmeetseker)
  - öne çıkan ürünler başlığındaki ürün adedi rozeti kaldırıldı
  - ürün kartlarına dar ekranda da kenarlık eklendi, galeri rayı tam genişliğe alındı, sağ kolon genişlikleri (260px / 1140px+ 320px) sabitlendi
  - Tümü feat/fix/refactor prefix'leriyle, geçmiş zaman fiil, başlık ≤72 karakter (commit.md
  - tradehub_core ve tradehubfront'u tek commit olarak istersen birleştirilmiş sürümlerini de
  - İstersen git add + commit komutlarını ben hazırlayıp sana vereyim (çalıştırmam), ya da sen kendi

---
## [v1.4.0] - 2026-06-16 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(ui): hareket cilası ve mobil üretici filtre çekmecesi eklendi (@ahmeetseker)
  - Üretici listesine mobil bottom-sheet filtre çekmecesi (ManufacturerFilterSheet) eklendi
  - Tutarlı giriş easing token'ı (--ease-emil cubic-bezier) ve motion-reduce fallback'leri eklendi
  - Shell içeriği init tamamlandıktan sonra yumuşak opacity geçişiyle gösteriliyor
  - iOS geri butonuna press/hover geri bildirimi eklendi
  - Accordion/SKU listelerinde x-collapse ve scaleX-tabanlı sekme alt çizgisi animasyonu eklendi
  - Krem renk tell'leri (#e8e6e0, #f7f7f5, #8a877f) nötr gri token'lara taşındı
  - th-no-press press yönetimi link/başlık/ikon butonlarına genişletildi
  - Yeni i18n anahtarları (varyant silme, MOQ uyarıları, mağaza profili) eklendi

### Duzeltildi
- fix(kyb): KYB taslak durumu için arayüz eklendi (@aliiball)
  - KYB durumu "Draft" iken "Taslak — Henüz Gönderilmedi" kartı ve gri durum rozeti gösteriliyor; yanlış "Beklemede" mesajı kaldırıldı
  - statusDraft/draftTitle/draftHint çevirileri tr/en/ar/ru'ya eklendi
- fix(product): ürün detayında duplicate "satıcı doğrulanmadı" uyarısı kaldırıldı (@aliiball)
- fix(currency): seçili para birimi tek kaynağa bağlandı, header rozeti dinamikleşti (@aliiball)
  - utils/currency get/setSelectedCurrency currencyService'e delege (desync giderildi, Kaydet currency-changed event'i fire ediyor)
  - header dil-para rozeti statik i18n yerine seçili dil + para birimini gösteriyor
- fix(currency): varyant modalı seçili para biriminde fiyat gösteriyor (@aliiball)
- fix(currency): checkout kargo, sipariş geçmişi ve sepet modalı fiyat çevirisi düzeltildi (@aliiball)
  - checkout kargo ücreti convertPrice ile çevriliyor
  - sipariş geçmişi order.currency kullanıyor; statik servis promo'ları sabit $ yapıldı
  - sepet önizleme kartı çevrilmiş fiyat basıyor
- fix(currency): favoriler ve gezinme geçmişinde fiyat seçili para birimine çevriliyor (@aliiball)
  - favori kartları listing detayından çevrilmiş fiyat gösteriyor
  - gezinme geçmişi (price, currency)'den canlı çeviriyor; hardcoded $ kaldırıldı
- fix(currency): listing cache anahtarına para birimi eklendi (kartlar artık çevriliyor) (@aliiball)
  - searchListings sonucu cache callback'i içinde çevriliyordu; key'de para birimi olmadığı için para birimi değişince eski kurla formatlı kartlar servis ediliyordu
  - key'e _cur eklendi → ana sayfa/liste/fırsat grid'leri doğru para biriminde

### Degistirildi
- refactor(subscription): kullanılmayan eski storefront abonelik sayfası kaldırıldı (@aliiball)
  - dashboard/subscription.html placeholder fiyatlarla sembol-swap ediyordu, hiçbir menüden link yoktu; sayfa + bileşenleri (kullanılmayan EntitlementBanner dahil) kaldırıldı (satıcı €599 fiyatlandırması ayrı, etkilenmedi)

---
## [v1.3.9-rc.1] - 2026-06-16 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(ui): hareket cilası ve mobil üretici filtre çekmecesi eklendi (@ahmeetseker)
  - Üretici listesine mobil bottom-sheet filtre çekmecesi (ManufacturerFilterSheet) eklendi
  - Tutarlı giriş easing token'ı (--ease-emil cubic-bezier) ve motion-reduce fallback'leri eklendi
  - Shell içeriği init tamamlandıktan sonra yumuşak opacity geçişiyle gösteriliyor
  - iOS geri butonuna press/hover geri bildirimi eklendi
  - Accordion/SKU listelerinde x-collapse ve scaleX-tabanlı sekme alt çizgisi animasyonu eklendi
  - Krem renk tell'leri (#e8e6e0, #f7f7f5, #8a877f) nötr gri token'lara taşındı
  - th-no-press press yönetimi link/başlık/ikon butonlarına genişletildi
  - Yeni i18n anahtarları (varyant silme, MOQ uyarıları, mağaza profili) eklendi

### Duzeltildi
- fix(kyb): KYB taslak durumu için arayüz eklendi (@aliiball)
  - KYB durumu "Draft" iken "Taslak — Henüz Gönderilmedi" kartı ve gri durum rozeti gösteriliyor; yanlış "Beklemede" mesajı kaldırıldı
  - statusDraft/draftTitle/draftHint çevirileri tr/en/ar/ru'ya eklendi
- fix(product): ürün detayında duplicate "satıcı doğrulanmadı" uyarısı kaldırıldı (@aliiball)
- fix(currency): seçili para birimi tek kaynağa bağlandı, header rozeti dinamikleşti (@aliiball)
  - utils/currency get/setSelectedCurrency currencyService'e delege (desync giderildi, Kaydet currency-changed event'i fire ediyor)
  - header dil-para rozeti statik i18n yerine seçili dil + para birimini gösteriyor
- fix(currency): varyant modalı seçili para biriminde fiyat gösteriyor (@aliiball)
- fix(currency): checkout kargo, sipariş geçmişi ve sepet modalı fiyat çevirisi düzeltildi (@aliiball)
  - checkout kargo ücreti convertPrice ile çevriliyor
  - sipariş geçmişi order.currency kullanıyor; statik servis promo'ları sabit $ yapıldı
  - sepet önizleme kartı çevrilmiş fiyat basıyor
- fix(currency): favoriler ve gezinme geçmişinde fiyat seçili para birimine çevriliyor (@aliiball)
  - favori kartları listing detayından çevrilmiş fiyat gösteriyor
  - gezinme geçmişi (price, currency)'den canlı çeviriyor; hardcoded $ kaldırıldı
- fix(currency): listing cache anahtarına para birimi eklendi (kartlar artık çevriliyor) (@aliiball)
  - searchListings sonucu cache callback'i içinde çevriliyordu; key'de para birimi olmadığı için para birimi değişince eski kurla formatlı kartlar servis ediliyordu
  - key'e _cur eklendi → ana sayfa/liste/fırsat grid'leri doğru para biriminde

### Degistirildi
- refactor(subscription): kullanılmayan eski storefront abonelik sayfası kaldırıldı (@aliiball)
  - dashboard/subscription.html placeholder fiyatlarla sembol-swap ediyordu, hiçbir menüden link yoktu; sayfa + bileşenleri (kullanılmayan EntitlementBanner dahil) kaldırıldı (satıcı €599 fiyatlandırması ayrı, etkilenmedi)

---
## [v1.3.9-beta.3] - 2026-06-16 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(kyb): KYB taslak durumu için arayüz eklendi (@aliiball)
  - KYB durumu "Draft" iken "Taslak — Henüz Gönderilmedi" kartı ve gri durum rozeti gösteriliyor; yanlış "Beklemede" mesajı kaldırıldı
  - statusDraft/draftTitle/draftHint çevirileri tr/en/ar/ru'ya eklendi
- fix(product): ürün detayında duplicate "satıcı doğrulanmadı" uyarısı kaldırıldı (@aliiball)
- fix(currency): seçili para birimi tek kaynağa bağlandı, header rozeti dinamikleşti (@aliiball)
  - utils/currency get/setSelectedCurrency currencyService'e delege (desync giderildi, Kaydet currency-changed event'i fire ediyor)
  - header dil-para rozeti statik i18n yerine seçili dil + para birimini gösteriyor
- fix(currency): varyant modalı seçili para biriminde fiyat gösteriyor (@aliiball)
- fix(currency): checkout kargo, sipariş geçmişi ve sepet modalı fiyat çevirisi düzeltildi (@aliiball)
  - checkout kargo ücreti convertPrice ile çevriliyor
  - sipariş geçmişi order.currency kullanıyor; statik servis promo'ları sabit $ yapıldı
  - sepet önizleme kartı çevrilmiş fiyat basıyor
- fix(currency): favoriler ve gezinme geçmişinde fiyat seçili para birimine çevriliyor (@aliiball)
  - favori kartları listing detayından çevrilmiş fiyat gösteriyor
  - gezinme geçmişi (price, currency)'den canlı çeviriyor; hardcoded $ kaldırıldı
- fix(currency): listing cache anahtarına para birimi eklendi (kartlar artık çevriliyor) (@aliiball)
  - searchListings sonucu cache callback'i içinde çevriliyordu; key'de para birimi olmadığı için para birimi değişince eski kurla formatlı kartlar servis ediliyordu
  - key'e _cur eklendi → ana sayfa/liste/fırsat grid'leri doğru para biriminde

### Degistirildi
- refactor(subscription): kullanılmayan eski storefront abonelik sayfası kaldırıldı (@aliiball)
  - dashboard/subscription.html placeholder fiyatlarla sembol-swap ediyordu, hiçbir menüden link yoktu; sayfa + bileşenleri (kullanılmayan EntitlementBanner dahil) kaldırıldı (satıcı €599 fiyatlandırması ayrı, etkilenmedi)

---
## [v1.3.9-beta.2] - 2026-06-16 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(ui): hareket cilası ve mobil üretici filtre çekmecesi eklendi (@ahmeetseker)
  - Üretici listesine mobil bottom-sheet filtre çekmecesi (ManufacturerFilterSheet) eklendi
  - Tutarlı giriş easing token'ı (--ease-emil cubic-bezier) ve motion-reduce fallback'leri eklendi
  - Shell içeriği init tamamlandıktan sonra yumuşak opacity geçişiyle gösteriliyor
  - iOS geri butonuna press/hover geri bildirimi eklendi
  - Accordion/SKU listelerinde x-collapse ve scaleX-tabanlı sekme alt çizgisi animasyonu eklendi
  - Krem renk tell'leri (#e8e6e0, #f7f7f5, #8a877f) nötr gri token'lara taşındı
  - th-no-press press yönetimi link/başlık/ikon butonlarına genişletildi
  - Yeni i18n anahtarları (varyant silme, MOQ uyarıları, mağaza profili) eklendi

---
## [v1.3.9] - 2026-06-15 PROD

Bu surum istoc.com'da yayindadir.

### Duzeltildi
- fix(perm): Seller Owner mağaza profili yazma izni geri verildi (@ahmeetseker)
  - Admin Seller Profile Custom DocPerm'inde Seller Owner permlevel-0 satırı eksikti; satıcı kendi profilini okuyabiliyor ama kaydedemiyordu ("does not have doctype access via role permission" 403)
  - v15_8_1_seller_owner_asp_docperm patch'i permlevel-0 read/write ekler (if_owner=0; izolasyonu admin_seller_profile_has_permission hook sağlar)
  - v15_5_1 RBAC reseed regresyonu; Listing (v15_7_1) ve KYB/KYC (v15_7_6) düzeltilmişti, Admin Seller Profile atlanmıştı

### Degistirildi
- refactor(ci): lint workflow PR tetiği kaldırıldı (@ahmeetseker)
  - pull_request trigger silindi; lint artık sadece push'ta çalışır

---
## [v1.3.8-rc.1] - 2026-06-15 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Duzeltildi
- fix(perm): Seller Owner mağaza profili yazma izni geri verildi (@ahmeetseker)
  - Admin Seller Profile Custom DocPerm'inde Seller Owner permlevel-0 satırı eksikti; satıcı kendi profilini okuyabiliyor ama kaydedemiyordu ("does not have doctype access via role permission" 403)
  - v15_8_1_seller_owner_asp_docperm patch'i permlevel-0 read/write ekler (if_owner=0; izolasyonu admin_seller_profile_has_permission hook sağlar)
  - v15_5_1 RBAC reseed regresyonu; Listing (v15_7_1) ve KYB/KYC (v15_7_6) düzeltilmişti, Admin Seller Profile atlanmıştı

### Degistirildi
- refactor(ci): lint workflow PR tetiği kaldırıldı (@ahmeetseker)
  - pull_request trigger silindi; lint artık sadece push'ta çalışır

---
## [v1.3.8-beta.1] - 2026-06-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(perm): Seller Owner mağaza profili yazma izni geri verildi (@ahmeetseker)
  - Admin Seller Profile Custom DocPerm'inde Seller Owner permlevel-0 satırı eksikti; satıcı kendi profilini okuyabiliyor ama kaydedemiyordu ("does not have doctype access via role permission" 403)
  - v15_8_1_seller_owner_asp_docperm patch'i permlevel-0 read/write ekler (if_owner=0; izolasyonu admin_seller_profile_has_permission hook sağlar)
  - v15_5_1 RBAC reseed regresyonu; Listing (v15_7_1) ve KYB/KYC (v15_7_6) düzeltilmişti, Admin Seller Profile atlanmıştı

### Degistirildi
- refactor(ci): lint workflow PR tetiği kaldırıldı (@ahmeetseker)
  - pull_request trigger silindi; lint artık sadece push'ta çalışır

---
## [v1.3.8] - 2026-06-12 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(satici-ol): pricing varsayılanı aylık + matris dinamik + komisyon "Özel" (@boraydeger32)
  - Paket toggle varsayılanı aylık; buton sırası Aylık | Yıllık olarak değişti
  - İlk render fallback'leri aylık (fiyat, periyot, alt açıklama — FOUC yok)
  - Karşılaştırma tablosu başlık fiyatları ve periyot metni artık toggle'a bağlı (x-text), escJs helper ile tek tırnak kaçışı
  - commissionLabel: commission_custom ise "Özel", aksi halde %X (0 dahil)
  - i18n: monthlyPeriodVatExcl + commissionCustom anahtarları (tr/en/ru/ar)

---
## [v1.3.7-rc.1] - 2026-06-12 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(satici-ol): pricing varsayılanı aylık + matris dinamik + komisyon "Özel" (@boraydeger32)
  - Paket toggle varsayılanı aylık; buton sırası Aylık | Yıllık olarak değişti
  - İlk render fallback'leri aylık (fiyat, periyot, alt açıklama — FOUC yok)
  - Karşılaştırma tablosu başlık fiyatları ve periyot metni artık toggle'a bağlı (x-text), escJs helper ile tek tırnak kaçışı
  - commissionLabel: commission_custom ise "Özel", aksi halde %X (0 dahil)
  - i18n: monthlyPeriodVatExcl + commissionCustom anahtarları (tr/en/ru/ar)

---
## [v1.3.7-beta.1] - 2026-06-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(satici-ol): pricing varsayılanı aylık + matris dinamik + komisyon "Özel" (@boraydeger32)
  - Paket toggle varsayılanı aylık; buton sırası Aylık | Yıllık olarak değişti
  - İlk render fallback'leri aylık (fiyat, periyot, alt açıklama — FOUC yok)
  - Karşılaştırma tablosu başlık fiyatları ve periyot metni artık toggle'a bağlı (x-text), escJs helper ile tek tırnak kaçışı
  - commissionLabel: commission_custom ise "Özel", aksi halde %X (0 dahil)
  - i18n: monthlyPeriodVatExcl + commissionCustom anahtarları (tr/en/ru/ar)

---
## [v1.3.7] - 2026-06-12 PROD

Bu surum istoc.com'da yayindadir.

### Duzeltildi
- fix(auth): süresi dolmuş OTP'de doğru uyarı ve anında tekrar gönder (@aliiball)
  - 404 (kod bulunamadı/süresi doldu) artık generic "kod hatalı" yerine ayrı OtpExpiredError ile yakalanıyor
  - süre dolunca "Kodun süresi doldu, yeni kod isteyin" mesajı gösteriliyor ve "Tekrar gönder" 60sn beklenmeden anında aktifleşiyor
  - ortak enableResendNow helper'ı çıkarıldı; lockout bloğu da onu kullanıyor
  - auth.otpExpired anahtarı 4 dile eklendi (tr/en/ar/ru)

---
## [v1.3.6-rc.1] - 2026-06-12 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Duzeltildi
- fix(auth): süresi dolmuş OTP'de doğru uyarı ve anında tekrar gönder (@aliiball)
  - 404 (kod bulunamadı/süresi doldu) artık generic "kod hatalı" yerine ayrı OtpExpiredError ile yakalanıyor
  - süre dolunca "Kodun süresi doldu, yeni kod isteyin" mesajı gösteriliyor ve "Tekrar gönder" 60sn beklenmeden anında aktifleşiyor
  - ortak enableResendNow helper'ı çıkarıldı; lockout bloğu da onu kullanıyor
  - auth.otpExpired anahtarı 4 dile eklendi (tr/en/ar/ru)

---
## [v1.3.6-beta.1] - 2026-06-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(auth): süresi dolmuş OTP'de doğru uyarı ve anında tekrar gönder (@aliiball)
  - 404 (kod bulunamadı/süresi doldu) artık generic "kod hatalı" yerine ayrı OtpExpiredError ile yakalanıyor
  - süre dolunca "Kodun süresi doldu, yeni kod isteyin" mesajı gösteriliyor ve "Tekrar gönder" 60sn beklenmeden anında aktifleşiyor
  - ortak enableResendNow helper'ı çıkarıldı; lockout bloğu da onu kullanıyor
  - auth.otpExpired anahtarı 4 dile eklendi (tr/en/ar/ru)

---
## [v1.3.6] - 2026-06-12 PROD

Bu surum istoc.com'da yayindadir.

### Duzeltildi
- fix(security): Capacitor WebView navigasyon kısıtı (@boraydeger32)

---
## [v1.3.5-rc.1] - 2026-06-12 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Duzeltildi
- fix(security): Capacitor WebView navigasyon kısıtı (@boraydeger32)

---
## [v1.3.5-beta.1] - 2026-06-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(security): Capacitor WebView navigasyon kısıtı (@boraydeger32)

---
## [v1.3.5] - 2026-06-11 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(nginx): birleşik container'da /panel admin SPA servisi ve SEO domain maskeleme eklendi (@ahmeetseker)
  - /panel location bloğu eklendi: birleşik container'da (PROD/istoc) admin paneli aynı container'dan serve edilir; ^~ ile asset regex'lerine düşmesi engellendi
  - SEO render location'larında (listing/category/brand/seller/static) sub_filter ile paylaşım önizlemesindeki backend domaini frontend domaine çevrildi (canonical/og:url)
  - sub_filter için proxy Accept-Encoding boşaltıldı (gzip yanıtta filtre çalışsın)

---
## [v1.3.4-rc.1] - 2026-06-11 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(nginx): birleşik container'da /panel admin SPA servisi ve SEO domain maskeleme eklendi (@ahmeetseker)
  - /panel location bloğu eklendi: birleşik container'da (PROD/istoc) admin paneli aynı container'dan serve edilir; ^~ ile asset regex'lerine düşmesi engellendi
  - SEO render location'larında (listing/category/brand/seller/static) sub_filter ile paylaşım önizlemesindeki backend domaini frontend domaine çevrildi (canonical/og:url)
  - sub_filter için proxy Accept-Encoding boşaltıldı (gzip yanıtta filtre çalışsın)

---
## [v1.3.4-beta.1] - 2026-06-11 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(nginx): birleşik container'da /panel admin SPA servisi ve SEO domain maskeleme eklendi (@ahmeetseker)
  - /panel location bloğu eklendi: birleşik container'da (PROD/istoc) admin paneli aynı container'dan serve edilir; ^~ ile asset regex'lerine düşmesi engellendi
  - SEO render location'larında (listing/category/brand/seller/static) sub_filter ile paylaşım önizlemesindeki backend domaini frontend domaine çevrildi (canonical/og:url)
  - sub_filter için proxy Accept-Encoding boşaltıldı (gzip yanıtta filtre çalışsın)

---
## [v1.3.4] - 2026-06-11 PROD

Bu surum istoc.com'da yayindadir.

### Duzeltildi
- fix(seo): canonical ve og:url paylaşımda backend domaini gösterme hatası düzeltildi (@ahmeetseker)
  - applyServerSeo artık canonical, og:url ve hreflang URL'lerini mevcut origin'e (istoc.com) sabitliyor; backend payload'u bunları kendi domain'iyle (istoc.cronbi.com) ürettiği için Safari "Paylaş" DOM'daki canonical'ı okuyup backend domainini gösteriyordu
  - toCurrentOrigin helper'ı eklendi (path/query korunur, host origin'e çevrilir); og:image dış CDN olabileceği için kapsam dışı bırakıldı
  - ortamdan bağımsız çalışır (rc/beta/prod kendi domainini gösterir)

### Degistirildi
- refactor(format): storefront kaynakları Prettier ile yeniden biçimlendirildi (@ahmeetseker)

---
## [v1.3.3-rc.1] - 2026-06-11 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Duzeltildi
- fix(seo): canonical ve og:url paylaşımda backend domaini gösterme hatası düzeltildi (@ahmeetseker)
  - applyServerSeo artık canonical, og:url ve hreflang URL'lerini mevcut origin'e (istoc.com) sabitliyor; backend payload'u bunları kendi domain'iyle (istoc.cronbi.com) ürettiği için Safari "Paylaş" DOM'daki canonical'ı okuyup backend domainini gösteriyordu
  - toCurrentOrigin helper'ı eklendi (path/query korunur, host origin'e çevrilir); og:image dış CDN olabileceği için kapsam dışı bırakıldı
  - ortamdan bağımsız çalışır (rc/beta/prod kendi domainini gösterir)

### Degistirildi
- refactor(format): storefront kaynakları Prettier ile yeniden biçimlendirildi (@ahmeetseker)

---
## [v1.3.3-beta.1] - 2026-06-11 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(seo): canonical ve og:url paylaşımda backend domaini gösterme hatası düzeltildi (@ahmeetseker)
  - applyServerSeo artık canonical, og:url ve hreflang URL'lerini mevcut origin'e (istoc.com) sabitliyor; backend payload'u bunları kendi domain'iyle (istoc.cronbi.com) ürettiği için Safari "Paylaş" DOM'daki canonical'ı okuyup backend domainini gösteriyordu
  - toCurrentOrigin helper'ı eklendi (path/query korunur, host origin'e çevrilir); og:image dış CDN olabileceği için kapsam dışı bırakıldı
  - ortamdan bağımsız çalışır (rc/beta/prod kendi domainini gösterir)

### Degistirildi
- refactor(format): storefront kaynakları Prettier ile yeniden biçimlendirildi (@ahmeetseker)

---
## [v1.3.2] - 2026-06-11 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(sell): trial niyetini satıcı başvurusuna taşı (@boraydeger32)

### Degistirildi
- refactor(sell): pricing kartlarından boş "Paket İçeriği" bölümünü kaldır (@boraydeger32)

---
## [v1.3.1-rc.1] - 2026-06-11 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(sell): trial niyetini satıcı başvurusuna taşı (@boraydeger32)

### Degistirildi
- refactor(sell): pricing kartlarından boş "Paket İçeriği" bölümünü kaldır (@boraydeger32)

---
## [v1.3.1-beta.2] - 2026-06-11 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(sell): trial niyetini satıcı başvurusuna taşı (@boraydeger32)

---
## [v1.3.1-beta.1] - 2026-06-11 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Degistirildi
- refactor(sell): pricing kartlarından boş "Paket İçeriği" bölümünü kaldır (@boraydeger32)

---
## [v1.3.1] - 2026-06-10 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(sell): trial niyetini satıcı başvurusuna taşı (@boraydeger32)

---
## [v1.3.0-rc.1] - 2026-06-10 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(sell): trial niyetini satıcı başvurusuna taşı (@boraydeger32)

---
## [v1.3.0-beta.1] - 2026-06-10 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(sell): trial niyetini satıcı başvurusuna taşı (@boraydeger32)

---
## [v1.3.0] - 2026-06-10 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(i18n): ürün detay yorum akışı çevirisi + storefront i18n/RTL düzeltmeleri (@aliturguttursab)
  - WriteReviewModal.ts + ProductReviews.ts: koda gömülü Türkçe metinler (modal başlık/etiket/buton/dropzone/puanlama boyutları + JS hata/başarı mesajları, "Yorum Yaz" butonu, Soru&Cevap sekmesi, değerlendirici rozetleri, edit tooltip) artık t() ile çözülüyor.
  - i18n/locales/{en,tr,ar,ru}.ts: product.reviewWrite.* (~39 anahtar).
  - Modül-seviyesi sabit haritalar (ASPECT_LABELS, REVIEW_DROPZONE_TEXTS) fonksiyona çevrildi ki t() import anında değil render/açılış anında çözülsün.
  - services/categoryService.ts, listingService.ts, utils/api.ts: GET isteklerine aktif içerik dili (lang) eklenmesi + detay/varyant displayLabel eşlemesi.
  - types/product.ts: ProductVariant/VariantOption displayLabel alanları.
  - components/product/{ProductInfo,MobileLayout}.ts: varyant gösteriminde displayLabel || label.
  - components/cart/molecules/ProductItem.ts, settings/SettingsPrivacy.ts: i18n düzeltmeleri.
  - vite.config.ts: dev-only pretty-URL rewrite (/urun/<slug> → product detail entry) — dev server'da Nginx olmadığı için.
- feat(i18n): Soru & Cevap (Q&A) bölümü çevirisi (@aliturguttursab)
  - Soru sorma formu (başlık, alt açıklama, placeholder, gönder butonu).
  - Liste durumları: yükleniyor, boş durum, onay-bekliyor/doğrulanmış rozetleri, faydalı sayacı + tooltip'ler, satıcı/alıcı cevabı, cevap yok.
  - JS toast/hata mesajları (min karakter, ürün yüklenmedi, soru alındı, oy alındı / zaten oy verildi / oy verilemedi).
- feat(i18n): storefront genel i18n süpürmesi — kalan tüm alanlar (en/tr/ar/ru) (@aliturguttursab)
  - Satıcı: seller-dashboard, sell/pricing sayfaları, seller-verification, seller-shop, alpine/seller, utils/seller
  - Siparişler + RFQ, Ayarlar, Trade Assurance, bilgi sayfaları (payments, refund-policy, membership, shipping-logistics, after-sales), KYC/KYB
  - Yardım merkezi, buyer dashboard, favoriler, auth + adresler
  - Checkout/sepet, üreticiler, header/nav/floating/footer
  - Chat/bildirim/mesaj/rezervasyon servisleri, upload-ui facade'ları
  - Ürün artıkları (ReportAbuseModal, WriteReviewModal dropzone, vb.)
- feat(i18n): HTML sayfa başlıklarını (document.title) çevir (en/tr/ar/ru) (@aliturguttursab)
  - 67 sayfanın <title>'ına data-i18n="pageTitle.<key>" eklendi (Türkçe metin no-JS/SEO fallback olarak korundu).
  - i18n/locales/{en,tr,ar,ru}.ts: pageTitle namespace (67 anahtar × 4 dil); marka "iSTOC TradeHub" korunarak açıklama kısmı çevrildi.
  - i18n/index.ts: import-anında <title data-i18n> anahtarından document.title ilk boyamada set ediliyor; dil değişiminde mevcut updatePageTranslations <title> textContent'ini güncellediği için başlık canlı değişiyor.
- feat(query): add IndexedDB AsyncStorage adapter for persister (@ahmeetseker)
- feat(query): add query key factory and per-resource cache policies (@TurksabYonetim)
- feat(query): add shared QueryClient with IndexedDB persister and queryFetch wrapper (@TurksabYonetim)
- feat(native): iOS hazırlığı — cross-origin API köprüsü + iOS geri butonu (@aliturguttursab)
  - server bloğu env-driven: CAP_SERVER_URL verilirse dev live-reload, yoksa bundle (App Store) modu. Makineye-özel IP artık koda gömülü değil.
  - CapacitorHttp.enabled=true → fetch native ağdan geçer; cross-origin istekler browser CORS'a takılmaz, cookie native jar'da (backend CORS gereksiz).
  - src/utils/nativeHttp.ts (yeni): bundle modunda window.fetch'i sarıp /api|/files|/private|/assets|/socket.io URL'lerini VITE_NATIVE_API_URL ile mutlaklaştırır. Web ve live-reload'da no-op.
  - src/utils/api.ts: BASE_URL (+ window.API_BASE) native bundle'da mutlak backend.
  - src/utils/nativeBackButton.ts (yeni): yalnızca native iOS'ta sol-üste, safe-area altına yüzen geri butonu enjekte eder; ana sayfada gizli; RTL uyumlu; history.back() / ana sayfa fallback. Web ve Android'de no-op.
- feat(pricing): satıcı paketleri kart ve karşılaştırma düzenlemeleri (@boraydeger32)
  - Pricing kartları: ortak özellik seti + ✓/✗ ile eşit uzunluk
  - enum/quota değerleri kartta gösterimi ("Destek seviyesi: 7×24 tahsisli")
  - "Yakında" rozeti (henüz çalışmayan özellikler için, coming_soon)
  - fiyat yerine özel metin (price_override_label) desteği
  - "14 gün ücretsiz dene" bandı (en dolu paket → kayıt yönlendirmesi)
  - "Diğer pazaryerlerine göre" rakip karşılaştırma bölümü kaldırıldı
  - pricingService: price_override_label / text_value / coming_soon / show_on_card tip alanları
- feat(i18n): SellPageLayout + MegaMenu i18n'ini geri uygula (@aliturguttursab)
  - MegaMenu: "Tümünü gör" → t("commonNav.viewAll")
  - SellPageLayout: tüm hardcoded TR → t("sellPage.*") (49 mevcut anahtar yeniden kullanıldı + 5 yeni: hero başlık/açıklama, görsel alt, üretici desteği, başvuru linki)
  - locales {en,tr,ar,ru}: 5 yeni sellPage anahtarı
- feat(pricing): karşılaştırma tablosunda "Yakında" rozeti + cache bump (@boraydeger32)
  - PricingMatrixFeature / MatrixRow tiplerine coming_soon eklendi; karşılaştırma tablosu satır adının yanında "Yakında" rozeti gösterir (kartlarla senkron)
  - localStorage cache anahtarı v3 → v4 (eski önbellek coming_soon alanını taşımadığı için otomatik geçersiz kılınır)
- feat(storefront): 2xl geniş ekran desteği ve iStoc marka geçişi (@ahmeetseker)
  - Kategori Vitrini bento grid 2xl'de tile sayısına göre +2 sütuna genişler (max-w-1680px, tam bölen kontrolüyle boşluksuz)
  - Hero slider 2xl breakpoint'inde tipografi/padding/spacing ölçeklenir
  - Marka adı "Thoptan Ltd." → "iStoc Private Company Limited" güncellendi (tr/en/ru/ar + yasal bildirim)
  - Footer operatedBy satırı kaldırıldı, telif "© 2026 iStoc Private Company Limited" olarak sadeleşti
  - MegaMenu'deki kullanılmayan renderSectorBody fonksiyonu temizlendi
  - Kullanılmayan import'lar ve mükerrer favIcon import'u kaldırıldı
- feat(trial): Enterprise butonu "14 gun ucretsiz dene" + komisyon/Yakinda fix (@boraydeger32)
  - Trial paketinin ANA buton metni "X gun ucretsiz dene" olur (trial_config); ayri buton-ustu CTA ve ust bant kaldirildi
  - Komisyon kartta/matriste her zaman gercek oran (0 -> "%0"); "Ozel" kaldirildi
  - Karsilastirma tablosunda "Yakinda" rozeti (matris coming_soon)
  - pricingService: trial_config + coming_soon tipleri; cache anahtari v4->v6
- feat(sell): show feature tooltips as hover ⓘ in pricing comparison table (@boraydeger32)

### Duzeltildi
- fix(i18n): en/ar/ru locale parite — tr'de olup eksik 43 anahtarı çevir/ekle (@aliturguttursab)
  - settings.consent* / downloadMyData* (KVKK/GDPR onay yönetimi + veri indirme)
  - product.* (sipariş koruma / işlem süresi bölümleri)
  - rfq.*, auth.*, checkout.*, kyb.* + birkaç mock veri anahtarı
- fix(security): tüm UI bileşenlerinde XSS koruması için HTML/URL kaçışlaması ekle (@ahmeetseker)
  - escapeHtml: 693 noktada metin/öznitelik enjeksiyonuna karşı
  - sanitizeUrl: 219 noktada javascript:/data: gibi URL şemalarına karşı
  - src/utils/sanitize.ts: yardımcı fonksiyonlar güncellendi
- fix(currency): rebuild currency picker list after async rates load (@TurksabYonetim)
- fix(categories): show error UI when category load fails (empty result) (@TurksabYonetim)
- fix(pwa): NetworkFirst for HTML documents to stop stale blank-page-on-navigation (@TurksabYonetim)
- fix(alpine): register @alpinejs/collapse plugin for x-collapse directive (@TurksabYonetim)
- fix(header): remove orphaned mobile-menu-drawer from full header (@TurksabYonetim)
- fix(a11y): add aria-labels, alt text, ARIA roles, contrast & tap targets (@TurksabYonetim)
  - ikonlu butonlara aria-label eklendi (kapat/ara/ileri-geri, şifre göster, kopyala, düzenle, fotoğraf yükle, video kontrolleri)
  - görsellere anlamlı alt metni verildi (banner/varyant/rozet/promosyon)
  - yanlış ARIA rolleri düzeltildi (list→group, ProductGrid'e listitem)
  - TopBar sticky aramadan geçersiz aria-expanded kaldırıldı
  - --color-text-tertiary AA kontrast için #a3a3a3→#737373
  - dot dokunma hedefleri WCAG 2.5.8 için 24px'e çıkarıldı perf(nginx): enable gzip + immutable cache for hashed/static assets
  - metin asset'leri için gzip (css/js/json/svg)
  - hash'li /assets/ 1 yıl immutable, statik medya 30 gün Cache-Control
- fix(lint): simplify lint workflow by removing auto-fix steps and changing permissions (@TurksabYonetim)
- fix(merge): main merge artefaktlarını onar + eksik bağımlılık (@aliturguttursab)
  - searchListings (listingService): main'in queryFetch cache sarmalayıcısı + benim i18n sort etiketlerim birleştirildi (Unexpected "," giderildi).
  - ProductItem: çift favIcon import kaldırıldı, eksik `const isFav` geri eklendi.
  - ProductVideoSection: eksik escapeHtml/sanitizeUrl import'u eklendi.
  - MobileLayout, ProductInfo: kullanılmayan safeHexColor import'tan çıkarıldı.
  - categoryService: kullanılmayan _promise kaldırıldı.
  - SellPageLayout, MegaMenu: derin ayrışma — main'in versiyonu alındı (dinamik fiyat matrisi + 3-seviye mega menü). NOT: bu 2 dosyada i18n etiketleri main'in hardcoded TR'sine döndü; ayrıca yeniden uygulanacak.
- fix(dev): vite /api proxy hedefini env-driven yap (varsayılan :8088) (@aliturguttursab)
- fix(auth): login promosyon panelinde komisyon mesajı sıfır komisyon olarak güncellendi (@ahmeetseker)
  - promoSubtitle "şeffaf komisyon" → "sıfır komisyon"
  - featTransparent "Şeffaf" → "Komisyonsuz"
  - featTransparentDesc "Komisyon Yapısı" → "%0 Komisyon"
  - 4 locale (tr/en/ar/ru) güncellendi
- fix(i18n): tekrarlanan t import'ları kaldırıldı, storefront build düzeltildi (@ahmeetseker)
  - 9 dosyada merge artığı çift "import { t } from i18n" satırı silindi
  - Rollup "Identifier t has already been declared" hatası giderildi
  - beta.istoc.com otomatik deploy build'i artık geçiyor (vite build temiz)
- fix(storefront): satıcı→mağaza linki doğru mağazayı açar (@aliiball)
  - getSellerUrl artık ?seller=<code> üretir (sayfanın okuduğu parametre)
  - sellerShop /magaza/<code> path'ini de okur (Mağazayı ziyaret et linkleri)
  - mock satıcı yalnız demo'da yüklenir (geçersiz satıcıda yanlış mağaza maskelenmez)
- fix(storefront): video_url boşken VIDEO rozeti gösterilmez (@aliiball)
  - mapListingDetail boş/whitespace videoUrl'i galeriye eklemez
  - ProductImageGallery video thumb'ı yalnız isVideo && src dolu iken çizer
- fix(seller): Mağazalarım panel URL'i host-relative /panel/ yapıldı (@ahmeetseker)

### Degistirildi
- refactor(category): route loadCategories through queryFetch with IndexedDB persist (@TurksabYonetim)
- refactor(currency): replace hand-rolled localStorage cache with queryFetch (@TurksabYonetim)
- refactor(listing): cache searchListings via queryFetch; document SW boundary (@TurksabYonetim)
- refactor(categories): route categories page through cached categoryService (@TurksabYonetim)

---
## [v1.2.1-rc.1] - 2026-06-10 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(i18n): ürün detay yorum akışı çevirisi + storefront i18n/RTL düzeltmeleri (@aliturguttursab)
  - WriteReviewModal.ts + ProductReviews.ts: koda gömülü Türkçe metinler (modal başlık/etiket/buton/dropzone/puanlama boyutları + JS hata/başarı mesajları, "Yorum Yaz" butonu, Soru&Cevap sekmesi, değerlendirici rozetleri, edit tooltip) artık t() ile çözülüyor.
  - i18n/locales/{en,tr,ar,ru}.ts: product.reviewWrite.* (~39 anahtar).
  - Modül-seviyesi sabit haritalar (ASPECT_LABELS, REVIEW_DROPZONE_TEXTS) fonksiyona çevrildi ki t() import anında değil render/açılış anında çözülsün.
  - services/categoryService.ts, listingService.ts, utils/api.ts: GET isteklerine aktif içerik dili (lang) eklenmesi + detay/varyant displayLabel eşlemesi.
  - types/product.ts: ProductVariant/VariantOption displayLabel alanları.
  - components/product/{ProductInfo,MobileLayout}.ts: varyant gösteriminde displayLabel || label.
  - components/cart/molecules/ProductItem.ts, settings/SettingsPrivacy.ts: i18n düzeltmeleri.
  - vite.config.ts: dev-only pretty-URL rewrite (/urun/<slug> → product detail entry) — dev server'da Nginx olmadığı için.
- feat(i18n): Soru & Cevap (Q&A) bölümü çevirisi (@aliturguttursab)
  - Soru sorma formu (başlık, alt açıklama, placeholder, gönder butonu).
  - Liste durumları: yükleniyor, boş durum, onay-bekliyor/doğrulanmış rozetleri, faydalı sayacı + tooltip'ler, satıcı/alıcı cevabı, cevap yok.
  - JS toast/hata mesajları (min karakter, ürün yüklenmedi, soru alındı, oy alındı / zaten oy verildi / oy verilemedi).
- feat(i18n): storefront genel i18n süpürmesi — kalan tüm alanlar (en/tr/ar/ru) (@aliturguttursab)
  - Satıcı: seller-dashboard, sell/pricing sayfaları, seller-verification, seller-shop, alpine/seller, utils/seller
  - Siparişler + RFQ, Ayarlar, Trade Assurance, bilgi sayfaları (payments, refund-policy, membership, shipping-logistics, after-sales), KYC/KYB
  - Yardım merkezi, buyer dashboard, favoriler, auth + adresler
  - Checkout/sepet, üreticiler, header/nav/floating/footer
  - Chat/bildirim/mesaj/rezervasyon servisleri, upload-ui facade'ları
  - Ürün artıkları (ReportAbuseModal, WriteReviewModal dropzone, vb.)
- feat(i18n): HTML sayfa başlıklarını (document.title) çevir (en/tr/ar/ru) (@aliturguttursab)
  - 67 sayfanın <title>'ına data-i18n="pageTitle.<key>" eklendi (Türkçe metin no-JS/SEO fallback olarak korundu).
  - i18n/locales/{en,tr,ar,ru}.ts: pageTitle namespace (67 anahtar × 4 dil); marka "iSTOC TradeHub" korunarak açıklama kısmı çevrildi.
  - i18n/index.ts: import-anında <title data-i18n> anahtarından document.title ilk boyamada set ediliyor; dil değişiminde mevcut updatePageTranslations <title> textContent'ini güncellediği için başlık canlı değişiyor.
- feat(query): add IndexedDB AsyncStorage adapter for persister (@ahmeetseker)
- feat(query): add query key factory and per-resource cache policies (@TurksabYonetim)
- feat(query): add shared QueryClient with IndexedDB persister and queryFetch wrapper (@TurksabYonetim)
- feat(native): iOS hazırlığı — cross-origin API köprüsü + iOS geri butonu (@aliturguttursab)
  - server bloğu env-driven: CAP_SERVER_URL verilirse dev live-reload, yoksa bundle (App Store) modu. Makineye-özel IP artık koda gömülü değil.
  - CapacitorHttp.enabled=true → fetch native ağdan geçer; cross-origin istekler browser CORS'a takılmaz, cookie native jar'da (backend CORS gereksiz).
  - src/utils/nativeHttp.ts (yeni): bundle modunda window.fetch'i sarıp /api|/files|/private|/assets|/socket.io URL'lerini VITE_NATIVE_API_URL ile mutlaklaştırır. Web ve live-reload'da no-op.
  - src/utils/api.ts: BASE_URL (+ window.API_BASE) native bundle'da mutlak backend.
  - src/utils/nativeBackButton.ts (yeni): yalnızca native iOS'ta sol-üste, safe-area altına yüzen geri butonu enjekte eder; ana sayfada gizli; RTL uyumlu; history.back() / ana sayfa fallback. Web ve Android'de no-op.
- feat(pricing): satıcı paketleri kart ve karşılaştırma düzenlemeleri (@boraydeger32)
  - Pricing kartları: ortak özellik seti + ✓/✗ ile eşit uzunluk
  - enum/quota değerleri kartta gösterimi ("Destek seviyesi: 7×24 tahsisli")
  - "Yakında" rozeti (henüz çalışmayan özellikler için, coming_soon)
  - fiyat yerine özel metin (price_override_label) desteği
  - "14 gün ücretsiz dene" bandı (en dolu paket → kayıt yönlendirmesi)
  - "Diğer pazaryerlerine göre" rakip karşılaştırma bölümü kaldırıldı
  - pricingService: price_override_label / text_value / coming_soon / show_on_card tip alanları
- feat(i18n): SellPageLayout + MegaMenu i18n'ini geri uygula (@aliturguttursab)
  - MegaMenu: "Tümünü gör" → t("commonNav.viewAll")
  - SellPageLayout: tüm hardcoded TR → t("sellPage.*") (49 mevcut anahtar yeniden kullanıldı + 5 yeni: hero başlık/açıklama, görsel alt, üretici desteği, başvuru linki)
  - locales {en,tr,ar,ru}: 5 yeni sellPage anahtarı
- feat(pricing): karşılaştırma tablosunda "Yakında" rozeti + cache bump (@boraydeger32)
  - PricingMatrixFeature / MatrixRow tiplerine coming_soon eklendi; karşılaştırma tablosu satır adının yanında "Yakında" rozeti gösterir (kartlarla senkron)
  - localStorage cache anahtarı v3 → v4 (eski önbellek coming_soon alanını taşımadığı için otomatik geçersiz kılınır)
- feat(storefront): 2xl geniş ekran desteği ve iStoc marka geçişi (@ahmeetseker)
  - Kategori Vitrini bento grid 2xl'de tile sayısına göre +2 sütuna genişler (max-w-1680px, tam bölen kontrolüyle boşluksuz)
  - Hero slider 2xl breakpoint'inde tipografi/padding/spacing ölçeklenir
  - Marka adı "Thoptan Ltd." → "iStoc Private Company Limited" güncellendi (tr/en/ru/ar + yasal bildirim)
  - Footer operatedBy satırı kaldırıldı, telif "© 2026 iStoc Private Company Limited" olarak sadeleşti
  - MegaMenu'deki kullanılmayan renderSectorBody fonksiyonu temizlendi
  - Kullanılmayan import'lar ve mükerrer favIcon import'u kaldırıldı
- feat(trial): Enterprise butonu "14 gun ucretsiz dene" + komisyon/Yakinda fix (@boraydeger32)
  - Trial paketinin ANA buton metni "X gun ucretsiz dene" olur (trial_config); ayri buton-ustu CTA ve ust bant kaldirildi
  - Komisyon kartta/matriste her zaman gercek oran (0 -> "%0"); "Ozel" kaldirildi
  - Karsilastirma tablosunda "Yakinda" rozeti (matris coming_soon)
  - pricingService: trial_config + coming_soon tipleri; cache anahtari v4->v6
- feat(sell): show feature tooltips as hover ⓘ in pricing comparison table (@boraydeger32)

### Duzeltildi
- fix(i18n): en/ar/ru locale parite — tr'de olup eksik 43 anahtarı çevir/ekle (@aliturguttursab)
  - settings.consent* / downloadMyData* (KVKK/GDPR onay yönetimi + veri indirme)
  - product.* (sipariş koruma / işlem süresi bölümleri)
  - rfq.*, auth.*, checkout.*, kyb.* + birkaç mock veri anahtarı
- fix(security): tüm UI bileşenlerinde XSS koruması için HTML/URL kaçışlaması ekle (@ahmeetseker)
  - escapeHtml: 693 noktada metin/öznitelik enjeksiyonuna karşı
  - sanitizeUrl: 219 noktada javascript:/data: gibi URL şemalarına karşı
  - src/utils/sanitize.ts: yardımcı fonksiyonlar güncellendi
- fix(currency): rebuild currency picker list after async rates load (@TurksabYonetim)
- fix(categories): show error UI when category load fails (empty result) (@TurksabYonetim)
- fix(pwa): NetworkFirst for HTML documents to stop stale blank-page-on-navigation (@TurksabYonetim)
- fix(alpine): register @alpinejs/collapse plugin for x-collapse directive (@TurksabYonetim)
- fix(header): remove orphaned mobile-menu-drawer from full header (@TurksabYonetim)
- fix(a11y): add aria-labels, alt text, ARIA roles, contrast & tap targets (@TurksabYonetim)
  - ikonlu butonlara aria-label eklendi (kapat/ara/ileri-geri, şifre göster, kopyala, düzenle, fotoğraf yükle, video kontrolleri)
  - görsellere anlamlı alt metni verildi (banner/varyant/rozet/promosyon)
  - yanlış ARIA rolleri düzeltildi (list→group, ProductGrid'e listitem)
  - TopBar sticky aramadan geçersiz aria-expanded kaldırıldı
  - --color-text-tertiary AA kontrast için #a3a3a3→#737373
  - dot dokunma hedefleri WCAG 2.5.8 için 24px'e çıkarıldı perf(nginx): enable gzip + immutable cache for hashed/static assets
  - metin asset'leri için gzip (css/js/json/svg)
  - hash'li /assets/ 1 yıl immutable, statik medya 30 gün Cache-Control
- fix(lint): simplify lint workflow by removing auto-fix steps and changing permissions (@TurksabYonetim)
- fix(merge): main merge artefaktlarını onar + eksik bağımlılık (@aliturguttursab)
  - searchListings (listingService): main'in queryFetch cache sarmalayıcısı + benim i18n sort etiketlerim birleştirildi (Unexpected "," giderildi).
  - ProductItem: çift favIcon import kaldırıldı, eksik `const isFav` geri eklendi.
  - ProductVideoSection: eksik escapeHtml/sanitizeUrl import'u eklendi.
  - MobileLayout, ProductInfo: kullanılmayan safeHexColor import'tan çıkarıldı.
  - categoryService: kullanılmayan _promise kaldırıldı.
  - SellPageLayout, MegaMenu: derin ayrışma — main'in versiyonu alındı (dinamik fiyat matrisi + 3-seviye mega menü). NOT: bu 2 dosyada i18n etiketleri main'in hardcoded TR'sine döndü; ayrıca yeniden uygulanacak.
- fix(dev): vite /api proxy hedefini env-driven yap (varsayılan :8088) (@aliturguttursab)
- fix(auth): login promosyon panelinde komisyon mesajı sıfır komisyon olarak güncellendi (@ahmeetseker)
  - promoSubtitle "şeffaf komisyon" → "sıfır komisyon"
  - featTransparent "Şeffaf" → "Komisyonsuz"
  - featTransparentDesc "Komisyon Yapısı" → "%0 Komisyon"
  - 4 locale (tr/en/ar/ru) güncellendi
- fix(i18n): tekrarlanan t import'ları kaldırıldı, storefront build düzeltildi (@ahmeetseker)
  - 9 dosyada merge artığı çift "import { t } from i18n" satırı silindi
  - Rollup "Identifier t has already been declared" hatası giderildi
  - beta.istoc.com otomatik deploy build'i artık geçiyor (vite build temiz)
- fix(storefront): satıcı→mağaza linki doğru mağazayı açar (@aliiball)
  - getSellerUrl artık ?seller=<code> üretir (sayfanın okuduğu parametre)
  - sellerShop /magaza/<code> path'ini de okur (Mağazayı ziyaret et linkleri)
  - mock satıcı yalnız demo'da yüklenir (geçersiz satıcıda yanlış mağaza maskelenmez)
- fix(storefront): video_url boşken VIDEO rozeti gösterilmez (@aliiball)
  - mapListingDetail boş/whitespace videoUrl'i galeriye eklemez
  - ProductImageGallery video thumb'ı yalnız isVideo && src dolu iken çizer
- fix(seller): Mağazalarım panel URL'i host-relative /panel/ yapıldı (@ahmeetseker)

### Degistirildi
- refactor(category): route loadCategories through queryFetch with IndexedDB persist (@TurksabYonetim)
- refactor(currency): replace hand-rolled localStorage cache with queryFetch (@TurksabYonetim)
- refactor(listing): cache searchListings via queryFetch; document SW boundary (@TurksabYonetim)
- refactor(categories): route categories page through cached categoryService (@TurksabYonetim)

---
## [v1.2.1-beta.13] - 2026-06-10 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(sell): show feature tooltips as hover ⓘ in pricing comparison table (@boraydeger32)

### Duzeltildi
- fix(storefront): satıcı→mağaza linki doğru mağazayı açar (@aliiball)
  - getSellerUrl artık ?seller=<code> üretir (sayfanın okuduğu parametre)
  - sellerShop /magaza/<code> path'ini de okur (Mağazayı ziyaret et linkleri)
  - mock satıcı yalnız demo'da yüklenir (geçersiz satıcıda yanlış mağaza maskelenmez)
- fix(storefront): video_url boşken VIDEO rozeti gösterilmez (@aliiball)
  - mapListingDetail boş/whitespace videoUrl'i galeriye eklemez
  - ProductImageGallery video thumb'ı yalnız isVideo && src dolu iken çizer
- fix(seller): Mağazalarım panel URL'i host-relative /panel/ yapıldı (@ahmeetseker)

---
## [v1.2.1-beta.12] - 2026-06-10 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(sell): show feature tooltips as hover ⓘ in pricing comparison table (@boraydeger32)

---
## [v1.2.1-beta.11] - 2026-06-10 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(storefront): satıcı→mağaza linki doğru mağazayı açar (@aliiball)
  - getSellerUrl artık ?seller=<code> üretir (sayfanın okuduğu parametre)
  - sellerShop /magaza/<code> path'ini de okur (Mağazayı ziyaret et linkleri)
  - mock satıcı yalnız demo'da yüklenir (geçersiz satıcıda yanlış mağaza maskelenmez)
- fix(storefront): video_url boşken VIDEO rozeti gösterilmez (@aliiball)
  - mapListingDetail boş/whitespace videoUrl'i galeriye eklemez
  - ProductImageGallery video thumb'ı yalnız isVideo && src dolu iken çizer

---
## [v1.2.1-beta.10] - 2026-06-10 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(trial): Enterprise butonu "14 gun ucretsiz dene" + komisyon/Yakinda fix (@boraydeger32)
  - Trial paketinin ANA buton metni "X gun ucretsiz dene" olur (trial_config); ayri buton-ustu CTA ve ust bant kaldirildi
  - Komisyon kartta/matriste her zaman gercek oran (0 -> "%0"); "Ozel" kaldirildi
  - Karsilastirma tablosunda "Yakinda" rozeti (matris coming_soon)
  - pricingService: trial_config + coming_soon tipleri; cache anahtari v4->v6

### Duzeltildi
- fix(auth): login promosyon panelinde komisyon mesajı sıfır komisyon olarak güncellendi (@ahmeetseker)
  - promoSubtitle "şeffaf komisyon" → "sıfır komisyon"
  - featTransparent "Şeffaf" → "Komisyonsuz"
  - featTransparentDesc "Komisyon Yapısı" → "%0 Komisyon"
  - 4 locale (tr/en/ar/ru) güncellendi

---
## [v1.2.1-beta.8] - 2026-06-10 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(trial): Enterprise butonu "14 gun ucretsiz dene" + komisyon/Yakinda fix (@boraydeger32)
  - Trial paketinin ANA buton metni "X gun ucretsiz dene" olur (trial_config); ayri buton-ustu CTA ve ust bant kaldirildi
  - Komisyon kartta/matriste her zaman gercek oran (0 -> "%0"); "Ozel" kaldirildi
  - Karsilastirma tablosunda "Yakinda" rozeti (matris coming_soon)
  - pricingService: trial_config + coming_soon tipleri; cache anahtari v4->v6

---
## [v1.2.1-beta.7] - 2026-06-10 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(i18n): ürün detay yorum akışı çevirisi + storefront i18n/RTL düzeltmeleri (@aliturguttursab)
  - WriteReviewModal.ts + ProductReviews.ts: koda gömülü Türkçe metinler (modal başlık/etiket/buton/dropzone/puanlama boyutları + JS hata/başarı mesajları, "Yorum Yaz" butonu, Soru&Cevap sekmesi, değerlendirici rozetleri, edit tooltip) artık t() ile çözülüyor.
  - i18n/locales/{en,tr,ar,ru}.ts: product.reviewWrite.* (~39 anahtar).
  - Modül-seviyesi sabit haritalar (ASPECT_LABELS, REVIEW_DROPZONE_TEXTS) fonksiyona çevrildi ki t() import anında değil render/açılış anında çözülsün.
  - services/categoryService.ts, listingService.ts, utils/api.ts: GET isteklerine aktif içerik dili (lang) eklenmesi + detay/varyant displayLabel eşlemesi.
  - types/product.ts: ProductVariant/VariantOption displayLabel alanları.
  - components/product/{ProductInfo,MobileLayout}.ts: varyant gösteriminde displayLabel || label.
  - components/cart/molecules/ProductItem.ts, settings/SettingsPrivacy.ts: i18n düzeltmeleri.
  - vite.config.ts: dev-only pretty-URL rewrite (/urun/<slug> → product detail entry) — dev server'da Nginx olmadığı için.
- feat(i18n): Soru & Cevap (Q&A) bölümü çevirisi (@aliturguttursab)
  - Soru sorma formu (başlık, alt açıklama, placeholder, gönder butonu).
  - Liste durumları: yükleniyor, boş durum, onay-bekliyor/doğrulanmış rozetleri, faydalı sayacı + tooltip'ler, satıcı/alıcı cevabı, cevap yok.
  - JS toast/hata mesajları (min karakter, ürün yüklenmedi, soru alındı, oy alındı / zaten oy verildi / oy verilemedi).
- feat(i18n): storefront genel i18n süpürmesi — kalan tüm alanlar (en/tr/ar/ru) (@aliturguttursab)
  - Satıcı: seller-dashboard, sell/pricing sayfaları, seller-verification, seller-shop, alpine/seller, utils/seller
  - Siparişler + RFQ, Ayarlar, Trade Assurance, bilgi sayfaları (payments, refund-policy, membership, shipping-logistics, after-sales), KYC/KYB
  - Yardım merkezi, buyer dashboard, favoriler, auth + adresler
  - Checkout/sepet, üreticiler, header/nav/floating/footer
  - Chat/bildirim/mesaj/rezervasyon servisleri, upload-ui facade'ları
  - Ürün artıkları (ReportAbuseModal, WriteReviewModal dropzone, vb.)
- feat(i18n): HTML sayfa başlıklarını (document.title) çevir (en/tr/ar/ru) (@aliturguttursab)
  - 67 sayfanın <title>'ına data-i18n="pageTitle.<key>" eklendi (Türkçe metin no-JS/SEO fallback olarak korundu).
  - i18n/locales/{en,tr,ar,ru}.ts: pageTitle namespace (67 anahtar × 4 dil); marka "iSTOC TradeHub" korunarak açıklama kısmı çevrildi.
  - i18n/index.ts: import-anında <title data-i18n> anahtarından document.title ilk boyamada set ediliyor; dil değişiminde mevcut updatePageTranslations <title> textContent'ini güncellediği için başlık canlı değişiyor.
- feat(native): iOS hazırlığı — cross-origin API köprüsü + iOS geri butonu (@aliturguttursab)
  - server bloğu env-driven: CAP_SERVER_URL verilirse dev live-reload, yoksa bundle (App Store) modu. Makineye-özel IP artık koda gömülü değil.
  - CapacitorHttp.enabled=true → fetch native ağdan geçer; cross-origin istekler browser CORS'a takılmaz, cookie native jar'da (backend CORS gereksiz).
  - src/utils/nativeHttp.ts (yeni): bundle modunda window.fetch'i sarıp /api|/files|/private|/assets|/socket.io URL'lerini VITE_NATIVE_API_URL ile mutlaklaştırır. Web ve live-reload'da no-op.
  - src/utils/api.ts: BASE_URL (+ window.API_BASE) native bundle'da mutlak backend.
  - src/utils/nativeBackButton.ts (yeni): yalnızca native iOS'ta sol-üste, safe-area altına yüzen geri butonu enjekte eder; ana sayfada gizli; RTL uyumlu; history.back() / ana sayfa fallback. Web ve Android'de no-op.
- feat(storefront): 2xl geniş ekran desteği ve iStoc marka geçişi (@ahmeetseker)
  - Kategori Vitrini bento grid 2xl'de tile sayısına göre +2 sütuna genişler (max-w-1680px, tam bölen kontrolüyle boşluksuz)
  - Hero slider 2xl breakpoint'inde tipografi/padding/spacing ölçeklenir
  - Marka adı "Thoptan Ltd." → "iStoc Private Company Limited" güncellendi (tr/en/ru/ar + yasal bildirim)
  - Footer operatedBy satırı kaldırıldı, telif "© 2026 iStoc Private Company Limited" olarak sadeleşti
  - MegaMenu'deki kullanılmayan renderSectorBody fonksiyonu temizlendi
  - Kullanılmayan import'lar ve mükerrer favIcon import'u kaldırıldı

### Duzeltildi
- fix(i18n): en/ar/ru locale parite — tr'de olup eksik 43 anahtarı çevir/ekle (@aliturguttursab)
  - settings.consent* / downloadMyData* (KVKK/GDPR onay yönetimi + veri indirme)
  - product.* (sipariş koruma / işlem süresi bölümleri)
  - rfq.*, auth.*, checkout.*, kyb.* + birkaç mock veri anahtarı

---
## [v1.2.1-beta.6] - 2026-06-09 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): karşılaştırma tablosunda "Yakında" rozeti + cache bump (@boraydeger32)
  - PricingMatrixFeature / MatrixRow tiplerine coming_soon eklendi; karşılaştırma tablosu satır adının yanında "Yakında" rozeti gösterir (kartlarla senkron)
  - localStorage cache anahtarı v3 → v4 (eski önbellek coming_soon alanını taşımadığı için otomatik geçersiz kılınır)

---
## [v1.2.1-beta.5] - 2026-06-09 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(i18n): SellPageLayout + MegaMenu i18n'ini geri uygula (@aliturguttursab)
  - MegaMenu: "Tümünü gör" → t("commonNav.viewAll")
  - SellPageLayout: tüm hardcoded TR → t("sellPage.*") (49 mevcut anahtar yeniden kullanıldı + 5 yeni: hero başlık/açıklama, görsel alt, üretici desteği, başvuru linki)
  - locales {en,tr,ar,ru}: 5 yeni sellPage anahtarı

---
## [v1.2.1-beta.4] - 2026-06-09 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): satıcı paketleri kart ve karşılaştırma düzenlemeleri (@boraydeger32)
  - Pricing kartları: ortak özellik seti + ✓/✗ ile eşit uzunluk
  - enum/quota değerleri kartta gösterimi ("Destek seviyesi: 7×24 tahsisli")
  - "Yakında" rozeti (henüz çalışmayan özellikler için, coming_soon)
  - fiyat yerine özel metin (price_override_label) desteği
  - "14 gün ücretsiz dene" bandı (en dolu paket → kayıt yönlendirmesi)
  - "Diğer pazaryerlerine göre" rakip karşılaştırma bölümü kaldırıldı
  - pricingService: price_override_label / text_value / coming_soon / show_on_card tip alanları

---
## [v1.2.1-beta.3] - 2026-06-09 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(merge): main merge artefaktlarını onar + eksik bağımlılık (@aliturguttursab)
  - searchListings (listingService): main'in queryFetch cache sarmalayıcısı + benim i18n sort etiketlerim birleştirildi (Unexpected "," giderildi).
  - ProductItem: çift favIcon import kaldırıldı, eksik `const isFav` geri eklendi.
  - ProductVideoSection: eksik escapeHtml/sanitizeUrl import'u eklendi.
  - MobileLayout, ProductInfo: kullanılmayan safeHexColor import'tan çıkarıldı.
  - categoryService: kullanılmayan _promise kaldırıldı.
  - SellPageLayout, MegaMenu: derin ayrışma — main'in versiyonu alındı (dinamik fiyat matrisi + 3-seviye mega menü). NOT: bu 2 dosyada i18n etiketleri main'in hardcoded TR'sine döndü; ayrıca yeniden uygulanacak.
- fix(dev): vite /api proxy hedefini env-driven yap (varsayılan :8088) (@aliturguttursab)

---
## [v1.2.1-beta.2] - 2026-06-08 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(i18n): ürün detay yorum akışı çevirisi + storefront i18n/RTL düzeltmeleri (@aliturguttursab)
  - WriteReviewModal.ts + ProductReviews.ts: koda gömülü Türkçe metinler (modal başlık/etiket/buton/dropzone/puanlama boyutları + JS hata/başarı mesajları, "Yorum Yaz" butonu, Soru&Cevap sekmesi, değerlendirici rozetleri, edit tooltip) artık t() ile çözülüyor.
  - i18n/locales/{en,tr,ar,ru}.ts: product.reviewWrite.* (~39 anahtar).
  - Modül-seviyesi sabit haritalar (ASPECT_LABELS, REVIEW_DROPZONE_TEXTS) fonksiyona çevrildi ki t() import anında değil render/açılış anında çözülsün.
  - services/categoryService.ts, listingService.ts, utils/api.ts: GET isteklerine aktif içerik dili (lang) eklenmesi + detay/varyant displayLabel eşlemesi.
  - types/product.ts: ProductVariant/VariantOption displayLabel alanları.
  - components/product/{ProductInfo,MobileLayout}.ts: varyant gösteriminde displayLabel || label.
  - components/cart/molecules/ProductItem.ts, settings/SettingsPrivacy.ts: i18n düzeltmeleri.
  - vite.config.ts: dev-only pretty-URL rewrite (/urun/<slug> → product detail entry) — dev server'da Nginx olmadığı için.
- feat(i18n): Soru & Cevap (Q&A) bölümü çevirisi (@aliturguttursab)
  - Soru sorma formu (başlık, alt açıklama, placeholder, gönder butonu).
  - Liste durumları: yükleniyor, boş durum, onay-bekliyor/doğrulanmış rozetleri, faydalı sayacı + tooltip'ler, satıcı/alıcı cevabı, cevap yok.
  - JS toast/hata mesajları (min karakter, ürün yüklenmedi, soru alındı, oy alındı / zaten oy verildi / oy verilemedi).
- feat(i18n): storefront genel i18n süpürmesi — kalan tüm alanlar (en/tr/ar/ru) (@aliturguttursab)
  - Satıcı: seller-dashboard, sell/pricing sayfaları, seller-verification, seller-shop, alpine/seller, utils/seller
  - Siparişler + RFQ, Ayarlar, Trade Assurance, bilgi sayfaları (payments, refund-policy, membership, shipping-logistics, after-sales), KYC/KYB
  - Yardım merkezi, buyer dashboard, favoriler, auth + adresler
  - Checkout/sepet, üreticiler, header/nav/floating/footer
  - Chat/bildirim/mesaj/rezervasyon servisleri, upload-ui facade'ları
  - Ürün artıkları (ReportAbuseModal, WriteReviewModal dropzone, vb.)
- feat(i18n): HTML sayfa başlıklarını (document.title) çevir (en/tr/ar/ru) (@aliturguttursab)
  - 67 sayfanın <title>'ına data-i18n="pageTitle.<key>" eklendi (Türkçe metin no-JS/SEO fallback olarak korundu).
  - i18n/locales/{en,tr,ar,ru}.ts: pageTitle namespace (67 anahtar × 4 dil); marka "iSTOC TradeHub" korunarak açıklama kısmı çevrildi.
  - i18n/index.ts: import-anında <title data-i18n> anahtarından document.title ilk boyamada set ediliyor; dil değişiminde mevcut updatePageTranslations <title> textContent'ini güncellediği için başlık canlı değişiyor.
- feat(native): iOS hazırlığı — cross-origin API köprüsü + iOS geri butonu (@aliturguttursab)
  - server bloğu env-driven: CAP_SERVER_URL verilirse dev live-reload, yoksa bundle (App Store) modu. Makineye-özel IP artık koda gömülü değil.
  - CapacitorHttp.enabled=true → fetch native ağdan geçer; cross-origin istekler browser CORS'a takılmaz, cookie native jar'da (backend CORS gereksiz).
  - src/utils/nativeHttp.ts (yeni): bundle modunda window.fetch'i sarıp /api|/files|/private|/assets|/socket.io URL'lerini VITE_NATIVE_API_URL ile mutlaklaştırır. Web ve live-reload'da no-op.
  - src/utils/api.ts: BASE_URL (+ window.API_BASE) native bundle'da mutlak backend.
  - src/utils/nativeBackButton.ts (yeni): yalnızca native iOS'ta sol-üste, safe-area altına yüzen geri butonu enjekte eder; ana sayfada gizli; RTL uyumlu; history.back() / ana sayfa fallback. Web ve Android'de no-op.

### Duzeltildi
- fix(i18n): en/ar/ru locale parite — tr'de olup eksik 43 anahtarı çevir/ekle (@aliturguttursab)
  - settings.consent* / downloadMyData* (KVKK/GDPR onay yönetimi + veri indirme)
  - product.* (sipariş koruma / işlem süresi bölümleri)
  - rfq.*, auth.*, checkout.*, kyb.* + birkaç mock veri anahtarı

---
## [v1.2.1-beta.1] - 2026-06-08 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(query): add IndexedDB AsyncStorage adapter for persister (@ahmeetseker)
- feat(query): add query key factory and per-resource cache policies (@TurksabYonetim)
- feat(query): add shared QueryClient with IndexedDB persister and queryFetch wrapper (@TurksabYonetim)

### Duzeltildi
- fix(security): tüm UI bileşenlerinde XSS koruması için HTML/URL kaçışlaması ekle (@ahmeetseker)
  - escapeHtml: 693 noktada metin/öznitelik enjeksiyonuna karşı
  - sanitizeUrl: 219 noktada javascript:/data: gibi URL şemalarına karşı
  - src/utils/sanitize.ts: yardımcı fonksiyonlar güncellendi
- fix(currency): rebuild currency picker list after async rates load (@TurksabYonetim)
- fix(categories): show error UI when category load fails (empty result) (@TurksabYonetim)
- fix(pwa): NetworkFirst for HTML documents to stop stale blank-page-on-navigation (@TurksabYonetim)
- fix(alpine): register @alpinejs/collapse plugin for x-collapse directive (@TurksabYonetim)
- fix(header): remove orphaned mobile-menu-drawer from full header (@TurksabYonetim)
- fix(a11y): add aria-labels, alt text, ARIA roles, contrast & tap targets (@TurksabYonetim)
  - ikonlu butonlara aria-label eklendi (kapat/ara/ileri-geri, şifre göster, kopyala, düzenle, fotoğraf yükle, video kontrolleri)
  - görsellere anlamlı alt metni verildi (banner/varyant/rozet/promosyon)
  - yanlış ARIA rolleri düzeltildi (list→group, ProductGrid'e listitem)
  - TopBar sticky aramadan geçersiz aria-expanded kaldırıldı
  - --color-text-tertiary AA kontrast için #a3a3a3→#737373
  - dot dokunma hedefleri WCAG 2.5.8 için 24px'e çıkarıldı perf(nginx): enable gzip + immutable cache for hashed/static assets
  - metin asset'leri için gzip (css/js/json/svg)
  - hash'li /assets/ 1 yıl immutable, statik medya 30 gün Cache-Control
- fix(lint): simplify lint workflow by removing auto-fix steps and changing permissions (@TurksabYonetim)

### Degistirildi
- refactor(category): route loadCategories through queryFetch with IndexedDB persist (@TurksabYonetim)
- refactor(currency): replace hand-rolled localStorage cache with queryFetch (@TurksabYonetim)
- refactor(listing): cache searchListings via queryFetch; document SW boundary (@TurksabYonetim)
- refactor(categories): route categories page through cached categoryService (@TurksabYonetim)

---
## [v1.2.0] - 2026-06-05 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(changelog): yeni storefront özellikleri eklendi ve belgeler güncellendi (@ahmeetseker)
- feat(kyc): KYC sayfası + form + prefill API entegrasyonu eklendi (@aliiball)
  - pages/dashboard/kyc.html + src/pages/kyc.ts entry
  - src/components/kyc/KycLayout.ts: Kurumsal/Bireysel toggle + boxed layout (account_type register'dan KYC formuna taşındı)
  - get_prefill_data ile User Profile + son KYC/KYB değerleri prefill
  - src/types/userProfile.ts type tanımları
- feat(verification-ui): banner + locked-feature + kyc-required modal eklendi (@aliiball)
  - VerificationStatusBanner: KYC × KYB state machine ile 9 banner durumu
  - LockedFeatureModal: sidebar locked item için "Alıcı/Satıcı olun" CTA
  - KycRequiredModal: checkout'ta [KYC_<STATE>] prefix regex parse + state-bazlı modal (Locked/Pending/Rejected/Suspended → support ticket)
  - utils/sellerRouter.ts: satıcı dashboard yönlendirme yardımcısı
- feat(data): countries + country-subdivisions mock data eklendi (@aliiball)
  - src/data/countries.ts: ülke listesi (ISO kodları + isimler)
  - src/data/country-subdivisions.ts: ülke-il/eyalet eşlemesi
- feat(i18n): KYC + verification + address purpose çevirileri eklendi (@aliiball)
  - en.ts + tr.ts: settings.myAccountTitle, settings.addressDisabledHint, header.myStore ("Mağaza Sayfam" → "Mağazalarım"), kyc.* key'leri, verification banner state'leri, address purpose etiketleri
- feat(auth): yasal metin onay popup'ı ve ayrı checkbox'lar eklendi (@aliiball)
  - Tek "Kullanım Koşulları ve Gizlilik Politikası" checkbox'ı iki ayrı onaya bölündü (terms-checkbox + privacy-checkbox)
  - Turuncu metne tıklayınca tüm sözleşme içeriği popup içinde gösteriliyor (yeni LegalConsentModal component)
  - Reddet/Kabul Et butonları metnin sonuna kadar okunmadan görünmüyor; her açılışta scroll baştan başlıyor ve buton durumu sıfırlanıyor
  - Popup içeriği legalContent.ts'ten çekiliyor — terms/privacy sayfalarıyla aynı kaynak
  - i18n: agreeTerms TR-suffix/EN-prefix çakışması agreeBefore + agreeAfter'a bölündü; auth.setup.legalConsent.{accept, reject} eklendi
- feat(sell): pricing planları dinamik API + entitlement banner (@boraydeger32)
  - sell sayfasındaki 4 hardcoded TIERS dizisi kaldırıldı, planlar artık tradehub_core.api.v1.public_pricing.get_pricing_plans endpoint'inden çekiliyor (Süper Admin Permission Console'dan yönetim).
  - pricingService.ts: localStorage cache (5 dk) + stale-while-revalidate; cache key v2'ye yükseltildi (CTA label şema değişikliği için invalidate).
  - sell.ts: cache fresh ise senkron paint, değilse fetch await; arka planda daima fetch + updated_at değişirse #paketler section'ı yerinde re-render (tüm DOM swap yerine — Alpine state korunur).
  - SellPageLayout: CTA action map (signup, contact_sales, learn_more) ve feature icon glyph map (check, x, star, zap, info, default check) eklendi; currency symbol + fmtListings helper'ları.
  - FAZ 1.7 — utils/entitlement.ts: snapshot client (sessionStorage 5dk cache), hasFeature/withinQuota/isVerifiedForCheckout helper'ları. Güvenlik sınırı değil — gerçek karar her korumalı eylemde backend'de.
  - components/subscription/EntitlementBanner.ts: trial ending (< 3 gün) ve subscription past_due durumları için banner.
- feat(routing): Türkçe pretty URL'lere dist HTML mapping katmanı eklendi (@ahmeetseker)
  - staticPageUrl.ts'e STATIC_PAGE_HTML_MAP ve getStaticPageHtmlPath() eklendi
  - Vite dev plugin (staticPageRewritePlugin) /ureticiler gibi path'leri pages/manufacturers.html'e rewrite eder
  - nginx.conf.template'e `map $uri $static_page_html` bloğu eklendi (prod aynı işi yapar)
  - Slug'lar yenilendi: /markalar → /ureticiler, /firsat → /firsatlar (MegaMenu, TopBar, HeroSideBannerSlider, TopDeals, SubHeader)
  - Seller storefront `/magaza/<code>` path'inden seller_code parse eder, nginx internal rewrite sonrası query görünmediği için fallback olarak
  - StoreHeader/CompanyProfile "Mağazayı ziyaret et" linkleri sellerCode state'ine bağlandı
- feat: kullanıcı veri hakları UI, backend-driven tracking ve SEO routing (@ahmeetseker)
  - Hesap ayarlarına "Verilerimi İndir" ve "Onay Yönetimi" bölümleri eklendi
  - Tracking Manager artık ID'leri backend API'den alıyor (hardcoded değerler kaldırıldı)
  - Nginx'e statik sayfa SEO backend routing eklendi (meta tag DB injection)
  - Social proof view kaydında CSRF token düzeltmesi
  - Ürün yorumları slug yerine Frappe name ile yükleniyor
  - Ödeme sayfalarına tracking init eklendi
  - Türkçe i18n çevirileri (consent, data export)
- feat(nginx): enhance SEO routing for bot user-agents and update static page handling (@ahmeetseker)
- feat(nginx): enhance dynamic SEO routing for bots and users with new rewrite rules (@ahmeetseker)
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri
- feat(kyc-kyb): belge önizleme kartı ve TCKN/VKN doğrulama eklendi (@aliiball)
  - KYC formunda mod-aware TCKN/VKN client-side validation eklendi; Bireysel modda pattern \d{11} + minlength/maxlength 11, Kurumsal modda \d{10,11}
  - isValidTckn helper backend kuralları ile birebir mod-10 checksum kontrolü yapıyor (submit'ten önce 11 hane TCKN doğrulanıyor)
  - KYC submit catch bloğuna console.error eklendi (debug için)
  - KYC ve KYB formlarında yüklü belgeler için Karma C preview pattern eklendi: yeşil tema kart, dosya ikonu, Yüklü rozet, dosya adı, Görüntüle butonu; SlotDropzone drag-drop davranışı korundu
  - Yeni dosya yüklenince preview kartı yenisine otomatik refresh oluyor
  - Verified ve Suspended durumlarında belge yükleme kapatıldı (slot-zone display:none + input disabled), preview kartı görünür kalıyor; backend 403 ve login redirect döngüsü engellendi
- feat(i18n): add Arabic + Russian locales and RTL layout support (@aliturguttursab)
  - locales: add ar.ts, ru.ts; register both in i18n/index.ts and extend SUPPORTED_LANGS
  - RTL: add RTL_LANGS/isRtl(); sync <html lang> and dir on first paint (static HTML hard-codes lang, detector overrides it)
  - layout: convert physical Tailwind direction classes to logical ones across ~175 components/pages (ml/mr->ms/me, pl/pr->ps/pe, text-left/right->text-start/end, border-l/r->border-s/e, rounded-*->logical, left/right->inset-s/e, float-*)
  - tooling: add scripts/rtl-logical-convert.mjs - boundary-aware codemod, verified against Tailwind v4 docs
- feat(storefront): alıcı paneli analitiği, hero slider ve sosyal kanıt eklendi (@ahmeetseker)
  - Alıcı dashboard'una ECharts tabanlı analitik özeti eklendi (KPI + harcama trendi + kategori dağılımı)
  - Ana sayfaya hero üst slider ve heroSliderService eklendi
  - Ürün listelemeye sosyal kanıt rozetleri eklendi (initListingSocialProof + socialProofService, batch sinyal)
  - Ürün mobil görünümüne öneri şeridi (MobileRecommendations) eklendi
  - Sepet/favoriler/üst bar UI iyileştirildi; küçük kontrollerde th-no-press ve RTL-logical (ps-/text-start) uyumu sağlandı
  - Kullanılmayan statik bilgi sayfaları kaldırıldı (blog, careers, csr, monitoring, news, partnerships, shipping-protection, tax)
- feat(sell): pricing kartı yalnızca dahil özellikleri gösterir + kart/tablo tutarlılığı (@boraydeger32)
  - PricingCard "Paket içeriği": sadece dahil (✓) özellikler; devre dışı (✗) gizlendi
  - Karşılaştırma matrisi backend field-otoritesiyle uyumlu (kart ile birebir)
  - pricingService: v3 cache + SWR (her yüklemede revalidate)
  - vite.config: küçük güncelleme
- feat(storefront): kategori vitrini ve satış sıralaması eklendi (@ahmeetseker)
  - Ana sayfaya Kategori Vitrini bento grid bölümü eklendi (stale-while-revalidate cache, FOUC'suz)
  - Ürün detayı Özellikler sekmesine kategori bazlı satış sıralaması (Best Sellers Rank) eklendi
  - Mega menü 3. seviyeyi (sektör › grup › yaprak) destekleyecek şekilde genişletildi
  - Ürün listesi breadcrumb'ı tam kategori zinciriyle (findCategoryPath) yeniden kuruldu
  - Hero slider responsive tipografi ve padding ölçekleri iyileştirildi
  - Satıcı sayfası metinleri "Türkiye" yerine küresel hitaba güncellendi
  - Sepet favori ikonu inline SVG'ye çevrildi; gizlilik ayarlarında segmented kontrol render hatası düzeltildi
- feat(overview): update certificate display with image support and improved layout (@ahmeetseker)

### Duzeltildi
- fix(ci): son PROD tag'ini güncelleyerek CHANGELOG girişini düzeltildi (@ahmeetseker)
- fix(settings): address/city/postal_code disabled + Vergi tab gizlendi (@aliiball)
  - SettingsAccountEdit + SettingsMyAccount address/city/postal_code disabled + helper text (Frappe Address mimarisinde olduğu için)
  - SettingsLayout 4 noktada Vergi tab yorum satırı (S3=C kararı)
  - FavoritesLayout User Profile field uyumu + filter sets
  - buyer-dashboard NewBuyerInfo + UserInfoCard + types + mock Sprint 2
  - pages/buyer-dashboard VerificationStatusBanner entegrasyonu
- fix(cart): sepet popup'larında mağaza adı linklendi ve canonical URL'ye normalize edildi (@ahmeetseker)
  - SharedCartDrawer: store'a yeni supplier eklenirken href canonical /pages/seller/seller-shop.html?seller= pattern'iyle yazılıyor
  - TopBar: header sepet özetinde eski /pages/seller.html?id= href'leri normalizeSupplierHref ile canonical pattern'e çevriliyor;
  - ManufacturersHero: statik "0" yerine favorites/sellerFavorites store'larından canlı count; favorites-changed ve
  - i18n: mfr.favoriteProducts / mfr.favoriteSuppliers key'leri eklendi (TR/EN), whitespace-pre-line ile iki satır render
  - ManufacturerList: ürün kartlarında thumbnail block + body sabit yükseklik (h-[78px], min-h-[2lh]) ile kart yüksekliği eşitlendi refactor(product): fiyat tier'larında strikethrough üst satıra alındı, qty font büyüdü
  - Pre-discount fiyat artık deal fiyatının yanında değil, üstünde block olarak gösteriliyor
  - Tier qty etiketi 13px → 15px
  - TR locale'inde "MSA:" prefix'i kaldırıldı; tier başlığı sade "1 adet" / "1 - 5 adet"
  - SubHeader: products sekmesinde "...\"keyword\" kategorisinde", manufacturers sekmesinde "...\"keyword\" için küresel
  - ProductListingGrid: chat butonuna list-mode'da tam genişlik ve <1599px grid'de küçük font/padding için container-query
  - MegaMenu: featured kart tipografisi keyfi [11.5px]/[13px] yerine text-xs / text-sm'e standardize edildi
  - fix(cart): sepet popup'larında eski /pages/seller.html?id= href'leri canonical /pages/seller/seller-shop.html?seller=
  - feat(manufacturers): landing favori ürün/tedarikçi sayaçları favorites store'larından canlı, event listener ile güncelleniyor;
  - refactor(product): fiyat tier'da strikethrough üst satıra taşındı, qty font 15px; TR "MSA:" prefix'i kaldırıldı
  - refactor(listing): SubHeader başlığı products/manufacturers sekmesine göre dinamik; ProductListingGrid chat butonuna list-mode
  - refactor(manufacturers): ürün kartlarında thumbnail block + body sabit yükseklik ile hizalama düzeltildi
- fix: SEO URL uyumluluğu ve seller shop routing düzeltmeleri (@ahmeetseker)
  - nginx.conf.template: /magaza/{code}/dukkan route'u ekle (seller shop)
  - ManufacturerList: ürün kartları slug ile SEO URL kullanır
  - ManufacturersHero: ürün linkleri slug fallback ile
  - CompanyProfile: mağaza ziyaret linki düzeltmesi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX
- fix(rtl): mirror Swiper sliders and mobile drawer for Arabic (RTL) (@aliturguttursab)
  - Every `new Swiper()` rendered LTR on an RTL page (slides packed to the physical left, large empty band on the right). Swiper's computed- direction auto-detect is unreliable at init (async API fill / pre- reflow), so it stayed LTR.
  - Add src/utils/direction.ts → applySwiperDir(el|selector): sets the container's `dir` attribute (Swiper's documented RTL trigger) to the document direction before instantiation. Applied to all sliders: hero (Recommendation/HeroSideBanner/Tailored), product RelatedProducts, 404 ExploreDeals, TailoredSelectionsHero, alpine/dashboard, seller/interactions (x5), trade-assurance, rfq.
  - Drawer anchors `start-0` (correct, right edge in RTL) but hide/show toggles physical -translate-x-full / translate-x-full (Flowbite + custom panel JS). Physical translate does not flip, so the hidden drawer slid into the viewport instead of off the right edge.
  - Tailwind v4 compiles these to the `translate` property via --tw-translate-x. Flip only that var, only in RTL, only while the toggled class is present, via inline variants (rtl:[&.-translate-x-full]:[--tw-translate-x:100%] and the inner-panel counterpart) — no Flowbite/JS changes, LTR untouched.
- fix(storefront): pre-existing build hataları ve checkout renk temizliği (@aliiball)
  - Eksik echarts bağımlılığı npm install ile yüklendi (rollup resolve hatası giderildi)
  - Settings Privacy yarım merge tamamlandı (segmented toggle çalışır hâle geldi, ${optionsHtml} → ${segmented})
  - Cart ürün satırında favori ikonu (fav.png) import edildi, isFav ile aktif/pasif renk vurgusu eklendi
  - Checkout ödeme yöntemi kartı hardcoded hex (#f5b800, #d39c00, #fff8e1) yerine Tailwind v4 brand token utility'leri kullanıyor
  - Görsel değişiklik yok; tek brand kaynağı style.css @theme bloğunda

### Degistirildi
- refactor(sidebar): KYC + KYB iki ayrı lockable item olarak ayrıldı (@aliiball)
  - sidebarData + sidebarIcons: KYC ve KYB için iki ayrı giriş
  - SidebarMenuItem: lockable mantığı (session state üzerinden)
  - Sidebar.ts legacy requireSeller davranışı kaldırıldı
- refactor(auth): SupplierSetupForm + AccountSetupForm User Profile API'sine taşındı (@aliiball)
  - supplier-setup + account-setup register_supplier / register_user Sprint 2.6 davranışına uyarlandı
  - account_type Bireysel/Şirket toggle KYC formuna taşındı (register'dan kaldırıldı)
  - utils/auth.ts session capability flag'leri (kyc_required, kyb_required, kyc_locked, kyb_locked) eklendi
  - pages/sell.ts + pages/supplier-setup.ts Sprint 2 akışına uyumlandı
- refactor(addresses): Bireysel/Kurumsal toggle + tax_no/tax_office eklendi (@aliiball)
  - AddressesLayout: address_type toggle (Individual/Business)
  - tax_no + tax_office Business için conditional render
  - utils/tr-validation.ts: VKN + TCKN checksum
  - alpine/addresses.ts: purpose alanı + Sprint 1 Faz D uyumu
- refactor(kyb): mersis_no + kep_address + rejection_category form alanları eklendi (@aliiball)
  - KybLayout + alpine/kyb purpose/state machine güncellemeleri
  - pages/kyb.ts mersis (16 hane) + kep (email format) doğrulamaları
- refactor(cart): SupplierCard + CartStore + cartService Sprint 2 uyumu (@aliiball)
  - SupplierCard supplierId → admin_seller_profile.name eşleme
  - CartStore + CartSummary KYC gate state
  - cartService [KYC_<STATE>] prefix mesajı parse
  - checkout.ts KycRequiredModal entegrasyonu
  - pages/product-detail + ProductInfo + MobileLayout + ProductListingGrid capability flag kontrolleri
  - types/cart + types/productListing Sprint 2 alanları
- refactor(layout): products/manufacturers sayfaları unified SubHeader'a geçirildi (@ahmeetseker)
  - SearchHeader → SubHeader: tabs + breadcrumb + sonuç başlığı + sort/view tek bileşende toplandı
  - MegaMenu: kategori kart görseli yerine icon-only akış
  - i18n: viewingLead, unitFound, unitFoundManufacturer, viewMode/Grid/List anahtarları eklendi
  - ManufacturerFilterSidebar/List, FilterSidebar, TopBar SubHeader API'ye uyumlandı
- refactor(lint): tradehubfront ESLint warning'leri sıfırlandı (@ahmeetseker)
  - 304 @typescript-eslint/no-explicit-any → proper type tanımları
  - Global window augmentation: src/types/global.d.ts oluşturuldu (API_BASE, Alpine, dataLayer, __getSellerFavs, __originalListingImages vb.)
  - Mevcut interface'ler kullanıldı (ProductDetail.videoUrl/brandInfo/specGroups cast'leri kaldırıldı); yeni: NotificationItem, RawTailoredProduct, Quote, Message/Conversation, SectionSettings, SellerStorefrontData, AlpineDataEl vb.
  - catch (e: any) → catch veya catch (e: unknown) + type guard
  - Underscore-prefix discard pattern (_id, _tempId, _) için varsIgnorePattern + caughtErrorsIgnorePattern: '^_' eklendi
  - Debug console.log silindi veya console.warn'a çevrildi
  - alpine/seller.ts, alpine/orders.ts, alpine/help.ts dahil ~50 dosya temizlendi
- refactor(upload): RFQ ve KYB/KYC upload-ui kütüphanesine taşındı (@aliiball)
  - src/lib/upload-ui/ paylaşımlı kütüphane (admin-panel ile aynı API)
  - rfq/dropzone.ts upload-ui facade'ı üzerinden yeniden yazıldı
  - rfq/file-list.ts ve rfq/uploader.ts ayrıldı
  - KybLayout, KycLayout, SettingsLayout, TicketForm, WriteReviewModal yeni upload bileşenlerine bağlandı
  - rfq-form.ts ve rfq.ts sayfa init'leri sadeleştirildi
  - i18n: yeni upload string'leri (en/tr)
- refactor(ui): radio seçimleri toggle bileşenlerine dönüştürüldü (@aliiball)
  - renderSwitch ve renderSegmented helper'ları eklendi
  - vergi mükellef tipi, fatura tipi ve KYC hesap türü segmented'e çevrildi
  - e-fatura mükellefiyeti switch'e çevrildi
  - sipariş iptal sebebi dropdown'a çevrildi
  - şikayet sebebi ve filtre seçimleri chip grubuna çevrildi

---
## [v1.1.9-rc.2] - 2026-06-05 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(changelog): yeni storefront özellikleri eklendi ve belgeler güncellendi (@ahmeetseker)
- feat(kyc): KYC sayfası + form + prefill API entegrasyonu eklendi (@aliiball)
  - pages/dashboard/kyc.html + src/pages/kyc.ts entry
  - src/components/kyc/KycLayout.ts: Kurumsal/Bireysel toggle + boxed layout (account_type register'dan KYC formuna taşındı)
  - get_prefill_data ile User Profile + son KYC/KYB değerleri prefill
  - src/types/userProfile.ts type tanımları
- feat(verification-ui): banner + locked-feature + kyc-required modal eklendi (@aliiball)
  - VerificationStatusBanner: KYC × KYB state machine ile 9 banner durumu
  - LockedFeatureModal: sidebar locked item için "Alıcı/Satıcı olun" CTA
  - KycRequiredModal: checkout'ta [KYC_<STATE>] prefix regex parse + state-bazlı modal (Locked/Pending/Rejected/Suspended → support ticket)
  - utils/sellerRouter.ts: satıcı dashboard yönlendirme yardımcısı
- feat(data): countries + country-subdivisions mock data eklendi (@aliiball)
  - src/data/countries.ts: ülke listesi (ISO kodları + isimler)
  - src/data/country-subdivisions.ts: ülke-il/eyalet eşlemesi
- feat(i18n): KYC + verification + address purpose çevirileri eklendi (@aliiball)
  - en.ts + tr.ts: settings.myAccountTitle, settings.addressDisabledHint, header.myStore ("Mağaza Sayfam" → "Mağazalarım"), kyc.* key'leri, verification banner state'leri, address purpose etiketleri
- feat(auth): yasal metin onay popup'ı ve ayrı checkbox'lar eklendi (@aliiball)
  - Tek "Kullanım Koşulları ve Gizlilik Politikası" checkbox'ı iki ayrı onaya bölündü (terms-checkbox + privacy-checkbox)
  - Turuncu metne tıklayınca tüm sözleşme içeriği popup içinde gösteriliyor (yeni LegalConsentModal component)
  - Reddet/Kabul Et butonları metnin sonuna kadar okunmadan görünmüyor; her açılışta scroll baştan başlıyor ve buton durumu sıfırlanıyor
  - Popup içeriği legalContent.ts'ten çekiliyor — terms/privacy sayfalarıyla aynı kaynak
  - i18n: agreeTerms TR-suffix/EN-prefix çakışması agreeBefore + agreeAfter'a bölündü; auth.setup.legalConsent.{accept, reject} eklendi
- feat(sell): pricing planları dinamik API + entitlement banner (@boraydeger32)
  - sell sayfasındaki 4 hardcoded TIERS dizisi kaldırıldı, planlar artık tradehub_core.api.v1.public_pricing.get_pricing_plans endpoint'inden çekiliyor (Süper Admin Permission Console'dan yönetim).
  - pricingService.ts: localStorage cache (5 dk) + stale-while-revalidate; cache key v2'ye yükseltildi (CTA label şema değişikliği için invalidate).
  - sell.ts: cache fresh ise senkron paint, değilse fetch await; arka planda daima fetch + updated_at değişirse #paketler section'ı yerinde re-render (tüm DOM swap yerine — Alpine state korunur).
  - SellPageLayout: CTA action map (signup, contact_sales, learn_more) ve feature icon glyph map (check, x, star, zap, info, default check) eklendi; currency symbol + fmtListings helper'ları.
  - FAZ 1.7 — utils/entitlement.ts: snapshot client (sessionStorage 5dk cache), hasFeature/withinQuota/isVerifiedForCheckout helper'ları. Güvenlik sınırı değil — gerçek karar her korumalı eylemde backend'de.
  - components/subscription/EntitlementBanner.ts: trial ending (< 3 gün) ve subscription past_due durumları için banner.
- feat(routing): Türkçe pretty URL'lere dist HTML mapping katmanı eklendi (@ahmeetseker)
  - staticPageUrl.ts'e STATIC_PAGE_HTML_MAP ve getStaticPageHtmlPath() eklendi
  - Vite dev plugin (staticPageRewritePlugin) /ureticiler gibi path'leri pages/manufacturers.html'e rewrite eder
  - nginx.conf.template'e `map $uri $static_page_html` bloğu eklendi (prod aynı işi yapar)
  - Slug'lar yenilendi: /markalar → /ureticiler, /firsat → /firsatlar (MegaMenu, TopBar, HeroSideBannerSlider, TopDeals, SubHeader)
  - Seller storefront `/magaza/<code>` path'inden seller_code parse eder, nginx internal rewrite sonrası query görünmediği için fallback olarak
  - StoreHeader/CompanyProfile "Mağazayı ziyaret et" linkleri sellerCode state'ine bağlandı
- feat: kullanıcı veri hakları UI, backend-driven tracking ve SEO routing (@ahmeetseker)
  - Hesap ayarlarına "Verilerimi İndir" ve "Onay Yönetimi" bölümleri eklendi
  - Tracking Manager artık ID'leri backend API'den alıyor (hardcoded değerler kaldırıldı)
  - Nginx'e statik sayfa SEO backend routing eklendi (meta tag DB injection)
  - Social proof view kaydında CSRF token düzeltmesi
  - Ürün yorumları slug yerine Frappe name ile yükleniyor
  - Ödeme sayfalarına tracking init eklendi
  - Türkçe i18n çevirileri (consent, data export)
- feat(nginx): enhance SEO routing for bot user-agents and update static page handling (@ahmeetseker)
- feat(nginx): enhance dynamic SEO routing for bots and users with new rewrite rules (@ahmeetseker)
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri
- feat(kyc-kyb): belge önizleme kartı ve TCKN/VKN doğrulama eklendi (@aliiball)
  - KYC formunda mod-aware TCKN/VKN client-side validation eklendi; Bireysel modda pattern \d{11} + minlength/maxlength 11, Kurumsal modda \d{10,11}
  - isValidTckn helper backend kuralları ile birebir mod-10 checksum kontrolü yapıyor (submit'ten önce 11 hane TCKN doğrulanıyor)
  - KYC submit catch bloğuna console.error eklendi (debug için)
  - KYC ve KYB formlarında yüklü belgeler için Karma C preview pattern eklendi: yeşil tema kart, dosya ikonu, Yüklü rozet, dosya adı, Görüntüle butonu; SlotDropzone drag-drop davranışı korundu
  - Yeni dosya yüklenince preview kartı yenisine otomatik refresh oluyor
  - Verified ve Suspended durumlarında belge yükleme kapatıldı (slot-zone display:none + input disabled), preview kartı görünür kalıyor; backend 403 ve login redirect döngüsü engellendi
- feat(i18n): add Arabic + Russian locales and RTL layout support (@aliturguttursab)
  - locales: add ar.ts, ru.ts; register both in i18n/index.ts and extend SUPPORTED_LANGS
  - RTL: add RTL_LANGS/isRtl(); sync <html lang> and dir on first paint (static HTML hard-codes lang, detector overrides it)
  - layout: convert physical Tailwind direction classes to logical ones across ~175 components/pages (ml/mr->ms/me, pl/pr->ps/pe, text-left/right->text-start/end, border-l/r->border-s/e, rounded-*->logical, left/right->inset-s/e, float-*)
  - tooling: add scripts/rtl-logical-convert.mjs - boundary-aware codemod, verified against Tailwind v4 docs
- feat(storefront): alıcı paneli analitiği, hero slider ve sosyal kanıt eklendi (@ahmeetseker)
  - Alıcı dashboard'una ECharts tabanlı analitik özeti eklendi (KPI + harcama trendi + kategori dağılımı)
  - Ana sayfaya hero üst slider ve heroSliderService eklendi
  - Ürün listelemeye sosyal kanıt rozetleri eklendi (initListingSocialProof + socialProofService, batch sinyal)
  - Ürün mobil görünümüne öneri şeridi (MobileRecommendations) eklendi
  - Sepet/favoriler/üst bar UI iyileştirildi; küçük kontrollerde th-no-press ve RTL-logical (ps-/text-start) uyumu sağlandı
  - Kullanılmayan statik bilgi sayfaları kaldırıldı (blog, careers, csr, monitoring, news, partnerships, shipping-protection, tax)
- feat(sell): pricing kartı yalnızca dahil özellikleri gösterir + kart/tablo tutarlılığı (@boraydeger32)
  - PricingCard "Paket içeriği": sadece dahil (✓) özellikler; devre dışı (✗) gizlendi
  - Karşılaştırma matrisi backend field-otoritesiyle uyumlu (kart ile birebir)
  - pricingService: v3 cache + SWR (her yüklemede revalidate)
  - vite.config: küçük güncelleme
- feat(storefront): kategori vitrini ve satış sıralaması eklendi (@ahmeetseker)
  - Ana sayfaya Kategori Vitrini bento grid bölümü eklendi (stale-while-revalidate cache, FOUC'suz)
  - Ürün detayı Özellikler sekmesine kategori bazlı satış sıralaması (Best Sellers Rank) eklendi
  - Mega menü 3. seviyeyi (sektör › grup › yaprak) destekleyecek şekilde genişletildi
  - Ürün listesi breadcrumb'ı tam kategori zinciriyle (findCategoryPath) yeniden kuruldu
  - Hero slider responsive tipografi ve padding ölçekleri iyileştirildi
  - Satıcı sayfası metinleri "Türkiye" yerine küresel hitaba güncellendi
  - Sepet favori ikonu inline SVG'ye çevrildi; gizlilik ayarlarında segmented kontrol render hatası düzeltildi
- feat(overview): update certificate display with image support and improved layout (@ahmeetseker)

### Duzeltildi
- fix(ci): son PROD tag'ini güncelleyerek CHANGELOG girişini düzeltildi (@ahmeetseker)
- fix(settings): address/city/postal_code disabled + Vergi tab gizlendi (@aliiball)
  - SettingsAccountEdit + SettingsMyAccount address/city/postal_code disabled + helper text (Frappe Address mimarisinde olduğu için)
  - SettingsLayout 4 noktada Vergi tab yorum satırı (S3=C kararı)
  - FavoritesLayout User Profile field uyumu + filter sets
  - buyer-dashboard NewBuyerInfo + UserInfoCard + types + mock Sprint 2
  - pages/buyer-dashboard VerificationStatusBanner entegrasyonu
- fix(cart): sepet popup'larında mağaza adı linklendi ve canonical URL'ye normalize edildi (@ahmeetseker)
  - SharedCartDrawer: store'a yeni supplier eklenirken href canonical /pages/seller/seller-shop.html?seller= pattern'iyle yazılıyor
  - TopBar: header sepet özetinde eski /pages/seller.html?id= href'leri normalizeSupplierHref ile canonical pattern'e çevriliyor;
  - ManufacturersHero: statik "0" yerine favorites/sellerFavorites store'larından canlı count; favorites-changed ve
  - i18n: mfr.favoriteProducts / mfr.favoriteSuppliers key'leri eklendi (TR/EN), whitespace-pre-line ile iki satır render
  - ManufacturerList: ürün kartlarında thumbnail block + body sabit yükseklik (h-[78px], min-h-[2lh]) ile kart yüksekliği eşitlendi refactor(product): fiyat tier'larında strikethrough üst satıra alındı, qty font büyüdü
  - Pre-discount fiyat artık deal fiyatının yanında değil, üstünde block olarak gösteriliyor
  - Tier qty etiketi 13px → 15px
  - TR locale'inde "MSA:" prefix'i kaldırıldı; tier başlığı sade "1 adet" / "1 - 5 adet"
  - SubHeader: products sekmesinde "...\"keyword\" kategorisinde", manufacturers sekmesinde "...\"keyword\" için küresel
  - ProductListingGrid: chat butonuna list-mode'da tam genişlik ve <1599px grid'de küçük font/padding için container-query
  - MegaMenu: featured kart tipografisi keyfi [11.5px]/[13px] yerine text-xs / text-sm'e standardize edildi
  - fix(cart): sepet popup'larında eski /pages/seller.html?id= href'leri canonical /pages/seller/seller-shop.html?seller=
  - feat(manufacturers): landing favori ürün/tedarikçi sayaçları favorites store'larından canlı, event listener ile güncelleniyor;
  - refactor(product): fiyat tier'da strikethrough üst satıra taşındı, qty font 15px; TR "MSA:" prefix'i kaldırıldı
  - refactor(listing): SubHeader başlığı products/manufacturers sekmesine göre dinamik; ProductListingGrid chat butonuna list-mode
  - refactor(manufacturers): ürün kartlarında thumbnail block + body sabit yükseklik ile hizalama düzeltildi
- fix: SEO URL uyumluluğu ve seller shop routing düzeltmeleri (@ahmeetseker)
  - nginx.conf.template: /magaza/{code}/dukkan route'u ekle (seller shop)
  - ManufacturerList: ürün kartları slug ile SEO URL kullanır
  - ManufacturersHero: ürün linkleri slug fallback ile
  - CompanyProfile: mağaza ziyaret linki düzeltmesi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX
- fix(rtl): mirror Swiper sliders and mobile drawer for Arabic (RTL) (@aliturguttursab)
  - Every `new Swiper()` rendered LTR on an RTL page (slides packed to the physical left, large empty band on the right). Swiper's computed- direction auto-detect is unreliable at init (async API fill / pre- reflow), so it stayed LTR.
  - Add src/utils/direction.ts → applySwiperDir(el|selector): sets the container's `dir` attribute (Swiper's documented RTL trigger) to the document direction before instantiation. Applied to all sliders: hero (Recommendation/HeroSideBanner/Tailored), product RelatedProducts, 404 ExploreDeals, TailoredSelectionsHero, alpine/dashboard, seller/interactions (x5), trade-assurance, rfq.
  - Drawer anchors `start-0` (correct, right edge in RTL) but hide/show toggles physical -translate-x-full / translate-x-full (Flowbite + custom panel JS). Physical translate does not flip, so the hidden drawer slid into the viewport instead of off the right edge.
  - Tailwind v4 compiles these to the `translate` property via --tw-translate-x. Flip only that var, only in RTL, only while the toggled class is present, via inline variants (rtl:[&.-translate-x-full]:[--tw-translate-x:100%] and the inner-panel counterpart) — no Flowbite/JS changes, LTR untouched.
- fix(storefront): pre-existing build hataları ve checkout renk temizliği (@aliiball)
  - Eksik echarts bağımlılığı npm install ile yüklendi (rollup resolve hatası giderildi)
  - Settings Privacy yarım merge tamamlandı (segmented toggle çalışır hâle geldi, ${optionsHtml} → ${segmented})
  - Cart ürün satırında favori ikonu (fav.png) import edildi, isFav ile aktif/pasif renk vurgusu eklendi
  - Checkout ödeme yöntemi kartı hardcoded hex (#f5b800, #d39c00, #fff8e1) yerine Tailwind v4 brand token utility'leri kullanıyor
  - Görsel değişiklik yok; tek brand kaynağı style.css @theme bloğunda

### Degistirildi
- refactor(sidebar): KYC + KYB iki ayrı lockable item olarak ayrıldı (@aliiball)
  - sidebarData + sidebarIcons: KYC ve KYB için iki ayrı giriş
  - SidebarMenuItem: lockable mantığı (session state üzerinden)
  - Sidebar.ts legacy requireSeller davranışı kaldırıldı
- refactor(auth): SupplierSetupForm + AccountSetupForm User Profile API'sine taşındı (@aliiball)
  - supplier-setup + account-setup register_supplier / register_user Sprint 2.6 davranışına uyarlandı
  - account_type Bireysel/Şirket toggle KYC formuna taşındı (register'dan kaldırıldı)
  - utils/auth.ts session capability flag'leri (kyc_required, kyb_required, kyc_locked, kyb_locked) eklendi
  - pages/sell.ts + pages/supplier-setup.ts Sprint 2 akışına uyumlandı
- refactor(addresses): Bireysel/Kurumsal toggle + tax_no/tax_office eklendi (@aliiball)
  - AddressesLayout: address_type toggle (Individual/Business)
  - tax_no + tax_office Business için conditional render
  - utils/tr-validation.ts: VKN + TCKN checksum
  - alpine/addresses.ts: purpose alanı + Sprint 1 Faz D uyumu
- refactor(kyb): mersis_no + kep_address + rejection_category form alanları eklendi (@aliiball)
  - KybLayout + alpine/kyb purpose/state machine güncellemeleri
  - pages/kyb.ts mersis (16 hane) + kep (email format) doğrulamaları
- refactor(cart): SupplierCard + CartStore + cartService Sprint 2 uyumu (@aliiball)
  - SupplierCard supplierId → admin_seller_profile.name eşleme
  - CartStore + CartSummary KYC gate state
  - cartService [KYC_<STATE>] prefix mesajı parse
  - checkout.ts KycRequiredModal entegrasyonu
  - pages/product-detail + ProductInfo + MobileLayout + ProductListingGrid capability flag kontrolleri
  - types/cart + types/productListing Sprint 2 alanları
- refactor(layout): products/manufacturers sayfaları unified SubHeader'a geçirildi (@ahmeetseker)
  - SearchHeader → SubHeader: tabs + breadcrumb + sonuç başlığı + sort/view tek bileşende toplandı
  - MegaMenu: kategori kart görseli yerine icon-only akış
  - i18n: viewingLead, unitFound, unitFoundManufacturer, viewMode/Grid/List anahtarları eklendi
  - ManufacturerFilterSidebar/List, FilterSidebar, TopBar SubHeader API'ye uyumlandı
- refactor(lint): tradehubfront ESLint warning'leri sıfırlandı (@ahmeetseker)
  - 304 @typescript-eslint/no-explicit-any → proper type tanımları
  - Global window augmentation: src/types/global.d.ts oluşturuldu (API_BASE, Alpine, dataLayer, __getSellerFavs, __originalListingImages vb.)
  - Mevcut interface'ler kullanıldı (ProductDetail.videoUrl/brandInfo/specGroups cast'leri kaldırıldı); yeni: NotificationItem, RawTailoredProduct, Quote, Message/Conversation, SectionSettings, SellerStorefrontData, AlpineDataEl vb.
  - catch (e: any) → catch veya catch (e: unknown) + type guard
  - Underscore-prefix discard pattern (_id, _tempId, _) için varsIgnorePattern + caughtErrorsIgnorePattern: '^_' eklendi
  - Debug console.log silindi veya console.warn'a çevrildi
  - alpine/seller.ts, alpine/orders.ts, alpine/help.ts dahil ~50 dosya temizlendi
- refactor(upload): RFQ ve KYB/KYC upload-ui kütüphanesine taşındı (@aliiball)
  - src/lib/upload-ui/ paylaşımlı kütüphane (admin-panel ile aynı API)
  - rfq/dropzone.ts upload-ui facade'ı üzerinden yeniden yazıldı
  - rfq/file-list.ts ve rfq/uploader.ts ayrıldı
  - KybLayout, KycLayout, SettingsLayout, TicketForm, WriteReviewModal yeni upload bileşenlerine bağlandı
  - rfq-form.ts ve rfq.ts sayfa init'leri sadeleştirildi
  - i18n: yeni upload string'leri (en/tr)
- refactor(ui): radio seçimleri toggle bileşenlerine dönüştürüldü (@aliiball)
  - renderSwitch ve renderSegmented helper'ları eklendi
  - vergi mükellef tipi, fatura tipi ve KYC hesap türü segmented'e çevrildi
  - e-fatura mükellefiyeti switch'e çevrildi
  - sipariş iptal sebebi dropdown'a çevrildi
  - şikayet sebebi ve filtre seçimleri chip grubuna çevrildi

---
## [v1.1.9-beta.31] - 2026-06-05 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri
- feat(kyc-kyb): belge önizleme kartı ve TCKN/VKN doğrulama eklendi (@aliiball)
  - KYC formunda mod-aware TCKN/VKN client-side validation eklendi; Bireysel modda pattern \d{11} + minlength/maxlength 11, Kurumsal modda \d{10,11}
  - isValidTckn helper backend kuralları ile birebir mod-10 checksum kontrolü yapıyor (submit'ten önce 11 hane TCKN doğrulanıyor)
  - KYC submit catch bloğuna console.error eklendi (debug için)
  - KYC ve KYB formlarında yüklü belgeler için Karma C preview pattern eklendi: yeşil tema kart, dosya ikonu, Yüklü rozet, dosya adı, Görüntüle butonu; SlotDropzone drag-drop davranışı korundu
  - Yeni dosya yüklenince preview kartı yenisine otomatik refresh oluyor
  - Verified ve Suspended durumlarında belge yükleme kapatıldı (slot-zone display:none + input disabled), preview kartı görünür kalıyor; backend 403 ve login redirect döngüsü engellendi
- feat(i18n): add Arabic + Russian locales and RTL layout support (@aliturguttursab)
  - locales: add ar.ts, ru.ts; register both in i18n/index.ts and extend SUPPORTED_LANGS
  - RTL: add RTL_LANGS/isRtl(); sync <html lang> and dir on first paint (static HTML hard-codes lang, detector overrides it)
  - layout: convert physical Tailwind direction classes to logical ones across ~175 components/pages (ml/mr->ms/me, pl/pr->ps/pe, text-left/right->text-start/end, border-l/r->border-s/e, rounded-*->logical, left/right->inset-s/e, float-*)
  - tooling: add scripts/rtl-logical-convert.mjs - boundary-aware codemod, verified against Tailwind v4 docs
- feat(storefront): alıcı paneli analitiği, hero slider ve sosyal kanıt eklendi (@ahmeetseker)
  - Alıcı dashboard'una ECharts tabanlı analitik özeti eklendi (KPI + harcama trendi + kategori dağılımı)
  - Ana sayfaya hero üst slider ve heroSliderService eklendi
  - Ürün listelemeye sosyal kanıt rozetleri eklendi (initListingSocialProof + socialProofService, batch sinyal)
  - Ürün mobil görünümüne öneri şeridi (MobileRecommendations) eklendi
  - Sepet/favoriler/üst bar UI iyileştirildi; küçük kontrollerde th-no-press ve RTL-logical (ps-/text-start) uyumu sağlandı
  - Kullanılmayan statik bilgi sayfaları kaldırıldı (blog, careers, csr, monitoring, news, partnerships, shipping-protection, tax)
- feat(sell): pricing kartı yalnızca dahil özellikleri gösterir + kart/tablo tutarlılığı (@boraydeger32)
  - PricingCard "Paket içeriği": sadece dahil (✓) özellikler; devre dışı (✗) gizlendi
  - Karşılaştırma matrisi backend field-otoritesiyle uyumlu (kart ile birebir)
  - pricingService: v3 cache + SWR (her yüklemede revalidate)
  - vite.config: küçük güncelleme
- feat(storefront): kategori vitrini ve satış sıralaması eklendi (@ahmeetseker)
  - Ana sayfaya Kategori Vitrini bento grid bölümü eklendi (stale-while-revalidate cache, FOUC'suz)
  - Ürün detayı Özellikler sekmesine kategori bazlı satış sıralaması (Best Sellers Rank) eklendi
  - Mega menü 3. seviyeyi (sektör › grup › yaprak) destekleyecek şekilde genişletildi
  - Ürün listesi breadcrumb'ı tam kategori zinciriyle (findCategoryPath) yeniden kuruldu
  - Hero slider responsive tipografi ve padding ölçekleri iyileştirildi
  - Satıcı sayfası metinleri "Türkiye" yerine küresel hitaba güncellendi
  - Sepet favori ikonu inline SVG'ye çevrildi; gizlilik ayarlarında segmented kontrol render hatası düzeltildi
- feat(overview): update certificate display with image support and improved layout (@ahmeetseker)

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX
- fix(rtl): mirror Swiper sliders and mobile drawer for Arabic (RTL) (@aliturguttursab)
  - Every `new Swiper()` rendered LTR on an RTL page (slides packed to the physical left, large empty band on the right). Swiper's computed- direction auto-detect is unreliable at init (async API fill / pre- reflow), so it stayed LTR.
  - Add src/utils/direction.ts → applySwiperDir(el|selector): sets the container's `dir` attribute (Swiper's documented RTL trigger) to the document direction before instantiation. Applied to all sliders: hero (Recommendation/HeroSideBanner/Tailored), product RelatedProducts, 404 ExploreDeals, TailoredSelectionsHero, alpine/dashboard, seller/interactions (x5), trade-assurance, rfq.
  - Drawer anchors `start-0` (correct, right edge in RTL) but hide/show toggles physical -translate-x-full / translate-x-full (Flowbite + custom panel JS). Physical translate does not flip, so the hidden drawer slid into the viewport instead of off the right edge.
  - Tailwind v4 compiles these to the `translate` property via --tw-translate-x. Flip only that var, only in RTL, only while the toggled class is present, via inline variants (rtl:[&.-translate-x-full]:[--tw-translate-x:100%] and the inner-panel counterpart) — no Flowbite/JS changes, LTR untouched.
- fix(storefront): pre-existing build hataları ve checkout renk temizliği (@aliiball)
  - Eksik echarts bağımlılığı npm install ile yüklendi (rollup resolve hatası giderildi)
  - Settings Privacy yarım merge tamamlandı (segmented toggle çalışır hâle geldi, ${optionsHtml} → ${segmented})
  - Cart ürün satırında favori ikonu (fav.png) import edildi, isFav ile aktif/pasif renk vurgusu eklendi
  - Checkout ödeme yöntemi kartı hardcoded hex (#f5b800, #d39c00, #fff8e1) yerine Tailwind v4 brand token utility'leri kullanıyor
  - Görsel değişiklik yok; tek brand kaynağı style.css @theme bloğunda

### Degistirildi
- refactor(ui): radio seçimleri toggle bileşenlerine dönüştürüldü (@aliiball)
  - renderSwitch ve renderSegmented helper'ları eklendi
  - vergi mükellef tipi, fatura tipi ve KYC hesap türü segmented'e çevrildi
  - e-fatura mükellefiyeti switch'e çevrildi
  - sipariş iptal sebebi dropdown'a çevrildi
  - şikayet sebebi ve filtre seçimleri chip grubuna çevrildi

---
## [v1.1.9-beta.30] - 2026-06-05 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri
- feat(kyc-kyb): belge önizleme kartı ve TCKN/VKN doğrulama eklendi (@aliiball)
  - KYC formunda mod-aware TCKN/VKN client-side validation eklendi; Bireysel modda pattern \d{11} + minlength/maxlength 11, Kurumsal modda \d{10,11}
  - isValidTckn helper backend kuralları ile birebir mod-10 checksum kontrolü yapıyor (submit'ten önce 11 hane TCKN doğrulanıyor)
  - KYC submit catch bloğuna console.error eklendi (debug için)
  - KYC ve KYB formlarında yüklü belgeler için Karma C preview pattern eklendi: yeşil tema kart, dosya ikonu, Yüklü rozet, dosya adı, Görüntüle butonu; SlotDropzone drag-drop davranışı korundu
  - Yeni dosya yüklenince preview kartı yenisine otomatik refresh oluyor
  - Verified ve Suspended durumlarında belge yükleme kapatıldı (slot-zone display:none + input disabled), preview kartı görünür kalıyor; backend 403 ve login redirect döngüsü engellendi
- feat(i18n): add Arabic + Russian locales and RTL layout support (@aliturguttursab)
  - locales: add ar.ts, ru.ts; register both in i18n/index.ts and extend SUPPORTED_LANGS
  - RTL: add RTL_LANGS/isRtl(); sync <html lang> and dir on first paint (static HTML hard-codes lang, detector overrides it)
  - layout: convert physical Tailwind direction classes to logical ones across ~175 components/pages (ml/mr->ms/me, pl/pr->ps/pe, text-left/right->text-start/end, border-l/r->border-s/e, rounded-*->logical, left/right->inset-s/e, float-*)
  - tooling: add scripts/rtl-logical-convert.mjs - boundary-aware codemod, verified against Tailwind v4 docs
- feat(storefront): alıcı paneli analitiği, hero slider ve sosyal kanıt eklendi (@ahmeetseker)
  - Alıcı dashboard'una ECharts tabanlı analitik özeti eklendi (KPI + harcama trendi + kategori dağılımı)
  - Ana sayfaya hero üst slider ve heroSliderService eklendi
  - Ürün listelemeye sosyal kanıt rozetleri eklendi (initListingSocialProof + socialProofService, batch sinyal)
  - Ürün mobil görünümüne öneri şeridi (MobileRecommendations) eklendi
  - Sepet/favoriler/üst bar UI iyileştirildi; küçük kontrollerde th-no-press ve RTL-logical (ps-/text-start) uyumu sağlandı
  - Kullanılmayan statik bilgi sayfaları kaldırıldı (blog, careers, csr, monitoring, news, partnerships, shipping-protection, tax)
- feat(sell): pricing kartı yalnızca dahil özellikleri gösterir + kart/tablo tutarlılığı (@boraydeger32)
  - PricingCard "Paket içeriği": sadece dahil (✓) özellikler; devre dışı (✗) gizlendi
  - Karşılaştırma matrisi backend field-otoritesiyle uyumlu (kart ile birebir)
  - pricingService: v3 cache + SWR (her yüklemede revalidate)
  - vite.config: küçük güncelleme
- feat(storefront): kategori vitrini ve satış sıralaması eklendi (@ahmeetseker)
  - Ana sayfaya Kategori Vitrini bento grid bölümü eklendi (stale-while-revalidate cache, FOUC'suz)
  - Ürün detayı Özellikler sekmesine kategori bazlı satış sıralaması (Best Sellers Rank) eklendi
  - Mega menü 3. seviyeyi (sektör › grup › yaprak) destekleyecek şekilde genişletildi
  - Ürün listesi breadcrumb'ı tam kategori zinciriyle (findCategoryPath) yeniden kuruldu
  - Hero slider responsive tipografi ve padding ölçekleri iyileştirildi
  - Satıcı sayfası metinleri "Türkiye" yerine küresel hitaba güncellendi
  - Sepet favori ikonu inline SVG'ye çevrildi; gizlilik ayarlarında segmented kontrol render hatası düzeltildi

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX
- fix(rtl): mirror Swiper sliders and mobile drawer for Arabic (RTL) (@aliturguttursab)
  - Every `new Swiper()` rendered LTR on an RTL page (slides packed to the physical left, large empty band on the right). Swiper's computed- direction auto-detect is unreliable at init (async API fill / pre- reflow), so it stayed LTR.
  - Add src/utils/direction.ts → applySwiperDir(el|selector): sets the container's `dir` attribute (Swiper's documented RTL trigger) to the document direction before instantiation. Applied to all sliders: hero (Recommendation/HeroSideBanner/Tailored), product RelatedProducts, 404 ExploreDeals, TailoredSelectionsHero, alpine/dashboard, seller/interactions (x5), trade-assurance, rfq.
  - Drawer anchors `start-0` (correct, right edge in RTL) but hide/show toggles physical -translate-x-full / translate-x-full (Flowbite + custom panel JS). Physical translate does not flip, so the hidden drawer slid into the viewport instead of off the right edge.
  - Tailwind v4 compiles these to the `translate` property via --tw-translate-x. Flip only that var, only in RTL, only while the toggled class is present, via inline variants (rtl:[&.-translate-x-full]:[--tw-translate-x:100%] and the inner-panel counterpart) — no Flowbite/JS changes, LTR untouched.
- fix(storefront): pre-existing build hataları ve checkout renk temizliği (@aliiball)
  - Eksik echarts bağımlılığı npm install ile yüklendi (rollup resolve hatası giderildi)
  - Settings Privacy yarım merge tamamlandı (segmented toggle çalışır hâle geldi, ${optionsHtml} → ${segmented})
  - Cart ürün satırında favori ikonu (fav.png) import edildi, isFav ile aktif/pasif renk vurgusu eklendi
  - Checkout ödeme yöntemi kartı hardcoded hex (#f5b800, #d39c00, #fff8e1) yerine Tailwind v4 brand token utility'leri kullanıyor
  - Görsel değişiklik yok; tek brand kaynağı style.css @theme bloğunda

### Degistirildi
- refactor(ui): radio seçimleri toggle bileşenlerine dönüştürüldü (@aliiball)
  - renderSwitch ve renderSegmented helper'ları eklendi
  - vergi mükellef tipi, fatura tipi ve KYC hesap türü segmented'e çevrildi
  - e-fatura mükellefiyeti switch'e çevrildi
  - sipariş iptal sebebi dropdown'a çevrildi
  - şikayet sebebi ve filtre seçimleri chip grubuna çevrildi

---
## [v1.1.9-beta.26] - 2026-06-04 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri
- feat(kyc-kyb): belge önizleme kartı ve TCKN/VKN doğrulama eklendi (@aliiball)
  - KYC formunda mod-aware TCKN/VKN client-side validation eklendi; Bireysel modda pattern \d{11} + minlength/maxlength 11, Kurumsal modda \d{10,11}
  - isValidTckn helper backend kuralları ile birebir mod-10 checksum kontrolü yapıyor (submit'ten önce 11 hane TCKN doğrulanıyor)
  - KYC submit catch bloğuna console.error eklendi (debug için)
  - KYC ve KYB formlarında yüklü belgeler için Karma C preview pattern eklendi: yeşil tema kart, dosya ikonu, Yüklü rozet, dosya adı, Görüntüle butonu; SlotDropzone drag-drop davranışı korundu
  - Yeni dosya yüklenince preview kartı yenisine otomatik refresh oluyor
  - Verified ve Suspended durumlarında belge yükleme kapatıldı (slot-zone display:none + input disabled), preview kartı görünür kalıyor; backend 403 ve login redirect döngüsü engellendi
- feat(i18n): add Arabic + Russian locales and RTL layout support (@aliturguttursab)
  - locales: add ar.ts, ru.ts; register both in i18n/index.ts and extend SUPPORTED_LANGS
  - RTL: add RTL_LANGS/isRtl(); sync <html lang> and dir on first paint (static HTML hard-codes lang, detector overrides it)
  - layout: convert physical Tailwind direction classes to logical ones across ~175 components/pages (ml/mr->ms/me, pl/pr->ps/pe, text-left/right->text-start/end, border-l/r->border-s/e, rounded-*->logical, left/right->inset-s/e, float-*)
  - tooling: add scripts/rtl-logical-convert.mjs - boundary-aware codemod, verified against Tailwind v4 docs
- feat(storefront): alıcı paneli analitiği, hero slider ve sosyal kanıt eklendi (@ahmeetseker)
  - Alıcı dashboard'una ECharts tabanlı analitik özeti eklendi (KPI + harcama trendi + kategori dağılımı)
  - Ana sayfaya hero üst slider ve heroSliderService eklendi
  - Ürün listelemeye sosyal kanıt rozetleri eklendi (initListingSocialProof + socialProofService, batch sinyal)
  - Ürün mobil görünümüne öneri şeridi (MobileRecommendations) eklendi
  - Sepet/favoriler/üst bar UI iyileştirildi; küçük kontrollerde th-no-press ve RTL-logical (ps-/text-start) uyumu sağlandı
  - Kullanılmayan statik bilgi sayfaları kaldırıldı (blog, careers, csr, monitoring, news, partnerships, shipping-protection, tax)

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX

### Degistirildi
- refactor(ui): radio seçimleri toggle bileşenlerine dönüştürüldü (@aliiball)
  - renderSwitch ve renderSegmented helper'ları eklendi
  - vergi mükellef tipi, fatura tipi ve KYC hesap türü segmented'e çevrildi
  - e-fatura mükellefiyeti switch'e çevrildi
  - sipariş iptal sebebi dropdown'a çevrildi
  - şikayet sebebi ve filtre seçimleri chip grubuna çevrildi

---
## [v1.1.9-beta.25] - 2026-06-03 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri
- feat(kyc-kyb): belge önizleme kartı ve TCKN/VKN doğrulama eklendi (@aliiball)
  - KYC formunda mod-aware TCKN/VKN client-side validation eklendi; Bireysel modda pattern \d{11} + minlength/maxlength 11, Kurumsal modda \d{10,11}
  - isValidTckn helper backend kuralları ile birebir mod-10 checksum kontrolü yapıyor (submit'ten önce 11 hane TCKN doğrulanıyor)
  - KYC submit catch bloğuna console.error eklendi (debug için)
  - KYC ve KYB formlarında yüklü belgeler için Karma C preview pattern eklendi: yeşil tema kart, dosya ikonu, Yüklü rozet, dosya adı, Görüntüle butonu; SlotDropzone drag-drop davranışı korundu
  - Yeni dosya yüklenince preview kartı yenisine otomatik refresh oluyor
  - Verified ve Suspended durumlarında belge yükleme kapatıldı (slot-zone display:none + input disabled), preview kartı görünür kalıyor; backend 403 ve login redirect döngüsü engellendi
- feat(i18n): add Arabic + Russian locales and RTL layout support (@aliturguttursab)
  - locales: add ar.ts, ru.ts; register both in i18n/index.ts and extend SUPPORTED_LANGS
  - RTL: add RTL_LANGS/isRtl(); sync <html lang> and dir on first paint (static HTML hard-codes lang, detector overrides it)
  - layout: convert physical Tailwind direction classes to logical ones across ~175 components/pages (ml/mr->ms/me, pl/pr->ps/pe, text-left/right->text-start/end, border-l/r->border-s/e, rounded-*->logical, left/right->inset-s/e, float-*)
  - tooling: add scripts/rtl-logical-convert.mjs - boundary-aware codemod, verified against Tailwind v4 docs
- feat(storefront): alıcı paneli analitiği, hero slider ve sosyal kanıt eklendi (@ahmeetseker)
  - Alıcı dashboard'una ECharts tabanlı analitik özeti eklendi (KPI + harcama trendi + kategori dağılımı)
  - Ana sayfaya hero üst slider ve heroSliderService eklendi
  - Ürün listelemeye sosyal kanıt rozetleri eklendi (initListingSocialProof + socialProofService, batch sinyal)
  - Ürün mobil görünümüne öneri şeridi (MobileRecommendations) eklendi
  - Sepet/favoriler/üst bar UI iyileştirildi; küçük kontrollerde th-no-press ve RTL-logical (ps-/text-start) uyumu sağlandı
  - Kullanılmayan statik bilgi sayfaları kaldırıldı (blog, careers, csr, monitoring, news, partnerships, shipping-protection, tax)

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX

### Degistirildi
- refactor(ui): radio seçimleri toggle bileşenlerine dönüştürüldü (@aliiball)
  - renderSwitch ve renderSegmented helper'ları eklendi
  - vergi mükellef tipi, fatura tipi ve KYC hesap türü segmented'e çevrildi
  - e-fatura mükellefiyeti switch'e çevrildi
  - sipariş iptal sebebi dropdown'a çevrildi
  - şikayet sebebi ve filtre seçimleri chip grubuna çevrildi

---
## [v1.1.9-beta.23] - 2026-06-03 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri
- feat(kyc-kyb): belge önizleme kartı ve TCKN/VKN doğrulama eklendi (@aliiball)
  - KYC formunda mod-aware TCKN/VKN client-side validation eklendi; Bireysel modda pattern \d{11} + minlength/maxlength 11, Kurumsal modda \d{10,11}
  - isValidTckn helper backend kuralları ile birebir mod-10 checksum kontrolü yapıyor (submit'ten önce 11 hane TCKN doğrulanıyor)
  - KYC submit catch bloğuna console.error eklendi (debug için)
  - KYC ve KYB formlarında yüklü belgeler için Karma C preview pattern eklendi: yeşil tema kart, dosya ikonu, Yüklü rozet, dosya adı, Görüntüle butonu; SlotDropzone drag-drop davranışı korundu
  - Yeni dosya yüklenince preview kartı yenisine otomatik refresh oluyor
  - Verified ve Suspended durumlarında belge yükleme kapatıldı (slot-zone display:none + input disabled), preview kartı görünür kalıyor; backend 403 ve login redirect döngüsü engellendi
- feat(i18n): add Arabic + Russian locales and RTL layout support (@aliturguttursab)
  - locales: add ar.ts, ru.ts; register both in i18n/index.ts and extend SUPPORTED_LANGS
  - RTL: add RTL_LANGS/isRtl(); sync <html lang> and dir on first paint (static HTML hard-codes lang, detector overrides it)
  - layout: convert physical Tailwind direction classes to logical ones across ~175 components/pages (ml/mr->ms/me, pl/pr->ps/pe, text-left/right->text-start/end, border-l/r->border-s/e, rounded-*->logical, left/right->inset-s/e, float-*)
  - tooling: add scripts/rtl-logical-convert.mjs - boundary-aware codemod, verified against Tailwind v4 docs

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX

---
## [v1.1.9-beta.22] - 2026-06-02 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri
- feat(kyc-kyb): belge önizleme kartı ve TCKN/VKN doğrulama eklendi (@aliiball)
  - KYC formunda mod-aware TCKN/VKN client-side validation eklendi; Bireysel modda pattern \d{11} + minlength/maxlength 11, Kurumsal modda \d{10,11}
  - isValidTckn helper backend kuralları ile birebir mod-10 checksum kontrolü yapıyor (submit'ten önce 11 hane TCKN doğrulanıyor)
  - KYC submit catch bloğuna console.error eklendi (debug için)
  - KYC ve KYB formlarında yüklü belgeler için Karma C preview pattern eklendi: yeşil tema kart, dosya ikonu, Yüklü rozet, dosya adı, Görüntüle butonu; SlotDropzone drag-drop davranışı korundu
  - Yeni dosya yüklenince preview kartı yenisine otomatik refresh oluyor
  - Verified ve Suspended durumlarında belge yükleme kapatıldı (slot-zone display:none + input disabled), preview kartı görünür kalıyor; backend 403 ve login redirect döngüsü engellendi

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX

---
## [v1.1.9-beta.21] - 2026-06-02 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi
- feat(chat,reservation,pwa): chat popup/shared bileşenleri, rezervasyon akışı + PWA/Capacitor (@aliturguttursab)
  - Chat popup ve paylaşılan bileşenlerde (composer, bubble, messages, attachment) güncellemeler
  - Rezervasyon modalı + reservationService + reservationModal alpine modülü
  - PWA: VitePWA + manifest + ikon setleri; Capacitor config (native projeler gitignore'da)
  - i18n (tr/en) ve chat type/service güncellemeleri

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX

---
## [v1.1.9-beta.20] - 2026-05-26 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError
- feat(ui): mobile/tablet responsive tasarım iyileştirmeleri ve tam ekran kategori (@ahmeetseker)
  - BottomNav: xl breakpoint'e genişletildi, tam ekran kategori overlay eklendi (sidebar +
  - TopBar: tablet/mobil uyumlu arama ve navigasyon düzenlemesi
  - Cart/Checkout: responsive boyut ve spacing iyileştirmeleri
  - Hero bileşenleri (ProductGrid, TopDeals, TopRanking, vb.): mobil spacing/font
  - Product detay (MobileLayout, QAModal, ReviewsModal): mobil uyum düzeltmeleri
  - Footer: mobil grid ve font boyutu optimizasyonu
  - FloatingPanel: mobil için rounded-full ve konum ayarı
  - i18n: bottomNav ve checkout için yeni TR/EN çeviri anahtarları eklendi

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX

---
## [v1.1.9-beta.19] - 2026-05-26 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)
- fix(checkout): company field optional, alert→showToast (@boraydeger32)
  - Remove "company" from requiredFields in validateAddAddressForm and handleSubmit (UI label already says optional, backend enforces for Business addresses only)
  - Replace 3 alert() calls with showToast({ type: "error" }) for address errors (save, delete, set default) — consistent with rest of storefront UX

---
## [v1.1.9-beta.18] - 2026-05-25 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(pricing): hardcoded fiyatlandırma kaldırıldı, backend API entegrasyonu (@boraydeger32)
  - PricingPageLayout statik PLANS array kaldırıldı, Alpine x-for ile backend'den dinamik render (responsive grid: 2/3/4 sütun plan sayısına göre)
  - sellPricing Alpine data'sına fetchPricingPlans() + SWR cache entegre edildi
  - Badge color enum'a green/blue eklendi (backend Select ile uyum)
  - pricingService.ts cta_action type'tan learn_more kaldırıldı
  - i18n dead string temizliği: tr.ts ve en.ts'den 42 kullanılmayan hardcoded plan/feature/comparison key'i silindi
  - Yeni i18n key'leri: free, trialDays, loadError

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)

---
## [v1.1.9-beta.17] - 2026-05-25 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(help): bozuk yardım merkezi linklerini nginx pretty URL'lerine çevir (@ahmeetseker)

---
## [v1.1.9-rc.1] - 2026-05-25 RC

Bu surum rc.istoc.com'da onay asamasindadir.

### Eklendi
- feat(changelog): yeni storefront özellikleri eklendi ve belgeler güncellendi (@ahmeetseker)
- feat(kyc): KYC sayfası + form + prefill API entegrasyonu eklendi (@aliiball)
  - pages/dashboard/kyc.html + src/pages/kyc.ts entry
  - src/components/kyc/KycLayout.ts: Kurumsal/Bireysel toggle + boxed layout (account_type register'dan KYC formuna taşındı)
  - get_prefill_data ile User Profile + son KYC/KYB değerleri prefill
  - src/types/userProfile.ts type tanımları
- feat(verification-ui): banner + locked-feature + kyc-required modal eklendi (@aliiball)
  - VerificationStatusBanner: KYC × KYB state machine ile 9 banner durumu
  - LockedFeatureModal: sidebar locked item için "Alıcı/Satıcı olun" CTA
  - KycRequiredModal: checkout'ta [KYC_<STATE>] prefix regex parse + state-bazlı modal (Locked/Pending/Rejected/Suspended → support ticket)
  - utils/sellerRouter.ts: satıcı dashboard yönlendirme yardımcısı
- feat(data): countries + country-subdivisions mock data eklendi (@aliiball)
  - src/data/countries.ts: ülke listesi (ISO kodları + isimler)
  - src/data/country-subdivisions.ts: ülke-il/eyalet eşlemesi
- feat(i18n): KYC + verification + address purpose çevirileri eklendi (@aliiball)
  - en.ts + tr.ts: settings.myAccountTitle, settings.addressDisabledHint, header.myStore ("Mağaza Sayfam" → "Mağazalarım"), kyc.* key'leri, verification banner state'leri, address purpose etiketleri
- feat(auth): yasal metin onay popup'ı ve ayrı checkbox'lar eklendi (@aliiball)
  - Tek "Kullanım Koşulları ve Gizlilik Politikası" checkbox'ı iki ayrı onaya bölündü (terms-checkbox + privacy-checkbox)
  - Turuncu metne tıklayınca tüm sözleşme içeriği popup içinde gösteriliyor (yeni LegalConsentModal component)
  - Reddet/Kabul Et butonları metnin sonuna kadar okunmadan görünmüyor; her açılışta scroll baştan başlıyor ve buton durumu sıfırlanıyor
  - Popup içeriği legalContent.ts'ten çekiliyor — terms/privacy sayfalarıyla aynı kaynak
  - i18n: agreeTerms TR-suffix/EN-prefix çakışması agreeBefore + agreeAfter'a bölündü; auth.setup.legalConsent.{accept, reject} eklendi
- feat(sell): pricing planları dinamik API + entitlement banner (@boraydeger32)
  - sell sayfasındaki 4 hardcoded TIERS dizisi kaldırıldı, planlar artık tradehub_core.api.v1.public_pricing.get_pricing_plans endpoint'inden çekiliyor (Süper Admin Permission Console'dan yönetim).
  - pricingService.ts: localStorage cache (5 dk) + stale-while-revalidate; cache key v2'ye yükseltildi (CTA label şema değişikliği için invalidate).
  - sell.ts: cache fresh ise senkron paint, değilse fetch await; arka planda daima fetch + updated_at değişirse #paketler section'ı yerinde re-render (tüm DOM swap yerine — Alpine state korunur).
  - SellPageLayout: CTA action map (signup, contact_sales, learn_more) ve feature icon glyph map (check, x, star, zap, info, default check) eklendi; currency symbol + fmtListings helper'ları.
  - FAZ 1.7 — utils/entitlement.ts: snapshot client (sessionStorage 5dk cache), hasFeature/withinQuota/isVerifiedForCheckout helper'ları. Güvenlik sınırı değil — gerçek karar her korumalı eylemde backend'de.
  - components/subscription/EntitlementBanner.ts: trial ending (< 3 gün) ve subscription past_due durumları için banner.
- feat(routing): Türkçe pretty URL'lere dist HTML mapping katmanı eklendi (@ahmeetseker)
  - staticPageUrl.ts'e STATIC_PAGE_HTML_MAP ve getStaticPageHtmlPath() eklendi
  - Vite dev plugin (staticPageRewritePlugin) /ureticiler gibi path'leri pages/manufacturers.html'e rewrite eder
  - nginx.conf.template'e `map $uri $static_page_html` bloğu eklendi (prod aynı işi yapar)
  - Slug'lar yenilendi: /markalar → /ureticiler, /firsat → /firsatlar (MegaMenu, TopBar, HeroSideBannerSlider, TopDeals, SubHeader)
  - Seller storefront `/magaza/<code>` path'inden seller_code parse eder, nginx internal rewrite sonrası query görünmediği için fallback olarak
  - StoreHeader/CompanyProfile "Mağazayı ziyaret et" linkleri sellerCode state'ine bağlandı
- feat: kullanıcı veri hakları UI, backend-driven tracking ve SEO routing (@ahmeetseker)
  - Hesap ayarlarına "Verilerimi İndir" ve "Onay Yönetimi" bölümleri eklendi
  - Tracking Manager artık ID'leri backend API'den alıyor (hardcoded değerler kaldırıldı)
  - Nginx'e statik sayfa SEO backend routing eklendi (meta tag DB injection)
  - Social proof view kaydında CSRF token düzeltmesi
  - Ürün yorumları slug yerine Frappe name ile yükleniyor
  - Ödeme sayfalarına tracking init eklendi
  - Türkçe i18n çevirileri (consent, data export)
- feat(nginx): enhance SEO routing for bot user-agents and update static page handling (@ahmeetseker)
- feat(nginx): enhance dynamic SEO routing for bots and users with new rewrite rules (@ahmeetseker)

### Duzeltildi
- fix(ci): son PROD tag'ini güncelleyerek CHANGELOG girişini düzeltildi (@ahmeetseker)
- fix(settings): address/city/postal_code disabled + Vergi tab gizlendi (@aliiball)
  - SettingsAccountEdit + SettingsMyAccount address/city/postal_code disabled + helper text (Frappe Address mimarisinde olduğu için)
  - SettingsLayout 4 noktada Vergi tab yorum satırı (S3=C kararı)
  - FavoritesLayout User Profile field uyumu + filter sets
  - buyer-dashboard NewBuyerInfo + UserInfoCard + types + mock Sprint 2
  - pages/buyer-dashboard VerificationStatusBanner entegrasyonu
- fix(cart): sepet popup'larında mağaza adı linklendi ve canonical URL'ye normalize edildi (@ahmeetseker)
  - SharedCartDrawer: store'a yeni supplier eklenirken href canonical /pages/seller/seller-shop.html?seller= pattern'iyle yazılıyor
  - TopBar: header sepet özetinde eski /pages/seller.html?id= href'leri normalizeSupplierHref ile canonical pattern'e çevriliyor;
  - ManufacturersHero: statik "0" yerine favorites/sellerFavorites store'larından canlı count; favorites-changed ve
  - i18n: mfr.favoriteProducts / mfr.favoriteSuppliers key'leri eklendi (TR/EN), whitespace-pre-line ile iki satır render
  - ManufacturerList: ürün kartlarında thumbnail block + body sabit yükseklik (h-[78px], min-h-[2lh]) ile kart yüksekliği eşitlendi refactor(product): fiyat tier'larında strikethrough üst satıra alındı, qty font büyüdü
  - Pre-discount fiyat artık deal fiyatının yanında değil, üstünde block olarak gösteriliyor
  - Tier qty etiketi 13px → 15px
  - TR locale'inde "MSA:" prefix'i kaldırıldı; tier başlığı sade "1 adet" / "1 - 5 adet"
  - SubHeader: products sekmesinde "...\"keyword\" kategorisinde", manufacturers sekmesinde "...\"keyword\" için küresel
  - ProductListingGrid: chat butonuna list-mode'da tam genişlik ve <1599px grid'de küçük font/padding için container-query
  - MegaMenu: featured kart tipografisi keyfi [11.5px]/[13px] yerine text-xs / text-sm'e standardize edildi
  - fix(cart): sepet popup'larında eski /pages/seller.html?id= href'leri canonical /pages/seller/seller-shop.html?seller=
  - feat(manufacturers): landing favori ürün/tedarikçi sayaçları favorites store'larından canlı, event listener ile güncelleniyor;
  - refactor(product): fiyat tier'da strikethrough üst satıra taşındı, qty font 15px; TR "MSA:" prefix'i kaldırıldı
  - refactor(listing): SubHeader başlığı products/manufacturers sekmesine göre dinamik; ProductListingGrid chat butonuna list-mode
  - refactor(manufacturers): ürün kartlarında thumbnail block + body sabit yükseklik ile hizalama düzeltildi
- fix: SEO URL uyumluluğu ve seller shop routing düzeltmeleri (@ahmeetseker)
  - nginx.conf.template: /magaza/{code}/dukkan route'u ekle (seller shop)
  - ManufacturerList: ürün kartları slug ile SEO URL kullanır
  - ManufacturersHero: ürün linkleri slug fallback ile
  - CompanyProfile: mağaza ziyaret linki düzeltmesi

### Degistirildi
- refactor(sidebar): KYC + KYB iki ayrı lockable item olarak ayrıldı (@aliiball)
  - sidebarData + sidebarIcons: KYC ve KYB için iki ayrı giriş
  - SidebarMenuItem: lockable mantığı (session state üzerinden)
  - Sidebar.ts legacy requireSeller davranışı kaldırıldı
- refactor(auth): SupplierSetupForm + AccountSetupForm User Profile API'sine taşındı (@aliiball)
  - supplier-setup + account-setup register_supplier / register_user Sprint 2.6 davranışına uyarlandı
  - account_type Bireysel/Şirket toggle KYC formuna taşındı (register'dan kaldırıldı)
  - utils/auth.ts session capability flag'leri (kyc_required, kyb_required, kyc_locked, kyb_locked) eklendi
  - pages/sell.ts + pages/supplier-setup.ts Sprint 2 akışına uyumlandı
- refactor(addresses): Bireysel/Kurumsal toggle + tax_no/tax_office eklendi (@aliiball)
  - AddressesLayout: address_type toggle (Individual/Business)
  - tax_no + tax_office Business için conditional render
  - utils/tr-validation.ts: VKN + TCKN checksum
  - alpine/addresses.ts: purpose alanı + Sprint 1 Faz D uyumu
- refactor(kyb): mersis_no + kep_address + rejection_category form alanları eklendi (@aliiball)
  - KybLayout + alpine/kyb purpose/state machine güncellemeleri
  - pages/kyb.ts mersis (16 hane) + kep (email format) doğrulamaları
- refactor(cart): SupplierCard + CartStore + cartService Sprint 2 uyumu (@aliiball)
  - SupplierCard supplierId → admin_seller_profile.name eşleme
  - CartStore + CartSummary KYC gate state
  - cartService [KYC_<STATE>] prefix mesajı parse
  - checkout.ts KycRequiredModal entegrasyonu
  - pages/product-detail + ProductInfo + MobileLayout + ProductListingGrid capability flag kontrolleri
  - types/cart + types/productListing Sprint 2 alanları
- refactor(layout): products/manufacturers sayfaları unified SubHeader'a geçirildi (@ahmeetseker)
  - SearchHeader → SubHeader: tabs + breadcrumb + sonuç başlığı + sort/view tek bileşende toplandı
  - MegaMenu: kategori kart görseli yerine icon-only akış
  - i18n: viewingLead, unitFound, unitFoundManufacturer, viewMode/Grid/List anahtarları eklendi
  - ManufacturerFilterSidebar/List, FilterSidebar, TopBar SubHeader API'ye uyumlandı
- refactor(lint): tradehubfront ESLint warning'leri sıfırlandı (@ahmeetseker)
  - 304 @typescript-eslint/no-explicit-any → proper type tanımları
  - Global window augmentation: src/types/global.d.ts oluşturuldu (API_BASE, Alpine, dataLayer, __getSellerFavs, __originalListingImages vb.)
  - Mevcut interface'ler kullanıldı (ProductDetail.videoUrl/brandInfo/specGroups cast'leri kaldırıldı); yeni: NotificationItem, RawTailoredProduct, Quote, Message/Conversation, SectionSettings, SellerStorefrontData, AlpineDataEl vb.
  - catch (e: any) → catch veya catch (e: unknown) + type guard
  - Underscore-prefix discard pattern (_id, _tempId, _) için varsIgnorePattern + caughtErrorsIgnorePattern: '^_' eklendi
  - Debug console.log silindi veya console.warn'a çevrildi
  - alpine/seller.ts, alpine/orders.ts, alpine/help.ts dahil ~50 dosya temizlendi
- refactor(upload): RFQ ve KYB/KYC upload-ui kütüphanesine taşındı (@aliiball)
  - src/lib/upload-ui/ paylaşımlı kütüphane (admin-panel ile aynı API)
  - rfq/dropzone.ts upload-ui facade'ı üzerinden yeniden yazıldı
  - rfq/file-list.ts ve rfq/uploader.ts ayrıldı
  - KybLayout, KycLayout, SettingsLayout, TicketForm, WriteReviewModal yeni upload bileşenlerine bağlandı
  - rfq-form.ts ve rfq.ts sayfa init'leri sadeleştirildi
  - i18n: yeni upload string'leri (en/tr)

---
## [v1.1.9-beta.16] - 2026-05-25 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(nginx): enhance dynamic SEO routing for bots and users with new rewrite rules (@ahmeetseker)

---
## [v1.1.9-beta.15] - 2026-05-25 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(nginx): enhance SEO routing for bot user-agents and update static page handling (@ahmeetseker)

---
## [v1.1.9-beta.13] - 2026-05-25 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: kullanıcı veri hakları UI, backend-driven tracking ve SEO routing (@ahmeetseker)
  - Hesap ayarlarına "Verilerimi İndir" ve "Onay Yönetimi" bölümleri eklendi
  - Tracking Manager artık ID'leri backend API'den alıyor (hardcoded değerler kaldırıldı)
  - Nginx'e statik sayfa SEO backend routing eklendi (meta tag DB injection)
  - Social proof view kaydında CSRF token düzeltmesi
  - Ürün yorumları slug yerine Frappe name ile yükleniyor
  - Ödeme sayfalarına tracking init eklendi
  - Türkçe i18n çevirileri (consent, data export)

---
## [v1.1.9-beta.12] - 2026-05-25 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix: SEO URL uyumluluğu ve seller shop routing düzeltmeleri (@ahmeetseker)
  - nginx.conf.template: /magaza/{code}/dukkan route'u ekle (seller shop)
  - ManufacturerList: ürün kartları slug ile SEO URL kullanır
  - ManufacturersHero: ürün linkleri slug fallback ile
  - CompanyProfile: mağaza ziyaret linki düzeltmesi

---
## [v1.1.9-beta.11] - 2026-05-25 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(sell): pricing planları dinamik API + entitlement banner (@boraydeger32)
  - sell sayfasındaki 4 hardcoded TIERS dizisi kaldırıldı, planlar artık tradehub_core.api.v1.public_pricing.get_pricing_plans endpoint'inden çekiliyor (Süper Admin Permission Console'dan yönetim).
  - pricingService.ts: localStorage cache (5 dk) + stale-while-revalidate; cache key v2'ye yükseltildi (CTA label şema değişikliği için invalidate).
  - sell.ts: cache fresh ise senkron paint, değilse fetch await; arka planda daima fetch + updated_at değişirse #paketler section'ı yerinde re-render (tüm DOM swap yerine — Alpine state korunur).
  - SellPageLayout: CTA action map (signup, contact_sales, learn_more) ve feature icon glyph map (check, x, star, zap, info, default check) eklendi; currency symbol + fmtListings helper'ları.
  - FAZ 1.7 — utils/entitlement.ts: snapshot client (sessionStorage 5dk cache), hasFeature/withinQuota/isVerifiedForCheckout helper'ları. Güvenlik sınırı değil — gerçek karar her korumalı eylemde backend'de.
  - components/subscription/EntitlementBanner.ts: trial ending (< 3 gün) ve subscription past_due durumları için banner.

---
## [v1.1.9-beta.10] - 2026-05-22 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(sell): pricing planları dinamik API + entitlement banner (@boraydeger32)
  - sell sayfasındaki 4 hardcoded TIERS dizisi kaldırıldı, planlar artık tradehub_core.api.v1.public_pricing.get_pricing_plans endpoint'inden çekiliyor (Süper Admin Permission Console'dan yönetim).
  - pricingService.ts: localStorage cache (5 dk) + stale-while-revalidate; cache key v2'ye yükseltildi (CTA label şema değişikliği için invalidate).
  - sell.ts: cache fresh ise senkron paint, değilse fetch await; arka planda daima fetch + updated_at değişirse #paketler section'ı yerinde re-render (tüm DOM swap yerine — Alpine state korunur).
  - SellPageLayout: CTA action map (signup, contact_sales, learn_more) ve feature icon glyph map (check, x, star, zap, info, default check) eklendi; currency symbol + fmtListings helper'ları.
  - FAZ 1.7 — utils/entitlement.ts: snapshot client (sessionStorage 5dk cache), hasFeature/withinQuota/isVerifiedForCheckout helper'ları. Güvenlik sınırı değil — gerçek karar her korumalı eylemde backend'de.
  - components/subscription/EntitlementBanner.ts: trial ending (< 3 gün) ve subscription past_due durumları için banner.

### Degistirildi
- refactor(upload): RFQ ve KYB/KYC upload-ui kütüphanesine taşındı (@aliiball)
  - src/lib/upload-ui/ paylaşımlı kütüphane (admin-panel ile aynı API)
  - rfq/dropzone.ts upload-ui facade'ı üzerinden yeniden yazıldı
  - rfq/file-list.ts ve rfq/uploader.ts ayrıldı
  - KybLayout, KycLayout, SettingsLayout, TicketForm, WriteReviewModal yeni upload bileşenlerine bağlandı
  - rfq-form.ts ve rfq.ts sayfa init'leri sadeleştirildi
  - i18n: yeni upload string'leri (en/tr)

---
## [v1.1.9-beta.9] - 2026-05-22 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(routing): Türkçe pretty URL'lere dist HTML mapping katmanı eklendi (@ahmeetseker)
  - staticPageUrl.ts'e STATIC_PAGE_HTML_MAP ve getStaticPageHtmlPath() eklendi
  - Vite dev plugin (staticPageRewritePlugin) /ureticiler gibi path'leri pages/manufacturers.html'e rewrite eder
  - nginx.conf.template'e `map $uri $static_page_html` bloğu eklendi (prod aynı işi yapar)
  - Slug'lar yenilendi: /markalar → /ureticiler, /firsat → /firsatlar (MegaMenu, TopBar, HeroSideBannerSlider, TopDeals, SubHeader)
  - Seller storefront `/magaza/<code>` path'inden seller_code parse eder, nginx internal rewrite sonrası query görünmediği için fallback olarak
  - StoreHeader/CompanyProfile "Mağazayı ziyaret et" linkleri sellerCode state'ine bağlandı

---
## [v1.1.9-beta.8] - 2026-05-22 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Degistirildi
- refactor(upload): RFQ ve KYB/KYC upload-ui kütüphanesine taşındı (@aliiball)
  - src/lib/upload-ui/ paylaşımlı kütüphane (admin-panel ile aynı API)
  - rfq/dropzone.ts upload-ui facade'ı üzerinden yeniden yazıldı
  - rfq/file-list.ts ve rfq/uploader.ts ayrıldı
  - KybLayout, KycLayout, SettingsLayout, TicketForm, WriteReviewModal yeni upload bileşenlerine bağlandı
  - rfq-form.ts ve rfq.ts sayfa init'leri sadeleştirildi
  - i18n: yeni upload string'leri (en/tr)

---
## [v1.1.9-beta.7] - 2026-05-22 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(sell): pricing planları dinamik API + entitlement banner (@boraydeger32)
  - sell sayfasındaki 4 hardcoded TIERS dizisi kaldırıldı, planlar artık tradehub_core.api.v1.public_pricing.get_pricing_plans endpoint'inden çekiliyor (Süper Admin Permission Console'dan yönetim).
  - pricingService.ts: localStorage cache (5 dk) + stale-while-revalidate; cache key v2'ye yükseltildi (CTA label şema değişikliği için invalidate).
  - sell.ts: cache fresh ise senkron paint, değilse fetch await; arka planda daima fetch + updated_at değişirse #paketler section'ı yerinde re-render (tüm DOM swap yerine — Alpine state korunur).
  - SellPageLayout: CTA action map (signup, contact_sales, learn_more) ve feature icon glyph map (check, x, star, zap, info, default check) eklendi; currency symbol + fmtListings helper'ları.
  - FAZ 1.7 — utils/entitlement.ts: snapshot client (sessionStorage 5dk cache), hasFeature/withinQuota/isVerifiedForCheckout helper'ları. Güvenlik sınırı değil — gerçek karar her korumalı eylemde backend'de.
  - components/subscription/EntitlementBanner.ts: trial ending (< 3 gün) ve subscription past_due durumları için banner.

---
## [v1.1.9-beta.6] - 2026-05-22 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(cart): sepet popup'larında mağaza adı linklendi ve canonical URL'ye normalize edildi (@ahmeetseker)
  - SharedCartDrawer: store'a yeni supplier eklenirken href canonical /pages/seller/seller-shop.html?seller= pattern'iyle yazılıyor
  - TopBar: header sepet özetinde eski /pages/seller.html?id= href'leri normalizeSupplierHref ile canonical pattern'e çevriliyor;
  - ManufacturersHero: statik "0" yerine favorites/sellerFavorites store'larından canlı count; favorites-changed ve
  - i18n: mfr.favoriteProducts / mfr.favoriteSuppliers key'leri eklendi (TR/EN), whitespace-pre-line ile iki satır render
  - ManufacturerList: ürün kartlarında thumbnail block + body sabit yükseklik (h-[78px], min-h-[2lh]) ile kart yüksekliği eşitlendi refactor(product): fiyat tier'larında strikethrough üst satıra alındı, qty font büyüdü
  - Pre-discount fiyat artık deal fiyatının yanında değil, üstünde block olarak gösteriliyor
  - Tier qty etiketi 13px → 15px
  - TR locale'inde "MSA:" prefix'i kaldırıldı; tier başlığı sade "1 adet" / "1 - 5 adet"
  - SubHeader: products sekmesinde "...\"keyword\" kategorisinde", manufacturers sekmesinde "...\"keyword\" için küresel
  - ProductListingGrid: chat butonuna list-mode'da tam genişlik ve <1599px grid'de küçük font/padding için container-query
  - MegaMenu: featured kart tipografisi keyfi [11.5px]/[13px] yerine text-xs / text-sm'e standardize edildi
  - fix(cart): sepet popup'larında eski /pages/seller.html?id= href'leri canonical /pages/seller/seller-shop.html?seller=
  - feat(manufacturers): landing favori ürün/tedarikçi sayaçları favorites store'larından canlı, event listener ile güncelleniyor;
  - refactor(product): fiyat tier'da strikethrough üst satıra taşındı, qty font 15px; TR "MSA:" prefix'i kaldırıldı
  - refactor(listing): SubHeader başlığı products/manufacturers sekmesine göre dinamik; ProductListingGrid chat butonuna list-mode
  - refactor(manufacturers): ürün kartlarında thumbnail block + body sabit yükseklik ile hizalama düzeltildi

---
## [v1.1.9-beta.5] - 2026-05-20 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(auth): yasal metin onay popup'ı ve ayrı checkbox'lar eklendi (@aliiball)
  - Tek "Kullanım Koşulları ve Gizlilik Politikası" checkbox'ı iki ayrı onaya bölündü (terms-checkbox + privacy-checkbox)
  - Turuncu metne tıklayınca tüm sözleşme içeriği popup içinde gösteriliyor (yeni LegalConsentModal component)
  - Reddet/Kabul Et butonları metnin sonuna kadar okunmadan görünmüyor; her açılışta scroll baştan başlıyor ve buton durumu sıfırlanıyor
  - Popup içeriği legalContent.ts'ten çekiliyor — terms/privacy sayfalarıyla aynı kaynak
  - i18n: agreeTerms TR-suffix/EN-prefix çakışması agreeBefore + agreeAfter'a bölündü; auth.setup.legalConsent.{accept, reject} eklendi

---
## [v1.1.9-beta.3] - 2026-05-18 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Degistirildi
- refactor(layout): products/manufacturers sayfaları unified SubHeader'a geçirildi (@ahmeetseker)
  - SearchHeader → SubHeader: tabs + breadcrumb + sonuç başlığı + sort/view tek bileşende toplandı
  - MegaMenu: kategori kart görseli yerine icon-only akış
  - i18n: viewingLead, unitFound, unitFoundManufacturer, viewMode/Grid/List anahtarları eklendi
  - ManufacturerFilterSidebar/List, FilterSidebar, TopBar SubHeader API'ye uyumlandı
- refactor(lint): tradehubfront ESLint warning'leri sıfırlandı (@ahmeetseker)
  - 304 @typescript-eslint/no-explicit-any → proper type tanımları
  - Global window augmentation: src/types/global.d.ts oluşturuldu (API_BASE, Alpine, dataLayer, __getSellerFavs, __originalListingImages vb.)
  - Mevcut interface'ler kullanıldı (ProductDetail.videoUrl/brandInfo/specGroups cast'leri kaldırıldı); yeni: NotificationItem, RawTailoredProduct, Quote, Message/Conversation, SectionSettings, SellerStorefrontData, AlpineDataEl vb.
  - catch (e: any) → catch veya catch (e: unknown) + type guard
  - Underscore-prefix discard pattern (_id, _tempId, _) için varsIgnorePattern + caughtErrorsIgnorePattern: '^_' eklendi
  - Debug console.log silindi veya console.warn'a çevrildi
  - alpine/seller.ts, alpine/orders.ts, alpine/help.ts dahil ~50 dosya temizlendi

---
## [v1.1.9-beta.2] - 2026-05-18 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(kyc): KYC sayfası + form + prefill API entegrasyonu eklendi (@aliiball)
  - pages/dashboard/kyc.html + src/pages/kyc.ts entry
  - src/components/kyc/KycLayout.ts: Kurumsal/Bireysel toggle + boxed layout (account_type register'dan KYC formuna taşındı)
  - get_prefill_data ile User Profile + son KYC/KYB değerleri prefill
  - src/types/userProfile.ts type tanımları
- feat(verification-ui): banner + locked-feature + kyc-required modal eklendi (@aliiball)
  - VerificationStatusBanner: KYC × KYB state machine ile 9 banner durumu
  - LockedFeatureModal: sidebar locked item için "Alıcı/Satıcı olun" CTA
  - KycRequiredModal: checkout'ta [KYC_<STATE>] prefix regex parse + state-bazlı modal (Locked/Pending/Rejected/Suspended → support ticket)
  - utils/sellerRouter.ts: satıcı dashboard yönlendirme yardımcısı
- feat(data): countries + country-subdivisions mock data eklendi (@aliiball)
  - src/data/countries.ts: ülke listesi (ISO kodları + isimler)
  - src/data/country-subdivisions.ts: ülke-il/eyalet eşlemesi
- feat(i18n): KYC + verification + address purpose çevirileri eklendi (@aliiball)
  - en.ts + tr.ts: settings.myAccountTitle, settings.addressDisabledHint, header.myStore ("Mağaza Sayfam" → "Mağazalarım"), kyc.* key'leri, verification banner state'leri, address purpose etiketleri

### Duzeltildi
- fix(settings): address/city/postal_code disabled + Vergi tab gizlendi (@aliiball)
  - SettingsAccountEdit + SettingsMyAccount address/city/postal_code disabled + helper text (Frappe Address mimarisinde olduğu için)
  - SettingsLayout 4 noktada Vergi tab yorum satırı (S3=C kararı)
  - FavoritesLayout User Profile field uyumu + filter sets
  - buyer-dashboard NewBuyerInfo + UserInfoCard + types + mock Sprint 2
  - pages/buyer-dashboard VerificationStatusBanner entegrasyonu

### Degistirildi
- refactor(sidebar): KYC + KYB iki ayrı lockable item olarak ayrıldı (@aliiball)
  - sidebarData + sidebarIcons: KYC ve KYB için iki ayrı giriş
  - SidebarMenuItem: lockable mantığı (session state üzerinden)
  - Sidebar.ts legacy requireSeller davranışı kaldırıldı
- refactor(auth): SupplierSetupForm + AccountSetupForm User Profile API'sine taşındı (@aliiball)
  - supplier-setup + account-setup register_supplier / register_user Sprint 2.6 davranışına uyarlandı
  - account_type Bireysel/Şirket toggle KYC formuna taşındı (register'dan kaldırıldı)
  - utils/auth.ts session capability flag'leri (kyc_required, kyb_required, kyc_locked, kyb_locked) eklendi
  - pages/sell.ts + pages/supplier-setup.ts Sprint 2 akışına uyumlandı
- refactor(addresses): Bireysel/Kurumsal toggle + tax_no/tax_office eklendi (@aliiball)
  - AddressesLayout: address_type toggle (Individual/Business)
  - tax_no + tax_office Business için conditional render
  - utils/tr-validation.ts: VKN + TCKN checksum
  - alpine/addresses.ts: purpose alanı + Sprint 1 Faz D uyumu
- refactor(kyb): mersis_no + kep_address + rejection_category form alanları eklendi (@aliiball)
  - KybLayout + alpine/kyb purpose/state machine güncellemeleri
  - pages/kyb.ts mersis (16 hane) + kep (email format) doğrulamaları
- refactor(cart): SupplierCard + CartStore + cartService Sprint 2 uyumu (@aliiball)
  - SupplierCard supplierId → admin_seller_profile.name eşleme
  - CartStore + CartSummary KYC gate state
  - cartService [KYC_<STATE>] prefix mesajı parse
  - checkout.ts KycRequiredModal entegrasyonu
  - pages/product-detail + ProductInfo + MobileLayout + ProductListingGrid capability flag kontrolleri
  - types/cart + types/productListing Sprint 2 alanları

---
## [v1.1.9-beta.1] - 2026-05-15 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(changelog): yeni storefront özellikleri eklendi ve belgeler güncellendi (@ahmeetseker)

### Duzeltildi
- fix(ci): son PROD tag'ini güncelleyerek CHANGELOG girişini düzeltildi (@ahmeetseker)

---
## [v1.1.10-beta.1] - 2026-05-15 BETA

> Geriye dönük belgeleme — daha önce CHANGELOG'a girmemiş storefront feature'larının kapsamı.

### Eklendi
- feat(info-pages): Blog, News, Careers, Partnerships, CSR statik sayfaları + `src/components/info/` ortak InfoPageLayout (footer linkleri için) (@ahmeetseker)
- feat(seller-dashboard): `src/pages/seller-dashboard.ts` — satıcı kontrol paneli (siparişler, mesajlar, performans widget'ları) (@ahmeetseker)
- feat(seller-verification): `src/pages/seller-verification.ts` — satıcı doğrulama (KYC) çok adımlı form akışı (@ahmeetseker)
- feat(subscription): `src/pages/subscription.ts` + `src/components/subscription/SubscriptionLayout.ts` — abonelik planları, fatura, plan yükseltme görünümü (@ahmeetseker)
- feat(manufacturers): `src/pages/manufacturers.ts` + `src/components/manufacturers/` — üretici listeleme/keşif sayfası ve kartları (@ahmeetseker)
- feat(help-center): `src/pages/help-ticket-new.ts` + 9 component dosyası — destek talebi oluşturma sayfası, kategori seçimi, ek dosya, form akışı (@ahmeetseker)
- feat(help-center): `src/pages/help-ticket.ts` — destek talep detayı gerçek API'ya bağlandı; ticket görüntüleme, mesajlaşma, durum takibi (@ahmeetseker)
- feat(payment): `src/pages/payment.ts`, `payment-processing.ts`, `payment-failed.ts` + `src/components/payment/` — ödeme sayfası, işleniyor ekranı, başarısız ödeme akışı (@ahmeetseker)
- feat(addresses): `src/pages/addresses.ts` + `src/components/addresses/` — adres defteri CRUD (ekle/düzenle/sil/varsayılan) (@ahmeetseker)
- feat(settings): `src/pages/settings.ts` — hesap ayarları (bildirim, gizlilik, dil tercihleri) (@ahmeetseker)
- feat(profile): `src/pages/profile.ts` — kullanıcı profil sayfası (kişisel bilgiler, avatar, biyografi) (@ahmeetseker)
- feat(categories): `src/pages/categories.ts` + `src/components/categories/` — tüm kategoriler keşif sayfası, hiyerarşik liste, kart görünümü (@ahmeetseker)
- feat(tailored-selections): `src/pages/tailored-selections.ts` + section registry + landing block'ları — kullanıcıya özel ürün seçkileri sayfası (@ahmeetseker)
- feat(rfq): `src/components/rfq/attachments.ts` + `dropzone.ts` — RFQ formu için dosya ekleme, sürükle-bırak yükleme component'leri (@aliiball)

## [v1.1.9] - 2026-05-15 PROD

Bu surum canliya alindi. v1.1.8 PROD'dan bu yana beta + RC asamasinda test edilen tum feat/fix dahildir.

### Eklendi
- feat(dashboard,favorites,sell): e-posta doğrulama slide'ı, favori filtreleri ve satıcı landing düzenlemesi (@ahmeetseker)
  - Dashboard: OperationSlider'a e-posta doğrulanmamış kullanıcılar için synthetic "email-verify" slide eklendi (resend + change link, i18n anahtarları en/tr).
  - Favoriler: kategori/tedarikçi/stok/fiyat filtre menüsü, listing detail lazy enrichment, kart üstü stok pill'i ve doğrulanmış supplier satırı.
  - Sell: 4 section'a ortak max-w-[1500px] inner sarmalayıcı; "Avrupa" → "dünya" metin güncellemesi.
- feat(reviews): aspect ortalamasından dinamik puan + partial-fill yıldız (@boraydeger32)
  - WriteReviewModal: "Genel Puan" artık kullanıcı seçimi değil; 4 boyut puanının ortalaması olarak hesaplanan computed değer. Yıldızlar read-only ve clip-path tabanlı partial-fill destekler.
  - ProductReviews: renderStars fractional rating alır (SVG layering + clip-path); displayRating() helper'ı backend Int rating yerine aspect ortalamasını kullanır. Yorum kartı, ReviewsModal ve ürün başlığı bu helper'a yönlendirildi.
  - ProductTitleBar: ortalama Approved yorumların aspect ortalamasından yeniden hesaplanır (backend `rating` Int olduğu için 3.5 → 4 olarak kaybolur). "X yorum" tıklaması Yorumlar tab'ını açıp section'a scroll eder; rating satırı product-reviews-loaded event'iyle re-render.
  - listingService: BackendStorefrontReview.aspects artık ProductReview'a map ediliyor; tip de güncellendi.
  - WriteReviewModal'daki merge conflict (HEAD vs 7aafda0) çözüldü.
  - Yeni eklenen tüm color/clip-path inline style'ları Tailwind utility arbitrary'lerine (theme-var + [clip-path:inset(...)] + CSS var atama pattern'i) çevrildi; yeni .css/<style> bloku yok.
## [v1.1.8-beta.20] - 2026-05-15 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(reviews): Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix (@boraydeger32)
  - Yorum Yaz modal: form + foto + kategori şablon cevapları
  - Şikayet Et modal: sebep dropdown + not
  - Q&A bottom-sheet: mobile-first soru/cevap görüntüleme
  - Reviewer tier rozeti (Top / Trusted / Verified) trust signal
  - Onay Bekliyor amber rozeti yorum sahibine
  - 24h içinde Düzenle butonu (max 1 edit, sonrası reddedilir)
  - Faydalı değil 👎 + Helpful/Not-helpful mutex pattern
  - Mobile pdm-* kısayol butonları (Yorum Yaz / Görüntüle / Soru-Cevap)
  - Bottom-sheet pattern: items-end sm:items-center
  - Mobile-first responsive header butonları
  - 374px altı küçültülmüş yazı
  - src/api/reviewsApi.ts
  - src/components/product/ProductQA.ts
  - src/components/product/QAModal.ts
  - src/components/product/WriteReviewModal.ts
  - src/components/product/ReportAbuseModal.ts
  - src/components/reviews/ReviewWidget.ts
  - src/styles/reviews-v5.css
- feat(reviews): review/Q&A storefront entegrasyonu + 4 kritik fix (@boraydeger32)
  - Backend API entegrasyonu (mock→real): eligibility, submit, vote, update, abuse, Q&A — yeni listingService methodları
  - Custom modal'lar: Yorum Yaz, Şikayet Et, Q&A bottom-sheet
  - Reviewer tier rozeti (Top/Trusted/Verified) — Newcomer gizli
  - Onay Bekliyor rozeti — sadece sahibine görünür (isOwnPending)
  - Düzenle butonu — 24h penceresinde, max 1 edit
  - Faydalı değil  + Helpful/Not-helpful mutex (kardeş butonlar kilitlenir)
  - Mobile layout: Yorum Yaz / Tüm yorumları / Soru-Cevap kısayolları
  - reviews-v5.css tasarım sistemi
  - Lint: @ts-nocheck pragma'larına eslint-disable + açıklama (rule bypass)
- feat(changelog): değişiklikleri daha okunabilir hale getirildi (@ahmeetseker)
- feat(reviews): dead code ve stil dosyalarını kaldırdı (@ahmeetseker)
- Yorum Yaz modal: form + foto + kategori şablon cevapları (@boraydeger32)
- Şikayet Et modal: sebep dropdown + not (@boraydeger32)
- Q&A bottom-sheet: mobile-first soru/cevap görüntüleme (@boraydeger32)
- Reviewer tier rozeti (Top / Trusted / Verified) trust signal (@boraydeger32)
- Onay Bekliyor amber rozeti yorum sahibine (@boraydeger32)
- 24h içinde Düzenle butonu (max 1 edit, sonrası reddedilir) (@boraydeger32)
- Faydalı değil 👎 + Helpful/Not-helpful mutex pattern (@boraydeger32)
- Mobile pdm-* kısayol butonları (Yorum Yaz / Görüntüle / Soru-Cevap) (@boraydeger32)
- Bottom-sheet pattern: items-end sm:items-center (@boraydeger32)
- Mobile-first responsive header butonları (@boraydeger32)
- 374px altı küçültülmüş yazı (@boraydeger32)
- src/api/reviewsApi.ts (@boraydeger32)
- src/components/product/ProductQA.ts (@boraydeger32)
- src/components/product/QAModal.ts (@boraydeger32)
- src/components/product/WriteReviewModal.ts (@boraydeger32)
- src/components/product/ReportAbuseModal.ts (@boraydeger32)
- src/components/reviews/ReviewWidget.ts (@boraydeger32)
- src/styles/reviews-v5.css (@boraydeger32)
- Backend API entegrasyonu (mock→real): eligibility, submit, vote, update, abuse, Q&A — yeni listingService methodları (@boraydeger32)
- Custom modal'lar: Yorum Yaz, Şikayet Et, Q&A bottom-sheet (@boraydeger32)
- Reviewer tier rozeti (Top/Trusted/Verified) — Newcomer gizli (@boraydeger32)
- Onay Bekliyor rozeti — sadece sahibine görünür (isOwnPending) (@boraydeger32)
- Düzenle butonu — 24h penceresinde, max 1 edit (@boraydeger32)
- Faydalı değil  + Helpful/Not-helpful mutex (kardeş butonlar kilitlenir) (@boraydeger32)
- Mobile layout: Yorum Yaz / Tüm yorumları / Soru-Cevap kısayolları (@boraydeger32)
- reviews-v5.css tasarım sistemi (@boraydeger32)
- Lint: @ts-nocheck pragma'larına eslint-disable + açıklama (rule bypass) (@boraydeger32)
- feat(chat-popup): mesaj kutusu arama + sağ-alt floating pencere; ürün gridine Sohbet et butonu; favori widget'i ürün kartlarıyla (@ahmeetseker)
- feat(chat-popup): mesaj kutusunda kişi / şirket / son mesaj üzerinden anlık arama (@ahmeetseker)
- feat(chat-popup): sohbet penceresi artık ekranın sağ-altında açılıyor, arka plan karartılmıyor — site üzerinde gezerken (@ahmeetseker)
- feat(products): ürün listesi kartlarına "Sohbet et" butonu eklendi — Sepete Ekle ile yan yana, satıcıya doğrudan mesaj (@ahmeetseker)
- feat(dashboard): favori ürünler kutusu artık boş ekran yerine gerçek ürün kartlarını yatay kaydırmalı gösteriyor (3 ürün + "Tümünü (@ahmeetseker)
- feat(dashboard): yan menüde "Mesajlarım" alt menüsü yeniden açıldı (Tedarikçi Mesajları / Tekliflerim / Kişilerim) (@ahmeetseker)
- refactor(chat): kartvizit penceresinin tasarımı yenilendi — ayrık başlık/alt bar, ülke bayrağı, daha sade kullanıcı bilgisi (@ahmeetseker)
- refactor(chat): araç çubuğunda kullanılmayan butonlar temizlendi (konum, çeviri, buluttan fotoğraf) (@ahmeetseker)
- refactor(style): global buton hover/press efekti sadeleştirildi — gereksiz transform/box-shadow kaldırıldı, sayfa geneli daha (@ahmeetseker)
- chore(i18n): kartvizit "iSTOC tarafından doğrulanan hesaplar" etiketi güncellendi (@ahmeetseker)
- feat(reviews): 2 değişiklik (@boraydeger32)
  - review/Q&A storefront entegrasyonu + 4 kritik fix
  - Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix
- feat(chat-popup): Sohbet Et özelliği — alıcı ile satıcı doğrudan iletişim (@ahmeetseker)
- feat(alpine): add chatPopup global store + chatPopupRoot data wrapper (@ahmeetseker)
- feat(chat): 16 değişiklik (@ahmeetseker)
  - AttachmentToolbar with 7 sub-menu triggers
  - BusinessCardForm sub-popup
  - CallMenu sub-popup with video/voice/schedule
  - ChatBubble — text/image/file/system variants
  - ChatComposer with pinned product, toolbar, input and orange Gönder
  - ChatHeader with optional back/expand/close buttons
  - ChatMessages list with date labels and error state
  - ContextMenu sub-popup with pin/block/delete/mute
  - EmojiPicker sub-popup with 70 popular emojis
  - OrderCard embedded order summary
  - PhotoSourceMenu sub-popup
  - PinnedProduct composer context strip
  - QuickActionChips quick-action row
  - SecurityBanner component
  - add error/sending state and try-catch around service calls
  - barrel export for chat-shared module
- feat(chat-popup): 4 değişiklik (@ahmeetseker)
  - ChatPopup root container with overlay, expand mode and mobile tabs
  - InboxPanel — conversation list with tag labels and unread badge
  - MobileTabs (Sohbet / Mesajlar) for sm screens
  - barrel export
- feat(data): seed mock conversations and messages (@ahmeetseker)
- feat(i18n): 2 değişiklik (@ahmeetseker)
  - add chat namespace keys
  - add chat.{emptyThread,orderCard,aria,toolbar,pending} keys
- feat(icons): add chat-popup lucide icons (@ahmeetseker)
- feat(product): 2 değişiklik (@ahmeetseker)
  - add Sohbet et button in 50/50 grid with Sepete Ekle
  - wire Sohbet et click to chat-popup:open event with pinned product
- feat(product-detail): mount ChatPopup so it can be opened from this page (@ahmeetseker)
- feat(services): add chat service stub with mock-data promises (@ahmeetseker)
- feat(theme): add orange palette tokens for chat composer (@ahmeetseker)
- feat(types): define chat conversation/message interfaces (@ahmeetseker)
- feat(utils): ref-counted scrollLock; use it in chat popup open/close (@ahmeetseker)
- feat(faq): 3 değişiklik (@ahmeetseker)
  - faqPage Alpine data'ya search helper'ları eklendi
  - search bar yeniden tasarlandı
  - eşleşme vurgusu + sidebar inline style refactor
- feat(orders): 6 değişiklik (@ahmeetseker)
  - detay panel için tab/ürün state'i ekle
  - ürünler kartını ilk-5 + scroll'lu hibrit yapıya çevir
  - boxed tab container + Kargo paneli + i18n tab etiketleri
  - Ödeme detaylarını tab paneline taşı
  - Tedarikçi detaylarını tab paneline taşı
  - replace per-order item list with thumbnail strip + drawer
- feat(header-notice): 7 değişiklik (@ahmeetseker)
  - add storefront service with localStorage cache
  - add HeaderNotice marquee component
  - integrate notice render into TopBar
  - call initHeaderNotice in main bootstrap
  - suppress notice on payment/payments/orders pages
  - remove icon rendering from storefront marquee
  - add slide display mode and per-notice background color
- feat(help-center): "Bize Ulaşın" 4'lü kart bloğu kaldırıldı (@ahmeetseker)
- feat(floating-panel): x-show ve x-transition ekleyerek görünürlüğü iyileştirdi (@ahmeetseker)

### Duzeltildi
- fix(lint): no-unused-expressions FavoritesLayout filter sets (@boraydeger32)
- fix(security): storefront 4 XSS sink + sample order payload + yıldız reactive (@boraydeger32)
  - utils/sanitize.ts: escapeHtml ve safeHexColor utility'leri eklendi. DOMPurify tabanlı sanitizeHtml zaten vardı; escapeHtml template literal innerHTML interpolation'ları için, safeHexColor CSS background değerini hex regex'iyle doğrular.
  - alpine/index.ts: Alpine.magic("safeHtml") kayıt — `x-html` binding'lerinde `$safeHtml(value)` ile DOMPurify'a yönlendirir.
  - utils/seller/section-registry.ts:569 seller.description artık `$safeHtml(...)` ile render. Kötü niyetli satıcının vitrinine yazdığı `<img src=x onerror=...>` payload'ı buyer oturumlarını hijack edebiliyordu.
  - components/help-center/TicketDetailLayout.ts:90 ticket.description `$safeHtml`. Destek personeli her ticket açtığında stored XSS çalışıyordu.
  - components/product/ProductReviews.ts review card içeriği (comment, anonymized author, date, country, productTitle/Price, image URL'ler, lightbox img src) escapeHtml ile, supplierReply zengin metin barındırdığı için sanitizeHtml ile sarıldı. Yorum yazan saldırgan tüm ürün sayfası ziyaretçilerinin oturumunu alabilirdi.
  - components/cart/overlay/SharedCartDrawer.ts:385-392 color.imageUrl escapeHtml, color.colorHex safeHexColor ile doğrulanıyor. Eski `style="background:${color.colorHex}"` CSS context injection'a açıktı (";background:url(javascript:…)" gibi).
  - pages/checkout.ts:516-527 order item payload her item için is_sample flag taşıyor (isSampleMode bayrağından). Backend _recompute_order_items_server_side bu flag'i listing.sample_price rotasına yönlendiriyor — aksi halde numune siparişler selling_price ile faturalandığı ~5× overcharge regresyonu vardı.
  - components/product/WriteReviewModal.ts:218-225 partial-fill yıldız `:style="'--star-fill:'+…+'%'"` string concat yerine object form `:style="{ '--star-fill': … }"` kullanıyor — aspect değişikliği reactive update'i daha güvenilir tetikler.
- fix(ci): release workflow printf format string bug (@boraydeger32)
- fix(chat-popup): mountChatPopup'u barrel export'a ekle (@ahmeetseker)
- fix(release-workflows): commit body bullet'larini CHANGELOG'a dahil et (@ahmeetseker)
- fix(changelog): beta.6 ve beta.7 release kayıtları manuel dolduruldu (@ahmeetseker)
- fix(release-workflows): commit mesajındaki boşlukları temizlendi (@ahmeetseker)
- fix(chat): 9 değişiklik (@ahmeetseker)
  - BusinessCardForm Edit/Send buttons close submenu (stub)
  - BusinessCardForm uses i18n placeholders (no leaked identity)
  - CallMenu renders activeConversation avatar when present
  - Shift+Enter must insert newline (move .prevent inside conditional)
  - add aria-label to composer textarea
  - clean up window/document listeners in chatPopupRoot destroy()
  - flatten body-type dispatch, right-align order cards, lucide file icon, i18n labels
  - i18n aria-labels and toolbar button labels
  - resolve conversation by sellerId via chatService (no more first-conv fallback)
- fix(chat-popup): 2 değişiklik (@ahmeetseker)
  - make chat section relative so ContextMenu anchors correctly
  - mark inbox avatar img as decorative (alt="")
- fix(product): use existing .th-btn-outline for Sohbet et (theme parity) (@ahmeetseker)
- fix(faq): 2 değişiklik (@ahmeetseker)
  - focus-within koyu drop-shadow kaldırıldı
  - siyah çizgi sorunu — border yerine ring, input focus-visible suppress
- fix(orders): 10 değişiklik (@ahmeetseker)
  - stepper label'larını 320px'te wrap edilebilir yap
  - a11y polish on items drawer (focus on open, aria-labels)
  - correct remittance event name and add aria-haspopup on drawer triggers
  - card spacing, remove link underline, drawer sort UX
  - symmetric card header (B layout)
  - remove confusing left sort icon in drawer (keep only chevron)
  - prevent hover/active layout shift on link-style buttons
  - remove all hover state changes on link-style buttons
  - use native select arrow only (remove custom chevron — fixes double arrow)
  - override global :focus-visible outline on link-style buttons

### Degistirildi
- refactor(css): migrate page styles to Tailwind utilities, drop src/styles/ (@ahmeetseker)
  - Migrate cart, checkout, seller-shop, seller-storefront ve product-detail sayfalarının custom CSS'lerini Tailwind v4 utility class'larına çevirdi. JS-toggled state'ler için `data-*` + `group-data-[...]/name:` variant pattern'i kullanıldı (parent class cascade pattern'i kaldırıldı).
  - src/styles/ dizini tamamen silindi: * cart-design.css            (-364) * checkout-design.css        (-1032) * seller/seller-storefront.css (-291)
  - src/style.css içindeki @media blokları, descendant selector cascade kuralları ve pseudo-element CSS'leri ilgili HTML/TS dosyalarına Tailwind utility olarak taşındı (-3239 değişiklik satırı).
  - Component dosyalarında string template'lere doğrudan utility class zincirleri yazıldı (auth, cart, checkout, product, seller, settings, manufacturers, favorites, orders, messages, buyer-dashboard).
  - CLAUDE.md güncellendi: @media → responsive variant, pseudo-element / nth-child / descendant / theme-var → utility eşleme tabloları, JS-toggled state → data-attribute + group variant kuralı.
  - css-optimization-reports/refactor-progress.md fazlara göre güncellendi.
- refactor(style): style.css ~700 satır baseline + th-btn 3D inset shadow (@ahmeetseker)
  - style.css: `.th-btn`/`.th-btn-outline`/`.th-btn-dark` hover ve active'de inset 3D shadow + `scale-[0.98]` tıklama efekti
  - style.css: `.th-btn-gradient` varyantı silindi → `utils/ui/button.ts` içinde `gradient` map'i `.th-btn`'e alias; SearchArea / TopBar / Cart Drawer kullanım yerleri güncellendi (inline `border-radius !important` temizliği dahil)
  - style.css: 325 satırlık ölü gradient/utility bloğu kaldırıldı (5056 → 4878, hedef ~700)
  - header-notice: slide-mode CSS sınıfları yerine `data-state=active|exiting` Tailwind pattern; `@theme` içine `--animate-notice-scroll` token taşındı
  - inquiries / orders / help-center / seller / subscription: sarı pill CTA butonları için `bg-(--btn-bg,#f5b800)` + `--btn-shadow` token + hover/active inset shadow zinciri
  - orders / subscription: link-tarzı butonlara `th-no-press` + `appearance-none focus:outline-none` — hover'da layout sıçraması yok
  - release-workflows: commit body bullet'ları subject altında nested gösteriliyor (admin-panel / tradehub_core ile senkron)
  - CLAUDE.md: yeni "0.0 İzin Kapısı — CSS dosyalarına yazma" bölümü; `style.css` baseline ~700 satır, `src/styles/*.css` yeni dosya yasağı, 5056 → 4878 → 700 yol haritası
  - css-optimization-reports/UYGULAMA-PLANI.md: refactor adımları güncellendi
- refactor(chat): 3 değişiklik (@ahmeetseker)
  - drop dead || "" fallback in appendDraft
  - promote Tab type to types/chat.ts as ChatTab
  - split localTime into localTimeHHMM primitive (i18n boundary)
- refactor(chat-popup): 2 değişiklik (@ahmeetseker)
  - drop dead 'pinned: ""' entry from tag lookup
  - lift click handler to initChatTriggers() shared module
- refactor(orders): 3 değişiklik (@ahmeetseker)
  - parsePrice'ı module scope'a taşı
  - ürünler kartı için helpers + i18n çekimi
  - extract order card into OrderListItem component
- refactor(faq): submit butonu projenin th-btn standardına geçti (@ahmeetseker)

---
## [v1.1.8-rc.1] - 2026-05-15 RC

Bu surum onay asamasindadir. v1.1.8 PROD'dan bu yana beta tag'lerinde test edilen tum feat/fix bu RC entry'sinde toplanmistir.

### Eklendi
- feat(dashboard,favorites,sell): e-posta doğrulama slide'ı, favori filtreleri ve satıcı landing düzenlemesi (@ahmeetseker)
  - Dashboard: OperationSlider'a e-posta doğrulanmamış kullanıcılar için synthetic "email-verify" slide eklendi (resend + change link, i18n anahtarları en/tr).
  - Favoriler: kategori/tedarikçi/stok/fiyat filtre menüsü, listing detail lazy enrichment, kart üstü stok pill'i ve doğrulanmış supplier satırı.
  - Sell: 4 section'a ortak max-w-[1500px] inner sarmalayıcı; "Avrupa" → "dünya" metin güncellemesi.
- feat(reviews): aspect ortalamasından dinamik puan + partial-fill yıldız (@boraydeger32)
  - WriteReviewModal: "Genel Puan" artık kullanıcı seçimi değil; 4 boyut puanının ortalaması olarak hesaplanan computed değer. Yıldızlar read-only ve clip-path tabanlı partial-fill destekler.
  - ProductReviews: renderStars fractional rating alır (SVG layering + clip-path); displayRating() helper'ı backend Int rating yerine aspect ortalamasını kullanır. Yorum kartı, ReviewsModal ve ürün başlığı bu helper'a yönlendirildi.
  - ProductTitleBar: ortalama Approved yorumların aspect ortalamasından yeniden hesaplanır (backend `rating` Int olduğu için 3.5 → 4 olarak kaybolur). "X yorum" tıklaması Yorumlar tab'ını açıp section'a scroll eder; rating satırı product-reviews-loaded event'iyle re-render.
  - listingService: BackendStorefrontReview.aspects artık ProductReview'a map ediliyor; tip de güncellendi.
  - WriteReviewModal'daki merge conflict (HEAD vs 7aafda0) çözüldü.
  - Yeni eklenen tüm color/clip-path inline style'ları Tailwind utility arbitrary'lerine (theme-var + [clip-path:inset(...)] + CSS var atama pattern'i) çevrildi; yeni .css/<style> bloku yok.
- feat(reviews): Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix (@boraydeger32)
  - Yorum Yaz modal: form + foto + kategori şablon cevapları
  - Şikayet Et modal: sebep dropdown + not
  - Q&A bottom-sheet: mobile-first soru/cevap görüntüleme
  - Reviewer tier rozeti (Top / Trusted / Verified) trust signal
  - Onay Bekliyor amber rozeti yorum sahibine
  - 24h içinde Düzenle butonu (max 1 edit, sonrası reddedilir)
  - Faydalı değil 👎 + Helpful/Not-helpful mutex pattern
  - Mobile pdm-* kısayol butonları (Yorum Yaz / Görüntüle / Soru-Cevap)
  - Bottom-sheet pattern: items-end sm:items-center
  - Mobile-first responsive header butonları
  - 374px altı küçültülmüş yazı
  - src/api/reviewsApi.ts
  - src/components/product/ProductQA.ts
  - src/components/product/QAModal.ts
  - src/components/product/WriteReviewModal.ts
  - src/components/product/ReportAbuseModal.ts
  - src/components/reviews/ReviewWidget.ts
  - src/styles/reviews-v5.css
- feat(reviews): review/Q&A storefront entegrasyonu + 4 kritik fix (@boraydeger32)
  - Backend API entegrasyonu (mock→real): eligibility, submit, vote, update, abuse, Q&A — yeni listingService methodları
  - Custom modal'lar: Yorum Yaz, Şikayet Et, Q&A bottom-sheet
  - Reviewer tier rozeti (Top/Trusted/Verified) — Newcomer gizli
  - Onay Bekliyor rozeti — sadece sahibine görünür (isOwnPending)
  - Düzenle butonu — 24h penceresinde, max 1 edit
  - Faydalı değil  + Helpful/Not-helpful mutex (kardeş butonlar kilitlenir)
  - Mobile layout: Yorum Yaz / Tüm yorumları / Soru-Cevap kısayolları
  - reviews-v5.css tasarım sistemi
  - Lint: @ts-nocheck pragma'larına eslint-disable + açıklama (rule bypass)
- feat(changelog): değişiklikleri daha okunabilir hale getirildi (@ahmeetseker)
- feat(reviews): dead code ve stil dosyalarını kaldırdı (@ahmeetseker)
- Yorum Yaz modal: form + foto + kategori şablon cevapları (@boraydeger32)
- Şikayet Et modal: sebep dropdown + not (@boraydeger32)
- Q&A bottom-sheet: mobile-first soru/cevap görüntüleme (@boraydeger32)
- Reviewer tier rozeti (Top / Trusted / Verified) trust signal (@boraydeger32)
- Onay Bekliyor amber rozeti yorum sahibine (@boraydeger32)
- 24h içinde Düzenle butonu (max 1 edit, sonrası reddedilir) (@boraydeger32)
- Faydalı değil 👎 + Helpful/Not-helpful mutex pattern (@boraydeger32)
- Mobile pdm-* kısayol butonları (Yorum Yaz / Görüntüle / Soru-Cevap) (@boraydeger32)
- Bottom-sheet pattern: items-end sm:items-center (@boraydeger32)
- Mobile-first responsive header butonları (@boraydeger32)
- 374px altı küçültülmüş yazı (@boraydeger32)
- src/api/reviewsApi.ts (@boraydeger32)
- src/components/product/ProductQA.ts (@boraydeger32)
- src/components/product/QAModal.ts (@boraydeger32)
- src/components/product/WriteReviewModal.ts (@boraydeger32)
- src/components/product/ReportAbuseModal.ts (@boraydeger32)
- src/components/reviews/ReviewWidget.ts (@boraydeger32)
- src/styles/reviews-v5.css (@boraydeger32)
- Backend API entegrasyonu (mock→real): eligibility, submit, vote, update, abuse, Q&A — yeni listingService methodları (@boraydeger32)
- Custom modal'lar: Yorum Yaz, Şikayet Et, Q&A bottom-sheet (@boraydeger32)
- Reviewer tier rozeti (Top/Trusted/Verified) — Newcomer gizli (@boraydeger32)
- Onay Bekliyor rozeti — sadece sahibine görünür (isOwnPending) (@boraydeger32)
- Düzenle butonu — 24h penceresinde, max 1 edit (@boraydeger32)
- Faydalı değil  + Helpful/Not-helpful mutex (kardeş butonlar kilitlenir) (@boraydeger32)
- Mobile layout: Yorum Yaz / Tüm yorumları / Soru-Cevap kısayolları (@boraydeger32)
- reviews-v5.css tasarım sistemi (@boraydeger32)
- Lint: @ts-nocheck pragma'larına eslint-disable + açıklama (rule bypass) (@boraydeger32)
- feat(chat-popup): mesaj kutusu arama + sağ-alt floating pencere; ürün gridine Sohbet et butonu; favori widget'i ürün kartlarıyla (@ahmeetseker)
- feat(chat-popup): mesaj kutusunda kişi / şirket / son mesaj üzerinden anlık arama (@ahmeetseker)
- feat(chat-popup): sohbet penceresi artık ekranın sağ-altında açılıyor, arka plan karartılmıyor — site üzerinde gezerken (@ahmeetseker)
- feat(products): ürün listesi kartlarına "Sohbet et" butonu eklendi — Sepete Ekle ile yan yana, satıcıya doğrudan mesaj (@ahmeetseker)
- feat(dashboard): favori ürünler kutusu artık boş ekran yerine gerçek ürün kartlarını yatay kaydırmalı gösteriyor (3 ürün + "Tümünü (@ahmeetseker)
- feat(dashboard): yan menüde "Mesajlarım" alt menüsü yeniden açıldı (Tedarikçi Mesajları / Tekliflerim / Kişilerim) (@ahmeetseker)
- refactor(chat): kartvizit penceresinin tasarımı yenilendi — ayrık başlık/alt bar, ülke bayrağı, daha sade kullanıcı bilgisi (@ahmeetseker)
- refactor(chat): araç çubuğunda kullanılmayan butonlar temizlendi (konum, çeviri, buluttan fotoğraf) (@ahmeetseker)
- refactor(style): global buton hover/press efekti sadeleştirildi — gereksiz transform/box-shadow kaldırıldı, sayfa geneli daha (@ahmeetseker)
- chore(i18n): kartvizit "iSTOC tarafından doğrulanan hesaplar" etiketi güncellendi (@ahmeetseker)
- feat(reviews): 2 değişiklik (@boraydeger32)
  - review/Q&A storefront entegrasyonu + 4 kritik fix
  - Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix
- feat(chat-popup): Sohbet Et özelliği — alıcı ile satıcı doğrudan iletişim (@ahmeetseker)
- feat(alpine): add chatPopup global store + chatPopupRoot data wrapper (@ahmeetseker)
- feat(chat): 16 değişiklik (@ahmeetseker)
  - AttachmentToolbar with 7 sub-menu triggers
  - BusinessCardForm sub-popup
  - CallMenu sub-popup with video/voice/schedule
  - ChatBubble — text/image/file/system variants
  - ChatComposer with pinned product, toolbar, input and orange Gönder
  - ChatHeader with optional back/expand/close buttons
  - ChatMessages list with date labels and error state
  - ContextMenu sub-popup with pin/block/delete/mute
  - EmojiPicker sub-popup with 70 popular emojis
  - OrderCard embedded order summary
  - PhotoSourceMenu sub-popup
  - PinnedProduct composer context strip
  - QuickActionChips quick-action row
  - SecurityBanner component
  - add error/sending state and try-catch around service calls
  - barrel export for chat-shared module
- feat(chat-popup): 4 değişiklik (@ahmeetseker)
  - ChatPopup root container with overlay, expand mode and mobile tabs
  - InboxPanel — conversation list with tag labels and unread badge
  - MobileTabs (Sohbet / Mesajlar) for sm screens
  - barrel export
- feat(data): seed mock conversations and messages (@ahmeetseker)
- feat(i18n): 2 değişiklik (@ahmeetseker)
  - add chat namespace keys
  - add chat.{emptyThread,orderCard,aria,toolbar,pending} keys
- feat(icons): add chat-popup lucide icons (@ahmeetseker)
- feat(product): 2 değişiklik (@ahmeetseker)
  - add Sohbet et button in 50/50 grid with Sepete Ekle
  - wire Sohbet et click to chat-popup:open event with pinned product
- feat(product-detail): mount ChatPopup so it can be opened from this page (@ahmeetseker)
- feat(services): add chat service stub with mock-data promises (@ahmeetseker)
- feat(theme): add orange palette tokens for chat composer (@ahmeetseker)
- feat(types): define chat conversation/message interfaces (@ahmeetseker)
- feat(utils): ref-counted scrollLock; use it in chat popup open/close (@ahmeetseker)
- feat(faq): 3 değişiklik (@ahmeetseker)
  - faqPage Alpine data'ya search helper'ları eklendi
  - search bar yeniden tasarlandı
  - eşleşme vurgusu + sidebar inline style refactor
- feat(orders): 6 değişiklik (@ahmeetseker)
  - detay panel için tab/ürün state'i ekle
  - ürünler kartını ilk-5 + scroll'lu hibrit yapıya çevir
  - boxed tab container + Kargo paneli + i18n tab etiketleri
  - Ödeme detaylarını tab paneline taşı
  - Tedarikçi detaylarını tab paneline taşı
  - replace per-order item list with thumbnail strip + drawer
- feat(header-notice): 7 değişiklik (@ahmeetseker)
  - add storefront service with localStorage cache
  - add HeaderNotice marquee component
  - integrate notice render into TopBar
  - call initHeaderNotice in main bootstrap
  - suppress notice on payment/payments/orders pages
  - remove icon rendering from storefront marquee
  - add slide display mode and per-notice background color
- feat(help-center): "Bize Ulaşın" 4'lü kart bloğu kaldırıldı (@ahmeetseker)
- feat(floating-panel): x-show ve x-transition ekleyerek görünürlüğü iyileştirdi (@ahmeetseker)

### Duzeltildi
- fix(lint): no-unused-expressions FavoritesLayout filter sets (@boraydeger32)

### Duzeltildi
- fix(security): storefront 4 XSS sink + sample order payload + yıldız reactive (@boraydeger32)
  - utils/sanitize.ts: escapeHtml ve safeHexColor utility'leri eklendi. DOMPurify tabanlı sanitizeHtml zaten vardı; escapeHtml template literal innerHTML interpolation'ları için, safeHexColor CSS background değerini hex regex'iyle doğrular.
  - alpine/index.ts: Alpine.magic("safeHtml") kayıt — `x-html` binding'lerinde `$safeHtml(value)` ile DOMPurify'a yönlendirir.
  - utils/seller/section-registry.ts:569 seller.description artık `$safeHtml(...)` ile render. Kötü niyetli satıcının vitrinine yazdığı `<img src=x onerror=...>` payload'ı buyer oturumlarını hijack edebiliyordu.
  - components/help-center/TicketDetailLayout.ts:90 ticket.description `$safeHtml`. Destek personeli her ticket açtığında stored XSS çalışıyordu.
  - components/product/ProductReviews.ts review card içeriği (comment, anonymized author, date, country, productTitle/Price, image URL'ler, lightbox img src) escapeHtml ile, supplierReply zengin metin barındırdığı için sanitizeHtml ile sarıldı. Yorum yazan saldırgan tüm ürün sayfası ziyaretçilerinin oturumunu alabilirdi.
  - components/cart/overlay/SharedCartDrawer.ts:385-392 color.imageUrl escapeHtml, color.colorHex safeHexColor ile doğrulanıyor. Eski `style="background:${color.colorHex}"` CSS context injection'a açıktı (";background:url(javascript:…)" gibi).
  - pages/checkout.ts:516-527 order item payload her item için is_sample flag taşıyor (isSampleMode bayrağından). Backend _recompute_order_items_server_side bu flag'i listing.sample_price rotasına yönlendiriyor — aksi halde numune siparişler selling_price ile faturalandığı ~5× overcharge regresyonu vardı.
  - components/product/WriteReviewModal.ts:218-225 partial-fill yıldız `:style="'--star-fill:'+…+'%'"` string concat yerine object form `:style="{ '--star-fill': … }"` kullanıyor — aspect değişikliği reactive update'i daha güvenilir tetikler.
- fix(ci): release workflow printf format string bug (@boraydeger32)
- fix(chat-popup): mountChatPopup'u barrel export'a ekle (@ahmeetseker)
- fix(release-workflows): commit body bullet'larini CHANGELOG'a dahil et (@ahmeetseker)
- fix(changelog): beta.6 ve beta.7 release kayıtları manuel dolduruldu (@ahmeetseker)
- fix(release-workflows): commit mesajındaki boşlukları temizlendi (@ahmeetseker)
- fix(chat): 9 değişiklik (@ahmeetseker)
  - BusinessCardForm Edit/Send buttons close submenu (stub)
  - BusinessCardForm uses i18n placeholders (no leaked identity)
  - CallMenu renders activeConversation avatar when present
  - Shift+Enter must insert newline (move .prevent inside conditional)
  - add aria-label to composer textarea
  - clean up window/document listeners in chatPopupRoot destroy()
  - flatten body-type dispatch, right-align order cards, lucide file icon, i18n labels
  - i18n aria-labels and toolbar button labels
  - resolve conversation by sellerId via chatService (no more first-conv fallback)
- fix(chat-popup): 2 değişiklik (@ahmeetseker)
  - make chat section relative so ContextMenu anchors correctly
  - mark inbox avatar img as decorative (alt="")
- fix(product): use existing .th-btn-outline for Sohbet et (theme parity) (@ahmeetseker)
- fix(faq): 2 değişiklik (@ahmeetseker)
  - focus-within koyu drop-shadow kaldırıldı
  - siyah çizgi sorunu — border yerine ring, input focus-visible suppress
- fix(orders): 10 değişiklik (@ahmeetseker)
  - stepper label'larını 320px'te wrap edilebilir yap
  - a11y polish on items drawer (focus on open, aria-labels)
  - correct remittance event name and add aria-haspopup on drawer triggers
  - card spacing, remove link underline, drawer sort UX
  - symmetric card header (B layout)
  - remove confusing left sort icon in drawer (keep only chevron)
  - prevent hover/active layout shift on link-style buttons
  - remove all hover state changes on link-style buttons
  - use native select arrow only (remove custom chevron — fixes double arrow)
  - override global :focus-visible outline on link-style buttons

### Degistirildi
- refactor(css): migrate page styles to Tailwind utilities, drop src/styles/ (@ahmeetseker)
  - Migrate cart, checkout, seller-shop, seller-storefront ve product-detail sayfalarının custom CSS'lerini Tailwind v4 utility class'larına çevirdi. JS-toggled state'ler için `data-*` + `group-data-[...]/name:` variant pattern'i kullanıldı (parent class cascade pattern'i kaldırıldı).
  - src/styles/ dizini tamamen silindi: * cart-design.css            (-364) * checkout-design.css        (-1032) * seller/seller-storefront.css (-291)
  - src/style.css içindeki @media blokları, descendant selector cascade kuralları ve pseudo-element CSS'leri ilgili HTML/TS dosyalarına Tailwind utility olarak taşındı (-3239 değişiklik satırı).
  - Component dosyalarında string template'lere doğrudan utility class zincirleri yazıldı (auth, cart, checkout, product, seller, settings, manufacturers, favorites, orders, messages, buyer-dashboard).
  - CLAUDE.md güncellendi: @media → responsive variant, pseudo-element / nth-child / descendant / theme-var → utility eşleme tabloları, JS-toggled state → data-attribute + group variant kuralı.
  - css-optimization-reports/refactor-progress.md fazlara göre güncellendi.
- refactor(style): style.css ~700 satır baseline + th-btn 3D inset shadow (@ahmeetseker)
  - style.css: `.th-btn`/`.th-btn-outline`/`.th-btn-dark` hover ve active'de inset 3D shadow + `scale-[0.98]` tıklama efekti
  - style.css: `.th-btn-gradient` varyantı silindi → `utils/ui/button.ts` içinde `gradient` map'i `.th-btn`'e alias; SearchArea / TopBar / Cart Drawer kullanım yerleri güncellendi (inline `border-radius !important` temizliği dahil)
  - style.css: 325 satırlık ölü gradient/utility bloğu kaldırıldı (5056 → 4878, hedef ~700)
  - header-notice: slide-mode CSS sınıfları yerine `data-state=active|exiting` Tailwind pattern; `@theme` içine `--animate-notice-scroll` token taşındı
  - inquiries / orders / help-center / seller / subscription: sarı pill CTA butonları için `bg-(--btn-bg,#f5b800)` + `--btn-shadow` token + hover/active inset shadow zinciri
  - orders / subscription: link-tarzı butonlara `th-no-press` + `appearance-none focus:outline-none` — hover'da layout sıçraması yok
  - release-workflows: commit body bullet'ları subject altında nested gösteriliyor (admin-panel / tradehub_core ile senkron)
  - CLAUDE.md: yeni "0.0 İzin Kapısı — CSS dosyalarına yazma" bölümü; `style.css` baseline ~700 satır, `src/styles/*.css` yeni dosya yasağı, 5056 → 4878 → 700 yol haritası
  - css-optimization-reports/UYGULAMA-PLANI.md: refactor adımları güncellendi
- refactor(chat): 3 değişiklik (@ahmeetseker)
  - drop dead || "" fallback in appendDraft
  - promote Tab type to types/chat.ts as ChatTab
  - split localTime into localTimeHHMM primitive (i18n boundary)
- refactor(chat-popup): 2 değişiklik (@ahmeetseker)
  - drop dead 'pinned: ""' entry from tag lookup
  - lift click handler to initChatTriggers() shared module
- refactor(orders): 3 değişiklik (@ahmeetseker)
  - parsePrice'ı module scope'a taşı
  - ürünler kartı için helpers + i18n çekimi
  - extract order card into OrderListItem component
- refactor(faq): submit butonu projenin th-btn standardına geçti (@ahmeetseker)
- fix(lint): no-unused-expressions FavoritesLayout filter sets (@boraydeger32)

---
## [v1.1.8-beta.19] - 2026-05-14 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(lint): no-unused-expressions FavoritesLayout filter sets (@boraydeger32)

---
## [v1.1.8-beta.18] - 2026-05-14 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(dashboard,favorites,sell): e-posta doğrulama slide'ı, favori filtreleri ve satıcı landing düzenlemesi (@ahmeetseker)
  - Dashboard: OperationSlider'a e-posta doğrulanmamış kullanıcılar için synthetic "email-verify" slide eklendi (resend + change link, i18n anahtarları en/tr).
  - Favoriler: kategori/tedarikçi/stok/fiyat filtre menüsü, listing detail lazy enrichment, kart üstü stok pill'i ve doğrulanmış supplier satırı.
  - Sell: 4 section'a ortak max-w-[1500px] inner sarmalayıcı; "Avrupa" → "dünya" metin güncellemesi.

---
## [v1.1.8-beta.17] - 2026-05-14 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(security): storefront 4 XSS sink + sample order payload + yıldız reactive (@boraydeger32)
  - utils/sanitize.ts: escapeHtml ve safeHexColor utility'leri eklendi. DOMPurify tabanlı sanitizeHtml zaten vardı; escapeHtml template literal innerHTML interpolation'ları için, safeHexColor CSS background değerini hex regex'iyle doğrular.
  - alpine/index.ts: Alpine.magic("safeHtml") kayıt — `x-html` binding'lerinde `$safeHtml(value)` ile DOMPurify'a yönlendirir.
  - utils/seller/section-registry.ts:569 seller.description artık `$safeHtml(...)` ile render. Kötü niyetli satıcının vitrinine yazdığı `<img src=x onerror=...>` payload'ı buyer oturumlarını hijack edebiliyordu.
  - components/help-center/TicketDetailLayout.ts:90 ticket.description `$safeHtml`. Destek personeli her ticket açtığında stored XSS çalışıyordu.
  - components/product/ProductReviews.ts review card içeriği (comment, anonymized author, date, country, productTitle/Price, image URL'ler, lightbox img src) escapeHtml ile, supplierReply zengin metin barındırdığı için sanitizeHtml ile sarıldı. Yorum yazan saldırgan tüm ürün sayfası ziyaretçilerinin oturumunu alabilirdi.
  - components/cart/overlay/SharedCartDrawer.ts:385-392 color.imageUrl escapeHtml, color.colorHex safeHexColor ile doğrulanıyor. Eski `style="background:${color.colorHex}"` CSS context injection'a açıktı (";background:url(javascript:…)" gibi).
  - pages/checkout.ts:516-527 order item payload her item için is_sample flag taşıyor (isSampleMode bayrağından). Backend _recompute_order_items_server_side bu flag'i listing.sample_price rotasına yönlendiriyor — aksi halde numune siparişler selling_price ile faturalandığı ~5× overcharge regresyonu vardı.
  - components/product/WriteReviewModal.ts:218-225 partial-fill yıldız `:style="'--star-fill:'+…+'%'"` string concat yerine object form `:style="{ '--star-fill': … }"` kullanıyor — aspect değişikliği reactive update'i daha güvenilir tetikler.
- fix(ci): release workflow printf format string bug (@boraydeger32)

---
## [v1.1.8-beta.15] - 2026-05-14 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(reviews): aspect ortalamasından dinamik puan + partial-fill yıldız (@boraydeger32)
  - WriteReviewModal: "Genel Puan" artık kullanıcı seçimi değil; 4 boyut puanının ortalaması olarak hesaplanan computed değer. Yıldızlar read-only ve clip-path tabanlı partial-fill destekler.
  - ProductReviews: renderStars fractional rating alır (SVG layering + clip-path); displayRating() helper'ı backend Int rating yerine aspect ortalamasını kullanır. Yorum kartı, ReviewsModal ve ürün başlığı bu helper'a yönlendirildi.
  - ProductTitleBar: ortalama Approved yorumların aspect ortalamasından yeniden hesaplanır (backend `rating` Int olduğu için 3.5 → 4 olarak kaybolur). "X yorum" tıklaması Yorumlar tab'ını açıp section'a scroll eder; rating satırı product-reviews-loaded event'iyle re-render.
  - listingService: BackendStorefrontReview.aspects artık ProductReview'a map ediliyor; tip de güncellendi.
  - WriteReviewModal'daki merge conflict (HEAD vs 7aafda0) çözüldü.
  - Yeni eklenen tüm color/clip-path inline style'ları Tailwind utility arbitrary'lerine (theme-var + [clip-path:inset(...)] + CSS var atama pattern'i) çevrildi; yeni .css/<style> bloku yok.

---
## [v1.1.8-beta.13] - 2026-05-14 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(reviews): Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix (@boraydeger32)
  - Yorum Yaz modal: form + foto + kategori şablon cevapları
  - Şikayet Et modal: sebep dropdown + not
  - Q&A bottom-sheet: mobile-first soru/cevap görüntüleme
  - Reviewer tier rozeti (Top / Trusted / Verified) trust signal
  - Onay Bekliyor amber rozeti yorum sahibine
  - 24h içinde Düzenle butonu (max 1 edit, sonrası reddedilir)
  - Faydalı değil 👎 + Helpful/Not-helpful mutex pattern
  - Mobile pdm-* kısayol butonları (Yorum Yaz / Görüntüle / Soru-Cevap)
  - Bottom-sheet pattern: items-end sm:items-center
  - Mobile-first responsive header butonları
  - 374px altı küçültülmüş yazı
  - src/api/reviewsApi.ts
  - src/components/product/ProductQA.ts
  - src/components/product/QAModal.ts
  - src/components/product/WriteReviewModal.ts
  - src/components/product/ReportAbuseModal.ts
  - src/components/reviews/ReviewWidget.ts
  - src/styles/reviews-v5.css
- feat(reviews): review/Q&A storefront entegrasyonu + 4 kritik fix (@boraydeger32)
  - Backend API entegrasyonu (mock→real): eligibility, submit, vote, update, abuse, Q&A — yeni listingService methodları
  - Custom modal'lar: Yorum Yaz, Şikayet Et, Q&A bottom-sheet
  - Reviewer tier rozeti (Top/Trusted/Verified) — Newcomer gizli
  - Onay Bekliyor rozeti — sadece sahibine görünür (isOwnPending)
  - Düzenle butonu — 24h penceresinde, max 1 edit
  - Faydalı değil  + Helpful/Not-helpful mutex (kardeş butonlar kilitlenir)
  - Mobile layout: Yorum Yaz / Tüm yorumları / Soru-Cevap kısayolları
  - reviews-v5.css tasarım sistemi
  - Lint: @ts-nocheck pragma'larına eslint-disable + açıklama (rule bypass)

---
## [v1.1.8-beta.12] - 2026-05-13 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Degistirildi
- refactor(css): migrate page styles to Tailwind utilities, drop src/styles/ (@ahmeetseker)
  - Migrate cart, checkout, seller-shop, seller-storefront ve product-detail sayfalarının custom CSS'lerini Tailwind v4 utility class'larına çevirdi. JS-toggled state'ler için `data-*` + `group-data-[...]/name:` variant pattern'i kullanıldı (parent class cascade pattern'i kaldırıldı).
  - src/styles/ dizini tamamen silindi: * cart-design.css            (-364) * checkout-design.css        (-1032) * seller/seller-storefront.css (-291)
  - src/style.css içindeki @media blokları, descendant selector cascade kuralları ve pseudo-element CSS'leri ilgili HTML/TS dosyalarına Tailwind utility olarak taşındı (-3239 değişiklik satırı).
  - Component dosyalarında string template'lere doğrudan utility class zincirleri yazıldı (auth, cart, checkout, product, seller, settings, manufacturers, favorites, orders, messages, buyer-dashboard).
  - CLAUDE.md güncellendi: @media → responsive variant, pseudo-element / nth-child / descendant / theme-var → utility eşleme tabloları, JS-toggled state → data-attribute + group variant kuralı.
  - css-optimization-reports/refactor-progress.md fazlara göre güncellendi.

---
## [v1.1.8-beta.10] - 2026-05-13 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(changelog): değişiklikleri daha okunabilir hale getirildi (@ahmeetseker)
- feat(reviews): dead code ve stil dosyalarını kaldırdı (@ahmeetseker)

### Degistirildi
- refactor(style): style.css ~700 satır baseline + th-btn 3D inset shadow (@ahmeetseker)
  - style.css: `.th-btn`/`.th-btn-outline`/`.th-btn-dark` hover ve active'de inset 3D shadow + `scale-[0.98]` tıklama efekti
  - style.css: `.th-btn-gradient` varyantı silindi → `utils/ui/button.ts` içinde `gradient` map'i `.th-btn`'e alias; SearchArea / TopBar / Cart Drawer kullanım yerleri güncellendi (inline `border-radius !important` temizliği dahil)
  - style.css: 325 satırlık ölü gradient/utility bloğu kaldırıldı (5056 → 4878, hedef ~700)
  - header-notice: slide-mode CSS sınıfları yerine `data-state=active|exiting` Tailwind pattern; `@theme` içine `--animate-notice-scroll` token taşındı
  - inquiries / orders / help-center / seller / subscription: sarı pill CTA butonları için `bg-(--btn-bg,#f5b800)` + `--btn-shadow` token + hover/active inset shadow zinciri
  - orders / subscription: link-tarzı butonlara `th-no-press` + `appearance-none focus:outline-none` — hover'da layout sıçraması yok
  - release-workflows: commit body bullet'ları subject altında nested gösteriliyor (admin-panel / tradehub_core ile senkron)
  - CLAUDE.md: yeni "0.0 İzin Kapısı — CSS dosyalarına yazma" bölümü; `style.css` baseline ~700 satır, `src/styles/*.css` yeni dosya yasağı, 5056 → 4878 → 700 yol haritası
  - css-optimization-reports/UYGULAMA-PLANI.md: refactor adımları güncellendi

---
## [v1.1.8-beta.9] - 2026-05-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(reviews): Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix (@boraydeger32)
- Yorum Yaz modal: form + foto + kategori şablon cevapları (@boraydeger32)
- Şikayet Et modal: sebep dropdown + not (@boraydeger32)
- Q&A bottom-sheet: mobile-first soru/cevap görüntüleme (@boraydeger32)
- Reviewer tier rozeti (Top / Trusted / Verified) trust signal (@boraydeger32)
- Onay Bekliyor amber rozeti yorum sahibine (@boraydeger32)
- 24h içinde Düzenle butonu (max 1 edit, sonrası reddedilir) (@boraydeger32)
- Faydalı değil 👎 + Helpful/Not-helpful mutex pattern (@boraydeger32)
- Mobile pdm-* kısayol butonları (Yorum Yaz / Görüntüle / Soru-Cevap) (@boraydeger32)
- Bottom-sheet pattern: items-end sm:items-center (@boraydeger32)
- Mobile-first responsive header butonları (@boraydeger32)
- 374px altı küçültülmüş yazı (@boraydeger32)
- src/api/reviewsApi.ts (@boraydeger32)
- src/components/product/ProductQA.ts (@boraydeger32)
- src/components/product/QAModal.ts (@boraydeger32)
- src/components/product/WriteReviewModal.ts (@boraydeger32)
- src/components/product/ReportAbuseModal.ts (@boraydeger32)
- src/components/reviews/ReviewWidget.ts (@boraydeger32)
- src/styles/reviews-v5.css (@boraydeger32)
- feat(reviews): review/Q&A storefront entegrasyonu + 4 kritik fix (@boraydeger32)
- Backend API entegrasyonu (mock→real): eligibility, submit, vote, update, abuse, Q&A — yeni listingService methodları (@boraydeger32)
- Custom modal'lar: Yorum Yaz, Şikayet Et, Q&A bottom-sheet (@boraydeger32)
- Reviewer tier rozeti (Top/Trusted/Verified) — Newcomer gizli (@boraydeger32)
- Onay Bekliyor rozeti — sadece sahibine görünür (isOwnPending) (@boraydeger32)
- Düzenle butonu — 24h penceresinde, max 1 edit (@boraydeger32)
- Faydalı değil  + Helpful/Not-helpful mutex (kardeş butonlar kilitlenir) (@boraydeger32)
- Mobile layout: Yorum Yaz / Tüm yorumları / Soru-Cevap kısayolları (@boraydeger32)
- reviews-v5.css tasarım sistemi (@boraydeger32)
- Lint: @ts-nocheck pragma'larına eslint-disable + açıklama (rule bypass) (@boraydeger32)
- feat(chat-popup): mesaj kutusu arama + sağ-alt floating pencere; ürün gridine Sohbet et butonu; favori widget'i ürün kartlarıyla (@ahmeetseker)
- feat(chat-popup): mesaj kutusunda kişi / şirket / son mesaj üzerinden anlık arama (@ahmeetseker)
- feat(chat-popup): sohbet penceresi artık ekranın sağ-altında açılıyor, arka plan karartılmıyor — site üzerinde gezerken (@ahmeetseker)
- feat(products): ürün listesi kartlarına "Sohbet et" butonu eklendi — Sepete Ekle ile yan yana, satıcıya doğrudan mesaj (@ahmeetseker)
- feat(dashboard): favori ürünler kutusu artık boş ekran yerine gerçek ürün kartlarını yatay kaydırmalı gösteriyor (3 ürün + "Tümünü (@ahmeetseker)
- feat(dashboard): yan menüde "Mesajlarım" alt menüsü yeniden açıldı (Tedarikçi Mesajları / Tekliflerim / Kişilerim) (@ahmeetseker)
- refactor(chat): kartvizit penceresinin tasarımı yenilendi — ayrık başlık/alt bar, ülke bayrağı, daha sade kullanıcı bilgisi (@ahmeetseker)
- refactor(chat): araç çubuğunda kullanılmayan butonlar temizlendi (konum, çeviri, buluttan fotoğraf) (@ahmeetseker)
- refactor(style): global buton hover/press efekti sadeleştirildi — gereksiz transform/box-shadow kaldırıldı, sayfa geneli daha (@ahmeetseker)
- chore(i18n): kartvizit "iSTOC tarafından doğrulanan hesaplar" etiketi güncellendi (@ahmeetseker)

### Duzeltildi
- fix(chat-popup): mountChatPopup'u barrel export'a ekle (@ahmeetseker)
- fix(release-workflows): commit body bullet'larini CHANGELOG'a dahil et (@ahmeetseker)

---
## [v1.1.8-beta.8] - 2026-05-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(changelog): beta.6 ve beta.7 release kayıtları manuel dolduruldu (@ahmeetseker)
- fix(release-workflows): commit mesajındaki boşlukları temizlendi (@ahmeetseker)

---
## [v1.1.8-beta.7] - 2026-05-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(reviews): 2 değişiklik (@boraydeger32)
  - review/Q&A storefront entegrasyonu + 4 kritik fix
  - Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix

---
## [v1.1.8-beta.6] - 2026-05-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(chat-popup): Sohbet Et özelliği — alıcı ile satıcı doğrudan iletişim (@ahmeetseker)

---
## [v1.1.8-beta.5] - 2026-05-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(alpine): add chatPopup global store + chatPopupRoot data wrapper (@ahmeetseker)
- feat(chat): 16 değişiklik (@ahmeetseker)
  - AttachmentToolbar with 7 sub-menu triggers
  - BusinessCardForm sub-popup
  - CallMenu sub-popup with video/voice/schedule
  - ChatBubble — text/image/file/system variants
  - ChatComposer with pinned product, toolbar, input and orange Gönder
  - ChatHeader with optional back/expand/close buttons
  - ChatMessages list with date labels and error state
  - ContextMenu sub-popup with pin/block/delete/mute
  - EmojiPicker sub-popup with 70 popular emojis
  - OrderCard embedded order summary
  - PhotoSourceMenu sub-popup
  - PinnedProduct composer context strip
  - QuickActionChips quick-action row
  - SecurityBanner component
  - add error/sending state and try-catch around service calls
  - barrel export for chat-shared module
- feat(chat-popup): 4 değişiklik (@ahmeetseker)
  - ChatPopup root container with overlay, expand mode and mobile tabs
  - InboxPanel — conversation list with tag labels and unread badge
  - MobileTabs (Sohbet / Mesajlar) for sm screens
  - barrel export
- feat(data): seed mock conversations and messages (@ahmeetseker)
- feat(i18n): 2 değişiklik (@ahmeetseker)
  - add chat namespace keys
  - add chat.{emptyThread,orderCard,aria,toolbar,pending} keys
- feat(icons): add chat-popup lucide icons (@ahmeetseker)
- feat(product): 2 değişiklik (@ahmeetseker)
  - add Sohbet et button in 50/50 grid with Sepete Ekle
  - wire Sohbet et click to chat-popup:open event with pinned product
- feat(product-detail): mount ChatPopup so it can be opened from this page (@ahmeetseker)
- feat(services): add chat service stub with mock-data promises (@ahmeetseker)
- feat(theme): add orange palette tokens for chat composer (@ahmeetseker)
- feat(types): define chat conversation/message interfaces (@ahmeetseker)
- feat(utils): ref-counted scrollLock; use it in chat popup open/close (@ahmeetseker)

### Duzeltildi
- fix(chat): 9 değişiklik (@ahmeetseker)
  - BusinessCardForm Edit/Send buttons close submenu (stub)
  - BusinessCardForm uses i18n placeholders (no leaked identity)
  - CallMenu renders activeConversation avatar when present
  - Shift+Enter must insert newline (move .prevent inside conditional)
  - add aria-label to composer textarea
  - clean up window/document listeners in chatPopupRoot destroy()
  - flatten body-type dispatch, right-align order cards, lucide file icon, i18n labels
  - i18n aria-labels and toolbar button labels
  - resolve conversation by sellerId via chatService (no more first-conv fallback)
- fix(chat-popup): 2 değişiklik (@ahmeetseker)
  - make chat section relative so ContextMenu anchors correctly
  - mark inbox avatar img as decorative (alt="")
- fix(product): use existing .th-btn-outline for Sohbet et (theme parity) (@ahmeetseker)

### Degistirildi
- refactor(chat): 3 değişiklik (@ahmeetseker)
  - drop dead || "" fallback in appendDraft
  - promote Tab type to types/chat.ts as ChatTab
  - split localTime into localTimeHHMM primitive (i18n boundary)
- refactor(chat-popup): 2 değişiklik (@ahmeetseker)
  - drop dead 'pinned: ""' entry from tag lookup
  - lift click handler to initChatTriggers() shared module

---
## [v1.1.8-beta.3] - 2026-05-11 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(faq): 3 değişiklik (@ahmeetseker)
  - faqPage Alpine data'ya search helper'ları eklendi
  - search bar yeniden tasarlandı
  - eşleşme vurgusu + sidebar inline style refactor
- feat(orders): 6 değişiklik (@ahmeetseker)
  - detay panel için tab/ürün state'i ekle
  - ürünler kartını ilk-5 + scroll'lu hibrit yapıya çevir
  - boxed tab container + Kargo paneli + i18n tab etiketleri
  - Ödeme detaylarını tab paneline taşı
  - Tedarikçi detaylarını tab paneline taşı
  - replace per-order item list with thumbnail strip + drawer
- feat(header-notice): 7 değişiklik (@ahmeetseker)
  - add storefront service with localStorage cache
  - add HeaderNotice marquee component
  - integrate notice render into TopBar
  - call initHeaderNotice in main bootstrap
  - suppress notice on payment/payments/orders pages
  - remove icon rendering from storefront marquee
  - add slide display mode and per-notice background color
- feat(help-center): "Bize Ulaşın" 4'lü kart bloğu kaldırıldı (@ahmeetseker)

### Duzeltildi
- fix(faq): 2 değişiklik (@ahmeetseker)
  - focus-within koyu drop-shadow kaldırıldı
  - siyah çizgi sorunu — border yerine ring, input focus-visible suppress
- fix(orders): 10 değişiklik (@ahmeetseker)
  - stepper label'larını 320px'te wrap edilebilir yap
  - a11y polish on items drawer (focus on open, aria-labels)
  - correct remittance event name and add aria-haspopup on drawer triggers
  - card spacing, remove link underline, drawer sort UX
  - symmetric card header (B layout)
  - remove confusing left sort icon in drawer (keep only chevron)
  - prevent hover/active layout shift on link-style buttons
  - remove all hover state changes on link-style buttons
  - use native select arrow only (remove custom chevron — fixes double arrow)
  - override global :focus-visible outline on link-style buttons

### Degistirildi
- refactor(orders): 3 değişiklik (@ahmeetseker)
  - parsePrice'ı module scope'a taşı
  - ürünler kartı için helpers + i18n çekimi
  - extract order card into OrderListItem component
- refactor(faq): submit butonu projenin th-btn standardına geçti (@ahmeetseker)

---

## [v1.1.8-beta.1] - 2026-05-11 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(floating-panel): x-show ve x-transition ekleyerek görünürlüğü iyileştirdi (@ahmeetseker)

---

## [v1.1.7-beta.8] - 2026-05-08 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(seller-trust): "Onaylanmış Satıcı" rozetini KYB Verified ile birleştir + 3-katmanlı sipariş gate (@aliiball)

## [v1.1.7-beta.7] - 2026-05-07 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Degistirildi
- refactor: standardize currency formatting by replacing manual string interpolation with formatCurrency utility (@ahmeetseker)

---

## [v1.1.7-beta.6] - 2026-05-07 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(nginx): parametrize backend domain via envsubst template (@ahmeetseker)

## [v1.1.7-beta.4] - 2026-05-07 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(top-ranking-category): 6 değişiklik (@ahmeetseker)
  - add Pagination component
  - add Grid component with rank badges and ratings
  - add Hero component reusing TopRankingFilters
  - add barrel export
  - add HTML entry
  - add page entry with Alpine data and assembly
- feat(homepage): link top-ranking cards to dedicated category page (@ahmeetseker)
- feat(products): remove inactive Karşılaştır checkbox from product cards (@ahmeetseker)
- feat(top-ranking): redirect category tabs and card headers to dedicated page (@ahmeetseker)
- feat: add spam category filtering, implement recent category tracking, and apply global touch-suppression utility classes (@ahmeetseker)

### Degistirildi
- refactor(top-ranking): remove flat mode (replaced by dedicated category page) (@ahmeetseker)

---

## [v1.1.7-beta.3] - 2026-05-06 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(kyb,dashboard): Storefront KYB sayfası + buyer dashboard widget + sidebar requireSeller; mesajlar/iletişim CTA'ları gizlendi (@aliiball)

---

## [v1.1.7-beta.2] - 2026-05-06 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)

---

## [v1.1.5] - 2026-04-29 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. refactor(product-card): MOQ i18n + kart sırası + Top Deals indirim gösterimi yapıldı. (@aliiball)

## [v1.1.4-rc.26] - 2026-04-29 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(settings,checkout): Three-step email change UI, EMAIL_NOT_VERIFIED handling, cart i18n (@aliiball)

## [v1.1.4-rc.25] - 2026-04-29 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Degistirildi
- refactor(theme,header): legacy section token'larını kaldır + destek bildirim akışı (@ahmeetseker)

---

## [v1.1.4-rc.24] - 2026-04-28 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(favorites,manufacturers): tedarikçi favorileri + Alibaba tarzı arama akışı (@ahmeetseker)

## [v1.1.4-rc.23] - 2026-04-27 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(legal,checkout): Mesafeli Satış + KVKK sayfaları ve MSY md.5 onay akışı (@ahmeetseker)

## [v1.1.4-rc.22] - 2026-04-21 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(notifications): destek talebi (dispute) bildirimleri "Destek" kategorisinde info toast olarak gosterilir (@ahmeetseker)
- feat(buyer-dashboard): right panel'e Destek Taleplerim kartı (açık + yanıt bekleyen sayıları + yeni talep CTA) (@ahmeetseker)
- feat(help-tickets): URL ?tab= parametresi ile dashboard kartından doğrudan açık/yanıt bekleyen tab'ına yönlendirme (@ahmeetseker)

## [v1.1.4-rc.21] - 2026-04-17 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)

## [v1.1.4-rc.18] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

---

## [v1.1.4-rc.16] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)

## [v1.1.4-rc.15] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)

## [v1.1.4-rc.12] - 2026-04-15 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)

---

## [v1.1.4-rc.11] - 2026-04-14 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)

## [v1.1.4-rc.8] - 2026-04-14 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)

## [v1.1.4-rc.7] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)

---

## [v1.1.4-rc.5] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)

---

## [v1.1.4-rc.2] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)

---

## [v1.1.4] - 2026-04-13 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@aliiball)
- feat(Search): 2 değişiklik (@aliiball)
  - Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı
  - Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı
- feat: alıcı adres defteri ve backend API entegrasyonu   - Adreslerim sayfası eklendi (dashboard/addresses.html): ekleme, düzenleme,     silme, varsayılan ayarlama; 10 adres limiti; il/ilçe kademeli dropdown   - Adres defteri checkout kargo adresi seçiciyle entegre edildi; iki sayfa     aynı tradehub_core.api.buyer storage'ını paylaşıyor   - Satıcıya özgü ödeme: ?suppliers= parametresi ürünleri, kalemleri ve     sipariş özetini yalnızca seçili satıcıya göre filtreliyor   - Oturum kalıcılığı düzeltildi (VITE_API_URL=/api Vite proxy üzerinden)   - Çıkış yapma düzeltildi (CSRF token alan frappeLogout kullanıldı)   - BuyerAddress tipi adresler ve checkout arasında birleştirildi; city/district/address_line karmaşası giderildi (artık state/city/street)   - Misafir adres migrasyonu: ilk girişte localStorage adresleri backend'e taşınıyor ve guest key temizleniyor (@boraydeger32)

### Duzeltildi
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@aliiball)

### Degistirildi
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) standart token referanslarına (--color-text-primary, --color-text-secondary)                                                      güncellendi                                                    - HeroSideBannerSlider ok butonlarından th-btn-outline kaldırılıp                                                          eksik transition/border/bg sınıfları düzeltildi (@ahmeetseker)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@ahmeetseker)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@ahmeetseker)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.)   görsel arama ile ilgili UI öğeleri yorum satırına alındı.   Özellik tamamen kaldırılmadı, ileride yeniden aktif edilebilir.     . (@ahmeetseker)

---

## [v1.1.3-rc.26] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(top-ranking): alt kategori seçiminde ana kategori tab'ı aktif hale getirildi. (@aliiball)

## [v1.1.3-rc.25] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(top-deals): Mağaza ön yüzüne “En İyi Fırsatlar” için arka uç iş akışı eklendi (@aliiball)

## [v1.1.3-rc.22] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(ci): prevent silent deploy failures with set -e and git reset (@ahmeetseker)

## [v1.1.3-rc.20] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@TurksabYonetim)

## [v1.1.3-rc.18] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Degistirildi
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---

## [v1.1.3-rc.17] - 2026-04-09 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Degistirildi
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)

---

## [v1.1.3-rc.16] - 2026-04-09 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)

### Duzeltildi
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)

## [v1.1.3-rc.13] - 2026-04-09 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Degistirildi
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)

---

## [v1.1.3-rc.11] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

## [v1.1.3-rc.10] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Degistirildi
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)

---

## [v1.1.3-rc.9] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)

---

## [v1.1.3-rc.7] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

---

## [v1.1.3-rc.6] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)

---

## [v1.1.3-rc.2] - 2026-04-07 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)

---

## [v1.1.3] - 2026-04-06 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@ahmeetseker)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@ahmeetseker)
- feat: apply red background color to login submit button (@ahmeetseker)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@ahmeetseker)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@ahmeetseker)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@ahmeetseker)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@ahmeetseker)

### Duzeltildi
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@ahmeetseker)
- fix: correct typo in deployment workflow name (@ahmeetseker)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@aliiball)
- fix: update auth-guard redirects to use dynamic base URL (@ahmeetseker)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@ahmeetseker)

---

## [v1.1.2-rc.10] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)

## [v1.1.2-rc.9] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)

## [v1.1.2-rc.8] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)

---

## [v1.1.2-rc.7] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)

## [v1.1.2-rc.6] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix: correct typo in deployment workflow name (@TurksabYonetim)

---

## [v1.1.2-rc.5] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)

---

## [v1.1.2-rc.4] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@aliiball)

---

## [v1.1.2-rc.3] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(RFQ): 2 değişiklik (@aliiball)
  - Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi.
  - Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor

## [v1.1.2-rc.2] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)

---

## [v1.1.2] - 2026-04-06 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat: export getCsrfToken function to retrieve current token or default value (@ahmeetseker)

---

## [v1.1.1-rc.2] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)

---

## [v1.1.0] - 2026-04-04 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@ahmeetseker)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo   güvencesi, vergi, üyelik vb.) ve ortak sayfa düzeni oluşturuldu. ve   FloatingPanel (yüzen menü/widget) — "Mesajlarım", "Görsel Arama", "En üste çık" butonları olan kısım güncellendi. (@ahmeetseker)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@ahmeetseker)

### Duzeltildi
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@ahmeetseker)

---

## [v1.0.1-rc.11] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@TurksabYonetim)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@TurksabYonetim)

## [v1.0.1-rc.10] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@aliiball)

---

## [v1.0.1-rc.8] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@TurksabYonetim)

## [v1.0.1-rc.7] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@TurksabYonetim)

## [v1.0.1-rc.6] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)

## [v1.0.1-rc.5] - 2026-04-02 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)

### Duzeltildi
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)

---

## [v1.0.1-rc.4] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@ahmeetseker)

---

## [v1.0.1-rc.3] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@ahmeetseker)

---

## [v1.0.1-rc.3] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(release): prod ve rc release iş akışları eklendi (@ahmeetseker)

---

## [v1.0.1-rc.2] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tracking): çerez onay yönetimi için CookieBanner ve TrackingManager eklendi (@ahmeetseker)

---
