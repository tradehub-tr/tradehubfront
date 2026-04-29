import Alpine from "alpinejs";
import { t } from "../i18n";
import { isPasswordValid } from "../utils/password-validation";
import { getSessionUser, logout } from "../utils/auth";
import { api, OtpVerifyError, RateLimitError } from "../utils/api";

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

// E-posta değişimi pending state'i için sessionStorage anahtarı.
// Dil değiştirici sayfa reload yapıyor (TopBar.ts:1656/1666); state'i koru ki
// kullanıcı kod gönderildi ekranındayken dili değiştirse bile geri kaldığı
// yerden devam edebilsin.
const EMAIL_CHANGE_STATE_KEY = "settings.emailChange.pending";

interface EmailChangePendingState {
  pendingNewEmail: string;
  /** Pending state'in oluştuğu epoch ms — 30dk sonra expired sayılır (backend OTP TTL ile uyumlu) */
  ts: number;
}

function readPendingState(): EmailChangePendingState | null {
  try {
    const raw = sessionStorage.getItem(EMAIL_CHANGE_STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as EmailChangePendingState;
    // 30 dk OTP TTL'i geçmişse drop
    if (!data.ts || Date.now() - data.ts > 30 * 60 * 1000) {
      sessionStorage.removeItem(EMAIL_CHANGE_STATE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writePendingState(pendingNewEmail: string): void {
  try {
    sessionStorage.setItem(
      EMAIL_CHANGE_STATE_KEY,
      JSON.stringify({ pendingNewEmail, ts: Date.now() })
    );
  } catch {
    /* sessionStorage yoksa yoksay */
  }
}

function clearPendingState(): void {
  try {
    sessionStorage.removeItem(EMAIL_CHANGE_STATE_KEY);
  } catch {
    /* yoksay */
  }
}

Alpine.data("settingsChangeEmail", () => ({
  step: 1,
  error: "",
  loading: false,
  showPassword: false,
  currentEmail: "",
  pendingNewEmail: "",
  otp: "",
  /** Last server-reported attempts remaining for the OTP, ``null`` if not yet attempted. */
  otpAttemptsRemaining: null as number | null,
  /** Frappe @rate_limit cooldown — saniye olarak kalan süre. 0 ise aktif değil. */
  cooldownSeconds: 0,
  /** Cooldown ticker handle (Alpine teardown'unda temizlenir). */
  _cooldownInterval: null as number | null,

  async init() {
    try {
      const user = await getSessionUser();
      if (user) {
        this.currentEmail = user.email || "";
      }
    } catch {
      /* ignore */
    }

    // Pending state restore — kullanıcı dili değiştirip sayfa reload olduysa
    // step=2'den (OTP girme ekranı) devam edebilmesi için.
    const pending = readPendingState();
    if (pending) {
      this.pendingNewEmail = pending.pendingNewEmail;
      this.step = 2;
      // Pending state varken cooldown da localStorage'da olabilir; rehydrate.
      try {
        const raw = localStorage.getItem("otp_cooldown_settings_email");
        if (raw) {
          const ts = parseInt(raw, 10);
          const remaining = Math.ceil((ts - Date.now()) / 1000);
          if (Number.isFinite(remaining) && remaining > 0) {
            this.startOtpCooldown(remaining);
          } else {
            localStorage.removeItem("otp_cooldown_settings_email");
          }
        }
      } catch {
        /* ignore */
      }
    }

    // Reset form when navigating back to this section (sadece kullanıcı manuel
    // hash değişimiyle geldiğinde — pending state varsa aynı kalır)
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#eposta-degistir") {
        // Pending state varsa step=2'de kal
        if (readPendingState()) return;
        this.step = 1;
        this.error = "";
        this.pendingNewEmail = "";
        this.otp = "";
        const refs = this.$refs as Record<string, HTMLInputElement>;
        if (refs.newEmail) refs.newEmail.value = "";
        if (refs.emailPassword) refs.emailPassword.value = "";
        if (refs.emailOtp) refs.emailOtp.value = "";
      }
    });
  },

  // Adım 1 → 2: Yeni adrese OTP gönder (DB yazımı YOK)
  async requestEmailChange() {
    const newEmail = (this.$refs as Record<string, HTMLInputElement>).newEmail.value.trim();
    const password = (this.$refs as Record<string, HTMLInputElement>).emailPassword.value;

    if (!newEmail) {
      this.error = t("settings.newEmailRequired");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      this.error = t("settings.invalidEmailFormat");
      return;
    }
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
      await api("/method/tradehub_core.api.v1.identity.request_email_change", {
        method: "POST",
        body: JSON.stringify({ new_email: newEmail, password }),
      });
      this.pendingNewEmail = newEmail;
      this.step = 2;
      writePendingState(newEmail); // dil değişimi sonrası restore için
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

  // Adım 2 → 3: OTP doğrula, rename uygula
  async confirmEmailChange() {
    const code = ((this.$refs as Record<string, HTMLInputElement>).emailOtp?.value || "").trim();
    if (!/^\d{6}$/.test(code)) {
      this.error = t("settings.invalidOtpFormat") || "Lütfen 6 haneli kodu girin.";
      return;
    }

    this.error = "";
    this.loading = true;
    try {
      await api("/method/tradehub_core.api.v1.identity.confirm_email_change", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      this.step = 3;
      this.otpAttemptsRemaining = null;
      clearPendingState(); // başarılı — pending state'i temizle
    } catch (err) {
      // OtpVerifyError carries attempts_remaining from the server, used to
      // drive the staged feedback (silent → informational → critical → lockout).
      if (err instanceof OtpVerifyError) {
        this.otpAttemptsRemaining = err.attemptsRemaining;
        if (err.attemptsRemaining === 0) {
          // Lockout — OTP geçersiz oldu ama kullanıcıyı step 1'e atmıyoruz.
          // Step 2'de kalsın, lockout alert kutusu görünsün, kullanıcı
          // "Kodu tekrar gönder" butonu ile yeni kod talep etsin.
          this.error = "";
          // step korunur; pending state temizlenmez — resend tekrar pending
          // kuracak.
        } else if (err.attemptsRemaining === 1) {
          // Kritik aşama — alert kutusu HTML'de render edilir, error metni boş.
          this.error = "";
        } else if (err.attemptsRemaining === 2) {
          // Bilgilendirme aşaması — meter satırı; error metni "kod hatalı".
          this.error = t("settings.wrongOtp") || "Doğrulama kodu hatalı.";
        } else {
          // Aşama 1 — sessiz: tek satır kırmızı text.
          this.error = t("settings.wrongOtp") || "Doğrulama kodu hatalı.";
        }
        this.loading = false;
        return;
      }
      if (err instanceof RateLimitError) {
        // Frappe @rate_limit decorator reject — cooldown countdown başlat.
        this.error = "";
        this.startOtpCooldown(err.retryAfter);
        this.loading = false;
        return;
      }
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMIT") {
        this.error = t("common.rateLimitError");
      } else if (msg.includes("Wrong verification code") || msg.includes("Wrong code")) {
        this.error = t("settings.wrongOtp") || "Doğrulama kodu hatalı.";
      } else if (msg.includes("Too many wrong attempts")) {
        this.error =
          t("settings.tooManyAttempts") || "Çok fazla hatalı deneme. Lütfen yeni kod isteyin.";
        this.step = 1;
        clearPendingState(); // OTP geçersiz oldu, baştan başla
      } else if (msg.includes("No pending email change")) {
        this.error = t("settings.otpExpired") || "Doğrulama kodu süresi doldu. Tekrar deneyin.";
        this.step = 1;
        clearPendingState();
      } else if (msg.includes("already exists")) {
        this.error = t("settings.emailAlreadyExists");
        this.step = 1;
        clearPendingState();
      } else {
        this.error = t("settings.emailChangeFailed");
      }
    } finally {
      this.loading = false;
    }
  },

  // Adım 2'de "Yeniden gönder"
  async resendOtp() {
    const newEmail = this.pendingNewEmail;
    const password = (this.$refs as Record<string, HTMLInputElement>).emailPassword?.value || "";
    if (!newEmail || !password) {
      // Step 1 form temizlendiyse en başa dön
      this.step = 1;
      return;
    }
    this.error = "";
    this.loading = true;
    try {
      await api("/method/tradehub_core.api.v1.identity.request_email_change", {
        method: "POST",
        body: JSON.stringify({ new_email: newEmail, password }),
      });
      // New OTP issued → backend resets attempts to 0; mirror locally so the
      // staged feedback clears immediately.
      this.otpAttemptsRemaining = null;
      this.otp = "";
    } catch (err) {
      if (err instanceof RateLimitError) {
        this.startOtpCooldown(err.retryAfter);
        this.loading = false;
        return;
      }
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMIT") {
        this.error = t("common.rateLimitError");
      } else {
        this.error = t("settings.emailChangeFailed");
      }
    } finally {
      this.loading = false;
    }
  },

  // ── Cooldown helper'ları (Frappe @rate_limit 429 sonrası UI sayacı) ──
  startOtpCooldown(retryAfterSec: number) {
    this.cooldownSeconds = retryAfterSec;
    // localStorage'a absolute end-time yaz — sayfa yenilense de devam etsin.
    try {
      localStorage.setItem(
        "otp_cooldown_settings_email",
        String(Date.now() + retryAfterSec * 1000)
      );
    } catch {
      /* ignore */
    }
    if (this._cooldownInterval) {
      clearInterval(this._cooldownInterval);
    }
    this._cooldownInterval = window.setInterval(() => {
      this.cooldownSeconds = Math.max(0, this.cooldownSeconds - 1);
      if (this.cooldownSeconds === 0 && this._cooldownInterval) {
        clearInterval(this._cooldownInterval);
        this._cooldownInterval = null;
        try {
          localStorage.removeItem("otp_cooldown_settings_email");
        } catch {
          /* ignore */
        }
      }
    }, 1000);
  },
  formatCooldown(s: number): string {
    const total = Math.max(0, Math.floor(s));
    const m = Math.floor(total / 60);
    const r = total % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  },
  /** "X sonra tekrar deneyebilirsiniz" — i18n placeholder yerleştirilmiş hâli. */
  cooldownLabel(): string {
    return t("auth.otpRetryIn", { time: this.formatCooldown(this.cooldownSeconds) });
  },

  // Step 2 → Step 1: kullanıcı yanlış e-posta yazdığını fark ettiğinde
  // (kod gelmiyor vs.) form ekranına geri dönüp adresi düzeltebilsin.
  // Backend'de email_change cache 30 dk TTL ile silinir; ayrıca yeni
  // request_email_change çağrısı zaten üstüne yazar — burada sadece
  // istemci tarafı state'i sıfırlamamız yeterli.
  changeEmailAddress() {
    this.step = 1;
    this.error = "";
    this.otp = "";
    this.otpAttemptsRemaining = null;
    this.pendingNewEmail = "";
    // OTP input'unu temizle. newEmail/password input'larını koru — kullanıcı
    // tek harf düzeltip devam edebilsin diye.
    const refs = this.$refs as Record<string, HTMLInputElement>;
    if (refs.emailOtp) refs.emailOtp.value = "";
    // Reload sonrası init'in step=2'ye geri atlamaması için pending state
    // local storage'dan temizlenmeli.
    clearPendingState();
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
      } else if (msg.includes("same as your current") || msg.includes("aynı olamaz")) {
        this.error = t("settings.passwordSameAsCurrent");
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

    // Strip non-digits and normalize Turkish prefixes (0 / 90) so "+90 532…" and "0532…" compare equal.
    const normalize = (p: string): string => {
      const d = (p || "").replace(/\D/g, "");
      if (d.startsWith("90") && d.length === 12) return d.slice(2);
      if (d.startsWith("0") && d.length === 11) return d.slice(1);
      return d;
    };
    const newNorm = normalize(newPhone);
    const curNorm = normalize(this.currentPhone);
    if (newNorm && curNorm && newNorm === curNorm) {
      this.error =
        t("settings.phoneSameAsCurrent") ||
        "Yeni telefon numaranız mevcut telefon numaranızdan farklı olmalı.";
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
      } else if (msg.includes("same as")) {
        this.error = t("settings.phoneSameAsCurrent");
      } else if (msg.includes("valid Turkish phone") || msg.includes("Türk telefon")) {
        this.error = t("settings.phoneInvalidFormat");
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
