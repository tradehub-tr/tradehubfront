/**
 * Medya teslim manifesti istemcisi — Dalga A / A4.
 *
 * Backend ucu: `tradehub_core.api.media_manifest.get_manifest` (tek ilan) ve
 * `...get_manifest_batch` (çok ilan). İkisi de `allow_guest` ve ikisi de
 * `media_pipeline_enabled` bayrağı arkasında: bayrak KAPALIYKEN hata değil,
 * `{"enabled": false, "images": [...manifest: null], "renditions": []}`
 * döner. Bu istemci o yanıtı "manifest yok" diye okur ve çağıran bugünkü tek
 * `<img>` yoluna düşer.
 *
 * ÜÇ SERT KURAL
 * -------------
 * 1. **ASLA FIRLATMAZ.** Ağ hatası, 500, bozuk JSON, zaman aşımı — hepsi boş
 *    sonuca çevrilir. Vitrin bir manifest isteği yüzünden kırılmamalı; bu,
 *    bayrak kapalıyken sitenin bozulmamasının istemci tarafındaki garantisi.
 * 2. **SENKRON OKUMA AYRI.** `getImageManifest()` yalnız bellekteki önbelleğe
 *    bakar ve hiç `await` etmez. Bileşenler (ListingCard, ProductImageGallery)
 *    HTML dizgesi döndüren SENKRON fonksiyonlardır; onları async'e çevirmek
 *    tüm çağrı zincirini değiştirirdi. Önbellek soğuksa `null` döner ve
 *    bileşen bugünkü işaretlemeyi basar.
 * 3. **KAPALIYSA SUS.** İlk yanıt `enabled: false` derse oturum boyunca bir
 *    daha istek atılmaz (`_kapali`). Bayrak kapalıyken ödenen bedel oturum
 *    başına TEK küçük istek olur.
 *
 * ÖNBELLEK
 * --------
 * Bellekte `Map`, ayrıca `sessionStorage`da kalıcı (sayfa geçişleri arası —
 * bu çok sayfalı bir Vite uygulaması, her gezinme tam yeniden yükleme). TTL
 * `CACHE_TTL_MS`. `sessionStorage` yazımı başarısız olursa (kota/gizli mod)
 * sessizce geçilir: önbellek bir hızlandırmadır, doğruluk koşulu değil.
 */

import { NATIVE_API_BASE } from "../../utils/nativeHttp";

/** `RenderManifest.to_dict()` içindeki tek biçim girdisi. */
export interface MediaManifestSource {
  /** MIME tipi — `image/avif`, `image/webp`, `image/jpeg`. */
  type: string;
  /** `url 384w, url 768w, ...` */
  srcset: string;
  /** Slot bazlı `sizes`; bölge bazlısı için `lib/media/sizes.ts`. */
  sizes: string;
}

/**
 * Tek görselin teslim manifesti — backend `RenderManifest.to_dict()` çıktısı.
 * Anahtarlar bilinçli olarak HTML özniteliklerinin adıyla aynı (sözleşme:
 * `contracts/delivery.py`), araya çeviri katmanı girmesin diye.
 */
export interface MediaImageManifest {
  slot_key: string;
  /** Yedek adres — `<img src>`. */
  src: string;
  sizes: string;
  alt: string;
  loading: string;
  decoding: string;
  fetchpriority: string;
  /** İçsel genişlik; 0 ise ÖLÇÜLMEMİŞ demektir (uydurma değil). */
  width: number;
  height: number;
  aspect_ratio: number;
  /** Biçim sırası AVIF → WebP → JPEG; backend `FORMAT_ORDER` sabitler. */
  sources: MediaManifestSource[];
  poster?: string;
  captions?: string;
}

/** İlanın galerisindeki tek görsel kaydı. */
export interface MediaManifestImage {
  /** Ham `File.file_url` — ilan bugünkü `<img src>`inde bunu taşıyor. */
  file_url: string;
  alt_text: string;
  primary: boolean;
  asset: string;
  /** Türev üretilmemişse `null` — bu, hata değil "henüz yok" demek. */
  manifest: MediaImageManifest | null;
}

