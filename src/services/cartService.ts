/**
 * Cart Service — Frappe backend API ile sepet entegrasyonu.
 * `tradehub_core.api.cart.*` endpoint'lerini çağırır.
 */

import { callMethod } from "../utils/api";
import type { CartSupplier } from "../types/cart";

export interface CartResponse {
  suppliers: CartSupplier[];
}

export interface CartItemInput {
  listing: string;
  listing_variant?: string;
  quantity: number;
}

// ── Read ──────────────────────────────────────────────────────────────────────

/** Oturumdaki kullanıcının sepetini getirir. */
export async function fetchCart(): Promise<CartResponse> {
  return callMethod<CartResponse>("tradehub_core.api.cart.get_cart");
}

// ── Write ─────────────────────────────────────────────────────────────────────

/** Sepete ürün ekler (zaten varsa miktarı artırır). */
export async function apiAddToCart(
  listing: string,
  quantity: number,
  listingVariant?: string,
  variantLabel?: string,
  colorVariant?: string,
  extraAxes?: Record<string, string>,
  isSample?: boolean
): Promise<CartResponse> {
  return callMethod<CartResponse>(
    "tradehub_core.api.cart.add_to_cart",
    {
      listing,
      quantity,
      ...(listingVariant ? { listing_variant: listingVariant } : {}),
      ...(variantLabel ? { variant_label: variantLabel } : {}),
      ...(colorVariant ? { color_variant: colorVariant } : {}),
      ...(extraAxes && Object.keys(extraAxes).length > 0
        ? { extra_axes: JSON.stringify(extraAxes) }
        : {}),
      ...(isSample ? { is_sample: 1 } : {}),
    },
    true
  );
}

/** Stok kontrolü yapar, sepete eklemez. Yetersiz stokta hata fırlatır. */
export async function apiCheckStock(
  listing: string,
  quantity: number,
  listingVariant?: string,
  variantLabel?: string,
  isSample?: boolean
): Promise<void> {
  await callMethod<{ ok: boolean }>(
    "tradehub_core.api.cart.check_stock",
    {
      listing,
      quantity,
      ...(listingVariant ? { listing_variant: listingVariant } : {}),
      ...(variantLabel ? { variant_label: variantLabel } : {}),
      ...(isSample ? { is_sample: 1 } : {}),
    },
    true
  );
}

/** Sepet öğesinin miktarını günceller. */
export async function apiUpdateCartItem(
  cartItem: string,
  quantity: number
): Promise<{ success: boolean }> {
  return callMethod<{ success: boolean }>(
    "tradehub_core.api.cart.update_cart_item",
    { cart_item: cartItem, quantity },
    true
  );
}

/** Sepetten tek bir öğeyi siler. */
export async function apiRemoveCartItem(cartItem: string): Promise<{ success: boolean }> {
  return callMethod<{ success: boolean }>(
    "tradehub_core.api.cart.remove_cart_item",
    { cart_item: cartItem },
    true
  );
}

/** Sepetteki tüm öğeleri temizler. */
export async function apiClearCart(): Promise<{ success: boolean }> {
  return callMethod<{ success: boolean }>("tradehub_core.api.cart.clear_cart", {}, true);
}

/**
 * Misafir localStorage sepetini oturumdaki kullanıcının API sepeti ile birleştirir.
 * Giriş sonrasında çağrılmalıdır.
 */
export async function apiMergeGuestCart(items: CartItemInput[]): Promise<CartResponse> {
  return callMethod<CartResponse>(
    "tradehub_core.api.cart.merge_guest_cart",
    { items: JSON.stringify(items) },
    true
  );
}

export interface BackendOrderProduct {
  listing: string;
  listing_title: string;
  listing_variant?: string | null;
  variation: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image: string;
}

export interface BackendOrder {
  seller_id: string;
  seller_name: string;
  shipping_fee: number;
  shipping_method: string;
  currency: string;
  buyer_note?: string;
  products: BackendOrderProduct[];
}

export interface CouponResult {
  code: string;
  type: string;
  value: number;
  minOrder: number;
  description: string;
}

/** Kupon kodunu doğrular. */
export async function apiValidateCoupon(code: string, orderTotal: number): Promise<CouponResult> {
  return callMethod<CouponResult>("tradehub_core.api.cart.validate_coupon", {
    code,
    order_total: orderTotal,
  });
}

export interface BackendOrderItem {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  payment_method: string;
  currency: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  seller: string;
  seller_name: string;
  products: {
    name: string;
    variation: string;
    unit_price: string;
    quantity: number;
    total_price: string;
    image: string;
  }[];
}

