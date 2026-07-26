import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (key: string) => key }));
vi.mock("../icons/lucideIcons", () => ({
  getLucideIcon: () => "<svg aria-hidden=\"true\"></svg>",
}));

import { mountChatPopup } from "../chat-popup/mountChatPopup";
import "../../alpine/chatPopup";
import "../../alpine/reservationModal";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ReservationModal mount ownership", () => {
  it("does not create a ReservationModal until the first chat intent, then mounts exactly one", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    mountChatPopup();

    expect(document.querySelectorAll('[x-data]:not([x-data="chatPopupRoot"])')).toHaveLength(0);

    window.dispatchEvent(new CustomEvent("chat-popup:open", { detail: { trigger } }));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('[x-data]:not([x-data="chatPopupRoot"])')).toHaveLength(1);
    });

    expect(document.querySelector("#reservation-modal-mount")).toBeNull();
    expect(document.querySelector("#chat-popup-mount")).not.toBeNull();
  });
});
