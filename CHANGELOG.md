## [v1.1.8-beta.7] - 2026-05-12 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(reviews): review/Q&A storefront entegrasyonu + 4 kritik fix (@boraydeger32)
- feat(reviews): Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix (@boraydeger32)

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
- feat(chat): AttachmentToolbar with 7 sub-menu triggers (@ahmeetseker)
- feat(chat): BusinessCardForm sub-popup (@ahmeetseker)
- feat(chat): CallMenu sub-popup with video/voice/schedule (@ahmeetseker)
- feat(chat): ChatBubble — text/image/file/system variants (@ahmeetseker)
- feat(chat): ChatComposer with pinned product, toolbar, input and orange Gönder (@ahmeetseker)
- feat(chat): ChatHeader with optional back/expand/close buttons (@ahmeetseker)
- feat(chat): ChatMessages list with date labels and error state (@ahmeetseker)
- feat(chat): ContextMenu sub-popup with pin/block/delete/mute (@ahmeetseker)
- feat(chat): EmojiPicker sub-popup with 70 popular emojis (@ahmeetseker)
- feat(chat): OrderCard embedded order summary (@ahmeetseker)
- feat(chat): PhotoSourceMenu sub-popup (@ahmeetseker)
- feat(chat): PinnedProduct composer context strip (@ahmeetseker)
- feat(chat): QuickActionChips quick-action row (@ahmeetseker)
- feat(chat): SecurityBanner component (@ahmeetseker)
- feat(chat): add error/sending state and try-catch around service calls (@ahmeetseker)
- feat(chat): barrel export for chat-shared module (@ahmeetseker)
- feat(chat-popup): ChatPopup root container with overlay, expand mode and mobile tabs (@ahmeetseker)
- feat(chat-popup): InboxPanel — conversation list with tag labels and unread badge (@ahmeetseker)
- feat(chat-popup): MobileTabs (Sohbet / Mesajlar) for sm screens (@ahmeetseker)
- feat(chat-popup): barrel export (@ahmeetseker)
- feat(data): seed mock conversations and messages (@ahmeetseker)
- feat(i18n): add chat namespace keys (@ahmeetseker)
- feat(i18n): add chat.{emptyThread,orderCard,aria,toolbar,pending} keys (@ahmeetseker)
- feat(icons): add chat-popup lucide icons (@ahmeetseker)
- feat(product): add Sohbet et button in 50/50 grid with Sepete Ekle (@ahmeetseker)
- feat(product): wire Sohbet et click to chat-popup:open event with pinned product (@ahmeetseker)
- feat(product-detail): mount ChatPopup so it can be opened from this page (@ahmeetseker)
- feat(services): add chat service stub with mock-data promises (@ahmeetseker)
- feat(theme): add orange palette tokens for chat composer (@ahmeetseker)
- feat(types): define chat conversation/message interfaces (@ahmeetseker)
- feat(utils): ref-counted scrollLock; use it in chat popup open/close (@ahmeetseker)

### Duzeltildi
- fix(chat): BusinessCardForm Edit/Send buttons close submenu (stub) (@ahmeetseker)
- fix(chat): BusinessCardForm uses i18n placeholders (no leaked identity) (@ahmeetseker)
- fix(chat): CallMenu renders activeConversation avatar when present (@ahmeetseker)
- fix(chat): Shift+Enter must insert newline (move .prevent inside conditional) (@ahmeetseker)
- fix(chat): add aria-label to composer textarea (@ahmeetseker)
- fix(chat): clean up window/document listeners in chatPopupRoot destroy() (@ahmeetseker)
- fix(chat): flatten body-type dispatch, right-align order cards, lucide file icon, i18n labels (@ahmeetseker)
- fix(chat): i18n aria-labels and toolbar button labels (@ahmeetseker)
- fix(chat): resolve conversation by sellerId via chatService (no more first-conv fallback) (@ahmeetseker)
- fix(chat-popup): make chat section relative so ContextMenu anchors correctly (@ahmeetseker)
- fix(chat-popup): mark inbox avatar img as decorative (alt="") (@ahmeetseker)
- fix(product): use existing .th-btn-outline for Sohbet et (theme parity) (@ahmeetseker)