/** Oturumdaki kullanıcının siparişlerini backend'den getirir. */
export async function apiGetOrders(
  page = 1
): Promise<{ orders: BackendOrderItem[]; total: number }> {
  return callMethod("tradehub_core.api.cart.get_orders", { page });
}

export interface ListingShippingMethod {
  id: string;
  method: string;
  cost: number;
  minDays: number | null;
  maxDays: number | null;
  estimatedDays: string;
  currency: string;
}

/** Belirtilen listing için satıcının tanımladığı kargo yöntemlerini getirir. */
export async function fetchShippingMethodsForListing(
  listingId: string
): Promise<ListingShippingMethod[]> {
  const result = await callMethod<{ data: ListingShippingMethod[] }>(
    "tradehub_core.api.listing.get_shipping_methods",
    { listing_id: listingId }
  );
  return result?.data ?? [];
}

// ── Address Book ─────────────────────────────────────────────────────────────

/** Birleşik adres tipi — DocType ile birebir eşleşir. */
export interface BuyerAddressData {
  id: string;
  title: string;
  contact_name: string;
  company: string;
  phone_prefix: string;
  phone: string;
  country: string;
  state: string; // İl / Province
  city: string; // İlçe / District
  street: string; // Açık adres satırı
  apartment: string; // Daire / Bina (opsiyonel)
  postal_code: string;
  note: string;
  is_default: boolean;
}

/** Kullanıcının tüm adreslerini çeker. */
export async function fetchAddresses(): Promise<BuyerAddressData[]> {
  return callMethod<BuyerAddressData[]>("tradehub_core.api.buyer.get_addresses");
}

/**
 * save_address endpoint response.
 * `address`: kaydedilen/güncellenen adres
 * `default_id`: save sonrası kullanıcının *mevcut* varsayılan adres id'si
 *   (backend _ensure_one_default otomatik reassign yapmış olabilir)
 */
export interface SaveAddressResult {
  address: BuyerAddressData;
  default_id: string;
}

/** Adres oluşturur veya günceller. `id` varsa güncelleme, yoksa yeni kayıt. */
export async function saveAddressApi(
  address: Omit<BuyerAddressData, "id"> & { id?: string }
): Promise<SaveAddressResult> {
  return callMethod<SaveAddressResult>(
    "tradehub_core.api.buyer.save_address",
    { address_json: JSON.stringify(address) },
    true
  );
}

/**
 * Bir adresi siler.
 * Backend silme sonrası `_ensure_one_default` invariant'ını tutarlı tutmak için
 * yeni default'u (`default_id`) döndürür — silinen default ise başka bir adres
 * default yapılır, çoklu-default broken state'i temizlenir. Caller bu değeri
 * kullanarak listedeki `is_default` flag'larını backend ile senkronlamalı.
 */
export async function deleteAddressApi(
  addressId: string
): Promise<{ success: boolean; default_id: string }> {
  return callMethod<{ success: boolean; default_id: string }>(
    "tradehub_core.api.buyer.delete_address",
    { address_id: addressId },
    true
  );
}

/** Bir adresi varsayılan yapar. */
export async function setDefaultAddressApi(addressId: string): Promise<void> {
  await callMethod<{ success: boolean }>(
    "tradehub_core.api.buyer.set_default_address",
    { address_id: addressId },
    true
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────

/** Backend'e gönderilecek fatura bilgisi (opsiyonel). */
export interface BillingInfoPayload {
  type: "Bireysel" | "Şirket";
  company_name: string;
  tax_office: string;
  tax_number: string;
  tcn: string;
  e_invoice: boolean;
  same_as_shipping: boolean;
  address: string;
  city: string;
  district: string;
  postal_code: string;
}

/** Ödeme onayı sonrası siparişleri backend'e kaydeder. */
export async function apiCreateOrder(
  orders: BackendOrder[],
  shippingAddress: string,
  paymentMethod: string,
  couponCode?: string,
  couponDiscount?: number,
  billingInfo?: BillingInfoPayload | null
): Promise<{ orders: unknown[] }> {
  return callMethod<{ orders: unknown[] }>(
    "tradehub_core.api.cart.create_order",
    {
      orders_json: JSON.stringify(orders),
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      coupon_code: couponCode || null,
      coupon_discount: couponDiscount || 0,
      billing_info_json: billingInfo ? JSON.stringify(billingInfo) : null,
    },
    true
  );
}
