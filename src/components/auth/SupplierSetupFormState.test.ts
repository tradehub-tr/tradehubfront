import { describe, expect, it } from "vitest";
import { collectSupplierSetupData, validateSupplierSetupStep, type SupplierSetupFieldState } from "./SupplierSetupForm";

const fields: SupplierSetupFieldState = {
  seller_type: "Business", business_name: "Acme", contact_phone: "05321234567",
  tax_id_type: "TCKN", tax_id: "12345678901", tax_office: "Kadikoy", address_line_1: "Adres", city: "Istanbul", country: "Turkey",
  bank_name: "Bank", iban: "TR330006100519786457841326", account_holder_name: "Acme",
  identity_document_type: "", identity_document_number: "10000000146", identity_document_expiry: "", identity_document: "",
  terms_accepted: true, privacy_accepted: true, kvkk_accepted: true, commission_accepted: true, return_policy_accepted: true,
};

describe("supplier setup field state", () => {
  it("validates tax and city fields", () => {
    expect(validateSupplierSetupStep(2, fields)).toBe(true);
    expect(validateSupplierSetupStep(2, { ...fields, city: "" })).toBe(false);
    expect(validateSupplierSetupStep(2, { ...fields, tax_id: "12" })).toBe(false);
  });
  it("validates IBAN plus a manual bank override", () => {
    expect(validateSupplierSetupStep(3, fields)).toBe(true);
    expect(validateSupplierSetupStep(3, { ...fields, bank_name: "Manual Bank" })).toBe(true);
    expect(validateSupplierSetupStep(3, { ...fields, bank_name: "" })).toBe(false);
  });
  it("requires all agreements and preserves prefilled values", () => {
    expect(validateSupplierSetupStep(4, fields)).toBe(true);
    expect(validateSupplierSetupStep(4, { ...fields, kvkk_accepted: false })).toBe(false);
    expect(collectSupplierSetupData(fields)).toEqual(fields);
  });
});
