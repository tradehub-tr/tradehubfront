import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({
  t: (key: string) => key,
}));

import { CookieBanner } from "./CookieBanner";
import { LegalPageLayout } from "./LegalPageLayout";

describe("legal secondary DOM", () => {
  it("does not render the duplicate mobile table of contents until it is opened", () => {
    const html = LegalPageLayout({
      pageTitle: "Kullanım Koşulları",
      lastUpdated: "2026-07-25",
      breadcrumbLabel: "Kullanım Koşulları",
      sections: [
        { id: "genel", title: "Genel", content: "Görünür yasal metin" },
      ],
    });

    expect(html).toContain('x-data="legalToc()"');
    expect(html).toContain('<template x-if="tocMounted">');
    expect(html).toContain('id="genel"');
    expect(html).toContain("Görünür yasal metin");
  });

  it("does not mount cookie preference controls before a visitor opens them", () => {
    const html = CookieBanner();

    expect(html).toContain('<template x-if="detailsMounted">');
    expect(html).toContain('x-model="categories.analytics"');
    expect(html).toContain("detailsMounted = true; showDetails = !showDetails");
  });
});
