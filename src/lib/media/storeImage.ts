/**
 * Mağaza görselleri (logo, kapak, vitrin slaytı, şirket galerisi) — WebP türev seçimi.
 *
 * Ürün görselinin aksine mağaza görselleri ilana bağlı değil; ilan bazlı
 * manifest ucu (`get_manifest_batch`) onları göremez. Backend satıcı yanıtlarına
 * her görsel alanının yanına `<alan>_media` gövdesi gömer
 * (`tradehub_core.api.media_manifest.magaza_gorsel_medyasi`):
 *
 *     logo: "/files/0a/…png"
 *     logo_media: { src, srcset: "…w64.webp 64w, …w128.webp 128w, …w256.webp 256w", width, height }
 *
 * `sizes` BİLEREK backend'den gelmez: aynı logo ürün sayfasında 30 px,
 * mağaza başlığında 140 px basılıyor — `sizes` basıldığı yerin bilgisidir ve
 * `STORE_IMAGE_SIZES` tablosunda durur (ölçümler: Playwright, 2026-09-30).
 *
 * Gövde yoksa (türev henüz üretilmedi, bayrak kapalı) çağıran bugünkü ham
 * adrese düşer — davranış bugünküyle aynı kalır.
 */

import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { STORE_PLACE_SIZES } from "./placements.gen";

/** Satıcının önizleme penceresinde seçtiği odak noktası, 0-1 (`Media Crop Intent`). */
export interface StoreImageFocal {
  x: number;
  y: number;
}

/** Backend `magaza_gorsel_medyasi` gövdesi. */
export interface StoreImageMedia {
  /** Yedek adres (en büyük WebP türevi). */
  src: string;
  /** `url 64w, url 128w, …` — yalnız WebP. */
  srcset: string;
  width: number;
  height: number;
  focal?: StoreImageFocal;
}

/**
 * Basıldığı yere göre `sizes` — CSS kutusunun ölçülmüş genişliği.
 * Proje kırılım noktaları: sm 480, md 640, lg 768, xl 1024 (`src/style.css`).
 */
export const STORE_IMAGE_SIZES = {
  /** Ürün detay satıcı paneli: `w-10 h-10` + çerçeve + `p-1` → 30 px. */
  productSellerPanelLogo: "30px",
  /** Ürün detay Tedarikçi sekmesi: 64×64. */
  productSupplierLogo: "64px",
  /** Mağaza sayfası yan kart: `w-12 h-12` + `p-1` → 38 px. */
  storefrontSidebarLogo: "38px",
  /** Dükkan iletişim formu (56 px yuvarlak, p-1 → 46 px) ve yan mini kart (36 px). */
  shopContactLogo: "46px",
  shopSidebarLogo: "36px",
  /** Üretici hero kartı 116 px, liste kartı ~40 px. */
  manufacturerHeroLogo: "116px",
  manufacturerListLogo: "50px",
  /** Favoriler satıcı satırı: `size-10` + p-1 → 30 px. */
  favoritesLogo: "30px",
  /** Marka sayfası sahip rozeti: 16 px. */
  brandOwnerLogo: "16px",
  /**
   * Önizleme penceresiyle ORTAK yerler — galleryMain, galleryThumb,
   * manufacturerGallery, shopHeaderLogoDesktop, shopHeaderLogoMobile.
   * Tek kaynak `placements.json → preview_places`; elle yazılmaz.
   */
  ...STORE_PLACE_SIZES,
} as const;

export type StoreImagePlacement = keyof typeof STORE_IMAGE_SIZES;

/** Gövdeyi doğrula; kullanılamazsa `null` (çağıran ham adrese düşer). */
export function toStoreImageMedia(value: unknown): StoreImageMedia | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const srcset = typeof v.srcset === "string" ? v.srcset.trim() : "";
  const src = typeof v.src === "string" ? v.src.trim() : "";
  const focal = storeImageFocal(v);
  // Yalnız odak gövdesi (srcset ""): türev yok ama odak uygulanmalı → srcset'siz döner.
  if (!src || (!srcset && !focal)) return null;
  return {
    src,
    srcset,
    width: Number(v.width) || 0,
    height: Number(v.height) || 0,
    ...(focal ? { focal } : {}),
  };
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** `focal` alanını doğrula; yoksa ya da bozuksa `null` (vitrin ortadan kırpar). */
export function storeImageFocal(value: unknown): StoreImageFocal | null {
  if (!value || typeof value !== "object") return null;
  const f = (value as Record<string, unknown>).focal;
  if (!f || typeof f !== "object") return null;
  const rx = (f as Record<string, unknown>).x;
  const ry = (f as Record<string, unknown>).y;
  // null / "" / boşluk Number()'da 0 olur → "0% 0%" yazılmasın.
  const blank = (r: unknown): boolean => r === null || r === undefined || (typeof r === "string" && !r.trim());
  if (blank(rx) || blank(ry)) return null;
  const x = Number(rx);
  const y = Number(ry);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: clamp01(x), y: clamp01(y) };
}

