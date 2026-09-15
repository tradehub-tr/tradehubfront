/**
 * FE-1 (AC-9) — hesap silme önizlemesinde açık sipariş uyarısı.
 * Backend consequences[] DOĞRUDAN render edilmediği için (i18n client-side),
 * open_order_count alanının openOrderCount()/openOrderWarning() üzerinden
 * doğru tüketildiğini ve 0/eksik alanda hiçbir şeyin değişmediğini doğrular.
 */
import { describe, expect, it, vi } from "vitest";

// Alpine.data kayıtlarını yakala — component factory'sine erişim için.
vi.mock("alpinejs", () => {
  const registry = new Map<string, () => Record<string, unknown>>();
  return {
    default: {
      data: (name: string, fn: () => Record<string, unknown>) => {
        registry.set(name, fn);
      },
      store: vi.fn(),
      start: vi.fn(),
      __dataRegistry: registry,
    },
  };
});

vi.mock("../i18n", () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params
      ? `${key}|${Object.entries(params)
          .map(([k, v]) => `${k}=${String(v)}`)
          .join(",")}`
      : key,
}));

vi.mock("../utils/api", () => ({
  api: vi.fn(),
  OtpVerifyError: class extends Error {},
  RateLimitError: class extends Error {},
}));

vi.mock("../utils/auth", () => ({
  getSessionUser: vi.fn(async () => null),
  logout: vi.fn(async () => undefined),
}));

vi.mock("../utils/password-validation", () => ({
  isPasswordValid: vi.fn(() => true),
}));

import Alpine from "alpinejs";
import "./settings";
import { SettingsDeleteAccount } from "../components/settings/SettingsDeleteAccount";

interface DeleteAccountComponent {
  preview: Record<string, unknown> | null;
  openOrderCount(): number;
  openOrderWarning(): string;
  previewLines(): string[];
}

function createComponent(): DeleteAccountComponent {
  const registry = (
    Alpine as unknown as { __dataRegistry: Map<string, () => Record<string, unknown>> }
  ).__dataRegistry;
  const factory = registry.get("settingsDeleteAccount");
  if (!factory) throw new Error("settingsDeleteAccount Alpine.data kaydı bulunamadı");
  return factory() as unknown as DeleteAccountComponent;
}

describe("settingsDeleteAccount — açık sipariş uyarısı (FE-1 / AC-9)", () => {
  it("open_order_count>0 iken sayı ve uyarı metni üretilir", () => {
    const c = createComponent();
    c.preview = { has_store: true, sub_user_count: 0, grace_days: 15, open_order_count: 3 };
    expect(c.openOrderCount()).toBe(3);
    expect(c.openOrderWarning()).toBe("settings.deletePreviewOpenOrders|count=3");
  });

  it("open_order_count=0 iken uyarı gizli kalır (count 0)", () => {
    const c = createComponent();
    c.preview = { has_store: true, sub_user_count: 0, grace_days: 15, open_order_count: 0 };
    expect(c.openOrderCount()).toBe(0);
  });

  it("alan yoksa (eski backend) ve preview null iken güvenli 0 döner", () => {
    const c = createComponent();
    c.preview = { has_store: true, sub_user_count: 0, grace_days: 15 };
    expect(c.openOrderCount()).toBe(0);
    c.preview = null;
    expect(c.openOrderCount()).toBe(0);
  });

  it("uyarı previewLines'ı DEĞİŞTİRMEZ — KVKK fallback maddesi korunur", () => {
    const c = createComponent();
    c.preview = { has_store: false, sub_user_count: 0, grace_days: 15, open_order_count: 5 };
    const lines = c.previewLines();
    expect(lines).toContain("settings.deletePreviewKvkk|days=15");
    expect(lines.some((l) => l.includes("deletePreviewOpenOrders"))).toBe(false);
  });

  it("template uyarıyı x-show ile count>0'a bağlar ve metni openOrderWarning'den alır", () => {
    const html = SettingsDeleteAccount();
    expect(html).toContain('x-show="openOrderCount() > 0"');
    expect(html).toContain('x-text="openOrderWarning()"');
  });
});
