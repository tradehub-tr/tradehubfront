import Alpine from "alpinejs";
import { t } from "../i18n";
import { isPasswordValid } from "../utils/password-validation";
import { getSessionUser, logout } from "../utils/auth";
import { api } from "../utils/api";

Alpine.data("settingsLayout", () => ({
  currentSection: "",
  userName: "",
  userEmail: "",
  userInitial: "",
  userImage: "",
  memberId: "",
  copied: false,
  uploadingPhoto: false,
  photoError: "",

  init() {
    this.currentSection = window.location.hash || "";
    this.loadUser();
  },

  async loadUser() {
    try {
      const user = await getSessionUser();
      if (user) {
        this.userName = user.full_name || "";
        this.userEmail = user.email || "";
        this.userInitial = (user.full_name || user.email || "?").charAt(0).toLowerCase();
        this.userImage = user.user_image || "";
        this.memberId = user.member_id || "";
      }
    } catch {
      /* ignore */
    }
  },

  async handleLogout() {
    await logout();
    window.location.replace("/pages/auth/login.html");
  },

  copyMemberId() {
    const text = this.memberId || this.userEmail;
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 1800);
      })
      .catch(() => {
        /* ignore clipboard errors */
      });
  },

  gotoChangeEmail() {
    window.location.hash = "#eposta-degistir";
  },

  triggerPhotoUpload() {
    const input = (this.$refs as Record<string, HTMLInputElement>).photoInput;
    if (input) input.click();
  },

  async uploadProfilePhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.photoError = "";

    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      this.photoError = t("settings.photoInvalidType") || "Geçersiz dosya türü.";
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = t("settings.photoTooLarge") || "Dosya 5 MB'dan küçük olmalı.";
      input.value = "";
      return;
    }

    this.uploadingPhoto = true;
    try {
      const filedata = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });

      const res = await api<{ message: { success: boolean; user_image: string } }>(
        "/method/tradehub_core.api.v1.identity.update_profile_image",
        {
          method: "POST",
          body: JSON.stringify({ filename: file.name, filedata }),
        }
      );

      const nextUrl = res.message?.user_image || "";
      if (nextUrl) {
        // Cache-bust so the browser fetches the new image even if URL is the same
        this.userImage = nextUrl + (nextUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMIT") {
        this.photoError = t("common.rateLimitError");
      } else {
        this.photoError = t("settings.photoUploadFailed") || "Fotoğraf yüklenemedi.";
      }
    } finally {
      this.uploadingPhoto = false;
      input.value = "";
    }
  },
}));

Alpine.data("settingsChangeEmail", () => ({
  step: 1,
  error: "",
  loading: false,
  showPassword: false,
  currentEmail: "",

  async init() {
    try {
      const user = await getSessionUser();
      if (user) {
        this.currentEmail = user.email || "";
      }
    } catch {
      /* ignore */
    }

    // Reset form when navigating back to this section
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#eposta-degistir") {
        this.step = 1;
        this.error = "";
        const refs = this.$refs as Record<string, HTMLInputElement>;
        if (refs.newEmail) refs.newEmail.value = "";
        if (refs.emailPassword) refs.emailPassword.value = "";
      }
    });
  },

  async saveEmail() {
    const newEmail = (this.$refs as Record<string, HTMLInputElement>).newEmail.value.trim();
    const password = (this.$refs as Record<string, HTMLInputElement>).emailPassword.value;

    if (!newEmail) {
      this.error = t("settings.newEmailRequired");
      return;
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      this.error = t("settings.invalidEmailFormat");
      return;
    }

    // Cannot be same as current
    if (newEmail.toLowerCase() === this.currentEmail.toLowerCase()) {
      this.error = t("settings.emailSameAsCurrent");
      return;
    }

    if (!password) {
      this.error = t("settings.currentPasswordRequired");
      return;
    }

    this.error = "";
    this.loading = true;
    try {
      await api("/method/tradehub_core.api.v1.identity.change_email", {
        method: "POST",
        body: JSON.stringify({ new_email: newEmail, password }),
      });
      this.step = 2;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMIT") {
        this.error = t("common.rateLimitError");
      } else if (
        msg.includes("Incorrect") ||
        msg.includes("incorrect") ||
        msg.includes("Invalid")
      ) {
        this.error = t("settings.currentPasswordWrong");
      } else if (msg.includes("already exists") || msg.includes("Duplicate")) {
        this.error = t("settings.emailAlreadyExists");
      } else if (msg.includes("same as")) {
        this.error = t("settings.emailSameAsCurrent");
      } else {
        this.error = t("settings.emailChangeFailed");
      }
    } finally {
      this.loading = false;
    }
  },
}));

