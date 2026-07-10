import Alpine from "alpinejs";

// motion (~) yalnızca arama-formu aç/kapa animasyonunda kullanılıyor (runAnimation,
// kullanıcı etkileşimiyle tetiklenir). Statik import her sayfada yüklenen alpine
// chunk'ını ~kBʼlarca şişiriyordu; ilk-paint-kritik DEĞİL → dinamik import ile
// ayrı async chunk'a alındı (ilk etkileşimde yüklenir, sonrası cache'li).
type AnimateFn = (typeof import("motion"))["animate"];
let _animate: AnimateFn | null = null;
function loadAnimate(): Promise<AnimateFn> {
  if (_animate) return Promise.resolve(_animate);
  return import("motion").then((mod) => {
    _animate = mod.animate;
    return _animate;
  });
}

Alpine.data("floatingPanel", () => ({
  showScrollTop: false,
  chatOpen: false,
  lensOpen: false,
  isSeller: false,
  sellerPanelUrl:
    (import.meta.env as Record<string, string>).VITE_SELLER_PANEL_URL || "http://localhost:8082/",

  async init() {
    this.showScrollTop = window.scrollY > 300;
    window.addEventListener(
      "scroll",
      () => {
        this.showScrollTop = window.scrollY > 300;
      },
      { passive: true }
    );

    try {
      const res = await fetch(
        (window.API_BASE || "/api") + "/method/tradehub_core.api.v1.auth.get_session_user",
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = (await res.json()) as {
          message?: { logged_in?: boolean; user?: { has_seller_profile?: boolean } };
        };
        if (data.message?.logged_in && data.message?.user?.has_seller_profile) {
          this.isSeller = true;
        }
      }
    } catch {
      // session yüklenemedi, buton gösterilmez
    }
  },

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  openMessages() {
    // chat-popup mount edilmiş sayfada popup'ı aç (Alibaba pattern: sağ-alt
    // floating pencere); mount edilmemiş sayfada mesajlar sayfasına yönlendir.
    if (document.getElementById("chat-popup-mount")) {
      window.dispatchEvent(new CustomEvent("chat-popup:open"));
    } else {
      window.location.href = "/pages/dashboard/messages.html";
    }
  },
}));

/**
 * Sticky header search — Motion One ile akıcı (60fps) açılış/kapanış.
 * iOS / macOS native his için spring physics + GPU-accelerated transform.
 * Web Animations API üzerine kurulu olduğu için JS thread'i bloklamaz.
 */
