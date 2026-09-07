/**
 * Sipariş onay penceresi başlığı: ödeme tek satıcıya yapılıyorsa başlıkta
 * mağaza adı geçer ("Özgen Plastik sipariş onayı") ve ödemenin doğrudan
 * satıcıya yapıldığı ayrı bir satırda söylenir. Birden çok satıcıda genel başlık.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({
  t: (k: string, o?: Record<string, unknown>) => (o ? `${k}:${Object.values(o).join(",")}` : k),
}));

import { reviewModalTitle, reviewModalDirectPayNote, reviewModalConfirmLabel } from "./reviewModalCopy";

const one = [{ sellerName: "Özgen Plastik" }];
const two = [{ sellerName: "Özgen Plastik" }, { sellerName: "Bursev Plastik" }];

describe("reviewModalTitle", () => {
  it("tek satıcıda mağaza adıyla 'sipariş onayı'", () => {
    expect(reviewModalTitle(one)).toBe("checkout.reviewOrderTitleSeller:Özgen Plastik");
  });
  it("birden çok satıcıda genel başlık", () => {
    expect(reviewModalTitle(two)).toBe("checkout.reviewOrderTitle");
  });
  it("sipariş yoksa veya satıcı adı boşsa genel başlık", () => {
    expect(reviewModalTitle([])).toBe("checkout.reviewOrderTitle");
    expect(reviewModalTitle([{ sellerName: "  " }])).toBe("checkout.reviewOrderTitle");
  });
});

describe("reviewModalDirectPayNote", () => {
  it("tek satıcıda 'ödeme doğrudan satıcıya' notu", () => {
    expect(reviewModalDirectPayNote(one)).toBe("checkout.reviewOrderDirectPay:Özgen Plastik");
  });
  it("birden çok satıcıda not yok", () => {
    expect(reviewModalDirectPayNote(two)).toBe("");
  });
});

describe("reviewModalConfirmLabel", () => {
  it("tek satıcıda buton mağaza adını taşır", () => {
    expect(reviewModalConfirmLabel(one)).toBe("checkout.confirmOrderBtnSeller:Özgen Plastik");
  });
  it("birden çok satıcıda genel buton metni", () => {
    expect(reviewModalConfirmLabel(two)).toBe("checkout.confirmOrderBtn");
  });
  it("boş/boşluk satıcı adında genel buton metni", () => {
    expect(reviewModalConfirmLabel([])).toBe("checkout.confirmOrderBtn");
    expect(reviewModalConfirmLabel([{ sellerName: " " }])).toBe("checkout.confirmOrderBtn");
  });
});
