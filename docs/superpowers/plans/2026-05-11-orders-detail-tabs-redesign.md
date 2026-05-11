# Orders Detail — Tab'lı Minimalist Düzen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Orders detay panelinde Kargo / Ödeme / Tedarikçi bölümlerini boxed tab grubuna topla; Ürünler kartını ilk-5 + scroll'lu liste hibrit yapısına çevir; sayfa yüksekliğini ~70% kısalt.

**Architecture:** Tek bir Alpine root component (`ordersListComponent`) state'ine 4 alan eklenir, mevcut `OrdersPageLayout.ts` içindeki 4 section yeniden yazılır. Yeni dosya açılmaz, yeni component soyutlanmaz — değişiklik sadece UI markup ve state seviyesinde.

**Tech Stack:** TypeScript, Alpine.js v3 (existing `Alpine.data` pattern), Tailwind v4 utility-only (style.css'e ekleme YOK), i18next. Test framework yok — doğrulama `npx tsc --noEmit && npx eslint src/` + `npm run dev` ile manuel browser testi.

**Spec:** `docs/superpowers/specs/2026-05-11-orders-detail-tabs-redesign.md`

**Çalışma dizini:** `/home/metin/Desktop/istoc cı-cd/tradehubfront/` (tüm komutlar buradan; git repo buranın altında).

**Kritik kurallar (CLAUDE.md):**
- **Tailwind utility ile yazılabilen stili `style.css`'e koyma** — her şey inline class olarak yazılır.
- **`x-init="init()"` yazma** — Alpine v3'te otomatik çağrılır.
- **`x-show.transition` yazma** — `x-show + x-transition` çiftini kullan.
- Commit öncesi `npx tsc --noEmit && npx eslint src/` çalıştır. ESLint warn'ları **commit'e geçirme** (any, console.log).
- Tarayıcı doğrulamaları için: `npm run dev` → `http://localhost:5173/pages/dashboard/orders.html` (veya kullanıcı setupına göre `http://tradehub.localhost/...`).

---

## File Structure

**Düzenlenen dosyalar (toplam 4):**

| Dosya | Değişiklik |
|---|---|
| `src/alpine/orders.ts` | `ordersListComponent` data objesine 4 alan + 1 computed getter + 1 `$watch` ekle |
| `src/components/orders/OrdersPageLayout.ts` | Section 4 (Ürünler) yeniden yaz; Section 5/6/7 (Kargo/Ödeme/Tedarikçi) tab container'a sar; ARIA attribute'ları ekle |
| `src/i18n/locales/tr.ts` | 3 kısa tab etiketi anahtarı ekle (`tabShipping`, `tabPayment`, `tabSupplier`) |
| `src/i18n/locales/en.ts` | Aynı 3 anahtarı İngilizce ekle |

**Yeni dosya yok. Backend değişikliği yok.**

---

## Task 1 — State foundation: 4 alan + computed getter

**Files:**
- Modify: `src/alpine/orders.ts:20-32`

- [ ] **Step 1: Mevcut state alanlarını oku (referans için)**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
sed -n '20,52p' src/alpine/orders.ts
```

Mevcut yapı (line 20-32):
```ts
Alpine.data("ordersListComponent", () => ({
  activeTab: "all",
  searchQuery: "",
  dateFilter: "all",
  dateFrom: "",
  dateTo: "",
  dateOpen: false,
  timeOpen: false,
  selectedOrder: null as any,
  copiedNumber: false,
  orders: [] as any[],
  loading: true,
  error: "",

  async init() { ... }
```

- [ ] **Step 2: 4 yeni state alanı ekle**

`src/alpine/orders.ts` line 32 (`error: ""` satırından sonra, `async init()`'ten önce) şu satırları ekle:

```ts
  // Order detail panel — Section 4 (Ürünler) state
  showAllProducts: false,
  productSearch: "",
  productSort: "default" as "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc",

  // Order detail panel — Tab state (Kargo/Ödeme/Tedarikçi)
  activeDetailTab: "shipping" as "shipping" | "payment" | "supplier",
```

- [ ] **Step 3: `filteredProducts` computed getter ekle**

`src/alpine/orders.ts` içinde `get filteredOrders()` getter'ından (line ~53) hemen sonra (kapanış `},` parantezinden sonra), şu getter'ı ekle:

```ts
  get filteredProducts() {
    if (!this.selectedOrder) return [] as any[];
    const products = (this.selectedOrder as any).products as any[];
    const q = this.productSearch.trim().toLowerCase();
    const filtered = q
      ? products.filter((p: any) => String(p.name).toLowerCase().includes(q))
      : products.slice();

    const parsePrice = (v: any): number => {
      const num = parseFloat(String(v).replace(/,/g, ""));
      return isNaN(num) ? 0 : num;
    };

    if (this.productSort === "name-asc") {
      filtered.sort((a: any, b: any) => String(a.name).localeCompare(String(b.name), "tr"));
    } else if (this.productSort === "name-desc") {
      filtered.sort((a: any, b: any) => String(b.name).localeCompare(String(a.name), "tr"));
    } else if (this.productSort === "price-asc") {
      filtered.sort((a: any, b: any) => parsePrice(a.totalPrice) - parsePrice(b.totalPrice));
    } else if (this.productSort === "price-desc") {
      filtered.sort((a: any, b: any) => parsePrice(b.totalPrice) - parsePrice(a.totalPrice));
    }
    return filtered;
  },
```

- [ ] **Step 4: `$watch` ile reset davranışı ekle**

`init()` metodunun **içinde**, mevcut `await orderStore.load();` çağrısından sonra şu satırı ekle:

```ts
    // selectedOrder değişince detay panel state'ini sıfırla
    this.$watch("selectedOrder", () => {
      this.showAllProducts = false;
      this.productSearch = "";
      this.productSort = "default";
      this.activeDetailTab = "shipping";
    });
```

- [ ] **Step 5: TypeScript + lint doğrula**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npx tsc --noEmit && npx eslint src/alpine/orders.ts
```

Beklenen: 0 error, 0 warning.

- [ ] **Step 6: Browser sanity check**

`npm run dev` çalıştır (eğer çalışmıyorsa). Tarayıcıda `/pages/dashboard/orders.html` aç. Bir siparişe tıkla. Console'da hata olmamalı. Konsoldan kontrol:

```js
// DevTools Console:
const root = document.querySelector('[x-data="ordersListComponent()"]').__x.$data;
console.log(root.showAllProducts, root.productSearch, root.productSort, root.activeDetailTab);
// Beklenen: false "" "default" "shipping"
console.log(root.filteredProducts);
// Beklenen: selectedOrder.products array'i ile aynı uzunlukta
```

- [ ] **Step 7: Commit**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
git add src/alpine/orders.ts
git commit -m "$(cat <<'EOF'
feat(orders): detay panel için tab/ürün state'i ekle

ordersListComponent'e showAllProducts, productSearch, productSort,
activeDetailTab alanlarını + filteredProducts getter'ını + selectedOrder
$watch reset davranışını ekle. UI değişikliği yok; sonraki taskların
veri temeli.
EOF
)"
```

---

## Task 2 — Section 4: Ürünler kartını yeniden yaz (kapalı + açık)

**Files:**
- Modify: `src/components/orders/OrdersPageLayout.ts:575-627`

- [ ] **Step 1: Mevcut Section 4'ü oku (referans)**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
sed -n '575,627p' src/components/orders/OrdersPageLayout.ts
```

Mevcut yapı: H2 "Ürün detayları" + seller satırı + `<table>` (line 591-619) + summary row (line 623-626).

- [ ] **Step 2: Section 4'ü tamamen değiştir**

`src/components/orders/OrdersPageLayout.ts` içinde line 575'ten line 627'ye kadar olan bloğu (`<!-- Section 4: Ürün detayları -->` ile başlayıp `</div>` ile biten) şu yeni içerikle değiştir:

```html
        <!-- Section 4: Ürün detayları (closed + open hybrid) -->
        <div class="px-7 max-sm:px-3 py-5 border-b border-gray-100">
          <!-- Header: özet + tedarikçi adı -->
          <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <h2 class="text-base font-bold text-gray-900">
                <span x-text="selectedOrder.products.length"></span> ${t("orders.productName")} ·
                ${getCurrencyCode()} <span x-text="selectedOrder.products.reduce((s, p) => { const v = parseFloat(String(p.totalPrice).replace(/,/g, '')); return s + (isNaN(v) ? 0 : v); }, 0).toLocaleString('en-US', {minimumFractionDigits: 2})"></span>
              </h2>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span class="text-gray-500">${t("orders.seller")}:</span>
              <span class="font-medium text-gray-800" x-text="selectedOrder.seller"></span>
              <a href="#" class="text-blue-600 hover:underline">${t("orders.chatNow")}</a>
            </div>
          </div>

          <!-- Search + sort toolbar (sadece açık durumda) -->
          <div x-show="showAllProducts" x-transition class="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
            <div class="relative flex-1">
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                x-model="productSearch"
                placeholder="${t("orders.productName")}"
                aria-label="${t("orders.productName")}"
                class="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--btn-bg,#cc9900)]/30 focus:border-[var(--btn-bg,#cc9900)]" />
            </div>
            <div class="relative" x-data="{ sortOpen: false }">
              <button @click="sortOpen = !sortOpen" class="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 whitespace-nowrap cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h13M3 12h9m-9 6h5"/></svg>
                <span x-text="productSort === 'default' ? 'Varsayılan' : productSort === 'name-asc' ? 'İsim A→Z' : productSort === 'name-desc' ? 'İsim Z→A' : productSort === 'price-asc' ? 'Fiyat ↑' : 'Fiyat ↓'"></span>
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5H5z"/></svg>
              </button>
              <div x-show="sortOpen" @click.outside="sortOpen = false" x-transition class="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1 min-w-[160px]">
                <button @click="productSort = 'default'; sortOpen = false" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">Varsayılan</button>
                <button @click="productSort = 'name-asc'; sortOpen = false" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">İsim A→Z</button>
                <button @click="productSort = 'name-desc'; sortOpen = false" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">İsim Z→A</button>
                <button @click="productSort = 'price-asc'; sortOpen = false" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">Fiyat ↑</button>
                <button @click="productSort = 'price-desc'; sortOpen = false" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">Fiyat ↓</button>
              </div>
            </div>
          </div>

          <!-- Product list: closed = first 5, open = scroll container -->
          <div
            :class="showAllProducts ? 'max-h-[340px] overflow-y-auto pr-1 relative' : ''">
            <template x-for="(product, idx) in (showAllProducts ? filteredProducts : selectedOrder.products.slice(0, 5))" :key="product.name + idx">
              <div class="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                <div class="w-10 h-10 max-sm:w-8 max-sm:h-8 rounded border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
                  <img :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-gray-800 line-clamp-2 leading-snug" x-text="product.name"></div>
                  <div class="text-xs text-gray-500 mt-0.5" x-text="product.quantity + ' × ${getCurrencyCode()} ' + product.unitPrice"></div>
                </div>
                <span class="text-sm font-medium text-gray-900 text-right whitespace-nowrap">${getCurrencyCode()} <span x-text="product.totalPrice"></span></span>
              </div>
            </template>

            <!-- Open + boş arama -->
            <template x-if="showAllProducts && filteredProducts.length === 0">
              <p class="text-sm text-gray-400 text-center py-6">Aramayla eşleşen ürün bulunamadı</p>
            </template>

            <!-- Scroll fade indicator (open + scrollable) -->
            <div x-show="showAllProducts && filteredProducts.length > 5" class="sticky bottom-0 h-5 bg-gradient-to-t from-white to-transparent pointer-events-none -mt-5"></div>
          </div>

          <!-- CTA + summary row (closed) -->
          <template x-if="!showAllProducts && selectedOrder.products.length > 5">
            <button @click="showAllProducts = true" class="w-full mt-3 py-2.5 text-sm font-medium text-blue-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 cursor-pointer transition-colors">
              ↓ <span x-text="selectedOrder.products.length - 5"></span> ürün daha — tümünü göster
            </button>
          </template>

          <!-- Open CTA (collapse) -->
          <template x-if="showAllProducts">
            <button @click="showAllProducts = false; productSearch = ''; productSort = 'default'" class="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer">
              ↑ Daralt
            </button>
          </template>

          <!-- Summary row (closed only) -->
          <template x-if="!showAllProducts">
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <span class="text-sm text-gray-500">${t("orders.productQuantity")}: <strong class="text-gray-800" x-text="selectedOrder.products.reduce((s, p) => s + p.quantity, 0)"></strong></span>
              <span class="text-sm text-gray-500">${t("orders.totalPrice")}: <strong class="text-gray-900" x-text="'${getCurrencyCode()} ' + selectedOrder.products.reduce((s, p) => { const v = parseFloat(String(p.totalPrice).replace(/,/g, '')); return s + (isNaN(v) ? 0 : v); }, 0).toLocaleString('en-US', {minimumFractionDigits:2})"></strong></span>
            </div>
          </template>
        </div>
```

- [ ] **Step 3: TypeScript + lint doğrula**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npx tsc --noEmit && npx eslint src/components/orders/OrdersPageLayout.ts
```

Beklenen: 0 error, 0 warning. (Eğer `style.css` veya başka dosyada ESLint warn varsa onlara karışma — sadece düzenlediğin dosya temiz olmalı.)

- [ ] **Step 4: Browser doğrulama — 4 senaryo**

`npm run dev` ile çalıştır, `/pages/dashboard/orders.html` aç:

| Senaryo | Beklenen |
|---|---|
| ≤5 ürünlü sipariş | Tüm ürünler görünür, CTA yok, summary row görünür |
| 6+ ürünlü sipariş | İlk 5 + "X ürün daha — tümünü göster" CTA |
| CTA'ya tıkla | Arama + sıralama görünür, liste max-height 340px, scroll çalışır |
| Arama "valf" yaz | Liste anında filtrelenir; eşleşme yoksa "bulunamadı" mesajı |
| Sıralama "Fiyat ↑" | Görünen liste fiyat artan sıraya geçer |
| "↑ Daralt" | İlk 5'e döner, arama temizlenir |
| Başka order seç | `showAllProducts` false'a döner ($watch çalışıyor) |

- [ ] **Step 5: Format**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npm run lint:fix
```

- [ ] **Step 6: Commit**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
git add src/components/orders/OrdersPageLayout.ts
git commit -m "$(cat <<'EOF'
feat(orders): ürünler kartını ilk-5 + scroll'lu hibrit yapıya çevir

Section 4 yeniden yazıldı: kapalı durumda ilk 5 ürün + "tümünü göster"
CTA; açık durumda arama + sıralama + max-h-340 scroll. Yüzlerce ürünlü
siparişlerde sayfa şişmesi engelleniyor. Tüm bilgi seti korunur.
EOF
)"
```

---

## Task 3 — Tab container shell + Kargo tab içeriği (Section 5)

**Files:**
- Modify: `src/i18n/locales/tr.ts` + `src/i18n/locales/en.ts` (3 kısa tab etiketi anahtarı)
- Modify: `src/components/orders/OrdersPageLayout.ts:629-667` (Section 5 — Kargo) + **yeni tab wrapper** ekle.

- [ ] **Step 1: TR locale'e 3 tab etiketi ekle**

`src/i18n/locales/tr.ts` içinde `supplierDetails: "Tedarikçi detayları",` satırını bul (line ~1250). **Hemen altına** şu 3 satırı ekle:

```ts
      tabShipping: "Kargo",
      tabPayment: "Ödeme",
      tabSupplier: "Tedarikçi",
```

- [ ] **Step 2: EN locale'e aynı 3 anahtarı ekle**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
grep -n "supplierDetails:" src/i18n/locales/en.ts
```

Bulduğun satırın hemen altına ekle:

```ts
      tabShipping: "Shipping",
      tabPayment: "Payment",
      tabSupplier: "Supplier",
```

- [ ] **Step 3: Mevcut Section 5'i oku (referans)**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
grep -n "Section 5: Kargo detayları" src/components/orders/OrdersPageLayout.ts
```

İçerik: H2 "Kargo detayları" + trackingStatus badge + 2 link + 4 sütunlu grid (adres, ülke, yöntem, incoterms).

- [ ] **Step 4: Section 5'i tab wrapper + Kargo paneli ile değiştir**

`src/components/orders/OrdersPageLayout.ts` içinde line 629'dan 667'ye kadar olan bloğu (`<!-- Section 5: Kargo detayları -->` ile başlayan div) şu yeni bloğu **değiştir**:

```html
        <!-- Section 5-7: Detay tab container (Kargo / Ödeme / Tedarikçi) -->
        <div class="px-7 max-sm:px-3 pt-5">
          <!-- Boxed tab bar -->
          <div class="flex items-end gap-0">
            <button
              @click="activeDetailTab = 'shipping'"
              :class="activeDetailTab === 'shipping' ? 'bg-white border-l border-r border-t border-gray-200 text-gray-900 font-semibold -mb-px z-10 relative' : 'bg-transparent text-gray-500 hover:text-gray-700 border-b border-gray-200'"
              class="px-4 py-2.5 max-sm:px-3 max-sm:py-2 text-sm max-sm:text-xs rounded-t-md cursor-pointer flex items-center gap-2 transition-colors"
              role="tab"
              :aria-selected="activeDetailTab === 'shipping'"
              aria-controls="panel-shipping">
              <svg class="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" :class="activeDetailTab === 'shipping' ? 'text-[var(--btn-bg,#cc9900)]' : 'text-gray-400'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
              </svg>
              <span>${t("orders.tabShipping")}</span>
            </button>
            <button
              @click="activeDetailTab = 'payment'"
              :class="activeDetailTab === 'payment' ? 'bg-white border-l border-r border-t border-gray-200 text-gray-900 font-semibold -mb-px z-10 relative' : 'bg-transparent text-gray-500 hover:text-gray-700 border-b border-gray-200'"
              class="px-4 py-2.5 max-sm:px-3 max-sm:py-2 text-sm max-sm:text-xs rounded-t-md cursor-pointer flex items-center gap-2 transition-colors"
              role="tab"
              :aria-selected="activeDetailTab === 'payment'"
              aria-controls="panel-payment">
              <svg class="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" :class="activeDetailTab === 'payment' ? 'text-[var(--btn-bg,#cc9900)]' : 'text-gray-400'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
              </svg>
              <span>${t("orders.tabPayment")}</span>
            </button>
            <button
              @click="activeDetailTab = 'supplier'"
              :class="activeDetailTab === 'supplier' ? 'bg-white border-l border-r border-t border-gray-200 text-gray-900 font-semibold -mb-px z-10 relative' : 'bg-transparent text-gray-500 hover:text-gray-700 border-b border-gray-200'"
              class="px-4 py-2.5 max-sm:px-3 max-sm:py-2 text-sm max-sm:text-xs rounded-t-md cursor-pointer flex items-center gap-2 transition-colors"
              role="tab"
              :aria-selected="activeDetailTab === 'supplier'"
              aria-controls="panel-supplier">
              <svg class="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" :class="activeDetailTab === 'supplier' ? 'text-[var(--btn-bg,#cc9900)]' : 'text-gray-400'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <span>${t("orders.tabSupplier")}</span>
            </button>
            <div class="flex-1 border-b border-gray-200"></div>
          </div>

          <!-- Tab panels (border-l/r/b ile aktif tab'a bağlı) -->
          <div class="bg-white border-l border-r border-b border-gray-200 rounded-b-md p-5 max-sm:p-4">
            <!-- Kargo paneli -->
            <div x-show="activeDetailTab === 'shipping'" x-transition.opacity id="panel-shipping" role="tabpanel" aria-labelledby="tab-shipping">
              <div class="flex items-center justify-end gap-3 mb-4 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full"
                      :class="selectedOrder.shipping.trackingStatus === 'Kargo yolda' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'"
                      x-text="selectedOrder.shipping.trackingStatus"></span>
                <button @click="openModal('showTrackPackage')" class="text-sm text-blue-600 hover:underline whitespace-nowrap bg-transparent border-none cursor-pointer p-0">${t("orders.trackShipments")} &gt;</button>
                <template x-if="canModifyShipping(selectedOrder)">
                  <button @click="openModal('showModifyShipping')" class="text-sm text-blue-600 hover:underline whitespace-nowrap bg-transparent border-none cursor-pointer p-0">${t("orders.modifyShippingDetails")}</button>
                </template>
              </div>
              <div class="grid grid-cols-4 max-sm:grid-cols-1 gap-4 max-sm:gap-3">
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.deliveryAddress")}</p>
                  <p class="text-sm text-gray-700 leading-relaxed" x-text="selectedOrder.shipping.address"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.shipFromCountry")}</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.shipping.shipFrom"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.shippingMethod")}</p>
                  <p class="text-sm text-gray-700 whitespace-pre-line" x-text="selectedOrder.shipping.method"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Incoterms</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.shipping.incoterms"></p>
                </div>
              </div>
            </div>

            <!-- Ödeme paneli — Task 4'te eklenecek -->
            <!-- Tedarikçi paneli — Task 5'te eklenecek -->
          </div>
        </div>
```

- [ ] **Step 5: TypeScript + lint doğrula**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npx tsc --noEmit && npx eslint src/components/orders/OrdersPageLayout.ts src/i18n/locales/
```

- [ ] **Step 6: Browser doğrulama**

`/pages/dashboard/orders.html` → herhangi bir sipariş aç. Kontrol:

- 3 tab görünüyor (Kargo / Ödeme / Tedarikçi), aktif olan Kargo
- Aktif tab beyaz arka plan, border 3 kenar, içerikle birleşik
- Pasif tab'lar gri yazı, sadece alt çizgi
- Kargo içeriği görünüyor — 4 sütun adres/ülke/yöntem/incoterms + tracking status + linkler
- Ödeme / Tedarikçi tab'ına tıkla → boş içerik panel (henüz eklenmedi — beklenen)

Mobile (DevTools, 360px):
- 3 tab yatay sığar, font küçülür
- Grid 1 sütuna düşer

İngilizce kontrolü: Browser'da locale'i İngilizce'ye al (i18n switcher) → tab etiketleri "Shipping / Payment / Supplier" olmalı, "Shipping details" gibi uzun değil.

- [ ] **Step 7: Format + commit**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npm run lint:fix
git add src/components/orders/OrdersPageLayout.ts src/i18n/locales/tr.ts src/i18n/locales/en.ts
git commit -m "$(cat <<'EOF'
feat(orders): boxed tab container + Kargo paneli + i18n tab etiketleri

Section 5-7 yerine tek boxed tab grubu (Kargo/Ödeme/Tedarikçi).
Bu commit tab shell'i + Kargo içeriğini + 3 yeni i18n anahtarı
(tabShipping/tabPayment/tabSupplier) ekler. Ödeme ve Tedarikçi
panelleri sonraki tasklarda taşınacak.
EOF
)"
```

---

## Task 4 — Ödeme tab içeriği (Section 6 → panel)

**Files:**
- Modify: `src/components/orders/OrdersPageLayout.ts` — Section 6 bloğunu (artık eski 669-754 satır aralığı; Task 3'ten sonra satır numaraları kaymıştır) Task 3'te oluşturulan tab panel container'ının içine taşı.

- [ ] **Step 1: Mevcut Section 6'yı bul**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
grep -n "Section 6: Ödeme detayları" src/components/orders/OrdersPageLayout.ts
```

Çıkan satır numarası `<!-- Section 6: ... -->` ile başlayan div'in ilk satırı. Bu div, kendine ait `<div class="px-7 ... border-b border-gray-100">` wrapper'ı ile çevrelidir ve `</div>` ile kapanır.

- [ ] **Step 2: Section 6 bloğunu çıkar**

`src/components/orders/OrdersPageLayout.ts` içinde `<!-- Section 6: Ödeme detayları -->` ile başlayan ve onun ait olduğu wrapper `</div>` ile kapanan tüm bloğu **sil**. (Mevcut: H2 başlık + flex header + 2-sütun grid: sol durum + sağ toplam kutusu.)

- [ ] **Step 3: Task 3'te oluşturduğun tab container içine Ödeme panelini ekle**

Tab container içinde `<!-- Ödeme paneli — Task 4'te eklenecek -->` placeholder yorum satırını şu blokla değiştir:

```html
            <!-- Ödeme paneli -->
            <div x-show="activeDetailTab === 'payment'" x-transition.opacity id="panel-payment" role="tabpanel" aria-labelledby="tab-payment">
              <div class="flex items-center justify-end gap-2 mb-4 flex-wrap">
                <button @click="openModal('showPaymentHistory')" class="px-4 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">
                  ${t("orders.paymentHistoryTitle")}
                </button>
                <div class="relative" x-data="{ moreOpen: false }">
                  <button @click="moreOpen = !moreOpen" class="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 bg-transparent border border-gray-200 rounded-full cursor-pointer transition-colors">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>
                  </button>
                  <div x-show="moreOpen" @click.outside="moreOpen = false" x-transition class="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 min-w-[160px]">
                    <button @click="downloadInvoice(selectedOrder); moreOpen = false" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      ${t("orders.downloadInvoice")}
                    </button>
                    <template x-if="canRefund(selectedOrder)">
                      <button @click="openRefundModal(selectedOrder); moreOpen = false" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer flex items-center gap-2">
                        <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        ${t("orders.requestRefund")}
                      </button>
                    </template>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 max-sm:grid-cols-1 gap-6 max-sm:gap-4">
                <!-- Left: Payment status -->
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full"
                        :class="selectedOrder.payment.status === 'Paid' ? 'bg-green-50 text-green-700' :
                                selectedOrder.payment.status === 'Processing' ? 'bg-blue-50 text-blue-700' :
                                selectedOrder.payment.status === 'Refunded' ? 'bg-purple-50 text-purple-700' :
                                'bg-amber-50 text-amber-700'">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                           x-show="selectedOrder.payment.status === 'Paid'"><path stroke-linecap="round" d="M5 13l4 4L19 7"/></svg>
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                           x-show="selectedOrder.payment.status === 'Refunded'"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                           x-show="selectedOrder.payment.status !== 'Paid' && selectedOrder.payment.status !== 'Refunded'"><path stroke-linecap="round" d="M12 8v4m0 4h.01"/><circle cx="12" cy="12" r="10"/></svg>
                      <span x-text="selectedOrder.payment.status === 'Paid' ? 'Ödendi' : selectedOrder.payment.status === 'Refunded' ? 'İade Edildi' : selectedOrder.payment.status === 'Unpaid' ? 'Ödenmedi' : selectedOrder.payment.status"></span>
                    </span>
                  </div>
                  <template x-if="selectedOrder.payment.hasRecord">
                    <a href="#" class="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      ${t("orders.viewPaymentHistory")}
                    </a>
                  </template>
                  <template x-if="!selectedOrder.payment.hasRecord">
                    <p class="text-sm text-gray-400">${t("orders.noPaymentRecord")}</p>
                  </template>
                </div>
                <!-- Right: Summary table -->
                <div class="bg-gray-50 rounded-lg p-4 max-sm:p-3">
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-500">${t("orders.subtotal")}</span>
                      <span class="text-gray-800">${getCurrencyCode()} <span x-text="selectedOrder.payment.subtotal"></span></span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-500">${t("orders.shippingFee")}</span>
                      <span class="text-gray-800">${getCurrencyCode()} <span x-text="selectedOrder.payment.shippingFee"></span></span>
                    </div>
                    <div class="border-t border-gray-200 pt-2.5 flex items-center justify-between text-sm">
                      <span class="text-gray-500">${t("orders.subtotal")}</span>
                      <span class="text-gray-800">${getCurrencyCode()} <span x-text="selectedOrder.payment.grandTotal"></span></span>
                    </div>
                    <div class="flex items-center justify-between text-base font-bold">
                      <span class="text-gray-900">${t("orders.grandTotal")}*</span>
                      <span class="text-gray-900">${getCurrencyCode()} <span x-text="selectedOrder.payment.grandTotal"></span></span>
                    </div>
                  </div>
                  <p class="text-[11px] text-gray-400 mt-3 leading-relaxed">${t("orders.totalDisclaimer")}</p>
                </div>
              </div>
            </div>

            <!-- Tedarikçi paneli — Task 5'te eklenecek -->
```

- [ ] **Step 4: TypeScript + lint doğrula**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npx tsc --noEmit && npx eslint src/components/orders/OrdersPageLayout.ts
```

- [ ] **Step 5: Browser doğrulama**

`/pages/dashboard/orders.html` → sipariş aç → "Ödeme" tab'ına tıkla:

- Sağ üstte "Ödeme Geçmişi" pill butonu + `...` üç nokta menü
- `...` menüde "Faturayı indir" + (refund edilebiliyorsa) "İade talep et"
- Sol: ödeme durum rozeti (renkli, ikon ile) + (kayıt varsa) "Ödeme geçmişini gör" linki / yoksa "Kayıt yok" mesajı
- Sağ: gri kutu — Ara toplam / Kargo / Ara toplam / **Genel toplam** + disclaimer

Mobile: 2 sütun → 1 sütuna düşer.

- [ ] **Step 6: Format + commit**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npm run lint:fix
git add src/components/orders/OrdersPageLayout.ts
git commit -m "$(cat <<'EOF'
feat(orders): Ödeme detaylarını tab paneline taşı

Mevcut Section 6 bloğu (status rozeti, ödeme geçmişi butonu, ... menü,
2-sütun durum+toplam grid'i) silindi ve activeDetailTab='payment'
panel'ine taşındı. Bilgi seti ve davranış birebir korunur.
EOF
)"
```

---

## Task 5 — Tedarikçi tab içeriği (Section 7 → panel)

**Files:**
- Modify: `src/components/orders/OrdersPageLayout.ts` — Section 7 bloğunu sil ve tab panel'ine ekle.

- [ ] **Step 1: Mevcut Section 7'yi bul**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
grep -n "Section 7: Tedarikçi detayları" src/components/orders/OrdersPageLayout.ts
```

- [ ] **Step 2: Section 7 bloğunu sil**

`<!-- Section 7: Tedarikçi detayları -->` ile başlayan div ve onun kapanış `</div>`'i dahil tüm bloğu sil.

- [ ] **Step 3: Tedarikçi panelini tab container'a ekle**

`<!-- Tedarikçi paneli — Task 5'te eklenecek -->` placeholder yorum satırını şu blokla değiştir:

```html
            <!-- Tedarikçi paneli -->
            <div x-show="activeDetailTab === 'supplier'" x-transition.opacity id="panel-supplier" role="tabpanel" aria-labelledby="tab-supplier">
              <div class="grid grid-cols-4 max-sm:grid-cols-2 max-[380px]:grid-cols-1 gap-4 max-sm:gap-3 mb-4">
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.supplier")}</p>
                  <p class="text-sm font-medium text-gray-800" x-text="selectedOrder.supplier.name"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.contactName")}</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.supplier.contact"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.phone")}</p>
                  <p class="text-sm text-gray-700" x-text="selectedOrder.supplier.phone"></p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">${t("orders.email")}</p>
                  <p class="text-sm text-gray-700 break-all" x-text="selectedOrder.supplier.email"></p>
                </div>
              </div>
              <div class="flex items-center gap-4 max-sm:gap-3">
                <a :href="selectedOrder.supplier.code ? '/pages/seller/seller-shop.html?seller=' + encodeURIComponent(selectedOrder.supplier.code) : '#'" class="text-sm text-blue-600 hover:underline">${t("orders.visitStore")}</a>
              </div>
            </div>
```

- [ ] **Step 4: TypeScript + lint doğrula**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npx tsc --noEmit && npx eslint src/components/orders/OrdersPageLayout.ts
```

- [ ] **Step 5: Browser doğrulama**

`/pages/dashboard/orders.html` → sipariş aç → "Tedarikçi" tab'ına tıkla:
- 4 sütun: Tedarikçi adı / İletişim adı / Telefon / E-posta
- Mobile 360px → 2 sütun, 320px → 1 sütun
- En altta "Mağazayı ziyaret et" linki
- Diğer tab'lar (Kargo/Ödeme) hâlâ doğru içerikle çalışıyor

- [ ] **Step 6: Format + commit**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npm run lint:fix
git add src/components/orders/OrdersPageLayout.ts
git commit -m "$(cat <<'EOF'
feat(orders): Tedarikçi detaylarını tab paneline taşı

Section 7 (firma/iletişim/telefon/e-posta + mağaza linki) silindi ve
activeDetailTab='supplier' panel'ine taşındı. Bu commit ile tab grubu
3/3 dolu.
EOF
)"
```

---

## Task 6 — Klavye navigasyonu (ARIA + sol/sağ ok)

**Files:**
- Modify: `src/components/orders/OrdersPageLayout.ts` — Task 3'te eklenen tab bar.

- [ ] **Step 1: Tab bar'daki 3 button'a klavye handler ekle**

Task 3'te eklediğin 3 tab button'ına `@keydown.right`, `@keydown.left`, `id` attribute'ları ekle. **Her button için**:

`shipping` tab button'ı için (Task 3'teki ilk button bloğu):
- `role="tab"` → kalır
- `:aria-selected="activeDetailTab === 'shipping'"` → kalır
- `aria-controls="panel-shipping"` → kalır
- **Yeni ekle:** `id="tab-shipping"`
- **Yeni ekle:** `@keydown.right.prevent="activeDetailTab = 'payment'; document.getElementById('tab-payment')?.focus()"`
- **Yeni ekle:** `@keydown.left.prevent="activeDetailTab = 'supplier'; document.getElementById('tab-supplier')?.focus()"`

