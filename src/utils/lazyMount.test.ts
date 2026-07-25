import { afterEach, describe, expect, it, vi } from "vitest";
import { createLazyMount } from "./lazyMount";
import { acquireScrollLock, releaseScrollLock } from "./scrollLock";

afterEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});

describe("createLazyMount", () => {
  it("mounts once, retains the dialog across reopen, and restores trigger focus", () => {
    const trigger = document.createElement("button");
    const host = document.createElement("div");
    const cleanup = vi.fn();
    let mounts = 0;
    document.body.append(trigger, host);

    const controller = createLazyMount({
      trigger,
      host,
      mount: () => {
        mounts += 1;
        const dialog = document.createElement("section");
        dialog.innerHTML = "<button data-first>First</button><button data-last>Last</button>";
        return dialog;
      },
      initialFocus: (dialog) => dialog.querySelector("[data-first]"),
      onMount: () => cleanup,
    });

    trigger.click();
    expect(mounts).toBe(1);
    expect(controller.mounted).toBe(true);
    expect(controller.opened).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(controller.element?.getAttribute("aria-hidden")).toBe("false");
    expect(controller.element?.hasAttribute("inert")).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(controller.element?.querySelector("[data-first]"));

    controller.close();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(controller.element?.getAttribute("aria-hidden")).toBe("true");
    expect(controller.element?.hasAttribute("inert")).toBe(true);
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    expect(mounts).toBe(1);
    expect(controller.element?.querySelector("[data-first]")).not.toBeNull();

    controller.destroy();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(controller.mounted).toBe(false);
    expect(host.childElementCount).toBe(0);

    trigger.click();
    expect(mounts).toBe(1);
  });

  it("closes on Escape and traps forward and backward Tab navigation", () => {
    const trigger = document.createElement("button");
    const host = document.createElement("div");
    document.body.append(trigger, host);

    const controller = createLazyMount({
      trigger,
      host,
      mount: () => {
        const dialog = document.createElement("section");
        dialog.innerHTML =
          '<button data-first>First</button><button data-last>Last</button><div class="hidden"><button data-hidden>Hidden</button></div>';
        return dialog;
      },
    });

    controller.open();
    const first = controller.element?.querySelector<HTMLButtonElement>("[data-first]");
    const last = controller.element?.querySelector<HTMLButtonElement>("[data-last]");

    last?.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(first);

    first?.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })
    );
    expect(document.activeElement).toBe(last);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(controller.opened).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("opens from the active delegated trigger and restores that trigger on Escape", () => {
    const firstTrigger = document.createElement("button");
    const delegatedTrigger = document.createElement("button");
    const host = document.createElement("div");
    document.body.append(firstTrigger, delegatedTrigger, host);

    const controller = createLazyMount({
      trigger: firstTrigger,
      host,
      mount: () => {
        const dialog = document.createElement("section");
        dialog.innerHTML = "<button>Close</button>";
        return dialog;
      },
    });

    delegatedTrigger.focus();
    (controller as unknown as { openFrom(trigger: HTMLElement): void }).openFrom(delegatedTrigger);

    expect(delegatedTrigger.getAttribute("aria-expanded")).toBe("true");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.activeElement).toBe(delegatedTrigger);

    controller.destroy();
  });

  it("releases scroll lock and keyboard handling when an open controller is detached", async () => {
    const trigger = document.createElement("button");
    const host = document.createElement("div");
    document.body.append(trigger, host);
    const controller = createLazyMount({
      trigger,
      host,
      mount: () => {
        const dialog = document.createElement("section");
        dialog.innerHTML = "<button>Only action</button>";
        return dialog;
      },
    });

    try {
      controller.open();
      expect(document.body.style.overflow).toBe("hidden");

      trigger.remove();
      host.remove();
      await Promise.resolve();

      expect(controller.opened).toBe(false);
      expect(document.body.style.overflow).toBe("");
      const tab = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);
    } finally {
      controller.destroy();
    }
  });

  it("destroys mounted cleanup and balances shared locks when its host is detached", async () => {
    const trigger = document.createElement("button");
    const host = document.createElement("div");
    const cleanup = vi.fn();
    document.body.append(trigger, host);
    const controller = createLazyMount({
      trigger,
      host,
      mount: () => document.createElement("section"),
      onMount: () => cleanup,
    });

    controller.open();
    acquireScrollLock();
    try {
      trigger.remove();
      host.remove();
      await Promise.resolve();

      expect(cleanup).toHaveBeenCalledOnce();
      expect(controller.mounted).toBe(false);
      expect(controller.opened).toBe(false);
      expect(document.body.style.overflow).toBe("hidden");

      const tab = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);
    } finally {
      controller.destroy();
      releaseScrollLock();
    }
    expect(document.body.style.overflow).toBe("");
  });

  it.each(["trigger", "host"] as const)(
    "keeps detach cleanup active after open and close when the %s detaches",
    async (detachedNode) => {
      const trigger = document.createElement("button");
      const host = document.createElement("div");
      const cleanup = vi.fn();
      let mounts = 0;
      document.body.append(trigger, host);
      const controller = createLazyMount({
        trigger,
        host,
        mount: () => {
          mounts += 1;
          return document.createElement("section");
        },
        onMount: () => cleanup,
      });

      controller.open();
      controller.close();
      expect(controller.mounted).toBe(true);

      if (detachedNode === "trigger") trigger.remove();
      else host.remove();
      await Promise.resolve();

      expect(cleanup).toHaveBeenCalledOnce();
      expect(controller.mounted).toBe(false);

      if (detachedNode === "trigger") document.body.append(trigger);
      else document.body.append(host);
      trigger.click();
      expect(mounts).toBe(1);

      controller.destroy();
      expect(cleanup).toHaveBeenCalledOnce();
    }
  );

  it("destroy releases an open controller and cannot consume later keyboard events", () => {
    const trigger = document.createElement("button");
    const host = document.createElement("div");
    document.body.append(trigger, host);
    const controller = createLazyMount({
      trigger,
      host,
      mount: () => {
        const dialog = document.createElement("section");
        dialog.innerHTML = "<button>Only action</button>";
        return dialog;
      },
    });

    controller.open();
    controller.destroy();

    expect(document.body.style.overflow).toBe("");
    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
  });

  it("keeps body locked when another component acquires a lock after the dialog opens", () => {
    const trigger = document.createElement("button");
    const host = document.createElement("div");
    document.body.style.overflow = "auto";
    document.body.append(trigger, host);
    const controller = createLazyMount({
      trigger,
      host,
      mount: () => document.createElement("section"),
    });

    controller.open();
    acquireScrollLock();

    try {
      controller.close();
      expect(document.body.style.overflow).toBe("hidden");
    } finally {
      controller.destroy();
      releaseScrollLock();
    }

    expect(document.body.style.overflow).toBe("auto");
  });
});
