// Static popular emoji grid. Inserts the chosen character into the composer
// draft via the store. Closes itself by toggling its own sub-menu key.

const EMOJIS = [
  "😊","😍","😂","😘","😁","😎","🤔","😴",
  "😅","🥰","🤩","😇","😉","😏","🙂","😐",
  "👍","👏","🙏","💪","👌","🤝","✌️","👋",
  "🤞","🫡","🫶","🤗","✋","☝️","🤙","🤘",
  "❤️","💔","💯","🔥","⭐","🎉","🎁","🎊",
  "📧","⏰","✈️","📦","🚚","🛒","💼","📷",
  "📝","✅","❌","⚠️","ℹ️","💡","🔔","💬",
  "💰","💵","💳","🏷️","📊","📈","💸","🧾",
  "📍","🌍","☀️","🌧️","⛈️","🌈","🌟","☘️",
];

export function EmojiPicker(): string {
  const grid = EMOJIS.map(
    (e) =>
      `<button type="button"
        @click.stop="$store.chatPopup.appendDraft('${e}')"
        class="appearance-none border-0 bg-transparent p-1 text-lg leading-none cursor-pointer rounded hover:bg-[var(--color-surface-raised,#f5f5f5)] focus:outline-none">${e}</button>`,
  ).join("");

  return /* html */ `
    <div data-submenu-panel
         x-show="$store.chatPopup.openSubMenu === 'emoji'"
         x-transition.opacity
         x-cloak
         class="absolute bottom-[150px] left-4 z-30 w-[280px] max-w-[calc(100%-2rem)] rounded-lg border border-[var(--color-border-default,#e5e5e5)] bg-white p-2 shadow-lg">
      <div class="grid grid-cols-8 gap-1">
        ${grid}
      </div>
    </div>
  `;
}
