## [Belgelenmemis Ozellikler — Gelistirme Sureci Ozeti] - 2026-05-08

Bu bolum, gelistirme surecinde koda eklenmis ancak onceki surum changelog'larinda
yer almayan ya da tek satir kuru bir feat/fix mesaji olarak gecistirilmis ozellikleri
detayli sekilde listeler. Her madde; etkilenen sayfa/komponent, ne yaptigi ve teknik
kapsami ile birlikte yazilmistir. Surum bolumlerine dokunulmamistir; bu bolum kod
incelemesi ile cikartilmis bir tamamlama notudur (PR #80, #82, #83 ve PR #77'in detay
dokumantasyonu burada toplanmistir).

### Eklendi (Belgelenmemis)

- feat(seller-trust): "Onaylanmis Satici" rozeti KYB Verified akisina baglandi ve uretim
  capacity'sine gore 3 katmanli sipariş gate kuruldu (Visitor/Buyer/Verified) — `FilterSidebar`'da
  yeni "Tedarikci Turleri > Onaylanmis Satici" checkbox'i, `filterEngine`'de `min_order` +
  `verifiedSupplier` + sertifika filtreleri URL <-> state <-> checkbox uc yonlu senkron;
  `ProductInfo`/`ProductTitleBar`'da hardcoded "Verified Multispecialty Supplier" metinleri
  silinerek `seller.is_verified` + `kyb_status` ortak hesaplamasiyla degistirildi;
  `business_type` icin `country.ts`'e localize fonksiyon eklendi, "MOQ" kisaltmasi
  Turkce arayuzde "MSA"ya cevrildi; bayrak ikonu artik `seller.country` koduna gore
  dinamik. Etkilenen 12+ komponent: ProductTitleBar, CompanyProfile, MobileLayout,
  CompanyInfo, CompanyIntroduction, StoreHeader, seller-shop, ManufacturerList,
  FavoritesLayout, TailoredProductGrid, SupplierCard, HorizontalCategoryBar. (@aliiball, PR #82)

- feat(seller): Backend `media_groups` storefront entegrasyonu — `alpine/seller.ts`
  icine `mediaGroups` computed property eklendi (kullaniciya gosterilmeyecek bos
  kategoriler kirpilir, Alpine scope inheritance sayesinde inner `x-data` bloklari
  da erisebilir); `StoreHeader`'da hardcoded `picsum` thumbnail'leri silindi, yerine
  backend'den gelen kategori segmentleri tab + thumbnail grid olarak basildi
  (2+ kategori varsa tab gorunur, 2+ medya varsa grid acilir); video icin poster
  yoksa `<video #t=0.5>` + `preload=metadata` fallback ile ilk frame'den thumbnail
  uretilir; `CompanyProfile`'dan kullanilmayan "service" tab'i kaldirildi. (@bora, PR #83)

- feat(top-ranking-category): Yeni `pages/top-ranking-category.html` adanmis kategori
  Top 100 sayfasi — tek bir kategori icin sira rozetleri (1-50/51-100), urun rating'i
  ve klasik sayfalama gosterir; URL parametreleri `?cat=&sort=&page=` uzerinden state
  saklanir, `searchListings(category, sort_by, page_size=50)` ile besleniyor; sira
  numarasi `(page - 1) * 50 + index + 1` formuluyle hesaplanir; `top-ranking-category/`
  altinda Hero (mevcut `TopRankingFilters`'i yeniden kullanir), Grid (rank badge'leri
  + yildiz gosterimi), Pagination, barrel export ve HTML/JS entry; Alpine module
  `init()` icinde fetch + URL pushState yonetimi. Homepage `top-ranking` kart
  basliklari ve kategori tab'lari artik bu adanmis sayfaya yonleniyor; `top-ranking`'in
  eski "flat mode"u kaldirildi. (@ahmeetseker, PR #78)

- feat(checkout): `BillingInfoSection` — fatura bilgisi yeni bir checkout bolumu olarak
  eklendi. Acikken: Bireysel/Sirket toggle'i, VKN/TCKN otomatik secimi, "Teslimat adresi
  ile ayni" checkbox'i, e-fatura mukellefi mi soru pill'i, sehir/ilce/adres alanlari;
  kapaliyken tek satir summary metni gosterir. Alpine modulu `billingForm`
  (`alpine/checkout.ts`, +253 satir) form state, validation, mukellef sorgusu ve
  adres senkronizasyonunu yonetir. `cartService.placeOrder` payload'una billing
  alanlari eklendi. (@ahmeetseker, PR #77)

- feat(checkout): `OrderProtectionModal` ve `OrderReviewModal` componentleri eklendi
  (alici siparis koruma akisi ve son onay ekrani); `PaymentMethodSection` 3D Secure
  toggle ve kart radyolarini Tailwind utility class'lariyla yeniden yazildi. (@ahmeetseker, PR #77)

- feat(cart): Atomic Design klasor yapisina gore yeniden organize edildi
  (`cart/atoms/`, `cart/molecules/`, `cart/organisms/`, `cart/overlay/`, `cart/page/`,
  `cart/state/`); `Checkbox`, `PriceDisplay`, `QuantityInput` atoms; `BatchSelectBar`,
  `ProductItem`, `SkuRow` molecules; `BuffTaskArrow`, `CartHeader`, `SupplierCard`
  organisms; `SharedCartDrawer` overlay; `CartPage`, `CartSummary` page; `CartStore`
  state singleton. Sepet artik DOM source-of-truth degil; `CartStore` localStorage
  + listener pattern ile tek noktadan yonetir. (@ahmeetseker, PR #77)

- feat(cart): SKU matrisinden birim fiyat hesaplama — `getSkuPriceForSize` ile sepet
  drawer'inda renk + beden + ek ozellik kombinasyonuna gore `skuMatrix`'ten birim
  fiyat aranir; uygun SKU yoksa beden seviyesindeki `rawPrice`'a, o da yoksa aktif
  fiyata duser. (@bora, PR #76)

- feat(products): "Stokta yok" rozeti — urun listesi kartlarinda gri overlay + devre
  disi sepete ekle butonu; urun detay sayfasinda "Hazir" badge'i listing seviyesindeki
  `outOfStock` bayragina saygi gosterir; `ProductDetail`/`ProductListingCard` tiplerine
  `outOfStock`, `status`, `inStock`, `stockQty` alanlari eklendi; `listingService`
  mapping'lerine baglandi; TR/EN locale'lara `products.outOfStock` string'i. (@bora, PR #76)

- feat(notifications): Toast spam onleyici akis — `alpine/notifications.ts` ilk poll'da
  toast atmaz, sadece `server_time`'i kaydeder (sayfa acilisinda birikmis bildirimleri
  bos veriye yansitmamak icin); ardisik 5 hata sonrasi `permanent stop` yerine 5dk
  recovery backoff devreye giriyor; `isSafeActionUrl` ile yalnizca relative `/...`
  veya `https://` baslayan URL'lere yonlendirme yapiliyor; dispute toast turu
  `info` -> `warning` olarak hizalandi; `?mark_as_read=1` parametresi backend'den
  kaldirildi (drawer kontrollu okuma). (@bora, PR #83)

- feat(buyer-dashboard): KYB Status Widget — `KybStatusWidget` buyer dashboard'a
  gomulu kart olarak eklendi; yalniz `is_seller=true` veya `pending_seller_application`
  kullanicilarinda render edilir, diger kullanicilar icin silent fail; status'a gore
  shield-check / alert icon + Verified/Pending/Rejected/Expired badge ve "Yeniden
  Gonder" CTA gosterir. (@aliiball, PR #79)

- feat(kyb): Storefront `pages/dashboard/kyb.html` ve `KybLayout` componenti — 6
  belge yukleme akisi (kimlik, imza sirkuleri, ticaret sicil gazetesi, faaliyet
  belgesi, vergi levhasi, banka hesap belgesi); Reject/Expired durumlarda "Yeniden
  Gonder" akisi, status badge'leri, hata mesajlari; `alpine/kyb.ts` Alpine state
  modulu form yonetimi ve dosya validasyonu icin; sidebar `SidebarMenuItem`'a
  `requireSeller` flag'i eklendi, `Sidebar.isItemVisible` filtresi KYB item'inin
  sadece satici/basvuru bekleyenlerde gorunmesini sagliyor; `dashboard.kybVerification`
  + `kyb.*` paneli i18n key'leri (TR/EN, ~20+ string). (@aliiball, PR #79)

- feat(buyer-dashboard): `SupportTicketsCard` — buyer dashboard sag panelde Destek
  Taleplerim karti; acik talep sayisi + yanit bekleyen talep sayisi + yeni talep
  CTA; URL `?tab=` parametresi ile dashboard kartindan dogrudan acik/yanit-bekleyen
  tab'ina yonlendirme. (@ahmeetseker, v1.1.4-rc.22 onceden eklendi ama detayi yok)

- feat(home): "Sizin icin kategoriler" personalization sinyali — yeni `recentCategories`
  utility (`src/utils/recentCategories.ts`) localStorage tabanli son ziyaret edilen
  kategori listesi tutar; FIFO, max 12 kayit, anonim ve giris yapmis kullanicilar
  icin ayni kaynak; her kategori sayfasi acildiginda otomatik kayit; homepage'de
  oneri panelinin besleyicisi olarak kullanilir. (@ahmeetseker, PR #78)

- feat(category): Spam/test kategori filtreleme — `categoryService` icine `isSpamCategory`
  filtre fonksiyonu eklendi; "test", "test-x", "test_x" prefix'i, bilinen spam isimler,
  1-6 harfli klavye spam'i (orn. "dasdas", "adsf", "asdfsa") regex ile ayiklanir;
  backend cleanup yapilana kadar gecici filtre olarak isaretli. (@ahmeetseker, PR #78)

- feat(ux): Global `touch-suppression` utility class'lari — mobil cihazlarda
  ghost-tap ve scroll sirasinda istemsiz `:hover` state'lerini bastirmak icin
  `@media (hover: hover)` query'leriyle conditional pseudo state'ler `style.css`'e
  eklendi; `CategoryBrowse`, `CartHeader`, `ProductImageGallery`, `AttributesTabContent`
  gibi yogun temas alan komponentlere uygulandi. (@ahmeetseker, PR #78)

- feat(shared): `TradeAssuranceBadge` componenti — odeme/checkout/cart bolumlerinde
  tekrar kullanilan TAS rozeti (icon + i18n metin); `payments`, `refund-policy`,
  `ShippingLogisticsPage`, `AfterSalesPage` sayfalarinda inline tekrar yerine ortak
  parca olarak kullanilir. (@ahmeetseker, PR #77)

- feat(icons): `lucideIcons.ts` modulu — `lucide-static`'tan ham SVG dosyalarini
  `?raw` import ile aliyor, kategori isimlerini tanimlayici ikonlara esliyor;
  tree-shake edilebilir (kullanilmayan ikon final bundle'a girmez); kategori
  klavyesinde kullaniliyor. (@ahmeetseker, PR #77)

- feat(ui): `utils/ui/button.ts` — ortak buton class helper'i; `btn({ variant, size })`
  call'i ile `style.css` `.th-btn-*` ailesine baglanan class string'i doner;
  variant: primary/outline/dark/success, size: sm/md/lg; admin panel "Tradehub Theme
  Settings" buton CSS variable'lari (`--btn-bg`, `--radius-button`, `--spacing-button-x/y`)
  ile entegre. (@ahmeetseker, PR #77)

- feat(header): TopBar'in tamami yeniden yazildi (+415 satir) — sticky scroll davranisi,
  arama bar genisleme animasyonu, mobil drawer entegrasyonu, kategori popover, dil/para
  birimi/sepet ikonlari yeni Lucide ikonlariyla; mega menu (`MegaMenu.ts` +312 satir)
  re-layout edildi: 3 sutunlu kategori grid'i, hover delay'i, klavye navigasyonu.
  (@ahmeetseker, PR #77)

- feat(types): `cart.is_sample` alani eklendi (numune satirlari); `cartService`
  numune satiri payload'i + fatura payload'i destekleri; `RankedProduct` tipi
  `rank: number` ve rating alanlariyla genisletildi. (@ahmeetseker, PR #77 / PR #78)

### Duzeltildi (Belgelenmemis)

- fix(checkout-address): "Adres akisinda 9 bug" toplu duzeltmesi — Duzenle butonu
  artik update yapiyor (onceden her zaman yeni kayit aciyordu); `buyerAddressToCheckout`
  mapping'i artik `company` ve `note` alanlarini kaybetmiyor; `fillMainFormFromAddress`
  Sirket Adi input'unu da dolduruyor; `submitAddAddress` validation'ina company +
  telefon format kontrolu eklendi (`validatePhone` + `normalizePhone`); `setDefaultAddress`
  silent error swallow yerine alert + local state geri alma; `delete_address` artik
  backend'in dondugu `default_id`'yi kullaniyor (frontend `_ensure_one_default`
  invariant drift onlendi); telefon normalize tutarsizligi giderildi (checkout artik
  `normalizePhone`'dan gecmis veriyi gonderiyor); 2 paralel `handleSubmit` /
  `submitAddAddress` save akisi (~150 satir tekrar) `_persistAddress(candidate, isEdit, prev)`
  ortak helper'inda birlestirildi (optimistic insert/replace + canonical replace +
  rollback); `ShippingAddressForm.ts` modal'ina zorunlu "Sirket Adi" alani eklendi;
  `cartService.deleteAddressApi` return type `{success, default_id}`; TR/EN locale'lara
  `checkout.companyName` eklendi. (@bora, PR #80)

- fix(seller-link): Storefront linki query parametre adi `?id=` -> `?seller=`
  olarak duzeltildi (backend'in bekledigi parametre adi ile hizalama, link tiklayinca
  404 sorunu giderildi); `listingService.mapListingDetail` icin `supplier.id`
  oncelikli olarak `sellerCode`'u kullanir hale getirildi; `CompanyProfile`'in
  `ReviewsTab`'i `Promise.all` + `try/catch` yerine `safeFetch` wrapper kullaniyor —
  endpoint'lerden biri 401/500 dondugunde digerleri kaybolmuyor, her biri bagimsiz
  null'a dusuyor. (@bora, v1.1.4-rc.27)

- fix(nginx): `nginx.conf` icindeki hardcoded `rcistoc.cronbi.com` beta deploy'larinda
  API trafigini yanlis backend'e yonlendiriyordu (VITE build arg'leri sadece client
  JS'i etkiliyordu, nginx `proxy_pass`'i degil). `nginx.conf` -> `nginx.conf.template`
  olarak yeniden yazildi; `${BACKEND_DOMAIN}` ve `${FRONTEND_DOMAIN}` placeholder'lari
  envsubst ile container baslatilirken doldurulur; `NGINX_ENVSUBST_FILTER` ile sadece
  bu iki degisken substitute edilir (nginx'in kendi `$remote_addr`/`$http_origin`
  korunur); default ENV `rcistoc/rc.istoc.com` kalir, beta compose iki ENV'i
  override eder. (@ahmeetseker, PR #81)

- fix(top-ranking-category): Mobil cihazlarda kart layout'u sikistirildi, responsive
  grid breakpoint'leri pürüzsüzlestirildi (gap, padding ve column count yeniden
  ayarlandi). (@ahmeetseker, polish commit e9383bc)

### Degistirildi (Belgelenmemis)

- refactor(currency): Sayfalardaki manuel string interpolasyonu (`"₺" + price.toFixed(2)`
  vb.) standart `formatCurrency(value)` utility cagrilariyla degistirildi; baslangic
  `alpine/checkout.ts` ve `ItemsDeliverySection.ts` icin yapildi, sonraki PR'larda
  digerlerine genisletilecek. (@ahmeetseker, PR #81)

- refactor(top-ranking): Eski "flat mode" kaldirildi — `top-ranking` sayfasi artik
  category secince adanmis `top-ranking-category` sayfasina yonleniyor; eski tum-100
  flat liste mode'u silindi (kod azaltma + tek kaynak veri akisi). (@ahmeetseker, PR #78)

- refactor(products): Inactive "Karsilastir" checkbox'i urun kartlarindan kaldirildi
  (backend karsilastirma feature yok, UI yanlis beklenti yaratiyordu). (@ahmeetseker, PR #78)

- refactor(filters): UI'dan kaldirilan filtre bolumleri (backend implementasyonu yok):
  Trade Assurance, Verified Supplier, Store Reviews, Paid Samples — `FilterSidebar`
  ve `filterEngine` icindeki bu bolumler temizlendi; ileride backend hazirlandiginda
  geri eklenmek uzere git history'sinde mevcut. (@aliiball, PR #82 + onceki PR'lar)

- refactor(messaging): Mesaj/iletisim CTA'lari frontend'den gizlendi (backend chat
  altyapisi olmadigindan): `TopBar` ve `CheckoutMinimalHeader` user-menu'sundeki
  "Mesajlarim" `<li>`'leri yorum satirina alindi; `FavoritesLayout` supplier card
  "Iletisime gec" + Orders "Saticiyla iletisim" linkleri devre disi; `Sidebar`
  messages parent + alt menu yorum, yerine standalone "RFQ Talepleri" item'i.
  Backend hazirlandiginda blok aynen geri acilacak. (@aliiball, PR #79)

### Notlar

- **Eksik footer sayfalari:** Footer'da yer alan bazi linklerin henuz adanmis sayfasi
  olmayabilir; mobil uygulama indirme bolumunde de placeholder kullaniliyor. Backend
  ve icerik hazirligi tamamlandiginda sayfalar acilacak.
- **Yorum satiri / hidden CTA'lar:** Mesajlasma, "Iletisime gec", canli destek gibi
  CTA'lar HTML'de yorum satirina alinarak korundu; backend chat servisi devreye
  girince yorum satirlari kaldirilacak.

---
## [v1.1.7-beta.9] - 2026-05-08 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)
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
- feat(kyb,dashboard): Storefront KYB sayfası + buyer dashboard widget + sidebar requireSeller; mesajlar/iletişim CTA'ları gizlendi (@aliiball)
- feat(seller-trust): "Onaylanmış Satıcı" rozetini KYB Verified ile birleştir + 3-katmanlı sipariş gate (@aliiball)

### Duzeltildi
- fix(nginx): parametrize backend domain via envsubst template (@ahmeetseker)

### Degistirildi
- refactor(top-ranking): remove flat mode (replaced by dedicated category page) (@ahmeetseker)
- refactor: standardize currency formatting by replacing manual string interpolation with formatCurrency utility (@ahmeetseker)

---
## [v1.1.7-beta.8] - 2026-05-08 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)
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
- feat(kyb,dashboard): Storefront KYB sayfası + buyer dashboard widget + sidebar requireSeller; mesajlar/iletişim CTA'ları gizlendi (@aliiball)
- feat(seller-trust): "Onaylanmış Satıcı" rozetini KYB Verified ile birleştir + 3-katmanlı sipariş gate (@aliiball)

### Duzeltildi
- fix(nginx): parametrize backend domain via envsubst template (@ahmeetseker)

### Degistirildi
- refactor(top-ranking): remove flat mode (replaced by dedicated category page) (@ahmeetseker)
- refactor: standardize currency formatting by replacing manual string interpolation with formatCurrency utility (@ahmeetseker)

---
## [v1.1.7-beta.7] - 2026-05-07 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)
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
- feat(kyb,dashboard): Storefront KYB sayfası + buyer dashboard widget + sidebar requireSeller; mesajlar/iletişim CTA'ları gizlendi (@aliiball)

### Duzeltildi
- fix(nginx): parametrize backend domain via envsubst template (@ahmeetseker)

### Degistirildi
- refactor(top-ranking): remove flat mode (replaced by dedicated category page) (@ahmeetseker)
- refactor: standardize currency formatting by replacing manual string interpolation with formatCurrency utility (@ahmeetseker)

---
## [v1.1.7-beta.6] - 2026-05-07 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)
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
- feat(kyb,dashboard): Storefront KYB sayfası + buyer dashboard widget + sidebar requireSeller; mesajlar/iletişim CTA'ları gizlendi (@aliiball)

### Duzeltildi
- fix(nginx): parametrize backend domain via envsubst template (@ahmeetseker)

### Degistirildi
- refactor(top-ranking): remove flat mode (replaced by dedicated category page) (@ahmeetseker)

---
## [v1.1.7-beta.5] - 2026-05-07 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)
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
- feat(kyb,dashboard): Storefront KYB sayfası + buyer dashboard widget + sidebar requireSeller; mesajlar/iletişim CTA'ları gizlendi (@aliiball)

### Degistirildi
- refactor(top-ranking): remove flat mode (replaced by dedicated category page) (@ahmeetseker)

---
## [v1.1.7-beta.4] - 2026-05-07 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)
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
- feat(kyb,dashboard): Storefront KYB sayfası + buyer dashboard widget + sidebar requireSeller; mesajlar/iletişim CTA'ları gizlendi (@aliiball)

### Degistirildi
- refactor(top-ranking): remove flat mode (replaced by dedicated category page) (@ahmeetseker)

---
## [v1.1.7-beta.3] - 2026-05-06 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)
- feat(kyb,dashboard): Storefront KYB sayfası + buyer dashboard widget + sidebar requireSeller; mesajlar/iletişim CTA'ları gizlendi (@aliiball)

---
## [v1.1.7-beta.2] - 2026-05-06 BETA

Bu surum beta.istoc.com'da test asamasindadir.

### Eklendi
- feat: cart + checkout redesign, fatura bilgisi bölümü, header & megamenü revizyonu (@ahmeetseker)

---
## [v1.1.7-beta.1] - 2026-05-05 BETA

Bu surum beta.istoc.com'da test asamasindadir.

---
## [v1.1.7] - 2026-04-30 PROD

Bu surum istoc.com'da yayindadir.

---
## [v1.1.6-rc.1] - 2026-04-30 RC

Bu surum rc.istoc.com'da onay asamasindadir.

---
## [v1.1.6-beta.1] - 2026-04-30 BETA

Bu surum beta.istoc.com'da test asamasindadir.

---
## [v1.1.6] - 2026-04-30 PROD

Bu surum istoc.com'da yayindadir.

---
## [v1.1.5-rc.2] - 2026-04-30 RC

Bu surum rc.istoc.com'da onay asamasindadir.

---
## [v1.1.5-beta.2] - 2026-04-30 BETA

Bu surum beta.istoc.com'da test asamasindadir.

---
## [v1.1.5-beta.1] - 2026-04-30 BETA

Bu surum beta.istoc.com'da test asamasindadir.

---
## [v1.1.5-rc.1] - 2026-04-29 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.1.5] - 2026-04-29 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(settings,checkout): Three-step email change UI, EMAIL_NOT_VERIFIED handling, cart i18n (@aliiball)
- feat(favorites,manufacturers): tedarikçi favorileri + Alibaba tarzı arama akışı (@ahmeetseker)
- feat(legal,checkout): Mesafeli Satış + KVKK sayfaları ve MSY md.5 onay akışı (@ahmeetseker)
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. refactor(product-card): MOQ i18n + kart sırası + Top Deals indirim gösterimi yapıldı. (@aliiball)
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)

### Duzeltildi
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)

### Degistirildi
- refactor(theme,header): legacy section token'larını kaldır + destek bildirim akışı (@ahmeetseker)

---
## [v1.1.4-rc.27] - 2026-04-29 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)
- feat(legal,checkout): Mesafeli Satış + KVKK sayfaları ve MSY md.5 onay akışı (@ahmeetseker)
- feat(favorites,manufacturers): tedarikçi favorileri + Alibaba tarzı arama akışı (@ahmeetseker)
- feat(settings,checkout): Three-step email change UI, EMAIL_NOT_VERIFIED handling, cart i18n (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

### Degistirildi
- refactor(theme,header): legacy section token'larını kaldır + destek bildirim akışı (@ahmeetseker)

---
## [v1.1.4-rc.26] - 2026-04-29 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)
- feat(legal,checkout): Mesafeli Satış + KVKK sayfaları ve MSY md.5 onay akışı (@ahmeetseker)
- feat(favorites,manufacturers): tedarikçi favorileri + Alibaba tarzı arama akışı (@ahmeetseker)
- feat(settings,checkout): Three-step email change UI, EMAIL_NOT_VERIFIED handling, cart i18n (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

### Degistirildi
- refactor(theme,header): legacy section token'larını kaldır + destek bildirim akışı (@ahmeetseker)

---
## [v1.1.4-rc.25] - 2026-04-29 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)
- feat(legal,checkout): Mesafeli Satış + KVKK sayfaları ve MSY md.5 onay akışı (@ahmeetseker)
- feat(favorites,manufacturers): tedarikçi favorileri + Alibaba tarzı arama akışı (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

### Degistirildi
- refactor(theme,header): legacy section token'larını kaldır + destek bildirim akışı (@ahmeetseker)

---
## [v1.1.4-rc.24] - 2026-04-28 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)
- feat(legal,checkout): Mesafeli Satış + KVKK sayfaları ve MSY md.5 onay akışı (@ahmeetseker)
- feat(favorites,manufacturers): tedarikçi favorileri + Alibaba tarzı arama akışı (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

---
## [v1.1.4-rc.23] - 2026-04-27 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)
- feat(legal,checkout): Mesafeli Satış + KVKK sayfaları ve MSY md.5 onay akışı (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

---
## [v1.1.4-rc.22] - 2026-04-21 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)
- feat(notifications): destek talebi (dispute) bildirimleri "Destek" kategorisinde info toast olarak gosterilir (@ahmeetseker)
- feat(buyer-dashboard): right panel'e Destek Taleplerim kartı (açık + yanıt bekleyen sayıları + yeni talep CTA) (@ahmeetseker)
- feat(help-tickets): URL ?tab= parametresi ile dashboard kartından doğrudan açık/yanıt bekleyen tab'ına yönlendirme (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

---
## [v1.1.4-rc.21] - 2026-04-17 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)
- feat(help-center): ticket kategori secimi + dosya ek yukleme + satici cikar catismasi onlemi (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

---
## [v1.1.4-rc.20] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

---
## [v1.1.4-rc.19] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

---
## [v1.1.4-rc.18] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)
- fix(auth,orders): stale CSRF retry, legacy URL yönlendirmesi ve sipariş sayfası sadeleştirmesi (@ahmeetseker)

---
## [v1.1.4-rc.17] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)

---
## [v1.1.4-rc.16] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)
- feat(currency): Para birimi dropdown ve kur verileri dinamik hale getirildi. (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)

---
## [v1.1.4-rc.15] - 2026-04-16 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)
- feat(help-center): talep oluşturma/listeleme login zorunlu (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)

---
## [v1.1.4-rc.14] - 2026-04-15 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)

---
## [v1.1.4-rc.13] - 2026-04-15 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)

---
## [v1.1.4-rc.12] - 2026-04-15 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)
- fix: implement CSRF token rotation retry logic and clear cache on login to prevent 403 errors (@ahmeetseker)

---
## [v1.1.4-rc.11] - 2026-04-14 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)
- feat(help-center): destek talep sistemi gerçek API'ya bağlandı (@ahmeetseker)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)

---
## [v1.1.4-rc.10] - 2026-04-14 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)

---
## [v1.1.4-rc.9] - 2026-04-14 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)

---
## [v1.1.4-rc.8] - 2026-04-14 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)
- feat(product-detail): İlgili Ürünler 4-tab section'ı (Benzer/İkame/Tamamlayıcı/Aksesuar) (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)

---
## [v1.1.4-rc.7] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)

### Duzeltildi
- fix(tailored-hero): Coverflow+loop atlamalarını rewind ile çözüldü. (@aliiball)

---
## [v1.1.4-rc.6] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)

---
## [v1.1.4-rc.5] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)
- feat(tailored): Detay sayfası hero carousel'i API'ye bağla + SPA davranışı yapıldı. (@aliiball)

---
## [v1.1.4-rc.4] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)

---
## [v1.1.4-rc.3] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)

---
## [v1.1.4-rc.2] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tailored): "Size Özel Seçimler" landing bloğu ve detay sayfası API'ye bağlandı. (@aliiball)

---
## [v1.1.4-rc.1] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.1.4] - 2026-04-13 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat(top-deals): Mağaza ön yüzüne “En İyi Fırsatlar” için arka uç iş akışı eklendi (@aliiball)
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@Ali)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@Ali)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@Ali)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@Ali)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@Ali)
- feat: alıcı adres defteri ve backend API entegrasyonu   - Adreslerim sayfası eklendi (dashboard/addresses.html): ekleme, düzenleme,     silme, varsayılan ayarlama; 10 adres limiti; il/ilçe kademeli dropdown   - Adres defteri checkout kargo adresi seçiciyle entegre edildi; iki sayfa     aynı tradehub_core.api.buyer storage'ını paylaşıyor   - Satıcıya özgü ödeme: ?suppliers= parametresi ürünleri, kalemleri ve     sipariş özetini yalnızca seçili satıcıya göre filtreliyor   - Oturum kalıcılığı düzeltildi (VITE_API_URL=/api Vite proxy üzerinden)   - Çıkış yapma düzeltildi (CSRF token alan frappeLogout kullanıldı)   - BuyerAddress tipi adresler ve checkout arasında birleştirildi; city/district/address_line karmaşası giderildi (artık state/city/street)   - Misafir adres migrasyonu: ilk girişte localStorage adresleri backend'e taşınıyor ve guest key temizleniyor (@Bora)
- feat: alıcı adres defteri ve backend API entegrasyonu   - Adreslerim sayfası eklendi (dashboard/addresses.html): ekleme, düzenleme,     silme, varsayılan ayarlama; 10 adres limiti; il/ilçe kademeli dropdown   - Adres defteri checkout kargo adresi seçiciyle entegre edildi; iki sayfa     aynı tradehub_core.api.buyer storage'ını paylaşıyor   - Satıcıya özgü ödeme: ?suppliers= parametresi ürünleri, kalemleri ve     sipariş özetini yalnızca seçili satıcıya göre filtreliyor   - Oturum kalıcılığı düzeltildi (VITE_API_URL=/api Vite proxy üzerinden)   - Çıkış yapma düzeltildi (CSRF token alan frappeLogout kullanıldı)   - BuyerAddress tipi adresler ve checkout arasında birleştirildi; city/district/address_line karmaşası giderildi (artık state/city/street)   - Misafir adres migrasyonu: ilk girişte localStorage adresleri backend'e taşınıyor ve guest key temizleniyor (@Bora)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@ahmet)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@ahmet)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat: apply red background color to login submit button (@ahmet)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@ahmet)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@ahmet)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@ahmet)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@ahmet)
- feat: export getCsrfToken function to retrieve current token or default value (@ahmet)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@Bora)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@Bora)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@Bora)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@Bora)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@ahmet)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo   güvencesi, vergi, üyelik vb.) ve ortak sayfa düzeni oluşturuldu. ve   FloatingPanel (yüzen menü/widget) — "Mesajlarım", "Görsel Arama", "En üste çık" butonları olan kısım güncellendi. (@ahmet)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@ahmet)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@ahmet)
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@ahmet)

### Duzeltildi
- fix(top-ranking): alt kategori seçiminde ana kategori tab'ı aktif hale getirildi. (@aliiball)
- fix(ci): prevent silent deploy failures with set -e and git reset (@ahmeetseker)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@Ali)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@Ali)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@Bora)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@Bora)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@ahmet)
- fix: correct typo in deployment workflow name (@ahmet)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@Ali)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix: update auth-guard redirects to use dynamic base URL (@ahmet)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@ahmet)
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)

