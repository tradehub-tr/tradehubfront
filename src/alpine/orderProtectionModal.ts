/**
 * orderProtectionModal — sipariş koruması bilgi modal'ı. B-2: product.ts'ten ayrıldı —
 * yalnız checkout sayfasında kullanılıyor, self-contained. product-detail'in ağır
 * modülünü checkout'a çekmemek için ayrı modül.
 */
import Alpine from "alpinejs";

Alpine.data("orderProtectionModal", () => ({
  open: false,
  triggerEl: null as HTMLElement | null,

  show() {
    // Save the element that triggered the modal for focus restoration
    this.triggerEl = document.activeElement as HTMLElement | null;
    this.open = true;
    document.body.style.overflow = "hidden";
    // Auto-focus close button after Alpine renders the modal
    setTimeout(() => {
      const closeBtn = (this.$refs as Record<string, HTMLElement>).closeBtn;
      closeBtn?.focus();
    }, 50);
  },

  close() {
    this.open = false;
    document.body.style.overflow = "";
    // Restore focus to the element that opened the modal
    this.triggerEl?.focus();
    this.triggerEl = null;
  },

  trapFocus(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const el = this.$el as HTMLElement;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  },
}));
