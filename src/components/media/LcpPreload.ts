/**
 * T-122 — LCP adayı görsel için `<link rel="preload">`.
 *
 * NE YAPAR, NE YAPMAZ
 * -------------------
 * Bu modül tarayıcının görseli **KEŞFETME anını** öne çeker. Vitrin çok
 * sayfalı bir Vite uygulaması ve ürün detay sayfasının işaretlemesi JS'te
 * dizge olarak kuruluyor: `<img>` DOM'a ancak `host.innerHTML = ...`
 * atamasıyla giriyor. O atamadan önce daha ProductBuyBox, ProductTabs,
 * RelatedProducts, ProductOrderPanel dizgeleri kuruluyor ve sonra tüm blok
 * ayrıştırılıyor. `<head>`e konan bir `preload` bağlantısı ise EKLENDİĞİ ANDA
 * ağ isteğini başlatır — ana iş parçacığı hâlâ dizge kurarken.
 *
 * **Kazanç ölçülmedi.** Bu dosya "LCP şu kadar düştü" demiyor ve diyemez;
 * ölçüm ayrı bir iş (T-124 / T-004). Buradaki iddia yalnız şu: istek daha
 * erken başlıyor ve **fazladan bayt indirilmiyor**.
 *
 * ÜÇ TUZAK VE BU DOSYANIN GARANTİSİ
 * ---------------------------------
 * 1. **Her görseli preload etmek hiçbirini etmemekle aynıdır.**
 *    Talep sayısı burada bir *yorumla* değil, `MAX_LCP_PRELOADS` sabitiyle
 *    ve `<head>`deki işaretçi bağlantının VARLIĞIYLA sınırlanır. İkinci
 *    çağrı — hangi bileşenden, hangi sırayla gelirse gelsin — `false` döner
 *    ve hiçbir şey basmaz. Sayaç modül değişkeninde DEĞİL DOM'da tutuluyor:
 *    modül iki kez yüklense (HMR, ayrı chunk) bile üst sınır korunur.
 *
 * 2. **`imagesrcset` + `imagesizes` olmadan preload YANLIŞ görseli indirir.**
 *    Bu modül preload'u elle yazılmış bir adresten değil, **basılacak
 *    işaretlemenin kendisinden** türetir (`extractLcpSourceFromHtml`).
 *    Yani `srcset`/`sizes` dizgeleri kopyalanmaz, AYNI dizgedir — ıraksama
 *    yapısal olarak imkânsız. `w` tanımlayıcılı bir `srcset` varken `sizes`
 *    boşsa preload BASILMAZ (aşağıda gerekçesi).
 *
 * 3. **Format uyumu.** `<picture>` varken tarayıcı, `type`'ını
 *    DESTEKLEDİĞİ İLK `<source>`'u seçer. Preload da tam o `<source>`'un
 *    `type`ını taşır. Tarayıcı o biçimi desteklemiyorsa `type` uyuşmaz ve
 *    preload HİÇ ATILMAZ (HTML spesifikasyonu: desteklenmeyen `type` →
 *    getirme yok); `<picture>` bir sonraki biçime düşer. Yani en kötü hâl
 *    "kazanç yok", asla "iki indirme" değil. AVIF+WebP için İKİ preload
 *    basmak bunu bozardı — bu yüzden yalnız BİRİNCİ `<source>` preload'lanır.
 *
 * NEDEN `href` YAZILMIYOR (srcset varken)
 * ---------------------------------------
 * `imagesrcset` taşıyan bir preload'a bir de `href` yazmak, `imagesrcset`
 * bilmeyen eski bir tarayıcıda `href`i indirtir; oysa aynı tarayıcı `<img>`
 * için kendi `srcset`inden BAŞKA bir adayı seçer → iki indirme. `href`siz
 * preload'u anlamayan tarayıcı hiçbir şey indirmez → kazanç yok, regresyon
 * da yok. Muhafazakâr olan ikincisi.
 */

import { sanitizeUrl } from "../../utils/sanitize";

/**
 * Bir belgede aynı anda kaç LCP preload'u olabilir.
 *
 * Bir. İki değil. Bir sayfada iki büyük görselin ikisi de "en büyük içerikli
 * boya" olamaz; ikincisi tanım gereği birincinin bandını çalar. Sabit burada
 * duruyor ki değeri artırmak bilinçli bir düzenleme olsun, kazara olmasın.
 */