/** CSS `object-position` — admin önizlemesiyle AYNI biçim (`geometry.js::objectPosition`). */
export function storeImgPosition(media: unknown): string | null {
  const f = storeImageFocal(media);
  if (!f) return null;
  const p = (v: number): string => `${Math.round(v * 1000) / 10}%`;
  return `${p(f.x)} ${p(f.y)}`;
}

function sizesFor(placement: StoreImagePlacement | { sizes: string }): string {
  return typeof placement === "string" ? STORE_IMAGE_SIZES[placement] : placement.sizes;
}

/**
 * Vitrin bandı `sizes`i: tam genişlik, sabit yükseklik, `object-cover`.
 *
 * Bant yüksekliği 180/220/320/400 px (<480 / ≥480 / ≥640 / ≥768). Görsel
 * yüksekliğe oturduğunda gereken genişlik `yükseklik × oran` olur; dar ekranda
 * bu 100vw'yi aşar (1920×720 slayt 375 px telefonda 180 px yükseklikte 480 CSS
 * px ister). `sizes` ikisinin büyüğünü söyler; oran bilinmiyorsa 100vw.
 */
export function coverBandSizes(media: unknown): string {
  const m = toStoreImageMedia(media);
  const oran = m && m.width > 0 && m.height > 0 ? m.width / m.height : 0;
  if (!oran) return "100vw";
  const w = (h: number): string => `max(100vw, ${Math.ceil(h * oran)}px)`;
  return [
    `(min-width: 768px) ${w(400)}`,
    `(min-width: 640px) ${w(320)}`,
    `(min-width: 480px) ${w(220)}`,
    w(180),
  ].join(", ");
}

/** `srcset` adaylarını tek tek güvenli adrese çevir (sanitizeUrl). */
function safeSrcset(srcset: string): string {
  return srcset
    .split(",")
    .map((aday) => {
      const deger = aday.trim();
      if (!deger) return "";
      const bosluk = deger.search(/\s/);
      const url = bosluk === -1 ? deger : deger.slice(0, bosluk);
      const tanim = bosluk === -1 ? "" : deger.slice(bosluk).trim();
      const guvenli = sanitizeUrl(url, "");
      if (!guvenli) return "";
      return tanim ? `${guvenli} ${tanim}` : guvenli;
    })
    .filter(Boolean)
    .join(", ");
}

/**
 * HTML dizgesi basan bileşenler için `src`/`srcset`/`sizes` öznitelikleri.
 *
 * Türev varsa `src` WebP yedeğidir ve tarayıcı `srcset`ten kutuya uyan en
 * küçük türevi seçer; yoksa yalnız `src="<ham adres>"` basılır (bugünkü davranış).
 * Dönen dizge baştaki boşlukla başlar: `<img${storeImgAttrs(...)} alt=…>`.
 */
export function storeImgAttrs(
  media: unknown,
  fallbackUrl: string | null | undefined,
  placement: StoreImagePlacement | { sizes: string }
): string {
  const pos = storeImgPosition(media);
  const style = pos ? ` style="object-position:${escapeHtml(pos)}"` : "";
  const m = toStoreImageMedia(media);
  if (!m) return ` src="${escapeHtml(sanitizeUrl(fallbackUrl ?? ""))}"${style}`;
  const srcset = safeSrcset(m.srcset);
  if (!srcset) return ` src="${escapeHtml(sanitizeUrl(fallbackUrl ?? ""))}"${style}`;
  // srcset + sizes, src'den ÖNCE: tarayıcı kaynak seçimini tek geçişte yapsın.
  return (
    ` srcset="${escapeHtml(srcset)}" sizes="${escapeHtml(sizesFor(placement))}"` +
    ` src="${escapeHtml(sanitizeUrl(m.src))}"${style}`
  );
}

/**
 * Alpine bağlamaları için (`:srcset`, `:src`): türev yoksa `srcset` `null`
 * döner — Alpine `null`da özniteliği hiç yazmaz.
 */
export function storeImgSrcset(media: unknown): string | null {
  const m = toStoreImageMedia(media);
  if (!m) return null;
  return safeSrcset(m.srcset) || null;
}

export function storeImgSrc(media: unknown, fallbackUrl: string | null | undefined): string {
  const m = toStoreImageMedia(media);
  return sanitizeUrl(m?.src || fallbackUrl || "", "");
}
