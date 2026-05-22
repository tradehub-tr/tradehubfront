/**
 * Sosyal kanıt rozeti — ürün kartında dönen mini sinyal pencereleri.
 *
 * F1 servisinden gelen Signal[] üzerinde 5 saniyede bir döner. `prefers-reduced-motion`
 * açıksa veya sinyal tek/yoksa sabit kalır. Hover (pause/resume) ritmi bozmaz — flag
 * tabanlı; `setInterval` yeniden kurulmaz.
 *
 * Spec: docs/superpowers/specs/2026-05-20-product-social-proof-badges-design.md (G1)
 */

import Alpine from "alpinejs";

import { fetchSocialProofSignals, type Signal, type SignalType } from "../services/socialProofService";
import { formatCount } from "../utils/formatCount";
import { getLucideIcon } from "../components/icons/lucideIcons";
import { t } from "../i18n";

const ROTATION_INTERVAL_MS = 5000;
const ICON_SIZE_CLASS = "w-4 h-4";

const ICON_MAP: Record<SignalType, string> = {
  sales: "zap",
  favorites: "star",
  cart_now: "shopping-cart",
  views_24h: "eye",
  distinct_buyers: "building-2",
  seller_orders: "shield-check",
};

interface Init {
  listingId: string;
  supplierId: string;
}

Alpine.data("socialProofBadge", (initial: Init) => ({
  signals: [] as Signal[],
  currentIndex: 0,
  paused: false,
  intervalId: null as number | null,

  async init() {
    try {
      this.signals = await fetchSocialProofSignals(initial.listingId, initial.supplierId);
    } catch {
      this.signals = [];
      return;
    }

    if (this.signals.length <= 1) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    this.intervalId = window.setInterval(() => this.tick(), ROTATION_INTERVAL_MS);
  },

  tick() {
    if (this.paused || this.signals.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.signals.length;
  },

  pause() {
    this.paused = true;
  },

  resume() {
    this.paused = false;
  },

  formatMessage(sig: Signal): string {
    return t(`socialProof.${sig.type}`, {
      value: formatCount(sig.value),
      days: sig.window_days ?? "",
    });
  },

  iconFor(type: SignalType): string {
    return getLucideIcon(ICON_MAP[type], ICON_SIZE_CLASS);
  },
}));