`payment` tab button'ı:
- **Yeni ekle:** `id="tab-payment"`
- **Yeni ekle:** `@keydown.right.prevent="activeDetailTab = 'supplier'; document.getElementById('tab-supplier')?.focus()"`
- **Yeni ekle:** `@keydown.left.prevent="activeDetailTab = 'shipping'; document.getElementById('tab-shipping')?.focus()"`

`supplier` tab button'ı:
- **Yeni ekle:** `id="tab-supplier"`
- **Yeni ekle:** `@keydown.right.prevent="activeDetailTab = 'shipping'; document.getElementById('tab-shipping')?.focus()"`
- **Yeni ekle:** `@keydown.left.prevent="activeDetailTab = 'payment'; document.getElementById('tab-payment')?.focus()"`

- [ ] **Step 2: Tab bar wrapper'a `role="tablist"` ekle**

Task 3'te eklediğin `<div class="flex items-end gap-0">` tab bar wrapper'ına `role="tablist"` ve `aria-label="Sipariş detay bölümleri"` ekle. Hâli:

```html
<div class="flex items-end gap-0" role="tablist" aria-label="Sipariş detay bölümleri">
```

- [ ] **Step 3: TypeScript + lint doğrula**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npx tsc --noEmit && npx eslint src/components/orders/OrdersPageLayout.ts
```

- [ ] **Step 4: Browser doğrulama**

`/pages/dashboard/orders.html` → sipariş aç:
- Klavye ile tab button'a focus (Tab tuşu ile odakla)
- Sol/sağ ok tuşları ile tab'lar arası geçiş yap; focus yeni tab'a taşınmalı, içerik değişmeli
- DevTools'ta `Accessibility tree` → tab bar'ın `role: tablist`, her button'ın `role: tab`, `aria-selected` doğru güncelleniyor

- [ ] **Step 5: Format + commit**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npm run lint:fix
git add src/components/orders/OrdersPageLayout.ts
git commit -m "$(cat <<'EOF'
a11y(orders): tab bar için klavye navigasyonu ve ARIA tablist

Sol/sağ ok tuşları ile tab geçişi, role=tablist, her tab için
aria-selected/aria-controls/id. WAI-ARIA Authoring Practices'e
uygun davranış.
EOF
)"
```