/** Tek ilanın manifest gövdesi. */
export interface MediaListingManifest {
  listing: string;
  slot: string;
  enabled: boolean;
  fallback: string;
  images: MediaManifestImage[];
  suppressed: number;
}

/** Varsayılan slot — ürün detay ve listeleme sayfalarının tamamı bunu basar. */
export const MEDIA_DEFAULT_SLOT = "product.image";

/** Backend `MAX_BATCH_LISTINGS` ile aynı; aşan istek kırpılır, biz parçalarız. */
const MAX_BATCH = 50;

/** Önbellek ömrü. Manifest içerik-adresli ETag taşır; bayatlık ucuz. */
const CACHE_TTL_MS = 5 * 60_000;

/** İstek zaman aşımı. Aşılırsa boş sonuç — sayfa beklemede kalmaz. */
const TIMEOUT_MS = 4_000;

const STORAGE_KEY = "tradehub-media-manifest-v1";

/**
 * "Bayrak kapalı" bilgisinin kalıcı anahtarı.
 *
 * Bu çok sayfalı bir Vite uygulaması: her gezinme TAM yeniden yükleme, yani
 * modül durumu sıfırlanır. Kapalılık bilgisi `sessionStorage`da tutulmazsa
 * bayrak kapalıyken bile her sayfa geçişinde bir istek atılırdı. Böylece
 * bedel oturum başına TEK isteğe iner.
 */
const DISABLED_KEY = "tradehub-media-manifest-off-v1";

const BASE_URL = NATIVE_API_BASE || import.meta.env.VITE_API_URL || "/api";
const BATCH_ENDPOINT = `${BASE_URL}/method/tradehub_core.api.media_manifest.get_manifest_batch`;

interface CacheEntry {
  ts: number;
  data: MediaListingManifest;
}

const _bellek = new Map<string, CacheEntry>();

/** Uçuşta olan istekler — aynı ilan iki kez istenmez. */
const _ucusta = new Map<string, Promise<void>>();

/**
 * Bayrak kapalı olduğu ÖĞRENİLDİ mi. `null` = henüz bilinmiyor.
 * `true` olduğunda bu oturumda bir daha istek atılmaz.
 */
let _kapali = false;

let _storageOkundu = false;

// ── önbellek ───────────────────────────────────────────────────────────

function _sessionOku(): void {
  if (_storageOkundu) return;
  _storageOkundu = true;
  try {
    if (sessionStorage.getItem(DISABLED_KEY) === "1") _kapali = true;
  } catch {
    // Erişilemiyorsa kapalılık her sayfada yeniden öğrenilir — sadece hız kaybı.
  }
  try {
    const ham = sessionStorage.getItem(STORAGE_KEY);
    if (!ham) return;
    const cozulen = JSON.parse(ham) as Record<string, CacheEntry>;
    const simdi = Date.now();
    for (const [ad, girdi] of Object.entries(cozulen)) {
      if (girdi && typeof girdi.ts === "number" && simdi - girdi.ts < CACHE_TTL_MS) {
        _bellek.set(ad, girdi);
      }
    }
  } catch {
    // Bozuk/erişilemez sessionStorage önbelleği yok sayılır — sadece hız kaybı.
  }
}

function _sessionYaz(): void {
  try {
    const duz: Record<string, CacheEntry> = {};
    for (const [ad, girdi] of _bellek) duz[ad] = girdi;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(duz));
  } catch {
    // Kota dolu ya da gizli mod: önbellek kalıcı olmaz, bellekteki yeterli.
  }
}

function _taze(ad: string): MediaListingManifest | null {
  _sessionOku();
  const girdi = _bellek.get(ad);
  if (!girdi) return null;
  if (Date.now() - girdi.ts > CACHE_TTL_MS) {
    _bellek.delete(ad);
    return null;
  }
  return girdi.data;
}

