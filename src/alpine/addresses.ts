/**
 * addressesManager — Alpine.js data component
 * Buyer address book: CRUD + default management.
 * Logged-in users: backend API (tradehub_core.api.buyer.*).
 * Guest users: localStorage fallback.
 */

import Alpine from "alpinejs";
import { getUser, isLoggedIn } from "../utils/auth";
import { turkishProvinces, districtsByProvince } from "../data/mockCheckout";
import { showToast } from "../utils/toast";
import { validatePhone, normalizePhone } from "../utils/tr-validation";
import {
  fetchAddresses,
  saveAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
  type BuyerAddressData,
} from "../services/cartService";

/* ── Types ──────────────────────────────────────────── */

export type BuyerAddress = BuyerAddressData;

type AddressForm = Omit<BuyerAddress, "id">;

/* ── Constants ──────────────────────────────────────── */

/** Kullanıcı başına maksimum adres sayısı. Backend MAX_ADDRESSES sabiti ile senkron. */
const MAX_ADDRESSES = 10;

/* ── Guest localStorage fallback ────────────────────── */

const GUEST_STORAGE_KEY = "tradehub_address_book";

function guestGetKey(): string {
  const user = getUser();
  return user?.email ? `user:${user.email.toLowerCase()}` : "guest";
}

function guestRead(): BuyerAddress[] {
  try {
    const book = JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || "{}") as Record<
      string,
      BuyerAddress[]
    >;
    return book[guestGetKey()] ?? [];
  } catch {
    return [];
  }
}

function guestWrite(addresses: BuyerAddress[]): void {
  try {
    const book = JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || "{}") as Record<
      string,
      BuyerAddress[]
    >;
    book[guestGetKey()] = addresses;
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(book));
  } catch {
    /* quota */
  }
}

/** Misafir oturumundan kalan adresleri temizler (login sonrası migrasyon tamamlanınca). */
function guestClearGuestKey(): void {
  try {
    const book = JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || "{}") as Record<
      string,
      BuyerAddress[]
    >;
    delete book["guest"];
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(book));
  } catch {
    /* ignore */
  }
}

/** Misafir oturumunda biriktirilen adresleri döndürür. */
function guestReadAnonymous(): BuyerAddress[] {
  try {
    const book = JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || "{}") as Record<
      string,
      BuyerAddress[]
    >;
    return book["guest"] ?? [];
  } catch {
    return [];
  }
}

