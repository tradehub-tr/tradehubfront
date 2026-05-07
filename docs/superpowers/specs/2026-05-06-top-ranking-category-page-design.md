# Top Ranking Category — Adanmış "Top 100" Sayfası

**Tarih:** 2026-05-06
**Etkilenen alanlar:** `tradehubfront/` (yeni sayfa + iki mevcut bileşen güncellemesi)
**Backend değişikliği:** Yok (mevcut `get_listings` endpoint'i yeterli)

---

## 1. Amaç

Mevcut "En Çok Satanlar" (`/pages/top-ranking.html`) sayfası, "Tümü" sekmesinde kategori kartları (her kart 3 ürün, #1/#2/#3 rozetli) gösteriyor. Bir kategori sekmesine veya kart başlığına tıklandığında ya aynı sayfada flat moda geçiyor ya da rank rozeti olmayan genel `products.html` ürün listeleme sayfasına gidiyor.

Amazon'un "Best Sellers in X" davranışı isteniyor: kart başlığına / sekmeye / anasayfadaki 6 kategori kartına tıklayınca **o kategoriye özgü, sıralama rozetli, sayfalanmış (1-50, 51-100) bir top 100 sayfası** açılmalı.

## 2. Yaklaşım Özeti

- Yeni adanmış sayfa: `/pages/top-ranking-category.html?cat=<slug>&sort=<key>&page=<n>`
- Backend'de yeni endpoint **yok**; mevcut `get_listings` (kategori filtresi + `sort_by=orders|views|rating` + `page_size=50`) kullanılır. Sıra rozeti `(page - 1) * 50 + index + 1` ile frontend'de hesaplanır.
- Mevcut top-ranking sayfasındaki **flat mod tamamen kaldırılır** (kategori sekmesi ve kart başlığı yeni sayfaya yönlendirir).
- Anasayfadaki "En Çok Satanlar" 6 kategori kartı da yeni sayfaya yönlendirilir.
- Ürün kartlarındaki "Karşılaştır" checkbox'ı (`ProductListingGrid.ts`'de) bu spec kapsamında kaldırılır — özellik şu an aktif değil.

## 3. URL ve Yönlendirme Akışı

**Yeni route:**
```
/pages/top-ranking-category.html?cat=<slug>&sort=<key>&page=<1|2>
```
- `cat` zorunlu — Product Category `url_slug`. Eksikse 404 davranışı (boş state + "Ana Sayfa'ya Dön").
- `sort` opsiyonel, varsayılan `hot-selling`. Diğer değerler: `most-popular`, `best-reviewed`.
- `page` opsiyonel, varsayılan `1`. Sadece `1` ve `2` geçerli; başka değer `1`'e clamp edilir.

**Yönlendirme noktaları (mevcut linkler değişir):**

| Kaynak | Mevcut Davranış | Yeni Davranış |
|---|---|---|
| Top-ranking sayfa, kategori kartı başlığı | `products.html?cat=X&sort=orders` | `top-ranking-category.html?cat=X&sort=hot-selling&page=1` |
| Top-ranking sayfa, kategori sekmesi (Mutfak, Spor, vs.) | Aynı sayfada flat mod (`setTab` Alpine action) | `top-ranking-category.html?cat=X&sort=<aktif sort>&page=1` (anchor href) |
| Top-ranking sayfa, "Tümü" sekmesi | Aynı sayfada grouped mod | **Değişmez** — grouped korunur |
| Top-ranking sayfa, hero "Tüm kategoriler" dropdown'u (alt kategori seçimi dahil) | `setTab/applyCategoryFilter` Alpine action | Eğer bir kategori seçilirse `top-ranking-category.html`'e yönlendir; "Tümü" seçilirse mevcut grouped davranışı kal |
| Anasayfa "En Çok Satanlar" 6 kategori kartı | (Mevcut hedef incelenir; muhtemelen `products.html`) | `top-ranking-category.html?cat=X&sort=hot-selling&page=1` |

> **Not:** Mevcut top-ranking sayfasındaki mobil "Tab Bottom Sheet" — `showTabSheet` — bir kategori seçildiğinde `setTab` yerine yeni sayfaya navigation yapacak. "Tümü" hâlâ aynı sayfada kalır.

## 4. Sayfa Düzeni

```
┌──────────────────────────────────────────────────────────────────────┐
│ [TopBar] [SubHeader]                            (desktop, mevcut)    │
├──────────────────────────────────────────────────────────────────────┤
│ Ana Sayfa › En Çok Satanlar › Mutfak Aksesuarları                    │
├──────────────────────────────────────────────────────────────────────┤
│  Krem-sarı gradient hero (mevcut TopRankingHero ile birebir tema)   │
│                                                                      │
│            En Çok Satanlar — Mutfak Aksesuarları                     │
│            30 ürün · Veri odaklı sıralamalarla trendleri keşfedin    │
│                                                                      │
│              [≡ Tüm kategoriler ▾]                                   │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  [Çok satan] [En popüler] [En çok değerlendirilen]   sticky          │
├──────────────────────────────────────────────────────────────────────┤
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│   │ #1  │ │ #2  │ │ #3  │ │ #4  │ │ #5  │  desktop 5 sütun           │
│   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  tablet 3, mobil 2         │
│   ... 50 kart ...                                                    │
│                                                                      │
│            [‹ Önceki]  [ 1 ]  [ 2 ]  [Sonraki ›]                     │
├──────────────────────────────────────────────────────────────────────┤
│ Footer                                                               │
└──────────────────────────────────────────────────────────────────────┘
```

**Hero:** Mevcut `TopRankingHero` bileşeni yeniden kullanılır. Sadece başlık dinamikleşir: `En Çok Satanlar — <Kategori Adı>`. Subtitle başına ürün sayısı eklenir. Hero'daki "Tüm kategoriler" dropdown'u korunur — kullanıcı bu sayfadan başka bir kategoriye atlayabilir; seçim yapıldığında mevcut sayfa URL'si yeniden yüklenir (`window.location = '/pages/top-ranking-category.html?cat=<yeniSlug>&sort=<aktif>'`).

**Sticky pills:** Mevcut `TopRankingSortPills` bileşeni aynen kullanılır.

**Grid:** Tailwind `grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4`. Tek değişiklik: kartların üzerinde büyük rozet ve yıldız satırı vardır.

**Filtreler yok:** Trade Assurance / Marka / Min sipariş gibi filtre paneli **bilinçli olarak yoktur** — bu sayfa keşif odaklıdır, satın alma listeleme sayfası değildir.

## 5. Ürün Kartı Tasarımı

```
┌──────────────────────────────┐
│ ┌──┐                         │  rozet: sol üst, üstte
│ │#1│   [ ürün görseli ]      │  • desktop w-9 h-9 text-sm
│ └──┘                         │  • mobil w-7 h-7 text-xs
│                              │  • beyaz font-bold numara
│                              │
│ Mug Tree Stand — Toptan      │  ürün adı: 2 satır clamp
│ Satış, Premium Kalite        │  text-sm font-medium
│                              │
│ ★★★★☆  4.9 (36)              │  yıldız + ortalama + count
│                              │  text-xs text-secondary
│ €5.22 - €5.83                │  fiyat: text-base font-bold
│ MSA: 5 adet                  │  MOQ: text-xs text-tertiary
└──────────────────────────────┘
```

**Rozet renk hiyerarşisi (mevcut tema renklerinden):**
- `#1` → `bg-success-500` (yeşil)
- `#2` → `bg-info-500` (mavi)
- `#3` → `bg-warning-500` (turuncu/altın)
- `#4..#100` → `bg-secondary-700` (koyu nötr) — 100 kart boyunca aynı parlak renk göz yormasın

**Yıldız satırı:** `average_rating` `> 0` ise gösterilir, yoksa satır gizlenir. Backend `searchListings` zaten `average_rating` ve `review_count` döndürüyor (mapping kontrolü gerekiyor — `mapListingCard` zaten `rating` ve `ratingCount` çıkarıyor).

**Tıklama:** Tüm kart `<a href="/pages/product-detail.html?id=<id>">` ile sarılı. Hover'da `-translate-y-0.5 shadow-md`.

**Olmayan elemanlar:** Karşılaştır checkbox, sepete ekle butonu, video butonu, satıcı badge'i. (Sayfa keşif odaklı; alma akışı ürün detayında.)

## 6. Sayfalama Bileşeni

```
[‹ Önceki]   [ 1 ]   [ 2 ]   [Sonraki ›]
```

**Davranış:**
- `total ≤ 50` → sayfalama hiç render edilmez.
- `50 < total ≤ 100` → 2 buton (1 ve 2). Aktif sayfa `bg-primary-500 text-white`, pasif `bg-surface text-text-secondary`.
- `total > 100` → yine 2 buton (sadece ilk 100 gösterilir; backend daha fazla sayfa döndürse bile UI clamp eder).
- Sayfa 1'deyken "Önceki" disabled. Sayfa 2'deyken "Sonraki" disabled.
- Tıklamada `history.replaceState` ile URL güncellenir, fetch tetiklenir, sayfa scroll'u grid başlangıcına götürülür (`scrollIntoView({ block: 'start' })`).

## 7. State Yönetimi (Alpine)

```typescript
Alpine.data('topRankingCategoryPage', () => ({
  // URL'den okunur (init)
  category: '',         // url_slug
  page: 1,              // 1 | 2
  activeSort: 'hot-selling',

  // API'den gelir
  products: [] as RankedProduct[],
  totalProducts: 0,
  totalPages: 1,        // min(2, ceil(total / 50))
  loading: false,
  categoryName: '',     // hero başlığı için

  init() { /* URL parse, ilk fetch */ },
  setSort(s: SortKey) { /* activeSort = s; page = 1; URL replace; fetch */ },
  goToPage(n: 1 | 2) { /* page = n; URL replace; fetch; scroll to grid */ },
  $t(key: string) { /* i18n */ },
}));
```

**Sort → backend eşlemesi (mevcut top-ranking.ts'den birebir kopyalanır):**

```typescript
const SORT_KEY_TO_BACKEND: Record<SortKey, string> = {
  'hot-selling':   'orders',
  'most-popular':  'views',
  'best-reviewed': 'rating',
};
```

**API çağrısı:**
```typescript
searchListings({
  category: this.category,
  sort_by: SORT_KEY_TO_BACKEND[this.activeSort],
  page: this.page,
  page_size: 50,
})
```

**Sıra rozeti:** Render sırasında `rank = (this.page - 1) * 50 + index + 1`.

**Kategori adı çözümü:** İlk `searchListings` yanıtı `category_name` alanı dönüyor mu kontrol edilir; dönmüyorsa ayrı bir `loadCategories()` çağrısı yapılır ve `apiCategories` içinden slug eşleşmesi bulunur. (Mevcut `loadCategories()` zaten `categoryService`'te var ve top-ranking sayfası kullanıyor — aynı pattern.)

## 8. Bileşen Dosya Planı

**Yeni dosyalar:**

```
tradehubfront/pages/top-ranking-category.html
tradehubfront/src/pages/top-ranking-category.ts
tradehubfront/src/components/top-ranking-category/
  ├── index.ts                                  (re-exports)
  ├── TopRankingCategoryHero.ts                 (başlık + sayı + dropdown)
  ├── TopRankingCategoryGrid.ts                 (rank rozeti + zengin kart + render fonksiyonu)
  └── TopRankingCategoryPagination.ts           (sayfa butonları)
```

**Yeniden kullanılan bileşenler (değişmez):**

```
src/components/top-ranking/TopRankingHero.ts        (hero arka planı + dropdown)
src/components/top-ranking/TopRankingFilters.ts     (kategori dropdown'u)
src/components/top-ranking/TopRankingSortPills.ts   (3 pil)
```

**Güncellenen mevcut dosyalar:**

| Dosya | Değişiklik |
|---|---|
| `src/pages/top-ranking.ts` | `mode === 'flat'` ve `flatProducts`, `fetchFlatPage`, `flatNextPage` state ve metotları kaldırılır. `setTab` her zaman 'all' bekler veya yeni sayfaya yönlendirir. |
| `src/components/top-ranking/TopRankingCategoryTabs.ts` | Sekme `<button @click="setTab(...)">` yerine `<a href="/pages/top-ranking-category.html?cat=<slug>&sort=<aktif>">` olur. "Tümü" sekmesi `<button>` olarak kalır (aynı sayfada grouped'a döner). |
| `src/components/top-ranking/TopRankingGrid.ts` | `mode === 'flat'` template'i ve `renderRankingFlatCard` fonksiyonu silinir. Sadece grouped mod kalır. |
| `src/components/top-ranking/TopRankingFilters.ts` | Kategori dropdown'unda `applyCategoryFilter` davranışı: alt kategori seçilirse `window.location` ile yeni sayfaya yönlendir; "Tümü" seçilirse mevcut Alpine davranışı. |
| `src/components/products/ProductListingGrid.ts` (lines 125-131) | Hover-only "Karşılaştır" checkbox `<label>` bloğu silinir. |
| `src/components/hero/TopRanking.ts` (line 47) | `href` `/pages/products.html?cat=...&sort=orders`'tan `/pages/top-ranking-category.html?cat=...&sort=hot-selling&page=1`'e güncellenir. |

**Yeni i18n anahtarları (`tr.ts` / `en.ts`):**

```
topRankingCategoryPage.heroTitle: "En Çok Satanlar — {category}"
topRankingCategoryPage.heroSubtitle: "{count} ürün · Veri odaklı sıralamalarla trendleri keşfedin"
topRankingCategoryPage.empty: "Bu kategoride henüz sıralama oluşmadı."
topRankingCategoryPage.pagination.previous: "Önceki"
topRankingCategoryPage.pagination.next: "Sonraki"
topRankingCategoryPage.breadcrumbTopRanking: "En Çok Satanlar"
common.ratingCount: "({count})"
```

`products.addToCompare` anahtarı **silinmez** — geri eklenebilsin diye dosyada kalır.

## 9. Veri Modeli

`RankedProduct` (mevcut `types/topRanking.ts` içinde):

```typescript
interface RankedProduct {
  id: string;
  name: string;
  href: string;
  price: string;          // örn. "€5.22-5.83"
  imageSrc: string;
  moq: string;            // örn. "5 Nos"
  rank: number;           // 1..100
}
```

**Genişletme (yeni alanlar):**

```typescript
interface RankedProduct {
  // ... mevcut
  averageRating?: number; // 0..5
  ratingCount?: number;   // örn. 152
}
```

`mapListingCard` (`listingService.ts`) zaten `rating` ve `ratingCount` döndürüyor; `top-ranking-category.ts`'de bunları `RankedProduct.averageRating` / `ratingCount`'a kopyala.

## 10. Edge Case'ler

| Durum | Davranış |
|---|---|
| `?cat=` parametresi eksik | Empty state: "Kategori belirtilmedi", "Ana Sayfa'ya Dön" linki |
| `?cat=<bilinmeyen-slug>` | API boş `data` döndürür → empty state: "Bu kategoride henüz sıralama oluşmadı." |
| `?page=3` veya negatif | `page = 1`'e clamp |
| `?sort=<bilinmeyen>` | `'hot-selling'`'e clamp |
| Kategoride 0 ürün | Empty state, sayfalama gizli |
| Kategoride 1-49 ürün | Tek sayfa, sayfalama gizli, kart sayısı kadar gösterilir |
| API timeout/hata | Mevcut top-ranking pattern: `console.warn` + boş liste; tekrar denemez (kullanıcı sort/page değiştirirse yeni fetch tetiklenir) |
| Aynı sayfada sort değişti, mevcut fetch henüz dönmedi | `loading` flag — yeni fetch beklemede tutulmaz; latest-write-wins (mevcut top-ranking pattern, kabul edilebilir) |

## 11. Etki Analizi (Mevcut sayfalar)

**Top Ranking sayfası (`/pages/top-ranking.html`):**
- Sadeleşir — tek mod (grouped). ~150 satır TS kodu silinir (`fetchFlatPage`, `flatProducts`, mode dispatcher).
- Kategori sekmesi `<button @click>`'ten `<a href>`'e dönüşür → sayfa yenileme yapar (gerçek navigation). Yeni sayfa context'i de aynı `TopRankingHero/Filters/SortPills`'i kullandığı için kullanıcı görsel olarak büyük bir farklılık hissetmez.

**Anasayfa "En Çok Satanlar" bölümü:** Sadece kartların `href`'i değişir.

**Ürün listeleme (`/pages/products.html`):** "Karşılaştır" checkbox'ı kaldırılır. Diğer her şey aynı kalır.

## 12. Kapsam Dışı

- Backend değişikliği (yeni endpoint, ranking algoritması değişikliği)
- Mobil için ayrı sayfalama UX (sayfalama mobil/desktop'ta aynı: 2 buton)
- "Best Sellers in X" dışındaki Amazon özellikleri (video butonu, "See More" carousel'i, "Sponsored" rozeti)
- Karşılaştırma özelliğinin yeniden ne zaman/nasıl etkinleştirileceği (i18n anahtarı korunur)
- SEO meta tag'leri ve canonical URL (gerekirse ayrı spec)
- Anasayfa 6 kart bileşeninin tasarım değişikliği (sadece href güncellenir)

## 13. Kabul Kriterleri

- [ ] `/pages/top-ranking-category.html?cat=demo-cat-mutfak` → Mutfak Aksesuarları için sıralanmış grid yüklenir, breadcrumb doğru.
- [ ] Sıralama pillları aktif sıralamayı `bg-primary` ile gösterir, tıklamayla URL `?sort=` güncellenir, grid yeniden yüklenir.
- [ ] Sıra rozetleri #1 yeşil, #2 mavi, #3 turuncu, #4+ koyu nötr.
- [ ] 50'den fazla ürün → sayfalama görünür, sayfa 2'de #51..#100 ve URL `?page=2`.
- [ ] 49 ürünlü kategoride sayfalama gizli, tüm ürünler tek sayfada.
- [ ] Top-ranking ana sayfa kategori sekmesi → yeni sayfaya yönlendiriyor.
- [ ] Top-ranking ana sayfa "Tümü" sekmesi → grouped mod, aynı sayfada.
- [ ] Top-ranking kart başlığı → yeni sayfaya yönlendiriyor.
- [ ] Anasayfa 6 kategori kartı → yeni sayfaya yönlendiriyor.
- [ ] `products.html`'deki ürün kartı hover'ında "Karşılaştır" görünmüyor.
- [ ] Mobil: 2 sütun grid + sticky sıralama pillları + alt sayfalama düzgün.
- [ ] Geri tuşu URL state'i düzgün geri yükler.