### Degistirildi
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) standart token referanslarına (--color-text-primary, --color-text-secondary)                                                      güncellendi                                                    - HeroSideBannerSlider ok butonlarından th-btn-outline kaldırılıp                                                          eksik transition/border/bg sınıfları düzeltildi (@ahmet)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@ahmet)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@ahmet)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@ahmet)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.)   görsel arama ile ilgili UI öğeleri yorum satırına alındı.   Özellik tamamen kaldırılmadı, ileride yeniden aktif edilebilir.     . (@ahmet)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.)   görsel arama ile ilgili UI öğeleri yorum satırına alındı.   Özellik tamamen kaldırılmadı, ileride yeniden aktif edilebilir.     . (@ahmet)
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@ahmet)

---
## [v1.1.3-rc.26] - 2026-04-13 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@TurksabYonetim)
- feat(top-deals): Mağaza ön yüzüne “En İyi Fırsatlar” için arka uç iş akışı eklendi (@aliiball)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(ci): prevent silent deploy failures with set -e and git reset (@ahmeetseker)
- fix(top-ranking): alt kategori seçiminde ana kategori tab'ı aktif hale getirildi. (@aliiball)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.25] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@TurksabYonetim)
- feat(top-deals): Mağaza ön yüzüne “En İyi Fırsatlar” için arka uç iş akışı eklendi (@aliiball)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(ci): prevent silent deploy failures with set -e and git reset (@ahmeetseker)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.24] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(ci): prevent silent deploy failures with set -e and git reset (@ahmeetseker)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.23] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(ci): prevent silent deploy failures with set -e and git reset (@ahmeetseker)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.22] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(ci): prevent silent deploy failures with set -e and git reset (@ahmeetseker)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.21] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.20] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(storefront): UI düzeltmeleri, kişiselleştirilmiş öneriler ve dinamik sayfalar (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.19] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.18] - 2026-04-10 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)
- refactor: Input, checkbox ve quantity bileşenlerini tema token sistemine taşı (v4)   style.css'e input/form field (hover, focus, disabled, error state),    checkbox/radio ve quantity stepper CSS değişkenleri eklendi  - 55+ bileşendeki inline Tailwind input sınıfları th-input / th-input-sm/md/lg                                                       tema sınıflarıyla değiştirildi                                                      - Hardcoded renk fallback'leri (--color-text-heading, --color-text-muted vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.17] - 2026-04-09 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)
- refactor: "Trade Assurance" ifadesini "Ticari Güvence" olarak yeniden adlandır ve uygulama genelinde footer kart düzenini güncelle (@TurksabYonetim)

