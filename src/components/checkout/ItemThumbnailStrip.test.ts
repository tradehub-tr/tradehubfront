/**
 * Sipariş özetindeki ürün küçük-resim şeridi (sepet sayfası ile ödeme adımı ortak):
 * her ürün kendi adet rozetiyle, hepsi yatay kaydırmalı şeritte; oklar taşma olunca.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (k: string) => k }));

import { renderItemThumbnailStrip, initItemThumbnailStrip } from "./ItemThumbnailStrip";

const items = [
  { image: "/a.jpg", quantity: 20 },
  { image: "/b.jpg", quantity: 1 },
  { image: "/c.jpg", quantity: 242 },
];

describe("renderItemThumbnailStrip", () => {
  it("her ürün için görsel + adet rozeti basar, hiçbirini atlamaz", () => {
    const root = document.createElement("div");
    root.innerHTML = renderItemThumbnailStrip(items);
    const cards = root.querySelectorAll(".checkout-item-card");
    expect(cards.length).toBe(3);
    expect([...cards].map((c) => c.querySelector("[data-qty-badge]")?.textContent?.trim())).toEqual(
      ["20", "1", "242"]
    );
    expect(root.querySelector(".checkout-items-images")).not.toBeNull();
    expect(root.querySelectorAll(".checkout-items-arrow").length).toBe(2);
  });

  it("boş listede boş döner", () => {
    expect(renderItemThumbnailStrip([])).toBe("");
  });
});

describe("initItemThumbnailStrip", () => {
  it("oklara tıklayınca şerit yatay kayar; taşma yoksa oklar gizlenir", () => {
    document.body.innerHTML = renderItemThumbnailStrip(items);
    const wrapper = document.querySelector<HTMLElement>(".checkout-items-wrapper")!;
    const track = wrapper.querySelector<HTMLElement>(".checkout-items-images")!;
    const scrollBy = vi.fn();
    track.scrollBy = scrollBy as unknown as typeof track.scrollBy;
    // happy-dom: scrollWidth/clientWidth 0 → taşma yok → oklar gizli
    initItemThumbnailStrip(wrapper);
    const right = wrapper.querySelector<HTMLButtonElement>('[data-dir="right"]')!;
    expect(right.classList.contains("!hidden")).toBe(true);
    right.click();
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 140 }));
    document.body.innerHTML = "";
  });
});

describe("renderItemThumbnailStrip — görselsiz ürün", () => {
  it("görseli boş ürün için kırık img yerine yer tutucu basar, adet rozeti kalır", () => {
    const root = document.createElement("div");
    root.innerHTML = renderItemThumbnailStrip([{ image: "", quantity: 3 }]);
    expect(root.querySelectorAll("img").length).toBe(0);
    expect(root.querySelector("[data-thumb-placeholder]")).not.toBeNull();
    expect(root.querySelector("[data-qty-badge]")?.textContent?.trim()).toBe("3");
  });
});