Alpine.data("stickyHeaderSearch", () => ({
  expanded: false,

  init() {
    this.$watch("expanded", (isExpanded: boolean) => {
      const el = this.$el as HTMLElement;
      el.querySelectorAll<HTMLElement>("[data-compact-expanded-interactive]").forEach((interEl) => {
        if (isExpanded) {
          interEl.removeAttribute("tabindex");
        } else {
          interEl.setAttribute("tabindex", "-1");
        }
      });

      this.runAnimation(isExpanded);
    });

    window.addEventListener(
      "resize",
      () => {
        if (this.expanded) {
          this.syncDropdownOffset();
        }
      },
      { passive: true }
    );

    document.addEventListener("istoc:close-search", () => {
      this.close();
      const input = (this.$refs as Record<string, HTMLInputElement>).searchInput;
      if (input && document.activeElement === input) {
        input.blur();
      }
    });
  },

  /**
   * Form shell + dropdown animasyonu (Emil prensipleri).
   * Açılış = giren öğe → güçlü EASE-OUT (anında hisseden, responsive).
   * Kapanış = çıkan öğe → daha snappy/kısa eğri. Material ease-in-out
   * (başta yavaş, sluggish) terk edildi. prefers-reduced-motion'da
   * hareket atlanır, son duruma anında geçilir.
   */
  runAnimation(isExpanded: boolean) {
    const refs = this.$refs as Record<string, HTMLElement | undefined>;
    const form = refs.searchForm;
    const dropdown = refs.dropdown;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Güçlü ease-out (girer) / snappy çıkış eğrisi.
    const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
    const easeExit: [number, number, number, number] = [0.32, 0.72, 0, 1];

    void loadAnimate().then((animate) => {
      if (prefersReduced) {
        if (form) {
          animate(
            form,
            { height: isExpanded ? "100px" : "42px", borderRadius: isExpanded ? "16px" : "9999px" },
            { duration: 0 }
          );
        }
        if (dropdown) animate(dropdown, { opacity: isExpanded ? 1 : 0 }, { duration: 0.12 });
        return;
      }

      if (isExpanded) {
        if (form) {
          animate(
            form,
            {
              height: ["42px", "100px"],
              borderRadius: ["9999px", "16px"],
            },
            { duration: 0.3, ease: easeOut }
          );
        }
        if (dropdown) {
          animate(
            dropdown,
            {
              opacity: [0, 1],
              y: [-4, 0],
              scale: [0.99, 1],
            },
            { duration: 0.26, ease: easeOut, delay: 0.05 }
          );
        }
      } else {
        if (form) {
          animate(
            form,
            {
              height: ["100px", "42px"],
              borderRadius: ["16px", "9999px"],
            },
            { duration: 0.2, ease: easeExit }
          );
        }
        if (dropdown) {
          animate(
            dropdown,
            {
              opacity: [1, 0],
              y: [0, -2],
              scale: [1, 0.99],
            },
            { duration: 0.15, ease: easeExit }
          );
        }
      }
    });
  },

  open() {
    if (this.expanded) return;
    this.expanded = true;
    this.$nextTick(() => {
      this.syncDropdownOffset();
    });
  },

  close() {
    if (!this.expanded) return;
    this.expanded = false;
  },

  syncDropdownOffset() {
    // Top position is now handled purely via Tailwind CSS classes
  },

  pickValue(value: string) {
    if (!value) return;
    const input = (this.$refs as Record<string, HTMLInputElement>).searchInput;
    if (input) {
      input.value = value;
      input.focus();
    }
  },
}));

Alpine.data("checkbox", () => ({
  checked: false,
  indeterminate: false,
  inputId: "",
  handlerId: null as string | null,

  init() {
    const input = (this.$refs as Record<string, HTMLInputElement>).input;
    if (!input) return;

    this.inputId = input.id;
    this.checked = input.checked;
    this.handlerId = input.dataset.onchange || null;

    if (input.dataset.indeterminate === "true") {
      this.indeterminate = true;
    }
  },

  handleChange() {
    const input = (this.$refs as Record<string, HTMLInputElement>).input;
    if (!input) return;

    this.checked = input.checked;
    this.indeterminate = false;

    if (this.handlerId) {
      this.$dispatch("checkbox-change", {
        id: this.inputId,
        checked: this.checked,
        handlerId: this.handlerId,
      });
    }
  },
}));

Alpine.data(
  "quantityInput",
  (props: { value: number; min: number; max: number; step: number; id: string }) => ({
    value: props.value,
    min: props.min,
    // max=0 gelirse (stok takipli ama stok girilmemiş) sınırsız say; backend zaten stok kontrolü yapıyor
    max: props.max > 0 ? props.max : 999999,
    step: props.step,
    id: props.id,

    decrement() {
      const current = this.value || this.min;
      const target = current - this.step;
      const snapped = this.step > 1 ? Math.floor(target / this.step) * this.step : target;
      this.value = Math.min(Math.max(snapped, this.min), this.max);
      this.$dispatch("quantity-change", { id: this.id, value: this.value });
    },

    increment() {
      const current = this.value || this.min;
      const target = current + this.step;
      const snapped = this.step > 1 ? Math.ceil(target / this.step) * this.step : target;
      this.value = Math.min(Math.max(snapped, this.min), this.max);
      this.$dispatch("quantity-change", { id: this.id, value: this.value });
    },

    clampAndDispatch() {
      const input = (this.$refs as Record<string, HTMLInputElement>).input;
      const raw = Number(input.value);
      let next = Number.isNaN(raw) ? this.min : raw;
      if (this.step > 1 && next > 0 && next % this.step !== 0) {
        next = Math.ceil(next / this.step) * this.step;
      }
      this.value = Math.min(Math.max(next, this.min), this.max);
      this.$dispatch("quantity-change", { id: this.id, value: this.value });
    },
  })
);
