import Alpine from "alpinejs";
import Swiper from "swiper";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { getSessionUser, resendVerificationEmail } from "../utils/auth";
import { callMethod } from "../utils/api";
import { t } from "../i18n";

Alpine.data("buyerUserInfo", () => ({
  userName: "",
  userInitial: "",
  statsMessages: 0,
  statsQuotations: 0,
  statsCoupons: 0,

  init() {
    this.loadUser();
    this.loadStats();
  },

  async loadUser() {
    try {
      const user = await getSessionUser();
      if (user) {
        this.userName = user.full_name || "";
        this.userInitial = (user.full_name || user.email || "?").charAt(0).toLowerCase();

        // Update TopBar greeting if present
        const greetingEl = document.querySelector('#user-dropdown-menu [data-i18n="header.hello"]');
        if (greetingEl) {
          greetingEl.textContent = t("header.hello", { name: user.full_name });
        }
      }
    } catch {
      /* ignore */
    }
  },

  async loadStats() {
    try {
      const [orderResult, couponResult] = await Promise.allSettled([
        callMethod<{ success: boolean; counts: Record<string, number> }>(
          "tradehub_core.api.order.get_order_counts"
        ),
        callMethod<{ coupons: { status: string }[] }>("tradehub_core.api.cart.get_buyer_coupons"),
      ]);

      if (orderResult.status === "fulfilled" && orderResult.value?.success) {
        this.statsMessages = orderResult.value.counts.all || 0;
      }
      if (couponResult.status === "fulfilled" && couponResult.value?.coupons) {
        this.statsCoupons = couponResult.value.coupons.filter(
          (c) => c.status === "available"
        ).length;
      }
    } catch {
      /* ignore */
    }
  },
}));

type Banner =
  | { type: "email-verify"; email: string }
  | { type: "remote"; title: string; link_text: string; link_href: string };

Alpine.data("dashboardBanners", () => ({
  banners: [] as Banner[],
  emailVerified: true,
  userEmail: "",
  verificationSent: false,
  sending: false,
  errorMessage: "",
  swiperInstance: null as Swiper | null,

  async init() {
    // 1. Config'i $root data-* attribute'larından oku (XSS-safe)
    const root = this.$root as HTMLElement;
    this.emailVerified = root.dataset.emailVerified === "true";
    this.userEmail = root.dataset.userEmail ?? "";

    // 2. Backend banner'larını çek
    let remote: { title: string; link_text: string; link_href: string }[] = [];
    try {
      const result = await callMethod<{
        success: boolean;
        banners: { title: string; link_text: string; link_href: string }[];
      }>("tradehub_core.api.banner.get_active_banners");

      if (result?.success && Array.isArray(result.banners)) {
        remote = result.banners;
      }
    } catch (err) {
      console.warn("[DashboardBanners] API fetch failed:", err);
    }

    // 3. E-posta doğrulanmamış + email mevcut → synthetic banner ilk sırada
    const synthetic: Banner[] =
      !this.emailVerified && this.userEmail
        ? [{ type: "email-verify", email: this.userEmail }]
        : [];

    this.banners = [...synthetic, ...remote.map((b) => ({ type: "remote" as const, ...b }))];

    if (this.banners.length > 0) {
      this.$nextTick(() => this.initSwiper());
    }
  },

  async sendVerification() {
    if (this.sending) return;
    this.sending = true;
    this.errorMessage = "";
    try {
      await resendVerificationEmail();
      this.verificationSent = true;
    } catch {
      this.errorMessage = t("dashboard.verificationEmailFailed");
      setTimeout(() => {
        this.errorMessage = "";
      }, 4000);
    } finally {
      this.sending = false;
    }
  },

  initSwiper() {
    const container = (this.$el as HTMLElement).querySelector<HTMLElement>(
      ".operation-slider__swiper"
    );
    if (!container) return;

    const hasMultiple = this.banners.length > 1;

    this.swiperInstance = new Swiper(container, {
      modules: [Navigation, Pagination, Autoplay],
      slidesPerView: 1,
      loop: hasMultiple,
      autoplay: hasMultiple ? { delay: 5000, disableOnInteraction: false } : false,
      navigation: hasMultiple
        ? { nextEl: ".operation-slider__next", prevEl: ".operation-slider__prev" }
        : false,
      pagination: hasMultiple ? { el: ".operation-slider__pagination", clickable: true } : false,
    });
  },

  destroy() {
    this.swiperInstance?.destroy(true, true);
  },
}));