---
## [v1.1.3-rc.16] - 2026-04-09 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@boraydeger32)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@boraydeger32)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@boraydeger32)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@boraydeger32)
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)
- feat: alıcı adres defteri ve backend API entegrasyonu (@boraydeger32)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@boraydeger32)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)

---
## [v1.1.3-rc.13] - 2026-04-09 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)
- refactor: Buton stilleri global tema sınıflarıyla bileşenler genelinde standartlaştırıldı (@TurksabYonetim)

---
## [v1.1.3-rc.12] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.11] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)
- fix(header): Popover ve mega menü UI düzeltmeleri + Ticari Güvence Sistemi logo eklemesi yapıldı. (@TurksabYonetim)

### Degistirildi
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.10] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)

### Degistirildi
- refactor: Ürün bileşenlerindeki (ProductCard, ProductList, SearchBar vb.) (@TurksabYonetim)

---
## [v1.1.3-rc.9] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

### Duzeltildi
- fix: products.ts merge conflict çözüldü (filter engine yaklaşımı korundu) (@TurksabYonetim)

---
## [v1.1.3-rc.8] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

---
## [v1.1.3-rc.7] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)
- feat(Search): Sidebar filtre sertifika bölümleri yönetim/ürün olarak ayrıldı (@TurksabYonetim)

