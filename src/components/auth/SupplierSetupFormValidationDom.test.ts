import { afterEach, describe, expect, it, vi } from "vitest";

const { validateIBAN } = vi.hoisted(() => ({ validateIBAN: vi.fn() }));

vi.mock("../../i18n", () => ({ t: (key: string) => key }));
vi.mock("../../utils/api", () => ({ callMethod: vi.fn() }));
vi.mock("../../utils/tr-validation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/tr-validation")>()),
  validateIBAN,
  validatePhone: () => true,
  validateTCKN: () => true,
}));

import {
  SupplierSetupForm,
  applySupplierSetupPrefill,
  initSupplierSetupForm,
} from "./SupplierSetupForm";

const validIban = "TR330006100519786457841326";

function mountStep3(): {
  iban: HTMLInputElement;
  bankName: HTMLInputElement;
  accountHolder: HTMLInputElement;
  nextButton: HTMLButtonElement;
  ibanError: HTMLElement;
} {
  document.body.innerHTML = SupplierSetupForm("TR");
  initSupplierSetupForm({ initialStep: 3 });

  return {
    iban: document.getElementById("ss-iban") as HTMLInputElement,
    bankName: document.getElementById("ss-bank-name") as HTMLInputElement,
    accountHolder: document.getElementById("ss-account-holder") as HTMLInputElement,
    nextButton: document.getElementById("ss-next-btn") as HTMLButtonElement,
    ibanError: document.getElementById("ss-iban-error") as HTMLElement,
  };
}

function input(element: HTMLInputElement, value: string): void {
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("SupplierSetupForm imperative Step 3 validation", () => {
  it("keeps steps 2 and 3 out of the initial DOM, then hydrates prefilled step 2 across back/forward navigation", () => {
    document.body.innerHTML = SupplierSetupForm("TR");
    expect(document.querySelector('[data-supplier-step="2"]')).toBeNull();
    expect(document.querySelector('[data-supplier-step="3"]')).toBeNull();

    applySupplierSetupPrefill({
      tax_id: "12345678901",
      tax_office: "Kadıköy",
      address_line_1: "Test adresi",
      city: "İstanbul",
    });
    initSupplierSetupForm({ initialStep: 2 });

    expect((document.getElementById("ss-tax-id") as HTMLInputElement).value).toBe("12345678901");
    expect((document.getElementById("ss-city") as HTMLInputElement).value).toBe("İstanbul");
    const nextButton = document.getElementById("ss-next-btn") as HTMLButtonElement;
    expect(nextButton.disabled).toBe(false);

    nextButton.click();
    expect(document.querySelector('[data-supplier-step="3"]')).not.toBeNull();
    (document.getElementById("ss-back-btn") as HTMLButtonElement).click();

    expect((document.getElementById("ss-tax-office") as HTMLInputElement).value).toBe("Kadıköy");
    expect((document.getElementById("ss-city") as HTMLInputElement).value).toBe("İstanbul");
  });

  it("moves focus into the lazily mounted city search and returns it to the trigger on Escape", async () => {
    document.body.innerHTML = SupplierSetupForm("TR");
    initSupplierSetupForm({ initialStep: 2 });
    const cityButton = document.getElementById("ss-city-btn") as HTMLButtonElement;
    const citySearch = document.getElementById("ss-city-search") as HTMLInputElement;

    cityButton.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(document.activeElement).toBe(citySearch);

    citySearch.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.activeElement).toBe(cityButton);
  });

  it("hydrates a draft directly into an initial Step 3 mount", () => {
    validateIBAN.mockReturnValue({ valid: false });
    document.body.innerHTML = SupplierSetupForm("TR");
    applySupplierSetupPrefill({
      business_name: "Acme Ltd.",
      iban: validIban,
      bank_name: "Draft Bank",
      account_holder_name: "Draft Holder",
    });
    initSupplierSetupForm({ initialStep: 3 });

    expect(document.querySelector('[data-supplier-step="2"]')).toBeNull();
    expect((document.getElementById("ss-iban") as HTMLInputElement).value).toBe(validIban);
    expect((document.getElementById("ss-bank-name") as HTMLInputElement).value).toBe("Draft Bank");
    expect((document.getElementById("ss-account-holder") as HTMLInputElement).value).toBe("Draft Holder");
  });

  it("shows an error for an invalid 5-character IBAN, disables Next, and leaves focus in place", () => {
    validateIBAN.mockReturnValue({ valid: false });
    const { iban, nextButton, ibanError } = mountStep3();

    iban.focus();
    input(iban, "TR12X");

    expect(ibanError.classList.contains("hidden")).toBe(false);
    expect(ibanError.textContent).toBe("auth.supplierSetup.invalidIBAN");
    expect(nextButton.disabled).toBe(true);
    expect(document.activeElement).toBe(iban);
  });

  it("autofills the bank name and enables Next for a valid IBAN plus account holder", () => {
    validateIBAN.mockImplementation((value: string) =>
      value === validIban ? { valid: true, bankName: "Test Bank" } : { valid: false }
    );
    const { iban, bankName, accountHolder, nextButton, ibanError } = mountStep3();

    input(accountHolder, "Acme Ltd.");
    input(iban, validIban);

    expect(bankName.value).toBe("Test Bank");
    expect(ibanError.classList.contains("hidden")).toBe(true);
    expect(nextButton.disabled).toBe(false);
  });

  it("keeps a manual bank override when the IBAN later becomes invalid", () => {
    validateIBAN.mockImplementation((value: string) =>
      value === validIban ? { valid: true, bankName: "Test Bank" } : { valid: false }
    );
    const { iban, bankName } = mountStep3();

    input(iban, validIban);
    expect(bankName.value).toBe("Test Bank");

    bankName.value = "Manual Bank";
    input(iban, "TR12X");

    expect(bankName.value).toBe("Manual Bank");
  });

  it("uppercases pasted IBAN text and removes whitespace, while retaining punctuation", () => {
    validateIBAN.mockReturnValue({ valid: false });
    const { iban } = mountStep3();
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", {
      value: { getData: () => " tr33 0006! 1005 " },
    });

    iban.dispatchEvent(paste);

    expect(paste.defaultPrevented).toBe(true);
    expect(iban.value).toBe("TR330006!1005");
  });
});
