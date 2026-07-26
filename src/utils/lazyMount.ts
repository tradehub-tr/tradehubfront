import { acquireScrollLock, releaseScrollLock } from "./scrollLock";

export interface LazyMountOptions {
  trigger: HTMLElement;
  host: HTMLElement;
  mount: () => HTMLElement;
  initialFocus?: (element: HTMLElement) => HTMLElement | null;
  onMount?: (element: HTMLElement) => void | (() => void);
  onOpen?: (element: HTMLElement) => void;
  onClose?: (element: HTMLElement) => void;
  closeOnMediaQuery?: string;
  /** Global event delegation already owns the trigger listener. */
  bindTrigger?: boolean;
}

export interface LazyMountController {
  readonly element: HTMLElement | null;
  readonly mounted: boolean;
  readonly opened: boolean;
  open(): void;
  openFrom(trigger: HTMLElement): void;
  close(restoreFocus?: boolean): void;
  destroy(): void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => {
      const hiddenAncestor = element.closest<HTMLElement>(
        "[hidden], [aria-hidden='true'], .hidden"
      );
      return !hiddenAncestor || hiddenAncestor === root;
    }
  );
  const rendered = candidates.filter((element) => element.getClientRects().length > 0);
  // happy-dom has no layout engine and reports zero rects for every element.
  // In a real browser at least the visible dialog controls have client rects.
  return rendered.length > 0 ? rendered : candidates;
}

/**
 * Retained one-time mount controller for heavyweight dialogs.
 *
 * The trigger listener is registered once, the mounted subtree is retained
 * across close/reopen cycles, and destroy explicitly releases listeners,
 * component cleanup, DOM, scroll lock, and focus state.
 */
export function createLazyMount(options: LazyMountOptions): LazyMountController {
  let element: HTMLElement | null = null;
  let mountedCleanup: (() => void) | undefined;
  let opened = false;
  let destroyed = false;
  let scrollLockHeld = false;
  let openMediaQuery: MediaQueryList | null = null;
  let lifetimeObserver: MutationObserver | null = null;
  let activeTrigger = options.trigger;

  const setActiveTrigger = (trigger: HTMLElement): void => {
    if (activeTrigger === trigger) return;
    activeTrigger.setAttribute("aria-expanded", "false");
    activeTrigger = trigger;
    activeTrigger.setAttribute("aria-expanded", "false");
  };

  const ensureMounted = (): HTMLElement | null => {
    if (destroyed) return null;
    if (element) return element;

    element = options.mount();
    options.host.append(element);
    element.classList.add("hidden");
    element.hidden = true;
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("inert", "");
    const cleanup = options.onMount?.(element);
    if (typeof cleanup === "function") mountedCleanup = cleanup;
    return element;
  };

  const close = (restoreFocus = true): void => {
    if (!element || !opened) return;
    opened = false;
    stopOpenListeners();
    element.hidden = true;
    element.classList.add("hidden");
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("inert", "");
    activeTrigger.setAttribute("aria-expanded", "false");
    if (scrollLockHeld) {
      scrollLockHeld = false;
      releaseScrollLock();
    }
    options.onClose?.(element);
    if (restoreFocus && activeTrigger.isConnected) activeTrigger.focus();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!opened || !element) return;
    if (!activeTrigger.isConnected || !element.isConnected) {
      close(false);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(element);
    if (focusable.length === 0) {
      event.preventDefault();
      element.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onMediaChange = (event: MediaQueryListEvent): void => {
    if (event.matches) close(false);
  };

  function stopOpenListeners(): void {
    document.removeEventListener("keydown", onKeyDown);
    openMediaQuery?.removeEventListener("change", onMediaChange);
    openMediaQuery = null;
  }

  function startOpenListeners(): void {
    document.addEventListener("keydown", onKeyDown);
    if (options.closeOnMediaQuery) {
      openMediaQuery = window.matchMedia(options.closeOnMediaQuery);
      openMediaQuery.addEventListener("change", onMediaChange);
    }
  }

  const open = (): void => {
    if (destroyed || opened) return;
    if (options.closeOnMediaQuery && window.matchMedia(options.closeOnMediaQuery).matches) return;
    const mountedElement = ensureMounted();
    if (!mountedElement) return;
    opened = true;
    acquireScrollLock();
    scrollLockHeld = true;
    mountedElement.hidden = false;
    mountedElement.classList.remove("hidden");
    mountedElement.setAttribute("aria-hidden", "false");
    mountedElement.removeAttribute("inert");
    activeTrigger.setAttribute("aria-expanded", "true");
    startOpenListeners();
    options.onOpen?.(mountedElement);
    const initialFocus =
      options.initialFocus?.(mountedElement) ?? getFocusableElements(mountedElement)[0];
    (initialFocus ?? mountedElement).focus();
  };

  const onTriggerClick = (event: Event): void => {
    event.preventDefault();
    openFrom(options.trigger);
  };

  const openFrom = (trigger: HTMLElement): void => {
    if (destroyed) return;
    setActiveTrigger(trigger);
    open();
  };

  options.trigger.setAttribute("aria-expanded", "false");
  if (options.bindTrigger !== false) options.trigger.addEventListener("click", onTriggerClick);
  if (typeof MutationObserver !== "undefined") {
    lifetimeObserver = new MutationObserver(() => {
      if (
        !activeTrigger.isConnected ||
        !options.host.isConnected ||
        (element !== null && !element.isConnected)
      ) {
        destroy();
      }
    });
    lifetimeObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function destroy(): void {
    if (destroyed) return;
    close(false);
    destroyed = true;
    if (options.bindTrigger !== false) options.trigger.removeEventListener("click", onTriggerClick);
    stopOpenListeners();
    lifetimeObserver?.disconnect();
    lifetimeObserver = null;
    mountedCleanup?.();
    mountedCleanup = undefined;
    element?.remove();
    element = null;
  }

  return {
    get element() {
      return element;
    },
    get mounted() {
      return element !== null;
    },
    get opened() {
      return opened;
    },
    open,
    openFrom,
    close,
    destroy,
  };
}
