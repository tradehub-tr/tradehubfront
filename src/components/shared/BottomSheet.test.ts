import { describe, expect, it } from "vitest";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  it("uses shared sprite symbols for its repeated back and close icons", () => {
    const html = BottomSheet({ id: "filters", titleKey: "shared.filters" }, "<p>Body</p>");

    expect(html).toContain('href="/icons/ui.svg#icon-chevron-left"');
    expect(html).toContain('href="/icons/ui.svg#icon-x"');
    expect(html).not.toContain('d="M15 19l-7-7 7-7"');
    expect(html).not.toContain('d="M6 18 18 6M6 6l12 12"');
  });
});