### Degistirildi
- refactor(chat): drop dead || "" fallback in appendDraft (@ahmeetseker)
- refactor(chat): promote Tab type to types/chat.ts as ChatTab (@ahmeetseker)
- refactor(chat): split localTime into localTimeHHMM primitive (i18n boundary) (@ahmeetseker)
- refactor(chat-popup): drop dead 'pinned: ""' entry from tag lookup (@ahmeetseker)
- refactor(chat-popup): lift click handler to initChatTriggers() shared module (@ahmeetseker)

---
## [v1.1.8-beta.3] - 2026-05-11 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat(faq): faqPage Alpine data'ya search helper'ları eklendi (@ahmeetseker)
- feat(orders): detay panel için tab/ürün state'i ekle (@ahmeetseker)
- feat(faq): search bar yeniden tasarlandı (@ahmeetseker)
- feat(faq): eşleşme vurgusu + sidebar inline style refactor (@ahmeetseker)
- feat(orders): ürünler kartını ilk-5 + scroll'lu hibrit yapıya çevir (@ahmeetseker)
- feat(header-notice): add storefront service with localStorage cache (@ahmeetseker)
- feat(header-notice): add HeaderNotice marquee component (@ahmeetseker)
- feat(orders): boxed tab container + Kargo paneli + i18n tab etiketleri (@ahmeetseker)
- feat(orders): Ödeme detaylarını tab paneline taşı (@ahmeetseker)
- feat(header-notice): integrate notice render into TopBar (@ahmeetseker)
- feat(orders): Tedarikçi detaylarını tab paneline taşı (@ahmeetseker)
- feat(header-notice): call initHeaderNotice in main bootstrap (@ahmeetseker)
- feat(header-notice): suppress notice on payment/payments/orders pages (@ahmeetseker)
- feat(help-center): "Bize Ulaşın" 4'lü kart bloğu kaldırıldı (@ahmeetseker)
- feat(header-notice): remove icon rendering from storefront marquee (@ahmeetseker)
- feat(header-notice): add slide display mode and per-notice background color (@ahmeetseker)
- feat(orders): replace per-order item list with thumbnail strip + drawer (@ahmeetseker)

### Duzeltildi
- fix(faq): focus-within koyu drop-shadow kaldırıldı (@ahmeetseker)
- fix(faq): siyah çizgi sorunu — border yerine ring, input focus-visible suppress (@ahmeetseker)
- fix(orders): stepper label'larını 320px'te wrap edilebilir yap (@ahmeetseker)
- fix(orders): a11y polish on items drawer (focus on open, aria-labels) (@ahmeetseker)
- fix(orders): correct remittance event name and add aria-haspopup on drawer triggers (@ahmeetseker)
- fix(orders): card spacing, remove link underline, drawer sort UX (@ahmeetseker)
- fix(orders): symmetric card header (B layout) (@ahmeetseker)
- fix(orders): remove confusing left sort icon in drawer (keep only chevron) (@ahmeetseker)
- fix(orders): prevent hover/active layout shift on link-style buttons (@ahmeetseker)
- fix(orders): remove all hover state changes on link-style buttons (@ahmeetseker)
- fix(orders): use native select arrow only (remove custom chevron — fixes double arrow) (@ahmeetseker)
- fix(orders): override global :focus-visible outline on link-style buttons (@ahmeetseker)

### Degistirildi
- refactor(orders): parsePrice'ı module scope'a taşı (@ahmeetseker)
- refactor(orders): ürünler kartı için helpers + i18n çekimi (@ahmeetseker)
- refactor(faq): submit butonu projenin th-btn standardına geçti (@ahmeetseker)
- refactor(orders): extract order card into OrderListItem component (@ahmeetseker)

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
- feat(top-ranking-category): add Pagination component (@ahmeetseker)
- feat(top-ranking-category): add Grid component with rank badges and ratings (@ahmeetseker)
- feat(top-ranking-category): add Hero component reusing TopRankingFilters (@ahmeetseker)
- feat(top-ranking-category): add barrel export (@ahmeetseker)
- feat(top-ranking-category): add HTML entry (@ahmeetseker)
- feat(top-ranking-category): add page entry with Alpine data and assembly (@ahmeetseker)
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
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@aliiball)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@aliiball)
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
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@aliiball)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@aliiball)

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
