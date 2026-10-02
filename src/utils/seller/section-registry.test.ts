import { describe, expect, it } from "vitest";

import { renderDynamicSections, type LayoutConfig } from "./section-registry";

const URL = "/files/c2/ozgen-banner.webp";

function layout(media: Record<string, unknown>): LayoutConfig {
  return {
    sections: [
      {
        type: "hero_banner",
        order: 1,
        enabled: true,
        settings: {
          mode: "static",
          slides: [{ id: "s1", image: URL, title: "", subtitle: "", ctaText: "", ctaLink: "" }],
        },
      },
    ],
    image_media: media,
  } as LayoutConfig;
}

describe("vitrin slaytı odak noktası", () => {
  it("odak kaydı olan banner'da object-position basılır", () => {
    const html = renderDynamicSections(
      layout({ [URL]: { src: URL, srcset: "", width: 0, height: 0, focal: { x: 0.78, y: 0.45 } } })
    );
    expect(html).toContain('style="object-position:78% 45%"');
  });

  it("odak kaydı olmayanda object-position yok (ortadan kırpılır)", () => {
    expect(renderDynamicSections(layout({}))).not.toContain("object-position");
  });
});
