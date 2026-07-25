import { describe, expect, it } from "vitest";
import { renderPagination } from "./Pagination";

describe("renderPagination", () => {
  it("tek sayfada boş string döner", () => {
    expect(renderPagination(1, 1, false, false)).toBe("");
  });

  it("orta sayfada aktif buton, komşular ve son sayfa kısayolu", () => {
    const html = renderPagination(5, 20, true, true);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('data-page="4"');
    expect(html).toContain('data-page="6"');
    expect(html).toContain('data-page="20"');
  });

  it("ilk sayfada geri butonu disabled", () => {
    const html = renderPagination(1, 3, true, false);
    expect(html).toContain("disabled");
  });

  it("yön oklarını paylaşılan sprite üzerinden render eder", () => {
    const html = renderPagination(2, 3, true, true);

    expect(html).toContain('href="/icons/ui.svg#icon-chevron-left"');
    expect(html).toContain('href="/icons/ui.svg#icon-chevron-right"');
    expect(html).not.toContain('d="M9 3L5 7l4 4"');
    expect(html).not.toContain('d="M5 3l4 4-4 4"');
  });
});