---
## [v1.1.3-rc.6] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)
- feat(Search): Ürün listeleme sayfası filtre sidebar'ı, arama ve sayfalama implementasyonu yapıldı (@TurksabYonetim)

---
## [v1.1.3-rc.5] - 2026-04-08 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)

---
## [v1.1.3-rc.4] - 2026-04-07 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)

---
## [v1.1.3-rc.3] - 2026-04-07 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)

---
## [v1.1.3-rc.2] - 2026-04-07 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: alıcı adres defteri ve backend API entegrasyonu (@TurksabYonetim)

---
## [v1.1.3-rc.1] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.1.3] - 2026-04-06 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@ahmet)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@ahmet)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat: apply red background color to login submit button (@ahmet)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@ahmet)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@ahmet)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@ahmet)
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@ahmet)

### Duzeltildi
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@ahmet)
- fix: correct typo in deployment workflow name (@ahmet)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@Ali)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix: update auth-guard redirects to use dynamic base URL (@ahmet)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@ahmet)

---
## [v1.1.2-rc.10] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)
- feat: implement media URL rewriting to support backend routing on GitHub Pages (@TurksabYonetim)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)

---
## [v1.1.2-rc.9] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)
- fix: prevent duplicate CORS headers by hiding backend-provided headers in nginx proxy configuration (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)

