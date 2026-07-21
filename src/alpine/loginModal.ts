/**
 * loginModal — misafir kullanıcı login-gerektiren bir aksiyon (favori, sepete ekle vb.)
 * denediğinde açılan modal. B-2: product.ts'ten ayrıldı — çapraz (6 listeleme/detay
 * sayfasında kullanılıyor) ve self-contained olduğu için ayrı modül. Böylece yüksek-trafik
 * listeleme sayfaları ağır product-detail modülünü (imageGallery vb.) yüklemeden yalnız
 * bu küçük modülü taşır.
 */
import Alpine from "alpinejs";
import { t } from "../i18n";

Alpine.data("loginModal", () => ({
  open: false,
  email: "",
  password: "",
  showPassword: false,
  loading: false,
  errorMsg: "",

  show() {
    this.open = true;
    this.errorMsg = "";
    document.body.style.overflow = "hidden";
  },

  close() {
    this.open = false;
    this.errorMsg = "";
    // Only restore body scroll if no other modal is open underneath
    // ReviewsModal now uses Alpine x-data with :data-open="open" instead of rv-modal-hidden class
    const reviewsModal = document.getElementById("rv-reviews-modal");
    const reviewsOpen = reviewsModal?.dataset.open === "true";
    if (!reviewsOpen) {
      document.body.style.overflow = "";
    }
  },

  async submit() {
    if (this.loading) return;
    this.errorMsg = "";
    const email = (this.email || "").trim();
    const password = this.password || "";
    if (!email || !password) {
      this.errorMsg = t("auth.login.invalidCredentials");
      return;
    }
    this.loading = true;
    try {
      const { login, invalidateAuthCache, waitForAuth } = await import("../utils/auth");
      await login(email, password);
      invalidateAuthCache();
      await waitForAuth();
      window.dispatchEvent(new CustomEvent("login-success"));
      this.email = "";
      this.password = "";
      this.close();
    } catch (err) {
      if (err instanceof Error && err.message === "2FA_REQUIRED") {
        this.errorMsg = t("auth.login.2faRequired");
      } else if (err instanceof Error && err.message === "ACCOUNT_DISABLED") {
        this.errorMsg = t("auth.login.accountDisabled");
      } else {
        this.errorMsg = t("auth.login.invalidCredentials");
      }
    } finally {
      this.loading = false;
    }
  },
}));
