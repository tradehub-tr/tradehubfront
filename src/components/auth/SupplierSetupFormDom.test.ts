import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (key: string) => key }));

import { SupplierSetupForm } from "./SupplierSetupForm";

describe("supplier setup inactive DOM", () => {
  it("keeps the final agreement step inert until it becomes active", () => {
    const html = SupplierSetupForm();

    expect(html).toContain('id="supplier-step-template-4"');
    expect(html).toContain('data-supplier-step-host="4"');
    expect(html).toContain('data-supplier-step="4"');
  });
});
