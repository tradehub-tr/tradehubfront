import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mountChatPopup,
  initChatTriggers,
  initMessagesLayout,
  requireAuth,
  startAlpine,
} = vi.hoisted(() => ({
  mountChatPopup: vi.fn(),
  initChatTriggers: vi.fn(),
  initMessagesLayout: vi.fn(),
  requireAuth: vi.fn(async () => undefined),
  startAlpine: vi.fn(),
}));

vi.mock("flowbite", () => ({ initFlowbite: vi.fn() }));
vi.mock("../components/header", () => ({
  TopBar: () => '<header data-test="topbar"></header>',
  initHeaderCart: vi.fn(),
}));
vi.mock("../components/header/TopBar", () => ({ initLanguageSelector: vi.fn() }));
vi.mock("../components/chat-popup", () => ({ mountChatPopup, initChatTriggers }));
vi.mock("../components/floating", () => ({
  FloatingPanel: () => '<aside data-test="floating-panel"></aside>',
}));
vi.mock("../alpine", () => ({ startAlpine }));
vi.mock("../components/sidebar", () => ({
  renderSidebarColumn: () => '<aside data-test="sidebar"></aside>',
  initSidebar: vi.fn(),
}));
vi.mock("../components/messages", () => ({
  MessagesLayout: () => '<section data-test="messages-layout"></section>',
  initMessagesLayout,
}));
vi.mock("../utils/auth-guard", () => ({ requireAuth }));

describe("Messages page chat ownership", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes MessagesLayout without bootstrapping the global chat overlay", async () => {
    await import("./messages");

    expect(requireAuth).toHaveBeenCalledOnce();
    expect(initMessagesLayout).toHaveBeenCalledOnce();
    expect(startAlpine).toHaveBeenCalledOnce();
    expect(mountChatPopup).not.toHaveBeenCalled();
    expect(initChatTriggers).not.toHaveBeenCalled();
    expect(document.querySelector('[data-test="messages-layout"]')).not.toBeNull();
  });
});