Alpine.data("settingsChangePassword", () => ({
  step: 1,
  error: "",
  loading: false,
  showCurrent: false,
  showNew: false,
  showConfirm: false,

  init() {
    // Reset form when navigating back to this section
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#sifre") {
        this.step = 1;
        this.error = "";
        const refs = this.$refs as Record<string, HTMLInputElement>;
        if (refs.pwCurrent) refs.pwCurrent.value = "";
        if (refs.pwNew) refs.pwNew.value = "";
        if (refs.pwConfirm) refs.pwConfirm.value = "";
      }
    });
  },

  async savePassword() {
    const currentPw = (this.$refs as Record<string, HTMLInputElement>).pwCurrent.value;
    const newPw = (this.$refs as Record<string, HTMLInputElement>).pwNew.value;
    const confirmPw = (this.$refs as Record<string, HTMLInputElement>).pwConfirm.value;

    if (!currentPw) {
      this.error = t("settings.currentPasswordRequired");
      return;
    }
    if (!isPasswordValid(newPw)) {
      this.error = t("settings.passwordMinLength");
      return;
    }
    if (newPw !== confirmPw) {
      this.error = t("settings.passwordsMismatch");
      return;
    }

    this.error = "";
    this.loading = true;
    try {
      await api("/method/tradehub_core.api.v1.identity.change_password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      this.step = 2;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMIT") {
        this.error = t("common.rateLimitError");
      } else if (
        msg.includes("Incorrect") ||
        msg.includes("incorrect") ||
        msg.includes("Invalid")
      ) {
        this.error = t("settings.currentPasswordWrong");
      } else {
        this.error = t("settings.passwordChangeFailed");
      }
    } finally {
      this.loading = false;
    }
  },
}));

Alpine.data("settingsChangePhone", () => ({
  step: 1,
  error: "",
  loading: false,
  currentPhone: "",

  async init() {
    try {
      const res = await api<{ message: { phone: string } }>(
        "/method/tradehub_core.api.v1.auth.get_user_profile"
      );
      this.currentPhone = res.message?.phone || "";
    } catch {
      /* ignore */
    }

    // Reset form when navigating back to this section
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#telefon") {
        this.step = 1;
        this.error = "";
        const refs = this.$refs as Record<string, HTMLInputElement>;
        if (refs.newPhone) refs.newPhone.value = "";
        if (refs.phonePassword) refs.phonePassword.value = "";
      }
    });
  },

  async savePhone() {
    const newPhone = (this.$refs as Record<string, HTMLInputElement>).newPhone.value.trim();
    const password = (this.$refs as Record<string, HTMLInputElement>).phonePassword.value;

    if (!newPhone) {
      this.error = t("settings.phoneRequired") || "Telefon numarası gerekli.";
      return;
    }
    if (!password) {
      this.error = t("settings.currentPasswordRequired");
      return;
    }

    this.error = "";
    this.loading = true;
    try {
      await api("/method/tradehub_core.api.v1.identity.change_phone", {
        method: "POST",
        body: JSON.stringify({ phone: newPhone, password }),
      });
      this.step = 2;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Incorrect") || msg.includes("incorrect") || msg.includes("Invalid")) {
        this.error = t("settings.currentPasswordWrong");
      } else {
        this.error = t("settings.phoneChangeFailed") || "Telefon numarası değiştirilemedi.";
      }
    } finally {
      this.loading = false;
    }
  },
}));

Alpine.data("settingsDeleteAccount", () => ({
  step: 1,
  error: "",
  loading: false,
  reason: "",

  goToStep2() {
    this.reason = (this.$refs as Record<string, HTMLSelectElement>).reason.value;
    this.step = 2;
  },

  async confirmDelete() {
    const password = (this.$refs as Record<string, HTMLInputElement>).deletePassword.value;
    const confirmed = (this.$refs as Record<string, HTMLInputElement>).confirmCheck.checked;

    if (!password) {
      this.error = t("settings.currentPasswordRequired");
      return;
    }
    if (!confirmed) {
      this.error = t("settings.confirmDeleteRequired") || "Lütfen onay kutusunu işaretleyin.";
      return;
    }

    this.error = "";
    this.loading = true;
    try {
      await api("/method/tradehub_core.api.v1.identity.delete_account", {
        method: "POST",
        body: JSON.stringify({ password, reason: this.reason }),
      });
      // Account disabled in DB — now logout and redirect
      this.step = 3;
      await logout();
      setTimeout(() => {
        window.location.href = "/pages/auth/login.html";
      }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Incorrect") || msg.includes("incorrect") || msg.includes("Invalid")) {
        this.error = t("settings.currentPasswordWrong");
      } else {
        this.error = t("settings.deleteAccountFailed") || "Hesap silinemedi.";
      }
    } finally {
      this.loading = false;
    }
  },
}));
