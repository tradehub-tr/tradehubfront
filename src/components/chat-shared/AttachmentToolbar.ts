import { getLucideIcon } from "../icons/lucideIcons";

interface ToolbarButton {
  key: "emoji" | "photo" | "file" | "call" | "card" | "location" | "translate";
  icon: string;
  label: string;
}

const BUTTONS: ToolbarButton[] = [
  { key: "emoji", icon: "smile", label: "Emoji" },
  { key: "photo", icon: "image", label: "Fotoğraf" },
  { key: "file", icon: "paperclip", label: "Dosya" },
  { key: "call", icon: "phone", label: "Arama" },
  { key: "card", icon: "contact", label: "Kartvizit" },
  { key: "location", icon: "map-pin", label: "Konum" },
  { key: "translate", icon: "languages", label: "Çeviri" },
];

export function AttachmentToolbar(): string {
  const items = BUTTONS.map((b) => {
    const icon = getLucideIcon(b.icon, "w-5 h-5");
    return `
      <button type="button"
              data-submenu-trigger
              @click.stop="$store.chatPopup.toggleSubMenu('${b.key}')"
              class="appearance-none border-0 bg-transparent p-1.5 rounded cursor-pointer text-[var(--color-text-tertiary,#a3a3a3)] hover:text-[var(--color-primary-600,#d39c00)] focus:outline-none transition-colors"
              :class="$store.chatPopup.openSubMenu === '${b.key}' ? 'text-[var(--color-primary-600,#d39c00)] bg-[var(--color-primary-50,#fff8e1)]' : ''"
              aria-label="${b.label}">
        ${icon}
      </button>`;
  }).join("");

  return /* html */ `
    <div class="flex items-center gap-3.5 px-4 py-2">
      ${items}
    </div>
  `;
}
