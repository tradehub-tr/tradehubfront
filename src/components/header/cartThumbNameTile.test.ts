import { describe, expect, it } from "vitest";
import { cartThumbNameTile } from "./cartThumbNameTile";

describe("cartThumbNameTile", () => {
  it("ürün adını kırpılabilir kutuda basar, tam adı title'a koyar", () => {
    const root = document.createElement("div");
    root.innerHTML = cartThumbNameTile("Kadın Kısa Kollu Madonna Yaka Yaprak Baskılı Elbise");
    const tile = root.querySelector<HTMLElement>("[data-thumb-name]");
    expect(tile?.getAttribute("title")).toBe("Kadın Kısa Kollu Madonna Yaka Yaprak Baskılı Elbise");
    expect(tile?.querySelector("span")?.className).toContain("line-clamp-2");
    expect(tile?.textContent?.trim()).toBe("Kadın Kısa Kollu Madonna Yaka Yaprak Baskılı Elbise");
  });
  it("HTML kaçışı yapar", () => {
    const root = document.createElement("div");
    root.innerHTML = cartThumbNameTile('<b>x</b> & "y"');
    expect(root.querySelector("b")).toBeNull();
    expect(root.querySelector("[data-thumb-name]")?.textContent).toBe('<b>x</b> & "y"');
  });
});
