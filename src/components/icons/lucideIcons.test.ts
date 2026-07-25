/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getLucideIcon, getLucideIconByCategoryName, styleSvg } from "./lucideIcons";

function parseIcon(html: string): { svg: SVGElement; use: SVGUseElement } {
  const host = document.createElement("div");
  host.innerHTML = html;
  const svg = host.querySelector("svg");
  const use = host.querySelector("use");

  if (!(svg instanceof SVGElement) || !(use instanceof SVGUseElement)) {
    throw new Error("Expected an SVG sprite reference");
  }

  return { svg, use };
}

describe("getLucideIcon", () => {
  it("renders a same-origin sprite reference while preserving the public className API", () => {
    const { svg, use } = parseIcon(getLucideIcon("search", "h-4 w-4 text-gray-500"));

    expect(svg.getAttribute("class")).toBe("h-4 w-4 text-gray-500");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(use.getAttribute("href")).toBe("/icons/ui.svg#icon-search");
  });

  it.each(["folder", "chevron-right", "mail"])(
    "resolves the previously missing %s icon instead of the star fallback",
    (name) => {
      const { use } = parseIcon(getLucideIcon(name));

      expect(use.getAttribute("href")).toBe(`/icons/ui.svg#icon-${name}`);
    }
  );

  it("keeps the existing star fallback for unknown icon names", () => {
    const { use } = parseIcon(getLucideIcon("not-a-real-icon"));

    expect(use.getAttribute("href")).toBe("/icons/ui.svg#icon-star");
  });

  it("routes category-name icons through the same sprite helper", () => {
    const { use } = parseIcon(getLucideIconByCategoryName("Elektronik"));

    expect(use.getAttribute("href")).toBe("/icons/ui.svg#icon-cpu");
  });

  it("keeps styleSvg available for legacy raw SVG consumers", () => {
    const raw =
      '<svg class="lucide" width="24" height="24" viewBox="0 0 24 24"><path d="M1 1h2"/></svg>';

    expect(styleSvg(raw, "h-6 w-6")).toContain('<svg class="h-6 w-6" viewBox="0 0 24 24">');
  });
});

describe("public icon sprite", () => {
  it("contains stable symbols for regular and formerly missing Lucide icons", () => {
    const sprite = readFileSync(resolve(process.cwd(), "public/icons/ui.svg"), "utf8");

    expect(sprite).toContain('<symbol id="icon-search"');
    expect(sprite).toContain('<symbol id="icon-folder"');
    expect(sprite).toContain('<symbol id="icon-chevron-right"');
    expect(sprite).toContain('<symbol id="icon-mail"');
    expect(sprite).not.toMatch(/<(?:linearGradient|radialGradient|mask|pattern)\b/);
  });
});
