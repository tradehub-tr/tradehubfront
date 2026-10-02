import { describe, expect, it } from "vitest";

import alpineIndex from "../../alpine/index.ts?raw";
import storeHeader from "../../components/seller/StoreHeader.ts?raw";
import manufacturerList from "../../components/manufacturers/ManufacturerList.ts?raw";
import sellerShop from "../../pages/seller-shop.ts?raw";

describe("Alpine görsellerinde odak bağlaması", () => {
  it("$focalPos sihri kayıtlı", () => {
    expect(alpineIndex).toMatch(/Alpine\.magic\(\s*"focalPos"/);
  });
  it("mağaza başlığı ana medya, video kapağı ve küçük resimler", () => {
    expect(storeHeader).toContain("$focalPos(current.src_media)");
    expect(storeHeader).toContain("$focalPos(current.poster_media)");
    expect(storeHeader).toContain("$focalPos(item.src_media)");
    expect(storeHeader).toContain("$focalPos(item.poster_media)");
  });
  it("masaüstü dükkan logosu ve üretici galerisi", () => {
    expect(sellerShop).toContain("$focalPos(seller?.logo_media)");
    expect(manufacturerList).toContain("$focalPos(seller.gallery_images_media && seller.gallery_images_media[activeIdx])");
  });
});