// ── doğrulama ──────────────────────────────────────────────────────────

function _sourceMu(deger: unknown): deger is MediaManifestSource {
  if (!deger || typeof deger !== "object") return false;
  const s = deger as Record<string, unknown>;
  return typeof s.type === "string" && typeof s.srcset === "string" && !!s.srcset.trim();
}

/**
 * Gövdeyi manifest olarak kabul et — YALNIZ gerçekten kullanılabilir ise.
 *
 * Boş `sources` ya da `srcset`siz kaynak taşıyan bir manifest `<picture>` için
 * boş bir kabuktur (`picture.py` aynı gerekçeyle `PictureError` atar). Burada
 * hata atmak yerine `null` dönüyoruz: çağıran bugünkü `<img>`e düşer.
 */
function _manifestTemizle(deger: unknown): MediaImageManifest | null {
  if (!deger || typeof deger !== "object") return null;
  const m = deger as Record<string, unknown>;
  const kaynaklar = Array.isArray(m.sources) ? m.sources.filter(_sourceMu) : [];
  if (kaynaklar.length === 0) return null;
  const src = typeof m.src === "string" ? m.src : "";
  if (!src.trim()) return null;
  return {
    slot_key: typeof m.slot_key === "string" ? m.slot_key : "",
    src,
    sizes: typeof m.sizes === "string" ? m.sizes : "",
    alt: typeof m.alt === "string" ? m.alt : "",
    loading: typeof m.loading === "string" ? m.loading : "",
    decoding: typeof m.decoding === "string" ? m.decoding : "",
    fetchpriority: typeof m.fetchpriority === "string" ? m.fetchpriority : "",
    width: Number(m.width) || 0,
    height: Number(m.height) || 0,
    aspect_ratio: Number(m.aspect_ratio) || 0,
    sources: kaynaklar,
  };
}

function _govdeTemizle(ad: string, deger: unknown): MediaListingManifest {
  const g = (deger && typeof deger === "object" ? deger : {}) as Record<string, unknown>;
  const hamGorseller = Array.isArray(g.images) ? g.images : [];
  const gorseller: MediaManifestImage[] = [];
  for (const ham of hamGorseller) {
    if (!ham || typeof ham !== "object") continue;
    const i = ham as Record<string, unknown>;
    const url = typeof i.file_url === "string" ? i.file_url : "";
    if (!url) continue;
    gorseller.push({
      file_url: url,
      alt_text: typeof i.alt_text === "string" ? i.alt_text : "",
      primary: !!i.primary,
      asset: typeof i.asset === "string" ? i.asset : "",
      manifest: _manifestTemizle(i.manifest),
    });
  }
  return {
    listing: typeof g.listing === "string" ? g.listing : ad,
    slot: typeof g.slot === "string" ? g.slot : MEDIA_DEFAULT_SLOT,
    enabled: !!g.enabled,
    fallback: typeof g.fallback === "string" ? g.fallback : "",
    images: gorseller,
    suppressed: Number(g.suppressed) || 0,
  };
}

// ── ağ ─────────────────────────────────────────────────────────────────

function _parcala(ilanlar: string[]): string[][] {
  const parcalar: string[][] = [];
  for (let i = 0; i < ilanlar.length; i += MAX_BATCH) {
    parcalar.push(ilanlar.slice(i, i + MAX_BATCH));
  }
  return parcalar;
}

/**
 * Tek bir toplu isteği yürüt ve önbelleğe yaz. HİÇBİR KOŞULDA reject etmez.
 */
