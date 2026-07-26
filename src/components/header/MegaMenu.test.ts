import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadCategories, searchListings } = vi.hoisted(() => ({
  loadCategories: vi.fn(() => Promise.resolve([])),
  searchListings: vi.fn(),
}));

vi.mock("../../i18n", () => ({
  t: (key: string) => key,
  getCurrentLang: () => "tr",
}));
vi.mock("../../services/categoryService", () => ({ loadCategories }));
vi.mock("../../services/listingService", () => ({ searchListings }));
vi.mock("../icons/lucideIcons", () => ({
  getLucideIcon: () => "<svg></svg>",
  getLucideIconByCategoryName: () => "<svg></svg>",
}));

import { initMegaMenu, MegaMenu } from "./MegaMenu";

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = `
    <nav>
      <button class="mega-trigger" data-mega-target="categories">A</button>
      <button class="mega-trigger" data-mega-target="protections">B</button>
    </nav>
    ${MegaMenu()}
  `;
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("MegaMenu hover timing", () => {
  it("opens trigger B when hovered while trigger A has a pending close", async () => {
    await initMegaMenu();
    const [triggerA, triggerB] = Array.from(
      document.querySelectorAll<HTMLElement>(".mega-trigger")
    );
    const panel = document.getElementById("istoc-mega-panel");

    triggerA.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);
    expect(triggerA.getAttribute("aria-expanded")).toBe("true");

    triggerA.dispatchEvent(new MouseEvent("mouseleave"));
    triggerB.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);

    expect(triggerA.getAttribute("aria-expanded")).toBe("false");
    expect(triggerB.getAttribute("aria-expanded")).toBe("true");
    expect(panel?.querySelector('[data-mega-view="protections"]')).not.toBeNull();

    vi.advanceTimersByTime(300);
    expect(triggerB.getAttribute("aria-expanded")).toBe("true");
    expect(panel?.getAttribute("data-home-overlay-state")).toBe("open");
  });
});
