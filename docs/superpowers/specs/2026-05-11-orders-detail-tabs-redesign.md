# Orders Detail — Tab'lı Minimalist Düzen

**Tarih:** 2026-05-11
**Etkilenen alanlar:** `tradehubfront/src/components/orders/OrdersPageLayout.ts` (tek dosya, ~2150 satır)
**Backend değişikliği:** Yok — mevcut `OrderStore` state aynı kalır, sadece görsel ambalaj değişir.

---

## 1. Amaç

`/pages/dashboard/orders.html` sipariş detay paneli şu an kargo, ödeme ve tedarikçi bölümlerini alt alta dikey olarak gösteriyor. Yüzlerce ürün içeren bir siparişte sayfa aşırı uzuyor ve görsel hiyerarşi kayboluyor.

Hedef:
- **Kargo / Ödeme / Tedarikçi** üç bölümünü tek bir boxed tab grubuna toplamak (sayfa ~70% kısalır).
- Ürün tablosunu yüzlerce kalem geldiğinde de derli toplu tutmak (ilk 5 + tıklamayla scroll'lu liste).
- Mevcut bilgi seti ve aksiyonların hiçbiri kaybolmaz; sadece sunum değişir.

## 2. Yaklaşım Özeti

- **Section 5 (Kargo) + Section 6 (Ödeme) + Section 7 (Tedarikçi)** bölümleri tek bir tab container'a sarılır. Stil: **boxed/folder tab** (aktif sekme beyaz arka plan + üç kenar border, alt sınırı içerikle birleşir).
- **Section 4 (Ürünler)** kartı kapalı/açık iki durumlu hale getirilir:
  - Kapalı: özet satırı + ilk 5 ürün + "Tümünü göster" CTA.
  - Açık: arama input + sıralama dropdown + `max-height: ~340px` scroll container içinde tüm ürünler.
- Tab bar **sticky değil** — normal sayfa akışında kalır.
- Default açık tab: **Kargo** (sipariş takibi en sık sorulan aksiyon).
- Tab state Alpine local state — URL hash'e yazılmaz (YAGNI).
- Tüm değişiklikler tek dosyada (`OrdersPageLayout.ts`); yeni bileşen klasörü açılmaz.

## 3. Mevcut Yapı (etkilenen kısımlar)

`OrdersPageLayout.ts` içinde sipariş detay paneli aşağıdaki sıralı section'lardan oluşuyor (line numaraları yaklaşık):

| Section | Satır | Bölüm | Bu spec'te |
|---|---|---|---|
| 1 | ~470 | Order header (no + toplam + status badge) | **Aynı kalır** |
| 2 | ~500-540 | Stepper (5-step horizontal) | **Aynı kalır** |
| 3 | ~543-546 | Status başlığı + açıklama | **Aynı kalır** |
| Actions | ~549-573 | Status-aware butonlar (Ödeme yap / İptal / Kargo değiştir) | **Aynı kalır** |
| 4 | ~575-627 | Ürünler tablosu (tam liste, summary row) | **🆕 Yeniden tasarlanır** |
| 5 | ~629-667 | Kargo detayları | **🆕 Tab'a taşınır** |
| 6 | ~669-754 | Ödeme detayları | **🆕 Tab'a taşınır** |
| 7 | ~756-787 | Tedarikçi detayları | **🆕 Tab'a taşınır** |
| 10 | ~789-794 | Operation history butonu | **Aynı kalır** |

Modal'lar (Operation History, Payment History, Track Package, Modify Shipping, Cancel, Remittance, Refund, Invoice) — tümü değişmeden korunur.

## 4. Section 4 — Ürünler Kartı (Yeniden Tasarım)

### 4.1 Veri ve State

Mevcut `selectedOrder.products` array zaten var. Yeni state alanları **`OrdersPageLayout` root scope**'una eklenir (mevcut `selectedOrder`, `showOperationHistory` vb. ile aynı yerde):

```js
{
  showAllProducts: false,
  productSearch: '',
  productSort: 'default', // 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'
  activeDetailTab: 'shipping',
}
```

Alpine `$watch('selectedOrder', ...)` ile başka siparişe geçildiğinde dördü birden sıfırlanır:
- `showAllProducts → false`
- `productSearch → ''`
- `productSort → 'default'`
- `activeDetailTab → 'shipping'`

İç scope `x-data` kullanılmaz çünkü mevcut kod ürün/order detay panelini `x-show` ile gösteriyor (DOM kalıcı), `x-if` ile yeniden mount olmuyor.

Filtrelenmiş/sıralanmış ürün listesi computed getter ile elde edilir: `filteredProducts()` — `productSearch` ile name filter + `productSort` ile sıralama.

### 4.2 Görsel Yapı

**Kart sarmalayıcı (her zaman var):**
```
┌─ 📦 [N] Ürün · TRY [toplam]                        [Tedarikçi adı] ─┐
│                                                                    │
│  [ürün satırları]                                                  │
│                                                                    │
│  [koşullu: CTA veya arama+scroll bloğu]                           │
└────────────────────────────────────────────────────────────────────┘
```

**Ürün satırı (her durumda aynı):**
- Sol: 32×32 thumbnail (mevcut `product.image`)
- Orta: ürün adı (line-clamp-2) + `2 adet × TRY 78.49` alt satırı
- Sağ: toplam (`product.totalPrice`)
- Mobil (max-sm): thumbnail 28×28, font-size küçülür

**Default durum (`showAllProducts: false`):**
- İlk 5 ürün listelenir.
- `selectedOrder.products.length > 5` ise CTA: `↓ [N-5] ürün daha — tümünü göster`.
- 5 veya daha az ürün varsa CTA gösterilmez; alt sınırda mevcut summary row (toplam adet + toplam fiyat) görünür.

**Açık durum (`showAllProducts: true`):**
- Üstte 1 satır: arama input (flex-1) + sıralama dropdown butonu.
  - Arama: `productSearch` model — case-insensitive `product.name` filter, debounce **yok** (client-side, hızlı).
  - Sıralama: native `<details>`/Alpine dropdown — 5 seçenek (Varsayılan, İsim A→Z, İsim Z→A, Fiyat ↑, Fiyat ↓).
- Liste container: `max-height: 340px; overflow-y: auto;` Tüm filtreli ürünler render edilir (virtual scroll **yok** — tek-tip layout, 1000 row'da bile DOM kabul edilebilir).
- Liste dibinde sticky fade gradient (`linear-gradient(to top, #fff, transparent)`, 20px) — sadece görsel scroll ipucu.
- Alt CTA değişir: `↑ Daralt`.

**Boş arama sonucu:** "Aramayla eşleşen ürün bulunamadı" mesajı (`text-sm text-gray-400 text-center py-6`).

### 4.3 Toplam ve Summary Row

Mevcut summary row (toplam adet + toplam fiyat, line ~623-626) korunur **sadece kapalı durumda**. Açık durumda zaten her ürün görünür, kart başlığındaki "N Ürün · TRY X" özet aynı bilgiyi veriyor.

## 5. Section 5-7 — Boxed Tab Container

### 5.1 State

`activeDetailTab` zaten 4.1'de tanımlandı. Default `'shipping'`. `selectedOrder` değiştiğinde `$watch` ile `'shipping'`'e döner.

### 5.2 Tab Bar Yapısı

```html
<div class="px-7 max-sm:px-3 pt-5">
  <div class="flex gap-0 items-end">
    <!-- Aktif: bg-white + border-l/r/t + border-b transparent (içerik üzerine taşar) -->
    <!-- Pasif: bg-transparent + sadece border-b -->
    <button [Kargo tab]>🚚 Kargo</button>
    <button [Ödeme tab]>💳 Ödeme</button>
    <button [Tedarikçi tab]>🏢 Tedarikçi</button>
    <div class="flex-1 border-b border-gray-200"></div>  <!-- pasif alanı dolduran çizgi -->
  </div>

  <!-- Tab içerik kartı -->
  <div class="bg-white border-l border-r border-b border-gray-200 rounded-b-lg p-5 max-sm:p-4">
    <template x-if="activeDetailTab === 'shipping'">{kargo içeriği}</template>
    <template x-if="activeDetailTab === 'payment'">{ödeme içeriği}</template>
    <template x-if="activeDetailTab === 'supplier'">{tedarikçi içeriği}</template>
  </div>
</div>
```

**Aktif tab tarzı:**
- `bg-white border-l border-r border-t border-gray-200 -mb-px` (içeriğin üst border'ını gizler)
- `text-gray-900 font-semibold`
- Icon: `text-[var(--btn-bg)]` (mevcut altın token)

**Pasif tab:**
- `bg-transparent text-gray-500 hover:text-gray-700 border-b border-gray-200`
- Icon: `text-gray-400`

**Mobile (max-sm):**
- Tab metni "Kargo / Ödeme / Tedarikçi" yeterince kısa, 3 sekme yatay sığar.
- Icon + metin yan yana kalır, padding küçülür (`px-3 py-2 text-xs`).
- Tab içeriği grid `grid-cols-1` (mevcut pattern).

### 5.3 Tab Headers — Aksiyonlar

Mevcut tab içeriklerindeki sağ üst aksiyonlar (Kargo: trackingStatus + "Kargo takibi" + "Kargo bilgilerini değiştir"; Ödeme: "Ödeme Geçmişi" butonu + `...` menü) **tab içeriğinin ilk satırına** taşınır — tab başlığının kendisi sadece icon + isim olur.

Yani bugün her bölümün başında olan `flex items-center justify-between` başlık satırı, içerik kartının içinde kalmaya devam eder. Sadece "Kargo Detayları / Ödeme Detayları / Tedarikçi Detayları" H2 başlıkları silinir (zaten tab adı görevini yapıyor).

### 5.4 Tab İçerikleri — Mevcut Bilgi Birebir Korunur

**Kargo tab içeriği:**
- 1. satır: trackingStatus badge + "Kargo takibi" link + (koşullu) "Kargo bilgilerini değiştir" link
- Grid 4 sütun (max-sm:1): Teslimat Adresi, Gönderim Ülkesi, Kargo Yöntemi, Incoterms

**Ödeme tab içeriği:**
- 1. satır: "Ödeme Geçmişi" butonu + `...` menü (Fatura indir, İade talep et)
- Grid 2 sütun (max-sm:1):
  - Sol: ödeme durum rozeti (Paid/Processing/Unpaid/Refunded renkleri) + ödeme geçmişi linki
  - Sağ: gri arka planlı toplam kutusu (ara toplam, kargo ücreti, ara toplam, **genel toplam**) + disclaimer

**Tedarikçi tab içeriği:**
- Grid 4 sütun (max-sm:2, max-[380px]:1): Tedarikçi, İletişim Adı, Telefon, E-posta
- "Mağazayı ziyaret et" linki en altta

## 6. CSS Stratejisi

Tüm yeni stiller **Tailwind utility** ile yazılır — `style.css`'e ekleme yapılmaz. Spesifik:
- Tab aktif/pasif state'i `:class="activeDetailTab === '...'  ? '...' : '...'"` Alpine binding ile.
- `bg-[var(--btn-bg,#cc9900)]` mevcut tema token'ı korunur.
- Scroll container fade indicator: sticky pseudo-element yerine `linear-gradient` arka plan (utility yetersiz → `bg-gradient-to-t from-white to-transparent` ile çözülür).
- Tek istisna: dropdown sıralama menüsü zaten mevcut `Section 6` (`moreOpen`) pattern'i ile yapılır, yeni custom CSS yok.

## 7. Erişilebilirlik

- Tab butonları: `role="tab"`, `aria-selected="true/false"`, `aria-controls="panel-shipping"` vb.
- Tab panel'ler: `role="tabpanel"`, `aria-labelledby="tab-shipping"`.
- Klavye navigasyonu: Alpine `@keydown.left/.right` ile tab'lar arası geçiş (`focus()` çağrısı + state güncelleme). Tab/Shift+Tab default akış.
- Arama input: `aria-label="Ürünlerde ara"`.

## 8. Test Senaryoları

| Senaryo | Beklenen |
|---|---|
| 0 ürünlü sipariş | Ürünler kartı kapalı modda, CTA yok, summary row 0 gösterir |
| 3 ürünlü sipariş | İlk 3 ürün listelenir, CTA yok |
| 5 ürünlü sipariş | 5 ürün listelenir, CTA yok |
| 6 ürünlü sipariş | İlk 5 + "1 ürün daha — tümünü göster" CTA |
| 124 ürünlü sipariş | CTA "119 ürün daha"; tıkla → arama+sırala+scroll'lu 124 ürün |
| Arama "valf" | Sadece "valf" geçen ürünler render, başlıkta gösterilen sayı değişmez |
| Sırala "Fiyat ↑" | Görünen liste fiyat artan sıralanır |
| Tab değişimi (Kargo→Ödeme→Tedarikçi) | Tab içeriği değişir, ürünler kartı state'i bozulmaz |
| Başka order seç (sidebar'dan) | `activeDetailTab` → `'shipping'`; ürün kartı kapalıya döner |
| Mobile 360px | 3 tab yatay sığar; tab içeriği tek sütun |
| Boş arama sonucu | "Aramayla eşleşen ürün bulunamadı" mesajı |

## 9. Kapsam Dışı (YAGNI)

- "Özet" tab'ı eklenmez.
- Ürünler için modal / side drawer eklenmez.
- Tab sticky scroll davranışı **yok**.
- URL hash ile tab persistleme **yok**.
- Ürün listesi sayfalama (pagination) **yok** — scroll yeterli.
- Virtual scroll **yok** — 124 row için DOM maliyeti kabul edilebilir.

## 10. Geri Dönüş Stratejisi

Tüm değişiklikler tek dosyada (`OrdersPageLayout.ts`) olduğu için commit revert yeterli. Backend impact yok, migration yok.
