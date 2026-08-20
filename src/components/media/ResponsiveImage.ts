/**
 * ResponsiveImage — manifestten `<picture>` üreten TEK nokta.
 *
 * Bu bileşen `tradehub_core/media/pipeline/delivery/picture.py`'nin istemci
 * karşılığıdır ve o modülün kararlarını BİREBİR uygular:
 *
 *   · Biçim sırası manifestin `sources` sırasıdır (AVIF → WebP → JPEG).
 *     Burada yeniden sıralama YAPILMAZ — iki yerde iki sıra olmasın diye.
 *   · **Yedek biçim `<source>` olarak değil, `<img srcset>` üstünde** taşınır.
 *     Aynı `srcset`i iki kez basmak baytı çoğaltır, seçimi değiştirmez.
 *   · **Tek biçim varsa `<picture>` sarmalı üretilmez** — tek `<source>`lu bir
 *     `<picture>` tarayıcıya hiçbir seçim sunmaz, yalnız DOM düğümü ekler.
 *   · `width`/`height` **HER ZAMAN** yazılır (CLS=0). Yazılamıyorsa üretim
 *     durur ve yedek yola düşülür — yanlış oran yazmak, hiç yazmamaktan kötü.
 *   · Öznitelik sırası sabittir (`IMG_ATTR_ORDER`): çıktı karşılaştırılabilir
 *     kalsın diye.
 *
 * PYTHON'DAN TEK SAPMA: HATA YOK, YEDEK VAR
 * ----------------------------------------
 * `picture.py` eksik ölçüde `PictureError` atar. Tarayıcıda bir istisna
 * ürünün görselini yok eder. Burada aynı koşul `fallback()`i çağırır — yani
 * **bugünkü tek `<img>` işaretlemesini**. Bu yüzden `fallback` zorunlu bir
 * parametredir ve bir kapanıştır (closure): çağıran kendi mevcut şablonunu
 * olduğu gibi verir, biz onu tek karakterine dokunmadan geri döndürürüz.
 *
 * `media_pipeline_enabled` KAPALIYKEN bu bileşenin ürettiği çıktı, çağıranın
 * `fallback()`inin çıktısıyla **BAYT BAYT AYNIDIR** — çünkü tam olarak odur.
 * `ListingCard.test.ts` anlık görüntüleri (karakterizasyon testi) bunun
 * güvenlik ağıdır; bu bileşen eklendikten sonra da değişmeden geçmelidir.
 */

import type { MediaImageManifest } from "../../lib/media/manifest";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

/** `<img>` öznitelik sırası — `picture.py::IMG_ATTR_ORDER` ile aynı. */
const IMG_ATTR_ORDER = [
  "src",
  "srcset",
  "sizes",
  "alt",
  "width",
  "height",
  "loading",
  "decoding",
  "fetchpriority",
  "class",
  "id",
  "style",
] as const;

/** `<source>` öznitelik sırası — `picture.py::SOURCE_ATTR_ORDER` ile aynı. */
const SOURCE_ATTR_ORDER = ["type", "srcset", "sizes"] as const;

/**
 * Boş değerle bile YAZILAN öznitelikler. `alt=""` bilinçli "dekoratif"
 * işaretidir; düşürülürse ekran okuyucu dosya adını okur.
 */
const KEEP_EMPTY = new Set<string>(["alt"]);

