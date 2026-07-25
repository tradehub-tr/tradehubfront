/**
 * Global lazy overlay host for chat and reservation.
 *
 * Page entries may call mountChatPopup() freely. Until a chat/reservation
 * intent arrives, this module creates neither the heavyweight markup nor its
 * async chunk. The retained lazy mount keeps a single overlay tree alive
 * across close/reopen cycles and restores focus to the active trigger.
 */

import Alpine from "alpinejs";
import { createLazyMount, type LazyMountController } from "../../utils/lazyMount";

type ChatOpenDetail = {
  sellerId?: string;
  pinnedProduct?: unknown;
  initialMessage?: string;
  initialFile?: File;
  trigger?: HTMLElement;
};

type ReservationOpenDetail = {
  sellerId?: string;
  sellerName?: string;
  trigger?: HTMLElement;
};

type ChatOpenOutcome = "opened" | "reservation-required" | "blocked";

type ChatOverlayState = {
  controller: LazyMountController | null;
  mounting: Promise<void> | null;
  attempt: number;
  pendingChat: ChatOpenDetail | null;
  pendingReservation: ReservationOpenDetail | null;
  onChatOpen: (event: Event) => void;
  onChatClose: () => void;
  onReservationOpen: (event: Event) => void;
  onReservationClose: () => void;
};

type ChatOverlayDocument = Document & { __chatPopupLazyOverlay?: ChatOverlayState };

function triggerFrom(detail: { trigger?: HTMLElement }): HTMLElement {
  if (detail.trigger?.isConnected) return detail.trigger;
  const active = document.activeElement;
  return active instanceof HTMLElement && active.isConnected ? active : document.body;
}

function closeChatAndReservationStores(): void {
  const chat = Alpine.store("chatPopup") as { isOpen?: boolean; close?: () => void } | undefined;
  if (chat?.isOpen) chat.close?.();

  const reservation = Alpine.store("reservationModal") as
    | { isOpen?: boolean; close?: () => void }
    | undefined;
  if (reservation?.isOpen) reservation.close?.();
}

function openReservationStore(detail: ReservationOpenDetail, root: HTMLElement): void {
  const reservation = Alpine.store("reservationModal") as
    | { open?: (options: { sellerId: string; sellerName?: string }) => Promise<void> }
    | undefined;
  if (!detail.sellerId || !reservation?.open) return;
  void reservation.open({ sellerId: detail.sellerId, sellerName: detail.sellerName });
  focusReservationDialog(root);
}

function isCurrentAttempt(state: ChatOverlayState, attempt: number): boolean {
  return state.attempt === attempt;
}

function invalidateAttempt(state: ChatOverlayState): void {
  state.attempt += 1;
  state.pendingChat = null;
  state.pendingReservation = null;
}

function openChatStore(
  state: ChatOverlayState,
  attempt: number,
  detail: ChatOpenDetail,
  root: HTMLElement
): Promise<ChatOpenOutcome> {
  const chat = Alpine.store("chatPopup") as
    | {
        open?: (options: Omit<ChatOpenDetail, "trigger"> & {
          onReservationRequired?: (detail: ReservationOpenDetail) => void;
          isCurrentAttempt?: () => boolean;
        }) => Promise<ChatOpenOutcome>;
      }
    | undefined;
  if (!chat?.open) return Promise.resolve("blocked");
  const { trigger: _trigger, ...options } = detail;
  return chat.open({
    ...options,
    isCurrentAttempt: () => isCurrentAttempt(state, attempt),
    onReservationRequired: (reservation) => openReservationStore(reservation, root),
  });
}

function settleChatOpen(
  state: ChatOverlayState,
  attempt: number,
  detail: ChatOpenDetail,
  root: HTMLElement
): void {
  void openChatStore(state, attempt, detail, root).then((outcome) => {
    if (!isCurrentAttempt(state, attempt)) return;
    if (outcome === "blocked") state.controller?.close();
  });
}

function focusReservationDialog(root: HTMLElement): void {
  requestAnimationFrame(() => {
    root.querySelector<HTMLElement>("[data-reservation-modal-close]")?.focus();
  });
}

