export const PROFILE_UNKNOWN: "unknown";

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
