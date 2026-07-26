import { describe, expect, it } from "vitest";
import { Breadcrumb } from "./Breadcrumb";

describe("Breadcrumb", () => {
  it("uses the shared chevron-right sprite symbol between items", () => {
    const html = Breadcrumb([
      { label: "Kategori", href: "/kategori" },
      { label: "Ürün" },
    ]);

    expect(html.match(/href="\/icons\/ui\.svg#icon-chevron-right"/g)).toHaveLength(2);
    expect(html).not.toContain('d="M9 5l7 7-7 7"');
  });
});