async function _partiGetir(ilanlar: string[], slot: string): Promise<void> {
  const kontrol = new AbortController();
  const zamanlayici = setTimeout(() => kontrol.abort(), TIMEOUT_MS);
  try {
    const qs = new URLSearchParams({ listings: JSON.stringify(ilanlar), slot });
    const yanit = await fetch(`${BATCH_ENDPOINT}?${qs.toString()}`, {
      method: "GET",
      credentials: "include",
      signal: kontrol.signal,
    });
    if (!yanit.ok) return;
    const govde = (await yanit.json()) as { message?: Record<string, unknown> };
    const mesaj = govde?.message;
    if (!mesaj || typeof mesaj !== "object") return;

    // Bayrak kapalıysa oturum boyunca bir daha sorma. `enabled` alanı boş
    // manifestte de bulunur; yokluğu "bilinmiyor" sayılır, kapalı DEĞİL.
    if ("enabled" in mesaj && mesaj.enabled === false) {
      _kapali = true;
      try {
        sessionStorage.setItem(DISABLED_KEY, "1");
      } catch {
        // Kalıcı olamazsa yalnız bu sayfa için geçerli olur.
      }
    }

    const manifestler = (mesaj.manifests ?? {}) as Record<string, unknown>;
    const simdi = Date.now();
    for (const ad of ilanlar) {
      // Yanıtta olmayan ilan da önbelleğe BOŞ olarak yazılır: "bu ilanın
      // manifesti yok" da bir bilgidir ve her render'da yeniden sorulmamalı.
      _bellek.set(ad, { ts: simdi, data: _govdeTemizle(ad, manifestler[ad]) });
    }
    _sessionYaz();
  } catch {
    // Ağ hatası / zaman aşımı / bozuk JSON — önbelleğe hiçbir şey yazılmaz,
    // çağıran bugünkü `<img>` yolunda kalır. Konsola da basmıyoruz: bu uç
    // her sayfada çağrılıyor, gürültü olurdu.
  } finally {
    clearTimeout(zamanlayici);
  }
}

/**
 * Verilen ilanların manifestlerini önbelleğe al.
 *
 * Zaten taze olan ilanlar için istek atılmaz; uçuştaki istek varsa ona
 * beklenir. Bayrak kapalı öğrenildiyse hiç istek atılmaz.
 *
 * @returns Her koşulda resolve olan bir promise (reject ETMEZ).
 */
export function primeMediaManifests(
  listings: readonly string[],
  slot: string = MEDIA_DEFAULT_SLOT
): Promise<void> {
  // Oturum durumu HER ŞEYDEN ÖNCE okunur. `_kapali` modül düzeyinde bir
  // değişken ve bu bir MPA: her gezinme modülü sıfırdan yükler, yani taze
  // sayfada `_kapali` daima `false` başlar. Erken çıkışı `_sessionOku()`'dan
  // ÖNCE yapsaydık devre kesici hiç çalışmaz, `sessionStorage`da "kapalı"
  // işareti dursa bile ziyaret edilen her sayfa bir istek daha atardı.
  _sessionOku();
  if (_kapali) return Promise.resolve();

  const gerekli: string[] = [];
  const beklenecek: Promise<void>[] = [];
  const gorulen = new Set<string>();

  for (const ham of listings) {
    const ad = String(ham || "").trim();
    if (!ad || gorulen.has(ad)) continue;
    gorulen.add(ad);
    if (_taze(ad)) continue;
    const acik = _ucusta.get(ad);
    if (acik) {
      beklenecek.push(acik);
      continue;
    }
    gerekli.push(ad);
  }

  for (const parca of _parcala(gerekli)) {
    const is = _partiGetir(parca, slot).finally(() => {
      for (const ad of parca) _ucusta.delete(ad);
    });
    for (const ad of parca) _ucusta.set(ad, is);
    beklenecek.push(is);
  }

  return beklenecek.length ? Promise.all(beklenecek).then(() => undefined) : Promise.resolve();
}

// ── gömülü gövdeyi tohumlama (W10) ─────────────────────────────────────

