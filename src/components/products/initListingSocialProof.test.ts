import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Signal } from "../../services/socialProofService";

const { fetchSocialProofSignalsBatch } = vi.hoisted(() => ({
  fetchSocialProofSignalsBatch: vi.fn(),
}));
vi.mock("../../services/socialProofService", () => ({
  fetchSocialProofSignalsBatch,
}));

import { applyListingSocialProof } from "./initListingSocialProof";

describe("applyListingSocialProof progressive batch", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="batch">
        <div class="fy26-product-card-wrapper">
          <div data-sp-host="signal-card"></div>
        </div>
        <div class="fy26-product-card-wrapper">
          <div data-sp-host="empty-card"></div>
        </div>
      </section>
    `;
    vi.clearAllMocks();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  it("home compact kartta yalnız gerçek sinyali olan ürün için slot oluşturur", async () => {
    const signal: Signal = { type: "sales", value: 27, window_days: 3 };
    fetchSocialProofSignalsBatch.mockResolvedValue({
      "signal-card": [signal],
      "empty-card": [],
    });
    const batch = document.getElementById("batch")!;

    await applyListingSocialProof([{ id: "signal-card" }, { id: "empty-card" }], {
      root: batch,
      createMissingSlots: true,
    });

    expect(batch.querySelector('[data-sp-slot="signal-card"]')).not.toBeNull();
    expect(batch.querySelector('[data-sp-slot="empty-card"]')).toBeNull();
  });

  it("sonraki progressive çağrıda önceden alınan sinyali ağsız yeniden uygular", async () => {
    fetchSocialProofSignalsBatch.mockResolvedValue({
      "cached-card": [{ type: "favorites", value: 12 }],
    });
    document.body.innerHTML = `
      <div id="first"><div data-sp-host="cached-card"></div></div>
      <div id="second"><div data-sp-host="cached-card"></div></div>
    `;

    await applyListingSocialProof([{ id: "cached-card" }], {
      root: document.getElementById("first")!,
      createMissingSlots: true,
    });
    await applyListingSocialProof([{ id: "cached-card" }], {
      root: document.getElementById("second")!,
      createMissingSlots: true,
    });

    expect(fetchSocialProofSignalsBatch).toHaveBeenCalledTimes(1);
    expect(document.querySelector('#second [data-sp-slot="cached-card"]')).not.toBeNull();
  });
});
