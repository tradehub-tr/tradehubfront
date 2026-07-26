import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (key: string) => key }));
vi.mock("../../utils/api", () => ({ callMethod: vi.fn() }));

import { SupplierSetupForm, initSupplierSetupForm } from "./SupplierSetupForm";

afterEach(() => { document.body.innerHTML = ""; });

describe("SupplierSetupForm imperative step 3", () => {
  it("keeps next disabled and focus in place for an invalid IBAN", () => {
    document.body.innerHTML = SupplierSetupForm("TR");
    initSupplierSetupForm({ initialStep: 3 });
    const iban = document.getElementById("ss-iban") as HTMLInputElement;
    const next = document.getElementById("ss-next-btn") as HTMLButtonElement;
    iban.focus(); iban.value = "TR000"; iban.dispatchEvent(new Event("input", { bubbles: true }));
    expect(next.disabled).toBe(true);
    expect(document.activeElement).toBe(iban);
    expect(document.getElementById("ss-iban-error")?.textContent).toContain("auth.supplierSetup.invalidIBAN");
  });

  it("normalizes pasted IBAN input without moving focus", () => {
    document.body.innerHTML = SupplierSetupForm("TR");
    initSupplierSetupForm({ initialStep: 3 });
    const iban = document.getElementById("ss-iban") as HTMLInputElement;
    iban.focus();
    iban.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: new DataTransfer() }));
    expect(document.activeElement).toBe(iban);
  });
});