---

## Task 7 — Manual QA: tüm spec test senaryoları

**Files:** Yok — sadece doğrulama. Spec'te tanımlı tüm senaryoları sırayla doğrula.

- [ ] **Step 1: Dev server çalışıyor olmalı**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npm run dev
# Tarayıcıda: http://localhost:5173/pages/dashboard/orders.html
```

- [ ] **Step 2: Spec §8 test senaryolarını sırayla yürüt**

Her senaryo için **beklenen davranışı doğrula**. Backend mock veya gerçek veriyle:

| # | Senaryo | Beklenen davranış | ✓ |
|---|---|---|---|
| 1 | 0 ürünlü sipariş (varsa) | Ürünler kartı: "0 Ürün · TRY 0.00" başlığı, ürün satırı yok, CTA yok, summary row 0 gösterir | ☐ |
| 2 | 3 ürünlü sipariş | 3 ürün listelenir, CTA yok | ☐ |
| 3 | 5 ürünlü sipariş | 5 ürün listelenir, CTA yok | ☐ |
| 4 | 6+ ürünlü sipariş | İlk 5 + "X ürün daha — tümünü göster" CTA | ☐ |
| 5 | CTA tıkla | Arama input + sırala dropdown belirir; liste 340px max-height; scroll çalışır | ☐ |
| 6 | Arama "valf" | Listede sadece "valf" geçen ürünler | ☐ |
| 7 | Arama temizlenince | Tüm ürünler döner | ☐ |
| 8 | Sırala "Fiyat ↑" | Liste fiyat artan | ☐ |
| 9 | Sırala "İsim A→Z" | Liste Türkçe alfabetik | ☐ |
| 10 | "↑ Daralt" | İlk 5'e döner, arama+sıralama sıfırlanır | ☐ |
| 11 | Kargo → Ödeme tab geçişi | İçerik değişir, ürün kart state'i bozulmaz | ☐ |
| 12 | Başka order seç (sidebar) | Tab Kargo'ya döner, ürün kartı kapalıya döner, arama temiz | ☐ |
| 13 | Mobile 360px | 3 tab yatay sığar; tab içeriği tek sütun | ☐ |
| 14 | Boş arama sonucu | "Aramayla eşleşen ürün bulunamadı" mesajı | ☐ |
| 15 | Klavye → sol/sağ ok | Tab değişir, focus taşınır | ☐ |
| 16 | Kargo "Pending" rozeti | Sağ üstte amber rozet görünür | ☐ |
| 17 | Ödeme "Ödenmedi" rozeti | Sol blokta amber rozet + ikon | ☐ |
| 18 | "Ödeme Yap" butonu (eski Section action butonu) | Stepper altındaki butondan modal hâlâ açılıyor | ☐ |
| 19 | Modify shipping link | Modal açılıyor (Kargo tab'ı içindeki link) | ☐ |
| 20 | Track package link | Modal açılıyor | ☐ |
| 21 | Ödeme geçmişi butonu | Modal açılıyor | ☐ |
| 22 | Mağazayı ziyaret et | seller-shop.html'e yönlendiriyor | ☐ |
| 23 | Stepper 5-step | Hâlâ doğru render (Sipariş → Ödeme → Hazırlanıyor → Kargoda → Teslim) | ☐ |
| 24 | Operation history butonu | En altta hâlâ var, modal açıyor | ☐ |

- [ ] **Step 3: Production build doğrula**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npm run build
```