---
## [v1.1.2-rc.8] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)

### Degistirildi
- refactor: make API base URL configurable via window.API_BASE across all fetch requests (@TurksabYonetim)

---
## [v1.1.2-rc.7] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)
- feat(auth): add email verification banners to login page, password visibility toggles to settings, and email verify slide to dashboard (@TurksabYonetim)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)

---
## [v1.1.2-rc.6] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)
- fix: correct typo in deployment workflow name (@TurksabYonetim)

---
## [v1.1.2-rc.5] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)
- fix(RFQ): Kategori ön doldurmasını düzeltmek için "productCategoryId" değeri mapper aracılığıyla aktarıldı (@TurksabYonetim)

---
## [v1.1.2-rc.4] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)
- fix(RFQ): RFQ formunun önceden doldurulması için ad yerine kategori UUID'si kullanıldı (@Ali)

---
## [v1.1.2-rc.3] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: add GitHub Pages deployment workflow for ahmet branch and update CI permissions (@TurksabYonetim)
- feat: configure CORS headers and SameSite cookie flags for API proxy in nginx.conf (@TurksabYonetim)
- feat: add preview.istoc.com to allowed CORS origins in nginx configuration (@TurksabYonetim)
- feat: add admin-preview.istoc.com to CORS allowed origins in nginx configuration (@TurksabYonetim)
- feat: apply red background color to login submit button (@TurksabYonetim)
- feat(RFQ): Sabit kodlanmış ürünler dinamik API çağrılarıyla değiştirildi. (@Ali)
- feat(RFQ): Ürün kartındaki liste bilgilerini kullanarak RFQ formu önceden otomatik doldurtuluyor (@Ali)