export const MAX_LCP_PRELOADS = 1;

/** Bastığımız bağlantıyı tanıyan işaretçi — üst sınırın DOM'daki sayacı. */
export const LCP_PRELOAD_MARKER = "data-lcp-preload";

/** Tarayıcının GERÇEKTEN indireceği kaynağın tarifi. */
export interface LcpPreloadSource {
  /** `<img src>` — yalnız `srcset` YOKKEN preload adresi olur. */
  src: string;
  /** Tarayıcının seçeceği elemanın `srcset`i; yoksa boş dizge. */
  srcset: string;
  /** Aynı elemanın `sizes`ı; yoksa boş dizge. */
  sizes: string;
  /** Seçilecek `<source>`'un MIME tipi; bilinmiyorsa boş dizge. */
  type: string;
}

function _belge(doc?: Document | null): Document | null {
  if (doc) return doc;
  return typeof document === "undefined" ? null : document;
}

/** Adres güvenli mi — `ResponsiveImage._guvenliSrcset` ile aynı ölçüt. */
function _guvenliAdres(url: string): boolean {
  return Boolean(url) && sanitizeUrl(url) === url;
}

/**
 * `srcset` dizgesini denetle.
 *
 * @returns `"w"` (hepsi genişlik tanımlayıcılı), `"other"` (en az biri değil),
 *          `"unsafe"` (en az bir aday güvensiz şema taşıyor), `"empty"`.
 */
function _srcsetTuru(srcset: string): "w" | "other" | "unsafe" | "empty" {
  const parcalar = String(srcset || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parcalar.length) return "empty";
  let hepsiW = true;
  for (const parca of parcalar) {
    const bosluk = parca.search(/\s/);
    const url = bosluk === -1 ? parca : parca.slice(0, bosluk);
    const tanim = bosluk === -1 ? "" : parca.slice(bosluk + 1).trim();
    if (!_guvenliAdres(url)) return "unsafe";
    if (!/^\d+w$/.test(tanim)) hepsiW = false;
  }
  return hepsiW ? "w" : "other";
}

/**
 * Basılacak işaretlemeden, tarayıcının indireceği kaynağı çıkar.
 *
 * Girdi, çağıranın DÖNDÜRECEĞİ HTML dizgesidir — preload ile işaretleme
 * arasındaki ıraksamayı imkânsız kılan yer burası.
 *
 * Ayrıştırma `<template>` ile yapılır: `<template>` içeriği ETKİSİZDİR
 * (inert), içindeki `<img>` İNDİRİLMEZ. `innerHTML` ile geçici bir `<div>`
 * kullansaydık ayrıştırma anında bir fazladan istek doğardı.
 *
 * @returns Tek bir `<img>` bulunduysa tarif; hiç `<img>` yoksa ya da BİRDEN
 *          FAZLA `<img>` varsa `null` — hangisinin LCP olduğu bilinemez ve
 *          tahmin etmek 1. tuzağa düşmektir.
 */
export function extractLcpSourceFromHtml(
  html: string,
  doc?: Document | null
): LcpPreloadSource | null {
  const belge = _belge(doc);
  if (!belge || !html) return null;

  const tpl = belge.createElement("template");
  tpl.innerHTML = html;
  const imgler = tpl.content.querySelectorAll("img");
  if (imgler.length !== 1) return null;
  const img = imgler[0];

  const src = img.getAttribute("src") || "";
  const imgSizes = img.getAttribute("sizes") || "";

  // `<picture>` varsa tarayıcı, desteklediği İLK `<source>`'u alır.
  const ilkKaynak = tpl.content.querySelector("picture > source");
  if (ilkKaynak) {
    return {
      src,
      srcset: ilkKaynak.getAttribute("srcset") || "",
      sizes: ilkKaynak.getAttribute("sizes") || imgSizes,
      type: ilkKaynak.getAttribute("type") || "",
    };
  }

  // Düz `<img>`: `type` BİLİNMİYOR ve UYDURULMAZ. Dosya uzantısından biçim
  // tahmin etmek yanlış `type` yazma riski taşır; `type`sız preload her
  // tarayıcıda atılır ve `<img>` ile aynı adaya çözülür — uyum korunur.
  return { src, srcset: img.getAttribute("srcset") || "", sizes: imgSizes, type: "" };
}

