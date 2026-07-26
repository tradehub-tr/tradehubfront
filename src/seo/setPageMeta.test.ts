// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { applyServerSeo, syncStructuredData } from "./setPageMeta";

describe("structured data ownership", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("reuses a bot-rendered script with the same @id", () => {
    const existing = document.createElement("script");
    existing.type = "application/ld+json";
    existing.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": "https://istoc.com/urun/test#product",
      name: "Eski",
    });
    document.head.appendChild(existing);

    syncStructuredData([
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": "https://istoc.com/urun/test#product",
        name: "Yeni",
      },
    ]);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent || "{}").name).toBe("Yeni");
    expect(scripts[0].getAttribute("data-istoc-jsonld")).toBe(
      "https://istoc.com/urun/test#product"
    );
  });

  it("upserts repeated payloads instead of duplicating them", () => {
    const first = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": "https://istoc.com/urunler#itemlist",
      numberOfItems: 1,
    };
    syncStructuredData([first]);
    syncStructuredData([{ ...first, numberOfItems: 2 }]);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent || "{}").numberOfItems).toBe(2);
  });

  it("replaces the previous ItemList when pagination changes", () => {
    syncStructuredData([
      { "@type": "ItemList", "@id": "https://istoc.com/urunler#itemlist", numberOfItems: 40 },
    ]);
    syncStructuredData([
      {
        "@type": "ItemList",
        "@id": "https://istoc.com/urunler?page=2#itemlist",
        numberOfItems: 12,
      },
    ]);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent || "{}")["@id"]).toContain("page=2");
  });

  it("adopts legacy bot markup without @id by matching its schema type", () => {
    const existing = document.createElement("script");
    existing.type = "application/ld+json";
    existing.textContent = JSON.stringify({ "@type": "BreadcrumbList", itemListElement: [] });
    document.head.appendChild(existing);

    syncStructuredData([
      {
        "@type": "BreadcrumbList",
        "@id": "https://istoc.com/urun/test#breadcrumb",
        itemListElement: [],
      },
    ]);

    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  });

  it("keeps schemas with distinct stable ids", () => {
    syncStructuredData([
      { "@type": "Organization", "@id": "https://istoc.com/#organization" },
      { "@type": "Organization", "@id": "https://istoc.com/marka/acme/#organization" },
    ]);

    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
  });

  it("applies backend json_ld through applyServerSeo and escapes script terminators", () => {
    applyServerSeo({
      json_ld: [
        {
          "@type": "Product",
          "@id": "https://istoc.com/urun/test#product",
          name: "</script><script>alert(1)</script>",
        },
      ],
    });

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script?.textContent).not.toContain("</script>");
    expect(JSON.parse(script?.textContent || "{}").name).toBe(
      "</script><script>alert(1)</script>"
    );
  });
});
