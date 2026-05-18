/**
 * Sprint 2 — User Profile Birleşmesi
 *
 * Backend tarafında Buyer Profile + Seller Profile birleşik User Profile'a taşındı.
 * Frontend bu interface ile yeni mimariyi temsil eder.
 *
 * KYC akışı: account_type=Business olan Buyer'lar için kyc_status state machine.
 * KYB akışı: can_sell=1 kullanıcılar için kyb_status (sadece İSTOÇ Marketplace Seller).
 *
 * Hibrit kullanıcı: can_buy=1 AND can_sell=1 ise hem storefront hem admin-panel erişimli.
 */

export type AccountType = "Individual" | "Business";

export type KycStatus = "" | "Pending" | "Verified" | "Rejected";
export type KybStatus = "" | "Pending" | "Under Review" | "Verified" | "Rejected" | "Expired";
export type UserStatus = "Active" | "Suspended" | "Deactivated";

export type BuyerLevel = "" | "Bronze" | "Silver" | "Gold" | "Diamond";

export interface UserProfile {
  name: string; // = user email (autoname=field:user)
  user: string; // Frappe User Link
  member_id: string; // UP-XXXXXX

  // Capabilities (B2B2B hibrit)
  can_buy: 0 | 1;
  can_sell: 0 | 1;
  can_admin: 0 | 1;

  // Temel bilgi
  status: UserStatus;
  full_name: string;
  phone?: string;
  country?: string;

  // Kimlik & doğrulama
  account_type: AccountType;
  company_name?: string;
  tax_id?: string;
  tax_id_type?: "TCKN" | "VKN";
  tax_office?: string;

  email_verified: 0 | 1;
  email_verified_at?: string;
  email_verified_method?: "otp" | "admin_override" | "migration";

  kyc_status?: KycStatus;
  kyc_verified_at?: string;
  kyb_status?: KybStatus;
  kyb_verified_at?: string;

  // Banka (can_sell=1)
  bank_name?: string;
  iban?: string;
  account_holder_name?: string;

  // İş bilgileri
  business_type?: string;
  job_title?: string;
  website?: string;
  year_established?: number;
  employee_count?: string;
  about_us?: string;
  selling_platforms?: string;
  industry_preferences?: string;
  sourcing_frequency?: string;
  annual_spending?: string;

  // Metrik & skor (can_buy=1)
  total_spent?: number;
  total_orders?: number;
  average_order_value?: number;
  payment_on_time_rate?: number;
  return_rate?: number;
  dispute_rate?: number;
  feedback_rate?: number;
  cancellation_rate?: number;
  account_age_days?: number;
  days_since_last_active?: number;
  buyer_score?: number;
  buyer_level?: BuyerLevel;
  last_score_date?: string;
  joined_at?: string;
  last_active_at?: string;

  // Audit
  created_via?: string;
  migrated_at?: string;
  migrated_from_buyer_profile?: string;
  migrated_from_seller_profile?: string;
  erpnext_customer?: string;
}

/**
 * Helper: hibrit kullanıcı kontrolü
 */
export function isHybridUser(profile: UserProfile): boolean {
  return profile.can_buy === 1 && profile.can_sell === 1;
}

/**
 * Helper: KYB doğrulanmış satıcı (sipariş gate'i)
 */
export function isVerifiedSeller(profile: UserProfile): boolean {
  return profile.can_sell === 1 && profile.kyb_status === "Verified";
}

/**
 * Helper: Business kullanıcı (kurumsal)
 */
export function isBusinessAccount(profile: UserProfile): boolean {
  return profile.account_type === "Business";
}
