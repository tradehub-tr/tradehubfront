import { getLucideIcon } from "../icons/lucideIcons";
import { t } from "../../i18n";

interface ToolbarButton {
  key: "emoji" | "photo" | "file" | "call" | "card";
  icon: string;
  labelKey: "emoji" | "photo" | "file" | "call" | "card";
  /** Submenu açmak yerine doğrudan çağrılacak store method'u. */
  action?: "startVideoCall";
}

const BUTTONS: ToolbarButton[] = [
  { key: "emoji", icon: "smile", labelKey: "emoji" },
  { key: "photo", icon: "image", labelKey: "photo" },
  { key: "file", icon: "paperclip", labelKey: "file" },
  { key: "call", icon: "video", labelKey: "call", action: "startVideoCall" },
  { key: "card", icon: "contact", labelKey: "card" },
];

export function AttachmentToolbar(): string {
  const items = BUTTONS.map((b) => {
    const icon = getLucideIcon(b.icon, "w-4 h-4");
    const label = t(`chat.toolbar.${b.labelKey}`);
    const clickHandler = b.action
      ? `$store.chatPopup.${b.action}()`
      : `$store.chatPopup.toggleSubMenu('${b.key}')`;
    return `
      <button type="button"
              data-submenu-trigger
              @click.stop="${clickHandler}"
              :disabled="${b.action === "startVideoCall" ? "$store.chatPopup.startingCall" : "false"}"
              class="appearance-none border-0 bg-transparent p-1 rounded cursor-pointer text-[var(--color-text-tertiary,#a3a3a3)] hover:text-[var(--color-primary-600,#d39c00)] focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="$store.chatPopup.openSubMenu === '${b.key}' ? 'text-[var(--color-primary-600,#d39c00)] bg-[var(--color-primary-50,#fff8e1)]' : ''"
              aria-label="${label}">
        ${icon}
      </button>`;
  }).join("");

  return /* html */ `
    <div class="flex items-center gap-2 px-4 py-1">
      ${items}
    </div>
  `;
}
