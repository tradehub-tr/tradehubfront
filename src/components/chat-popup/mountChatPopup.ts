/**
 * Idempotent global mount for the chat popup. Inserts the popup HTML into
 * document.body once per page lifetime; subsequent calls are no-ops. Must be
 * invoked AFTER the main app DOM is in place and BEFORE startAlpine() so
 * Alpine scans the x-data="chatPopupRoot" attribute on its first pass.
 */

import { ChatPopup } from "./ChatPopup";

const MOUNT_ID = "chat-popup-mount";

export function mountChatPopup(): void {
  if (document.getElementById(MOUNT_ID)) return;
  const container = document.createElement("div");
  container.id = MOUNT_ID;
  container.innerHTML = ChatPopup();
  document.body.appendChild(container);
}