Beklenen: `tsc` + `vite build` 0 error ile tamamlanır.

- [ ] **Step 4: Stil regression'ı kontrol**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
git diff main -- src/style.css | head -20
```

Beklenen: `src/style.css` dosyasında **0 değişiklik** (CLAUDE.md §0.1 — tüm stil utility ile yazıldı).

- [ ] **Step 5: i18n eklemeleri doğru mu?**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
git diff main -- src/i18n/locales/ | grep -E "^\+.*tab(Shipping|Payment|Supplier)"
```

Beklenen: 6 satır (TR + EN, her birinde 3 anahtar) eklenmiş; başka i18n değişikliği yok.

- [ ] **Step 6: Eğer QA'da bug bulduysan**

Tek bir "QA fix" commit'inde topla:

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
git add src/
git commit -m "$(cat <<'EOF'
fix(orders): QA bulgularını gider

[Burada bug'ları kısaca özetle]
EOF
)"
```

- [ ] **Step 7: PR hazırla (opsiyonel — kullanıcı isterse)**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
git log --oneline main..ahmet | head -10
```

Tüm commit'leri gör. PR açma kararı kullanıcıda.

---

## Notlar

- **Tek dosya değişikliği prensibi:** `style.css`, locale dosyaları, yeni component klasörü açılmayacak. Eğer task sırasında bir CSS utility'sinin yetmediğini düşünürsen önce CLAUDE.md §0.1 utility kontrol akışını uygula — Context7'den doğrula.
- **Alpine `x-data` nested scope yasak değil ama gerekli değil:** Sıralama dropdown'u için `x-data="{ sortOpen: false }"` zaten mevcut bir pattern (line 682). Aynı pattern Task 2'de tekrar kullanıldı — uygun.
- **`-mb-px` trick:** Aktif tab'ın alt border'ını içerik kartının üst border'ıyla örtüşüp gizlemesi için `margin-bottom: -1px`. Tailwind utility `-mb-px`. Bu boxed/folder tab pattern'inin standart yöntemi.
- **Yüzlerce ürün performansı:** 1000 ürün için bile DOM ~1000 row kabul edilebilir (Alpine reactive overhead minimal, image lazy-load tarayıcı default). Virtual scroll **bilinçli olarak yok** (YAGNI). Eğer ileride 5000+ ürün senaryosu gelirse ayrı bir spec açılır.
