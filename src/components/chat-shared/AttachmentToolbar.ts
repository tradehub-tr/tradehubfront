import { getLucideIcon } from "../icons/lucideIcons";
import { t } from "../../i18n";

interface ToolbarButton {
  key: "emoji" | "photo" | "file" | "call" | "card" | "location" | "translate";
  icon: string;
  labelKey: "emoji" | "photo" | "file" | "call" | "card" | "location" | "translate";
}

const BUTTONS: ToolbarButton[] = [
  { key: "emoji", icon: "smile", labelKey: "emoji" },
  { key: "photo", icon: "image", labelKey: "photo" },
  { key: "file", icon: "paperclip", labelKey: "file" },
  { key: "call", icon: "phone", labelKey: "call" },
  { key: "card", icon: "contact", labelKey: "card" },
  { key: "location", icon: "map-pin", labelKey: "location" },
  { key: "translate", icon: "languages", labelKey: "translate" },
];

export function AttachmentToolbar(): string {
  const items = BUTTONS.map((b) => {
    const icon = getLucideIcon(b.icon, "w-5 h-5");
    const label = t(`chat.toolbar.${b.labelKey}`);
    return `
      <button type="button"
              data-submenu-trigger
              @click.stop="$store.chatPopup.toggleSubMenu('${b.key}')"
              class="appearance-none border-0 bg-transparent p-1.5 rounded cursor-pointer text-[var(--color-text-tertiary,#a3a3a3)] hover:text-[var(--color-primary-600,#d39c00)] focus:outline-none transition-colors"
              :class="$store.chatPopup.openSubMenu === '${b.key}' ? 'text-[var(--color-primary-600,#d39c00)] bg-[var(--color-primary-50,#fff8e1)]' : ''"
              aria-label="${label}">
        ${icon}
      </button>`;
  }).join("");

  return /* html */ `
    <div class="flex items-center gap-3.5 px-4 py-2">
      ${items}
    </div>
  `;
}
