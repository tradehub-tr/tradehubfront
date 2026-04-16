/**
 * Lead Service — CRM Lead (iletisim formu / konsol kaydi).
 *
 * Headless — frappe/crm UI'i kapali. Storefront'un iletisim formu ve guest
 * talepleri `tradehub_core.api.public.create_lead` wrapper'ina yazar.
 * Rate-limit: email basina 5 dakikada 5 kayit (backend tarafinda).
 */

import { callMethod } from "../utils/api";

export interface CreateLeadInput {
  email: string;
  first_name?: string;
  last_name?: string;
  mobile_no?: string;
  organization?: string;
  message?: string;
  source?: string;
}

export interface CreateLeadResponse {
  name: string;
  ok: boolean;
}

export async function createLead(input: CreateLeadInput): Promise<CreateLeadResponse> {
  return await callMethod<CreateLeadResponse>(
    "tradehub_core.api.public.create_lead",
    input as unknown as Record<string, unknown>,
    true
  );
}