export interface ResponsiveImageOptions {
  /**
   * Görselin teslim manifesti. `null`/`undefined`/kullanılamaz olduğunda
   * `fallback()` döner. Kaynağı: `lib/media/manifest.ts::getMediaImageManifest`.
   */
  manifest?: MediaImageManifest | null;
  /**
   * **ZORUNLU.** Bugünkü tek `<img>` işaretlemesini döndüren kapanış.
   * Manifest yoksa/kullanılamazsa çıktı BİREBİR budur. Çağıran kendi mevcut
   * şablon literalini buraya taşır; yeniden yazmaz.
   */
  fallback: () => string;
  /**
   * Bölge bazlı `sizes` (`lib/media/sizes.ts`). Manifestin slot bazlı
   * `sizes`ini EZER — kutuyu bilen taraf CSS'i yazan taraftır.
   */
  sizes?: string;
  /**
   * LCP adayı. `true` → `fetchpriority="high"`, `decoding="sync"` ve
   * `loading` özniteliği HİÇ YAZILMAZ (varsayılan zaten `eager`; açıkça
   * `eager` yazmak bazı tarayıcılarda lazy-load sezgiselini uyandırır).
   * `false` → `loading="lazy"`, `decoding="async"`.
   * Verilmezse manifestin `loading`/`fetchpriority` alanları okunur.
   */
  priority?: boolean;
  /**
   * `priority` değilken `loading` özniteliğini düşürür (bugünkü "ızgaranın
   * ilk görseli eager, kalanı lazy" davranışı). `fetchpriority` YAZILMAZ:
   * bir ızgaradaki 20 kartın hepsine `high` vermek önceliği anlamsızlaştırır.
   * `priority: true` bunu ezer.
   */
  eager?: boolean;
  /** `alt`. Verilmezse manifestinki. Boş dizge geçerli bir değerdir. */
  alt?: string;
  /** `<img class>`. */
  imgClass?: string;
  /** `<picture class>` — yalnız sarmal üretildiğinde yazılır. */
  pictureClass?: string;
  /** `<img id>`. */
  imgId?: string;
  /** `<img style>`. */
  imgStyle?: string;
  /**
   * İçsel genişlik/yükseklik yedeği — manifest ölçü taşımıyorsa kullanılır.
   * İkisi de yoksa üretim DURUR ve `fallback()` döner (CLS kuralı).
   */
  width?: number;
  height?: number;
  /**
   * Sıra korunarak `<img>`e eklenen ek öznitelikler (`data-*`, `draggable`,
   * Alpine `:class` vb.). Sabit sıradan SONRA basılır; değeri `undefined`
   * olan atlanır. Anahtarlar kaçışlanmaz — çağıran sabit dizge vermeli.
   */
  extraAttrs?: Record<string, string | number | undefined>;
  /**
   * **EN DIŞTAKİ** elemana yazılan öznitelikler: sarmal üretildiyse
   * `<picture>`a, üretilmediyse `<img>`e.
   *
   * Neden ayrı bir kanal: ürün galerisinde zoom/lightbox CSS'i
   * `#gallery-main-image > [data-gallery-main-media="true"]` DOĞRUDAN ÇOCUK
   * seçicisiyle çalışıyor. İşaretçiyi koşulsuz `<img>`e yazsaydık, sarmal
   * eklendiği anda `<img>` torun olur ve seçici hiçbir şeyle eşleşmezdi —
   * zoom sessizce ölürdü. `hostAttrs` işaretçiyi her iki durumda da doğrudan
   * çocuk olan elemana koyar.
   */
  hostAttrs?: Record<string, string | number | undefined>;
}

/** `ad="değer"` çiftlerini kaçışlayarak ekle; `undefined` atlanır. */
function _ekAttrs(attrs: Record<string, string | number | undefined> | undefined): string {
  if (!attrs) return "";
  let cikti = "";
  for (const [ad, deger] of Object.entries(attrs)) {
    if (deger === undefined) continue;
    cikti += ` ${ad}="${escapeHtml(deger)}"`;
  }
  return cikti;
}

function _attrs(pairs: Array<[string, string | number | undefined]>): string {
  const sozluk = new Map<string, string>();
  for (const [ad, deger] of pairs) {
    if (deger === undefined || deger === null) continue;
    const metin = String(deger);
    if (metin === "" && !KEEP_EMPTY.has(ad)) continue;
    sozluk.set(ad, metin);
  }
  const parcalar: string[] = [];
  for (const ad of IMG_ATTR_ORDER) {
    const deger = sozluk.get(ad);
    if (deger !== undefined) parcalar.push(`${ad}="${deger}"`);
  }
  return parcalar.join(" ");
}

function _sourceAttrs(type: string, srcset: string, sizes: string): string {
  const sozluk: Record<string, string> = { type, srcset, sizes };
  const parcalar: string[] = [];
  for (const ad of SOURCE_ATTR_ORDER) {
    const deger = sozluk[ad];
    if (deger) parcalar.push(`${ad}="${escapeHtml(deger)}"`);
  }
  return parcalar.join(" ");
}

/**
 * `srcset`i kaçışla — ama önce her adayın adresini şema süzgecinden geçir.
 *
 * Manifest bizim ürettiğimiz adresleri taşısa da `url_for` çözücüsü DB'den
 * besleniyor; `javascript:` taşıyan tek bir adres tüm listeyi zehirler.
 * Reddedilen aday listeden DÜŞER; hiçbiri kalmazsa boş dizge döner ve çağıran
 * yedek yola gider.
 */
function _guvenliSrcset(srcset: string): string {
  const adaylar: string[] = [];
  for (const ham of String(srcset || "").split(",")) {
    const parca = ham.trim();
    if (!parca) continue;
    const bosluk = parca.search(/\s/);
    const url = bosluk === -1 ? parca : parca.slice(0, bosluk);
    const tanimlayici = bosluk === -1 ? "" : parca.slice(bosluk + 1).trim();
    // sanitizeUrl güvensiz şemada "#" döner — o adayı listeye ALMA.
    if (sanitizeUrl(url) !== url) continue;
    adaylar.push(tanimlayici ? `${url} ${tanimlayici}` : url);
  }
  return adaylar.join(", ");
}

interface _Hazir {
  sources: Array<{ type: string; srcset: string; sizes: string }>;
  src: string;
  width: number;
  height: number;
  sizes: string;
  alt: string;
}

