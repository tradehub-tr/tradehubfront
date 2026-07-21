/**
 * Üreticiler (Manufacturer) sayfası facet servisi.
 *
 * Backend `seller.get_manufacturer_facets` — count birimi ÜRETİCİ sayısıdır (ilan değil).
 * `seller.get_sellers` ile aynı filtre çözümünü paylaşır → sayılar liste ile tutarlı
 * (monotonic narrow: aktif filtre seçilince kalan seçeneklerin sayıları daralır).
 */
import { api } from "../utils/api";

export interface ManufacturerFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface ManufacturerFacets {
  /** Tedarikçi ülkesi (value = Country adı, ör. "Turkey") */
  countries: ManufacturerFacetOption[];
  /** Mağaza puanı eşikleri (4+/3+/2+/1+) */
  ratings: ManufacturerFacetOption[];
  /** Firma yaşı eşikleri (5+/10+/15+ yıl) */
  foundedYears: ManufacturerFacetOption[];
  managementCertifications: ManufacturerFacetOption[];
  productCertifications: ManufacturerFacetOption[];
  /** Onaylanmış (Verified Seller) üretici sayısı */
  verifiedSupplierCount: number;
  /** Aktif filtrelere uyan toplam üretici sayısı */
  total: number;
}

export interface ManufacturerFacetParams {
  keyword?: string;
  category?: string;
  country?: string;
  min_rating?: string;
  min_order?: string;
  founded_year_min?: string;
  verified?: string;
  mgmt_certs?: string;
  product_certs?: string;
}

const EMPTY_FACETS: ManufacturerFacets = {
  countries: [],
  ratings: [],
  foundedYears: [],
  managementCertifications: [],
  productCertifications: [],
  verifiedSupplierCount: 0,
  total: 0,
};

export async function getManufacturerFacets(
  params: ManufacturerFacetParams = {}
): Promise<ManufacturerFacets> {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      p.set(key, String(value));
    }
  }
  const qs = p.toString();
  const response = await api<{ message: { data: ManufacturerFacets } }>(
    `/method/tradehub_core.api.seller.get_manufacturer_facets${qs ? "?" + qs : ""}`
  );
  return response.message?.data || EMPTY_FACETS;
}