### Duzeltildi
- fix: update auth-guard redirects to use dynamic base URL (@TurksabYonetim)

---
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
## [v1.1.2-rc.1] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.1.2] - 2026-04-06 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat: export getCsrfToken function to retrieve current token or default value (@ahmet)

---
## [v1.1.1-rc.2] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat: export getCsrfToken function to retrieve current token or default value (@TurksabYonetim)

---
## [v1.1.1-rc.1] - 2026-04-06 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.1.1] - 2026-04-06 PROD

Bu surum istoc.com'da yayindadir.

---
## [v1.1.0-rc.1] - 2026-04-04 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.1.0] - 2026-04-04 PROD

Bu surum istoc.com'da yayindadir.

### Eklendi
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@Bora)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@Bora)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@Bora)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@Bora)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@ahmet)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo   güvencesi, vergi, üyelik vb.) ve ortak sayfa düzeni oluşturuldu. ve   FloatingPanel (yüzen menü/widget) — "Mesajlarım", "Görsel Arama", "En üste çık" butonları olan kısım güncellendi. (@ahmet)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@ahmet)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@ahmet)
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@ahmet)

### Duzeltildi
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@ahmet)
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)

---
## [v1.0.1-rc.11] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@TurksabYonetim)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@TurksabYonetim)
- feat: Beden gruplarıyla çoklu varyant desteği eklendi, sepet servisi API’si güncellendi ve ürün CTA butonları yeniden tasarlandı (@TurksabYonetim)
- feat: Sepet çekmecesinde beden varyant desteği eklendi, CSRF token yönetimi güncellendi ve sepete ekleme servisine varyanta özel alanlar eklendi (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)