/**
 * Manifesti işaretlemeye hazır hâle getir; üretilemiyorsa `null`.
 *
 * `null` dönen her koşul bir "yedek yola düş" kararıdır ve gerekçesi yorumda.
 */
function _hazirla(opts: ResponsiveImageOptions): _Hazir | null {
  const man = opts.manifest;
  if (!man) return null;

  const sizes = opts.sizes || man.sizes || "";
  const kaynaklar: _Hazir["sources"] = [];
  for (const kaynak of man.sources || []) {
    const srcset = _guvenliSrcset(kaynak.srcset);
    // Tüm adayları elenen bir biçim `<source>` olarak basılamaz.
    if (!srcset || !kaynak.type) continue;
    kaynaklar.push({ type: kaynak.type, srcset, sizes: kaynak.sizes || sizes });
  }
  if (!kaynaklar.length) return null;

  const src = sanitizeUrl(man.src);
  // sanitizeUrl güvensiz adreste "#" döner; onu `<img src>`e yazmak sayfayı
  // yeniden yükletir. Manifeste güvenmiyoruz — yedek yol daha güvenli.
  if (!src || src === "#" || src !== man.src) return null;

  // CLS kuralı: ölçü YOKSA üretim durur. Uydurulmuş oran, ölçülemeyen bir
  // CLS demektir (`picture.py::intrinsic_size` gerekçesi).
  const width = Number(man.width) || Number(opts.width) || 0;
  const height = Number(man.height) || Number(opts.height) || 0;
  if (width <= 0 || height <= 0) return null;

  return {
    sources: kaynaklar,
    src,
    width,
    height,
    sizes,
    alt: opts.alt !== undefined ? opts.alt : man.alt || "",
  };
}

/** `loading` / `decoding` / `fetchpriority` üçlüsü. */
function _yuklemeOznitelikleri(
  opts: ResponsiveImageOptions,
  man: MediaImageManifest
): Array<[string, string | undefined]> {
  let oncelik = opts.priority;
  if (oncelik === undefined) {
    oncelik = man.fetchpriority === "high" || man.loading === "eager";
  }
  if (oncelik) {
    // `loading` HİÇ yazılmaz — varsayılan zaten eager.
    return [
      ["decoding", "sync"],
      ["fetchpriority", "high"],
    ];
  }
  if (opts.eager) {
    // Bugünkü "ızgaranın ilk görseli" davranışı: eager ama `high` DEĞİL.
    return [["decoding", "async"]];
  }
  return [
    ["loading", "lazy"],
    ["decoding", "async"],
  ];
}

/**
 * Manifestten `<picture>` (tek biçimde düz `<img>`); üretilemezse `fallback()`.
 *
 * Çıktı tek satırdır ve dış boşluk taşımaz — çağıranın şablonuna gömülür.
 */
export function ResponsiveImage(opts: ResponsiveImageOptions): string {
  const hazir = _hazirla(opts);
  if (!hazir || !opts.manifest) return opts.fallback();

  const yedek = hazir.sources[hazir.sources.length - 1];
  const ciftler: Array<[string, string | number | undefined]> = [
    ["src", escapeHtml(hazir.src)],
    ["srcset", escapeHtml(yedek.srcset)],
    ["sizes", escapeHtml(yedek.sizes || hazir.sizes)],
    ["alt", escapeHtml(hazir.alt)],
    ["width", hazir.width],
    ["height", hazir.height],
    ["class", opts.imgClass ? escapeHtml(opts.imgClass) : ""],
    ["id", opts.imgId ? escapeHtml(opts.imgId) : ""],
    ["style", opts.imgStyle ? escapeHtml(opts.imgStyle) : ""],
  ];
  for (const [ad, deger] of _yuklemeOznitelikleri(opts, opts.manifest)) {
    ciftler.push([ad, deger]);
  }

  const sarmalVar = hazir.sources.length > 1;

  let img = `<img ${_attrs(ciftler)}`;
  img += _ekAttrs(opts.extraAttrs);
  // Sarmal yoksa en dıştaki eleman `<img>`dir.
  if (!sarmalVar) img += _ekAttrs(opts.hostAttrs);
  img += ">";

  // Tek biçim → sarmal hiçbir seçim sunmaz, yalnız DOM düğümü ekler.
  if (!sarmalVar) return img;

  let cikti = "<picture";
  if (opts.pictureClass) cikti += ` class="${escapeHtml(opts.pictureClass)}"`;
  cikti += `${_ekAttrs(opts.hostAttrs)}>`;
  // Sonuncu biçim `<img>` üstünde taşınır; burada TEKRAR EDİLMEZ.
  for (const kaynak of hazir.sources.slice(0, -1)) {
    cikti += `<source ${_sourceAttrs(kaynak.type, kaynak.srcset, kaynak.sizes || hazir.sizes)}>`;
  }
  return `${cikti}${img}</picture>`;
}
