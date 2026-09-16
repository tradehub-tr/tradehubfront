/**
 * Task 5 (2026-08-27 dosya-yöneticisi-seo) — ProductDocuments bloğu.
 *
 *   ÖLÇÜLDÜ  — liste boşken blok DOM'a hiç girmiyor (`ProductCertificates.ts`
 *              ile AYNI "" dönüş deseni); dolu listede başlık `escapeHtml`,
 *              bağlantı `sanitizeUrl`'den geçiyor; güvensiz/boş URL'li satır
 *              tek başına elenip diğer satırlar kalıyor; TÜM satırlar
 *              elendiğinde blok yine hiç girmiyor; doc_type/boyut etiketi
 *              doğru biçimleniyor.
 *   ÖLÇÜLMEDİ — gerçek tarayıcıda indirme davranışı (link zaten `target=
 *              "_blank"` + native indirme, JS yok).
 */
import { describe, expect, it, vi } from "vitest";

const currentProduct = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

// ProductVideoSection.test.ts ile AYNI desen: Alpine/i18n zincirini gerçek
// modülleriyle yüklemek testi Alpine.start bagajına sokar; burada yalnız HTML
// üretimi ölçülüyor. `t` kimlik fonksiyonu — anahtarın kendisi dönerse test
// çeviri metnine değil SÖZLEŞMEYE (doğru anahtar mı çağrıldı) bağlı kalır.
vi.mock("../../alpine/product", () => ({
  getCurrentProduct: () => currentProduct.value,
}));
vi.mock("../../i18n", () => ({ t: (key: string) => key }));

import { ProductDocuments } from "./ProductDocuments";

describe("ProductDocuments — boş liste", () => {
  it("documents hiç yoksa blok render edilmez", () => {
    currentProduct.value = {};
    expect(ProductDocuments()).toBe("");
  });

  it("documents boş dizi ise blok render edilmez", () => {
    currentProduct.value = { documents: [] };
    expect(ProductDocuments()).toBe("");
  });
});

describe("ProductDocuments — dolu liste", () => {
  it("başlık, doc_type etiketi ve URL basılır", () => {
    currentProduct.value = {
      documents: [
        {
          url: "/files/katalog.pdf",
          title: "Ürün Kataloğu",
          docType: "Katalog",
          language: "tr",
          sizeBytes: 0,
        },
      ],
    };
    const html = ProductDocuments();
    expect(html).toContain('id="pd-documents"');
    expect(html).toContain('href="/files/katalog.pdf"');
    expect(html).toContain("Ürün Kataloğu");
    // t() kimlik mock'u — bilinen doc_type haritalanmış anahtarıyla çağrılmalı.
    expect(html).toContain("product.docTypeCatalog");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("başlık boşsa dosya adı (uzantısıyla) gövdeye düşer", () => {
    currentProduct.value = {
      documents: [{ url: "/files/sunum.pptx", title: "", docType: "", language: "", sizeBytes: 0 }],
    };
    expect(ProductDocuments()).toContain("sunum.pptx");
  });

  it("başlıktaki HTML escape edilir (XSS)", () => {
    currentProduct.value = {
      documents: [
        {
          url: "/files/x.pdf",
          title: "<img src=x onerror=alert(1)>",
          docType: "",
          language: "",
          sizeBytes: 0,
        },
      ],
    };
    const html = ProductDocuments();
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img");
  });

  it("güvensiz URL'li (javascript:) satır elenir, geçerli satır kalır", () => {
    currentProduct.value = {
      documents: [
        { url: "javascript:alert(1)", title: "Kötücül", docType: "", language: "", sizeBytes: 0 },
        { url: "/files/temiz.pdf", title: "Temiz", docType: "", language: "", sizeBytes: 0 },
      ],
    };
    const html = ProductDocuments();
    expect(html).not.toContain("Kötücül");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("Temiz");
    expect(html).toContain('href="/files/temiz.pdf"');
  });

  it("TÜM satırlar güvensiz/boş URL'liyse blok yine hiç render edilmez", () => {
    currentProduct.value = {
      documents: [
        { url: "javascript:alert(1)", title: "Kötücül", docType: "", language: "", sizeBytes: 0 },
      ],
    };
    expect(ProductDocuments()).toBe("");
  });

  it("boyut MB/KB olarak biçimlenir, 0/boş ise hiç basılmaz", () => {
    currentProduct.value = {
      documents: [
        {
          url: "/files/buyuk.pdf",
          title: "Büyük",
          docType: "",
          language: "",
          sizeBytes: 2 * 1024 * 1024,
        },
        { url: "/files/kucuk.pdf", title: "Küçük", docType: "", language: "", sizeBytes: 5 * 1024 },
        {
          url: "/files/bilinmeyen.pdf",
          title: "Bilinmeyen",
          docType: "",
          language: "",
          sizeBytes: 0,
        },
      ],
    };
    const html = ProductDocuments();
    expect(html).toContain("2.0 MB");
    expect(html).toContain("5 KB");
    // "Bilinmeyen" satırında meta alt-satırı hiç basılmamalı (docType de boş).
    const bilinmeyenIdx = html.indexOf("Bilinmeyen");
    const parcaSonrasi = html.slice(bilinmeyenIdx, bilinmeyenIdx + 200);
    expect(parcaSonrasi).not.toContain("mt-0.5");
  });

  it("haritada olmayan doc_type ham haliyle basılır (backend yeni tür eklerse sessizce kırılmaz)", () => {
    currentProduct.value = {
      documents: [
        { url: "/files/x.pdf", title: "X", docType: "Yeni Tür", language: "", sizeBytes: 0 },
      ],
    };
    expect(ProductDocuments()).toContain("Yeni Tür");
  });
});