---
## [v1.0.1-rc.10] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@TurksabYonetim)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@TurksabYonetim)

### Duzeltildi
- fix: Dockerfile ARG'leri local Docker için relative URL yapıldı. (@Ali)
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)

---
## [v1.0.1-rc.9] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@TurksabYonetim)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@TurksabYonetim)

### Duzeltildi
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)

---
## [v1.0.1-rc.8] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@TurksabYonetim)
- feat: Telefon alanı etiketini İngilizce ve Türkçe yerelleştirme dosyalarına eklendi. (@TurksabYonetim)

### Duzeltildi
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)

---
## [v1.0.1-rc.7] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)
- feat: Satıcı vitrinleri için URL hash tabanlı gezinme ve dinamik para birimi desteğini uygula. (@TurksabYonetim)

### Duzeltildi
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)

---
## [v1.0.1-rc.6] - 2026-04-03 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@TurksabYonetim)
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@TurksabYonetim)
- feat(seller_storefront): ana ürün kaydırıcısı ve bölüm kaydı işlevselliği eklendi seller front  detaylı değişilik yapıldı ve footerdaki bottomdaki çalışmayan linkler düzeltildi (@TurksabYonetim)
- feat: footer'daki tüm bilgi sayfaları (iade politikası, kargo (@TurksabYonetim)
- feat: Ticaret Güvencesi, kargo lojistiği ve satış sonrası sayfaları eklendi (@TurksabYonetim)

