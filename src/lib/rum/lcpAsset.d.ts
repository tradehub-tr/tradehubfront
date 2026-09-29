export const PROFILE_UNKNOWN: "unknown";

/** T-5 (2026-09-28): eski shard türevi + okunur SEO adresi — ikisi de "original" saymaz. */
export const NON_ORIGINAL_RENDITION: RegExp;

export function parseProfile(url: string): string;
export function parseFormat(url: string): string;
export function normalizeRegion(region: string): string;

export interface LcpAssetTags {
  lcp_profile: string;
  lcp_format: string;
  lcp_region: string;
}

export interface LcpAssetOptions {
  doc?: Document;
}

export function lcpAssetTags(metric: unknown, opts?: LcpAssetOptions): LcpAssetTags;
