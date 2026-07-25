import { describe, expect, it, vi } from "vitest";
import { markHomeReadyAfterInitialTasks } from "./homeReadiness";

const { onCategoriesLoaded } = vi.hoisted(() => ({ onCategoriesLoaded: vi.fn() }));

vi.mock("../i18n", () => ({ t: (key: string) => key }));
vi.mock("../services/categoryService", () => ({ onCategoriesLoaded }));
vi.mock("../utils/auth", () => ({ waitForAuth: () => Promise.resolve(null) }));
vi.mock("../services/currencyService", () => ({
  getSelectedCurrency: () => "TRY",
  getSelectedCurrencyInfo: () => ({ code: "TRY", symbol: "₺" }),
  getSupportedCurrencies: () => [],
  setSelectedCurrency: vi.fn(),
  onCurrencyChange: vi.fn(),
}));

import { BottomNav, initBottomNav } from "../components/floating/BottomNav";

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe("markHomeReadyAfterInitialTasks", () => {
  it("marks the homepage ready only after every initial DOM task settles", async () => {
    const root = document.createElement("div");
    const hero = deferred();
    const productGrid = deferred();

    const ready = markHomeReadyAfterInitialTasks(root, [hero.promise, productGrid.promise]);
    expect(root.dataset.perfReady).toBeUndefined();

    hero.resolve();
    await Promise.resolve();
    expect(root.dataset.perfReady).toBeUndefined();

    productGrid.resolve();
    await ready;
    expect(root.dataset.perfReady).toBe("true");
  });

  it("still marks ready when an initial task fails, so measurement cannot wait forever", async () => {
    const root = document.createElement("div");

    await markHomeReadyAfterInitialTasks(root, [Promise.reject(new Error("API unavailable"))]);

    expect(root.dataset.perfReady).toBe("true");
  });

  it("bounds an indefinitely pending background request", async () => {
    const root = document.createElement("div");
    const never = new Promise<void>(() => {});

    await markHomeReadyAfterInitialTasks(root, [never], { timeoutMs: 1 });

    expect(root.dataset.perfReady).toBe("true");
  });

  it("waits for the next animation frame after category consumers render their DOM", async () => {
    const root = document.createElement("div");
    const categoryConsumer = deferred();
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    let runFrame: FrameRequestCallback | undefined;

    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      runFrame = callback;
      return 1;
    }) as typeof window.requestAnimationFrame;

    try {
      const categoryRendered = categoryConsumer.promise.then(() => {
        root.innerHTML = '<div data-category-consumer-rendered="true"></div>';
      });
      const ready = markHomeReadyAfterInitialTasks(root, [categoryRendered]);
      categoryConsumer.resolve();
      await new Promise((resolve) => window.setTimeout(resolve, 0));

      expect(runFrame).toBeTypeOf("function");
      expect(root.dataset.perfReady).toBeUndefined();

      runFrame?.(0);
      await ready;

      expect(root.querySelector("[data-category-consumer-rendered='true']")).not.toBeNull();
      expect(root.dataset.perfReady).toBe("true");
    } finally {
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
  });

  it("does not require the closed BottomNav category overlay DOM for home readiness", async () => {
    const root = document.createElement("div");
    root.innerHTML = BottomNav();
    document.body.append(root);
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => null, setItem: vi.fn() },
    });

    onCategoriesLoaded.mockImplementation(() => new Promise<void>(() => {}));
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    let runFrame: FrameRequestCallback | undefined;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      runFrame = callback;
      return 1;
    }) as typeof window.requestAnimationFrame;

    try {
      const bottomNavReady = initBottomNav();
      const ready = markHomeReadyAfterInitialTasks(root, [bottomNavReady]);

      await Promise.resolve();
      await Promise.resolve();

      expect(onCategoriesLoaded).not.toHaveBeenCalled();
      expect(root.querySelector("#cat-fullscreen-overlay")).toBeNull();
      expect(root.dataset.perfReady).toBeUndefined();

      runFrame?.(0);
      await ready;

      expect(root.dataset.perfReady).toBe("true");
    } finally {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: originalLocalStorage,
      });
      onCategoriesLoaded.mockReset();
      root.remove();
    }
  });

  it("falls back when requestAnimationFrame is throttled after initial tasks settle", async () => {
    const root = document.createElement("div");
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const cancelAnimationFrame = vi.fn();
    window.requestAnimationFrame = (() => 42) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = cancelAnimationFrame as typeof window.cancelAnimationFrame;

    try {
      await markHomeReadyAfterInitialTasks(root, [Promise.resolve()], {
        animationFrameTimeoutMs: 1,
      });

      expect(root.dataset.perfReady).toBe("true");
      expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    } finally {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  });
});