function generateGuestId(): string {
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyForm(): AddressForm {
  return {
    title: "",
    contact_name: "",
    company: "",
    phone_prefix: "+90",
    phone: "",
    country: "TR",
    state: "",
    city: "",
    street: "",
    apartment: "",
    postal_code: "",
    note: "",
    is_default: false,
  };
}

/* ── Alpine component ───────────────────────────────── */

Alpine.data("addressesManager", () => ({
  addresses: [] as BuyerAddress[],
  loading: true,
  maxAddresses: MAX_ADDRESSES,

  // Form modal
  isModalOpen: false,
  editingId: "" as string,
  form: emptyForm() as AddressForm,
  errors: {} as Record<string, string>,
  saving: false,

  // Delete confirm
  isDeleteConfirmOpen: false,
  deletingId: "" as string,
  deletingTitle: "" as string,

  // Province / district dropdown
  provinces: turkishProvinces.map((p) => p.name),

  get districtOptions(): string[] {
    return districtsByProvince[this.form.state] ?? [];
  },

  /* ── Lifecycle ─────────────────────────────────── */

  async init() {
    // Modal açıldığında auto-focus: ilk odaklanabilir element'e odakla (a11y).
    this.$watch("isModalOpen", (val: boolean) => {
      if (val) {
        this.$nextTick(() => {
          const firstInput = document.querySelector<HTMLElement>(
            "#buyer-address-form input:not([disabled]), #buyer-address-form select:not([disabled]), #buyer-address-form textarea:not([disabled])"
          );
          firstInput?.focus();
        });
      }
    });
    await this.loadAddresses();
  },

  /* ── A11y: focus trap ──────────────────────────── */

  /**
   * Modal için basit focus trap — Tab / Shift+Tab tuşları modal dışına çıkmasın.
   * Alpine `@alpinejs/focus` plugin'i olmadığı için manuel.
   */
  handleFocusTrap(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const modal = document.getElementById("buyer-address-form")?.closest('[role="dialog"]');
    if (!modal) return;
    const focusables = modal.querySelectorAll<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  },

  /* ── Load ──────────────────────────────────────── */

  async loadAddresses() {
    this.loading = true;
    try {
      if (isLoggedIn()) {
        const apiAddresses = await fetchAddresses();

        // Misafir oturumunda biriktirilen adresler varsa API'ye taşı (sadece bir kez)
        if (apiAddresses.length === 0) {
          const orphaned = guestReadAnonymous();
          if (orphaned.length > 0) {
            const migrated: BuyerAddress[] = [];
            const failed: BuyerAddress[] = [];
            for (const addr of orphaned) {
              try {
                // id'yi çıkar — backend yeni kayıt oluştursun
                const { id: _id, ...addrWithoutId } = addr;
                const { address: saved } = await saveAddressApi(addrWithoutId);
                migrated.push(saved);
              } catch {
                failed.push(addr);
              }
            }
            if (migrated.length > 0) {
              // Başarıyla taşınan adresler varsa guest key'i temizle
              guestClearGuestKey();
            }
            // Taşınamayan adresler (varsa) localStorage'da beklesin
            if (failed.length > 0) {
              guestWrite(failed);
            }
            this.addresses = migrated;
          } else {
            this.addresses = apiAddresses;
          }
        } else {
          // API'de adres varsa misafir verisini sil (artık gerek yok)
          guestClearGuestKey();
          this.addresses = apiAddresses;
        }
      } else {
        this.addresses = guestRead();
      }
    } catch {
      this.addresses = guestRead();
    } finally {
      this.loading = false;
    }
  },

  /* ── Modal open/close ──────────────────────────── */

  openAdd() {
    if (this.addresses.length >= MAX_ADDRESSES) {
      showToast({
        message: `En fazla ${MAX_ADDRESSES} adres ekleyebilirsiniz. Yeni adres eklemek için mevcut bir adresi silin.`,
        type: "warning",
      });
      return;
    }
    this.editingId = "";
    this.form = emptyForm();
    if (this.addresses.length === 0) this.form.is_default = true;
    this.errors = {};
    this.isModalOpen = true;
  },

  openEdit(addr: BuyerAddress) {
    this.editingId = addr.id;
    const { id: _id, ...formData } = addr;
    // Eski kayıtlarda phone_prefix boş olabilir — TR sabit prefix'e fallback
    if (!formData.phone_prefix) formData.phone_prefix = "+90";
    this.form = formData;
    this.errors = {};
    this.isModalOpen = true;
  },

  closeModal() {
    this.isModalOpen = false;
    this.editingId = "";
    this.errors = {};
  },

  /* ── Validate ──────────────────────────────────── */

  validate(): boolean {
    const required: (keyof AddressForm)[] = [
      "title",
      "contact_name",
      "company",
      "phone",
      "state",
      "street",
    ];
    let valid = true;
    this.errors = {};
    for (const field of required) {
      if (!String(this.form[field]).trim()) {
        this.errors[field] = "Bu alan zorunludur.";
        valid = false;
      }
    }
    // Telefon format kontrolü — yalnızca boş değilse (boş durumu zaten yukarıda yakalandı)
    if (this.form.phone.trim() && !validatePhone(this.form.phone, this.form.phone_prefix)) {
      this.errors.phone =
        this.form.phone_prefix === "+90"
          ? "Geçerli bir telefon numarası giriniz. (örn. 0212 555 00 00)"
          : "Geçerli bir telefon numarası giriniz (7-15 rakam).";
      valid = false;
    }
    return valid;
  },

  /* ── Save (add / edit) ─────────────────────────── */

  async saveAddress() {
    if (!this.validate()) return;
    this.saving = true;
    try {
      // Telefonu backend'e tutarlı formatta gönder (boşluk/tire/parantez temizlenmiş)
      const normalizedForm = { ...this.form, phone: normalizePhone(this.form.phone) };
      if (isLoggedIn()) {
        const payload = this.editingId
          ? { ...normalizedForm, id: this.editingId }
          : { ...normalizedForm };
        const { address: saved, default_id } = await saveAddressApi(payload);
        if (this.editingId) {
          const idx = this.addresses.findIndex((a) => a.id === this.editingId);
          if (idx !== -1) this.addresses[idx] = saved;
        } else {
          this.addresses.push(saved);
        }
        // Tüm listedeki is_default flag'ını backend'in verdiği default_id'ye göre senkronize et.
        // Bu, kullanıcının mevcut default'u kaldırması durumunda backend'in
        // _ensure_one_default ile başka bir adresi default yapmasını da yansıtır.
        this.addresses = this.addresses.map((a) => ({ ...a, is_default: a.id === default_id }));
      } else {
        // Guest: localStorage
        if (normalizedForm.is_default) {
          this.addresses = this.addresses.map((a) => ({ ...a, is_default: false }));
        }
        if (this.editingId) {
          const idx = this.addresses.findIndex((a) => a.id === this.editingId);
          if (idx !== -1) this.addresses[idx] = { ...normalizedForm, id: this.editingId };
        } else {
          this.addresses.push({ ...normalizedForm, id: generateGuestId() });
        }
        if (!this.addresses.some((a) => a.is_default) && this.addresses.length > 0) {
          this.addresses[0].is_default = true;
        }
        guestWrite(this.addresses);
      }
      this.closeModal();
      showToast({
        message: this.editingId ? "Adres güncellendi." : "Adres eklendi.",
        type: "success",
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Adres kaydedilemedi.";
      showToast({ message: msg, type: "error" });
    } finally {
      this.saving = false;
    }
  },

  /* ── Set default ────────────────────────────────── */

  async setDefault(id: string) {
    try {
      if (isLoggedIn()) {
        await setDefaultAddressApi(id);
      }
      this.addresses = this.addresses.map((a) => ({ ...a, is_default: a.id === id }));
      if (!isLoggedIn()) guestWrite(this.addresses);
      showToast({ message: "Varsayılan adres güncellendi.", type: "success" });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Varsayılan adres güncellenemedi.";
      showToast({ message: msg, type: "error" });
    }
  },

  /* ── Delete ─────────────────────────────────────── */

  confirmDelete(addr: BuyerAddress) {
    this.deletingId = addr.id;
    this.deletingTitle = addr.title;
    this.isDeleteConfirmOpen = true;
  },

  async deleteAddress() {
    try {
      let backendDefaultId: string | null = null;
      if (isLoggedIn()) {
        const res = await deleteAddressApi(this.deletingId);
        backendDefaultId = res.default_id || "";
      }
      this.addresses = this.addresses.filter((a) => a.id !== this.deletingId);

      if (isLoggedIn() && backendDefaultId !== null) {
        // Backend'in döndürdüğü default_id ile listeyi senkronize et;
        // _ensure_one_default "en eski adresi default yap" stratejisini
        // burada yansıtırız (frontend kendi sıralamasıyla farklı düşünmesin).
        this.addresses = this.addresses.map((a) => ({
          ...a,
          is_default: a.id === backendDefaultId,
        }));
      } else {
        // Guest: silinen default ise listenin ilkini default yap (geri uyumlu)
        const wasDefault = this.addresses.length > 0 && !this.addresses.some((a) => a.is_default);
        if (wasDefault) {
          this.addresses[0].is_default = true;
        }
        guestWrite(this.addresses);
      }
      this.isDeleteConfirmOpen = false;
      this.deletingId = "";
      this.deletingTitle = "";
      showToast({ message: "Adres silindi.", type: "success" });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Adres silinemedi.";
      showToast({ message: msg, type: "error" });
    }
  },
}));