/**
 * LCP adayı için `<link rel="preload">` bas. **En fazla bir kez.**
 *
 * @returns Bağlantı gerçekten basıldıysa `true`. `false` dönen her yol bir
 *          "basmamak daha doğru" kararıdır ve gerekçesi kodda yazılı.
 */
export function preloadLcpImage(source: LcpPreloadSource, doc?: Document | null): boolean {
  const belge = _belge(doc);
  if (!belge || !belge.head) return false;

  // ÜST SINIR — 1. tuzak. Sayaç DOM'da: modül iki kez yüklense de korunur.
  if (belge.head.querySelectorAll(`link[${LCP_PRELOAD_MARKER}]`).length >= MAX_LCP_PRELOADS) {
    return false;
  }

  const srcsetTuru = _srcsetTuru(source.srcset);
  if (srcsetTuru === "unsafe") return false;

  const link = belge.createElement("link");
  link.setAttribute("rel", "preload");
  link.setAttribute("as", "image");

  if (srcsetTuru === "w") {
    // 2. tuzak: `w` tanımlayıcılı bir `srcset`te `sizes` YOKSA tarayıcı
    // `100vw` varsayar. `<img>` de aynı varsayımı yapardı ama biz `<img>`in
    // ne yaptığını TAHMİN etmiyoruz — `sizes` yoksa iki tarafın aynı adaya
    // çözüleceğini KANITLAYAMAYIZ, o yüzden basmayız.
    if (!source.sizes) return false;
    link.setAttribute("imagesrcset", source.srcset);
    link.setAttribute("imagesizes", source.sizes);
    // `href` BİLİNÇLİ YAZILMIYOR — gerekçe dosya başlığında.
  } else if (srcsetTuru === "other") {
    // `x` tanımlayıcılı ya da tanımlayıcısız `srcset`: `imagesizes` anlamsız,
    // seçim DPR'a bağlı. Preload'un `<img>` ile aynı adayı seçeceğini
    // garanti edemeyiz → basmayız. (Bugün manifest yalnız `w` üretiyor.)
    return false;
  } else {
    // `srcset` yok → `<img src>` tek aday. Adres birebir odur.
    if (!_guvenliAdres(source.src)) return false;
    link.setAttribute("href", source.src);
  }

  // 3. tuzak: biçim uyumu. Desteklenmeyen `type` → tarayıcı preload'u ATLAR,
  // `<picture>` bir sonraki `<source>`'a düşer. İkinci bir indirme doğmaz.
  if (source.type) link.setAttribute("type", source.type);

  // `<img fetchpriority="high">` ile aynı sinyal; ikisi ayrışırsa tarayıcı
  // aynı kaynağı iki farklı öncelikle görür.
  link.setAttribute("fetchpriority", "high");
  link.setAttribute(LCP_PRELOAD_MARKER, "");

  belge.head.appendChild(link);
  return true;
}

/**
 * Basılacak işaretlemeden preload üret — çağıranların kullandığı tek kapı.
 *
 * @param html Çağıranın DÖNDÜRECEĞİ işaretleme (henüz DOM'a girmemiş).
 * @returns Bağlantı basıldıysa `true`.
 */
export function preloadLcpImageFromHtml(html: string, doc?: Document | null): boolean {
  const kaynak = extractLcpSourceFromHtml(html, doc);
  if (!kaynak) return false;
  return preloadLcpImage(kaynak, doc);
}

/**
 * Basılmış bağlantıyı kaldır ve üst sınırı serbest bırak.
 *
 * Vitrinde ÜRETİM YOLUNDA ÇAĞRILMAZ: her gezinme tam sayfa yüklemesidir,
 * `<head>` zaten sıfırlanır. Testler için ve gelecekte bir SPA rotası
 * eklenirse diye var.
 */
export function resetLcpPreload(doc?: Document | null): void {
  const belge = _belge(doc);
  if (!belge || !belge.head) return;
  for (const link of Array.from(belge.head.querySelectorAll(`link[${LCP_PRELOAD_MARKER}]`))) {
    link.remove();
  }
}
