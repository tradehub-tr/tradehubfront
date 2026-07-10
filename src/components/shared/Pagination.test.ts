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
});