async function ensureMounted(state: ChatOverlayState, trigger: HTMLElement): Promise<void> {
  if (state.controller?.mounted) return;
  if (state.mounting) return state.mounting;

  state.mounting = Promise.all([
    import("./ChatPopup"),
    import("../reservation/ReservationModal"),
  ])
    .then(([{ ChatPopup }]) => {
      const controller = createLazyMount({
        trigger,
        host: document.body,
        bindTrigger: false,
        mount: () => {
          const container = document.createElement("div");
          container.id = "chat-popup-mount";
          container.innerHTML = ChatPopup();
          return container;
        },
        initialFocus: (container) =>
          container.querySelector<HTMLElement>("[data-chat-popup-close]"),
        onMount: (container) => {
          Alpine.initTree(container);
          return () => Alpine.destroyTree(container);
        },
        onOpen: (container) => {
          const chat = state.pendingChat;
          const reservation = state.pendingReservation;
          state.pendingChat = null;
          state.pendingReservation = null;
          if (chat) settleChatOpen(state, state.attempt, chat, container);
          if (reservation) focusReservationDialog(container);
        },
        onClose: () => {
          invalidateAttempt(state);
          closeChatAndReservationStores();
        },
      });
      state.controller = controller;
    })
    .finally(() => {
      state.mounting = null;
    });

  return state.mounting;
}

function openForChat(state: ChatOverlayState, detail: ChatOpenDetail): void {
  const attempt = state.attempt + 1;
  state.attempt = attempt;
  const trigger = triggerFrom(detail);
  state.pendingChat = detail;

  if (state.controller?.mounted) {
    if (state.controller.opened) {
      state.pendingChat = null;
      const root = state.controller.element;
      if (root) settleChatOpen(state, attempt, detail, root);
      return;
    }
    state.controller.openFrom(trigger);
    return;
  }

  void ensureMounted(state, trigger).then(() => {
    if (isCurrentAttempt(state, attempt)) state.controller?.openFrom(trigger);
  });
}

function openForReservation(state: ChatOverlayState, detail: ReservationOpenDetail): void {
  const attempt = state.attempt + 1;
  state.attempt = attempt;
  const trigger = triggerFrom(detail);
  state.pendingReservation = detail;

  if (state.controller?.mounted) {
    if (state.controller.opened) {
      const root = state.controller.element;
      if (root) focusReservationDialog(root);
      return;
    }
    state.controller.openFrom(trigger);
    return;
  }

  void ensureMounted(state, trigger).then(() => {
    if (isCurrentAttempt(state, attempt)) state.controller?.openFrom(trigger);
  });
}

/**
 * Registers lightweight, idempotent intent listeners. This intentionally does
 * not append a host element: a route with no chat intent pays zero chat or
 * reservation DOM/chunk cost.
 */
export function mountChatPopup(): void {
  const doc = document as ChatOverlayDocument;
  if (doc.__chatPopupLazyOverlay) {
    const controller = doc.__chatPopupLazyOverlay.controller;
    if (controller?.element && !controller.element.isConnected) {
      controller.destroy();
      doc.__chatPopupLazyOverlay.controller = null;
    }
    return;
  }

  const state = {} as ChatOverlayState;
  state.controller = null;
  state.mounting = null;
  state.attempt = 0;
  state.pendingChat = null;
  state.pendingReservation = null;
  state.onChatOpen = (event) => {
    const detail = ((event as CustomEvent<ChatOpenDetail>).detail ?? {}) as ChatOpenDetail;
    event.stopImmediatePropagation();
    openForChat(state, detail);
  };
  state.onChatClose = () => {
    invalidateAttempt(state);
    state.controller?.close();
  };
  state.onReservationOpen = (event) => {
    const detail = ((event as CustomEvent<ReservationOpenDetail>).detail ?? {}) as ReservationOpenDetail;
    event.stopImmediatePropagation();
    openForReservation(state, detail);
  };
  state.onReservationClose = () => {
    const chat = Alpine.store("chatPopup") as { isOpen?: boolean } | undefined;
    if (!chat?.isOpen) {
      invalidateAttempt(state);
      state.controller?.close();
    }
  };

  window.addEventListener("chat-popup:open", state.onChatOpen);
  window.addEventListener("chat-popup:close", state.onChatClose);
  window.addEventListener("reservation-modal:open", state.onReservationOpen);
  window.addEventListener("reservation-modal:close", state.onReservationClose);
  doc.__chatPopupLazyOverlay = state;
}