### Duzeltildi
- fix(ci): release changelog'da yanlış kullanıcı etiketlenmesini düzelt (@TurksabYonetim)

---
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
- feat: sipariş başarı yönlendirmesini uygula, vitrin arayüz bileşenlerini güncelle ve i18n yerelleştirme dosyalarını temizle (@ahmet)
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@ahmet)

---
## [v1.0.1-rc.3] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat:HelpCenterHeader'a dil seçici bileşenini ekleyin ve yardım merkezi sayfalarına entegre edin. (@ahmet)

---
## [v1.0.1-rc.2] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.0.1-rc.1] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.0.1] - 2026-04-01 PROD

Bu surum istoc.com'da yayindadir.

---
## [v1.0.1-rc.5] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(release): prod ve rc release iş akışları eklendi (@ahmet)
- feat(tracking): çerez onay yönetimi için CookieBanner ve TrackingManager eklendi (@ahmet)

---
## [v1.0.1-rc.4] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(release): prod ve rc release iş akışları eklendi (@ahmet)
- feat(tracking): çerez onay yönetimi için CookieBanner ve TrackingManager eklendi (@ahmet)

---
## [v1.0.1-rc.3] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(release): prod ve rc release iş akışları eklendi (@ahmet)
- feat(tracking): çerez onay yönetimi için CookieBanner ve TrackingManager eklendi (@ahmet)

---
## [v1.0.1-rc.2] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

### Eklendi
- feat(tracking): çerez onay yönetimi için CookieBanner ve TrackingManager eklendi (@ahmet)

---
## [v1.0.1-rc.1] - 2026-04-01 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.0.1] - 2026-04-01 PROD

Bu surum istoc.com'da yayindadir.

---
## [v2.0.0-rc.1] - 2026-03-31 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v2.0.0] - 2026-03-31 PROD

Bu surum istoc.com'da yayindadir.

---
## [v1.0.1-rc.1] - 2026-03-31 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.0.1] - 2026-03-31 PROD

Bu surum istoc.com'da yayindadir.

---
## [v1.0.0-rc.3] - 2026-03-31 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.0.0-rc.2] - 2026-03-31 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
## [v1.0.0-rc.1] - 2026-03-31 RC

Bu surum rc.istoc.com'da test asamasindadir.

---
# tradehubfront Changelog

Tüm önemli değişiklikler bu dosyada belgelenir.
Format: [SemVer](https://semver.org/) standardına göre.

---
