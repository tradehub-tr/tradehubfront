/*
 * VENDOR EKİ (2026-08-20) — T-123 storefront montajı. Kaynak pakette
 * (admin-panel) YOKTUR; yalnız bu storefront kopyasına eklendi.
 *
 * NEDEN: Bu MPA'da toplayıcının gördüğü `location.pathname` İKİ biçimde
 * gelir (ölçüldü 2026-08-20):
 *
 *   1. Pretty URL — nginx `rewrite ... break` tarayıcı adresini DEĞİŞTİRMEZ:
 *      `/urunler`, `/urun/bonny-kap`, `/sepet` … Bunlar `routeTemplate()`
 *      ile zaten eşleşir.
 *   2. Fiziksel dosya yolu — iç bağlantıların önemli bir kısmı hâlâ dosyaya
 *      gider (ölçüldü: `FooterLinks`, `MegaMenu`, `BottomNav`, `CategoryGrid`,
 *      `ProductSalesRank` … `/pages/products.html?cat=x` gibi). Bu yollar
 *      `ROUTE_TEMPLATES`'le eşleşmez ve HEPSİ `other` kovasına düşerdi —
 *      sayfa-tipi kırılımı oluşmazdı.
 *
 * Bu modül fiziksel yolu, sunucu şablonlarına DOKUNMADAN (rum.py başka
 * sahiplikte), istemci tarafında pretty karşılığına çevirir. Harita yalnız
 * `ROUTE_TEMPLATES` beyaz listesindeki rotaları kapsar; geri kalan fiziksel
 * sayfalar sunucu sözleşmesi gereği zaten `other`dır ve öyle kalır.
 *
 * Harita kaynağı: `nginx.conf.template` `map $uri $static_page_html` bloğu
 * + dinamik `location ~ ^/(urun|kategori|marka|magaza)/` rewrite'ları.
 */

/**
 * Fiziksel dosya yolu → beyaz listedeki rota şablonu.
 *
 * `/pages/categories.html` notu: nginx bu dosyayı hem `/kategoriler`
 * (beyaz listede YOK → `other`) hem `/kategori/:slug` için servis eder.
 * Ölçülen iç bağlantıların baskın biçimi `?cat=<slug>` taşıdığından dosya
 * `/kategori/:slug` sayılır; `/kategoriler` pretty URL'iyle gelen ziyaret
 * sunucu sözleşmesindeki gibi `other` kalır.
 */
const FIZIKSEL_ROTA = Object.freeze({
  "/index.html": "/",
  "/pages/products.html": "/urunler",
  "/pages/cart.html": "/sepet",
  "/pages/product-detail.html": "/urun/:slug",
  "/pages/categories.html": "/kategori/:slug",
  "/pages/brand.html": "/marka/:slug",
  "/pages/seller/seller-storefront.html": "/magaza/:code",
});

/**
 * Toplayıcının gördüğü ham yolu normalize et. **Asla fırlatmaz.**
 *
 * 1. Sorgu/fragment zaten `location.pathname`'de yoktur; yine de savunmacı
 *    olarak kırpılır ve sondaki `/` atılır.
 * 2. Dil öneki `/en` soyulur (`getStaticPageUrl` Faz 7 path prefix'i) —
 *    `/en/urun/x` de `/urun/:slug` kovasında sayılsın.
 * 3. Fiziksel `.html` yolu haritadan pretty karşılığına çevrilir.
 *
 * Eşleşme yoksa yol OLDUĞU GİBİ döner; şablona indirgeme kararı yine
 * `routeTemplate()`'indir (sunucu sözleşmesiyle birebir kalan tek yer).
 *
 * @param {string} path ham `location.pathname`
 * @returns {string}
 */
export function normalizePhysicalPath(path) {
  let yol = String(path || "")
    .split("?")[0]
    .split("#")[0]
    .trim();
  if (!yol) return yol;
  if (!yol.startsWith("/")) yol = `/${yol}`;
  yol = yol.replace(/\/+$/, "") || "/";
  if (yol === "/en") yol = "/";
  else if (yol.startsWith("/en/")) yol = yol.slice(3);
  return FIZIKSEL_ROTA[yol] || yol;
}