/**
 * Gömülü manifest gövdesini önbelleğe TOHUMLA — ağ turu OLMADAN.
 *
 * W10 (rapor 101 §İş1): `get_listings` yanıtı İLK kartın görsel manifestini
 * gömüyor (`listing.py::_kart_gorsel_manifesti`). `mapListingCard` o gövdeyi
 * buraya verir; böylece `getMediaImageManifest(listing, primary_image)` daha
 * kart SENKRON basılırken sıcaktır ve LCP adayı ilk boyamada `<picture>`/AVIF
 * ile çıkar — ayrı `get_manifest_batch` turunu beklemeden. Kalan kartlar o
 * turda gelir (`primeMediaManifests` tohumlanmış kartı `_taze` görüp atlar).
 *
 * ÜÇ GÜVENCE (istemcinin diğer kurallarıyla tutarlı):
 *  1. **ASLA FIRLATMAZ** — bozuk/eksik gövde sessizce yok sayılır.
 *  2. **AĞ OTORİTESİNİ EZMEZ** — o ilan için TAZE bir kayıt zaten varsa (ağ
 *     turundan) tohum yazmaz; en güncel gövde korunur.
 *  3. **YALNIZ BELLEK** — `sessionStorage`a yazmaz; kalıcılık ağ turunun işi
 *     (gömülü gövde zaten `get_listings` yanıt cache'iyle her gezinmede gelir).
 */
export function seedMediaManifest(listing: string, body: unknown): void {
  const ad = String(listing || "").trim();
  if (!ad || !body || typeof body !== "object") return;
  _sessionOku();
  if (_taze(ad)) return;
  _bellek.set(ad, { ts: Date.now(), data: _govdeTemizle(ad, body) });
}

// ── senkron okuma (bileşenlerin kullandığı yüzey) ──────────────────────

/** Önbellekteki ilan manifesti; yoksa/bayatsa `null`. Ağ İSTEĞİ ATMAZ. */
export function getMediaManifest(listing: string): MediaListingManifest | null {
  const ad = String(listing || "").trim();
  return ad ? _taze(ad) : null;
}

/**
 * URL'i karşılaştırılabilir hâle getir: sorgu dizgesi ve köken atılır.
 *
 * Gerekçe: ilan `/files/x.jpg` taşırken `utils/mediaUrl.ts` GitHub Pages
 * dağıtımında aynı adresin başına `VITE_MEDIA_BASE` ekliyor. İki dizgeyi
 * ham hâlde karşılaştırmak o ortamda hiç eşleşme vermezdi.
 */
function _yolAnahtari(url: string): string {
  const metin = String(url || "")
    .split("?")[0]
    .split("#")[0];
  if (!metin) return "";
  const i = metin.indexOf("/files/");
  if (i >= 0) return metin.slice(i);
  const j = metin.indexOf("/private/files/");
  if (j >= 0) return metin.slice(j);
  return metin;
}

/**
 * Bir ilanın belirli görselinin manifesti; yoksa `null`.
 *
 * Eşleştirme `file_url` üzerinden yapılır — bileşenlerin elinde bugün olan tek
 * kimlik bu. Bulunamazsa (varyant swap sonrası yeni URL, manifest soğuk,
 * bayrak kapalı) `null` döner ve çağıran bugünkü `<img>`i basar.
 */
export function getMediaImageManifest(listing: string, fileUrl: string): MediaImageManifest | null {
  const govde = getMediaManifest(listing);
  if (!govde || !govde.images.length) return null;
  const anahtar = _yolAnahtari(fileUrl);
  if (!anahtar) return null;
  for (const gorsel of govde.images) {
    if (gorsel.manifest && _yolAnahtari(gorsel.file_url) === anahtar) return gorsel.manifest;
  }
  return null;
}

/** Test ve oturum kapanışı için — bellek + `sessionStorage` + kapalı bayrağı. */
export function clearMediaManifestCache(): void {
  _bellek.clear();
  _ucusta.clear();
  _kapali = false;
  _storageOkundu = false;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(DISABLED_KEY);
  } catch {
    // Erişilemiyorsa zaten yazılamamıştı.
  }
}
