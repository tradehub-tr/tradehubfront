/**
 * SettingsEmailPreferences Component
 * Email notification preferences with master toggles and sub-checkboxes.
 * Fetches categories dynamically from API, saves user preferences to backend.
 */

import { t } from "../../i18n";
import { api } from "../../utils/api";

export interface EmailCategory {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  items: EmailItem[];
}

export interface EmailItem {
  id: string;
  title: string;
  description: string;
  checked: boolean;
}

// ── API ─────────────────────────────────────────────────────────

async function fetchEmailPreferences(): Promise<EmailCategory[] | null> {
  try {
    const res = await api<{ message: { categories: EmailCategory[] } }>(
      "/method/tradehub_core.api.v1.email_preferences.get_email_preferences"
    );
    return res.message?.categories ?? [];
  } catch {
    return null;
  }
}

async function savePrefsToAPI(
  toggles: Record<string, boolean>,
  checks: Record<string, boolean>
): Promise<void> {
  try {
    await api("/method/tradehub_core.api.v1.email_preferences.save_email_preferences", {
      method: "POST",
      body: JSON.stringify({ preferences: { toggles, checks } }),
    });
  } catch {
    // optimistic UI — sessiz hata
  }
}

// ── Renderers ────────────────────────────────────────────────────

function renderEmailItem(item: EmailItem): string {
  return `
    <div class="email-pref__item flex items-start gap-3 py-4 px-6 border-b border-(--color-border-light,#f0f0f0) last:border-b-0 max-md:px-4 max-md:py-3 max-sm:px-3">
      <label class="email-pref__checkbox relative inline-flex items-center justify-center w-5 h-5 flex-shrink-0 mt-0.5 cursor-pointer">
        <input type="checkbox" data-email-check="${item.id}" ${item.checked ? "checked" : ""} class="peer opacity-0 w-0 h-0 absolute" />
        <span class="email-pref__checkmark w-[18px] h-[18px] border-2 border-gray-300 rounded bg-white transition-all flex items-center justify-center peer-checked:bg-[var(--color-primary-500,#cc9900)] peer-checked:border-[var(--color-primary-500,#cc9900)] peer-checked:after:content-[''] peer-checked:after:w-[5px] peer-checked:after:h-[9px] peer-checked:after:border-solid peer-checked:after:border-[var(--color-text-inverse)] peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45 peer-checked:after:mb-0.5"></span>
      </label>
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-bold mb-1 m-0" style="color:var(--color-text-primary)">${item.title}</h4>
        <p class="text-[13px] leading-normal m-0" style="color:var(--color-text-secondary)">${item.description}</p>
      </div>
    </div>
  `;
}

function renderCategory(cat: EmailCategory): string {
  return `
    <div class="email-pref__category">
      <div class="flex items-center justify-between gap-6 py-5 px-6 bg-surface-muted border border-border-default border-b-0 rounded-t-lg max-md:flex-col max-md:items-start max-md:gap-3 max-md:px-4 max-sm:px-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-[15px] max-sm:text-sm font-bold mb-1 m-0" style="color:var(--color-text-primary)">${cat.title}</h3>
          <p class="text-[13px] max-sm:text-xs m-0" style="color:var(--color-text-secondary)">${cat.description}</p>
        </div>
        <label class="relative inline-flex w-12 h-[26px] flex-shrink-0 cursor-pointer">
          <input type="checkbox" data-cat-toggle="${cat.id}" ${cat.enabled ? "checked" : ""} class="peer opacity-0 w-0 h-0 absolute" />
          <span class="email-pref__toggle-slider absolute inset-0 rounded-[13px] bg-[var(--color-border-medium)] transition-colors duration-200 peer-checked:bg-[var(--toggle-active-bg,#cc9900)] before:content-[''] before:absolute before:w-5 before:h-5 before:left-[3px] before:top-[3px] before:bg-[var(--color-surface,#fff)] before:rounded-full before:transition-transform before:duration-200 before:shadow-[0_1px_3px_rgba(0,0,0,0.15)] peer-checked:before:translate-x-[22px]"></span>
        </label>
      </div>
      <div class="border border-border-default border-t-0 rounded-b-lg">
        ${cat.items.map(renderEmailItem).join("")}
      </div>
    </div>
  `;
}

function renderContent(categories: EmailCategory[]): string {
  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:p-3.5">
      <p class="text-[13px] max-sm:text-xs mb-2 m-0" style="color:var(--color-text-secondary)">${t("settings.emailServices")}</p>
      <h2 class="text-2xl max-sm:text-xl font-bold mb-2 m-0" style="color:var(--color-text-primary)">${t("settings.emailPreferences")}</h2>
      <p class="text-sm max-sm:text-[13px] mb-4 m-0" style="color:var(--color-text-tertiary)">${t("settings.emailPreferencesDesc")}</p>
      <p class="text-sm max-sm:text-[13px] mb-6 m-0" style="color:var(--color-text-primary)">${t("settings.emailPreferencesFor")} <strong x-text="userEmail || '...'" class="font-semibold"></strong></p>
      <div class="flex flex-col gap-5 max-sm:gap-4">
        ${categories.map(renderCategory).join("")}
      </div>
      <div class="mt-5">
        <a href="#" id="email-prefs-unsubscribe-all" class="text-[13px] no-underline hover:underline" style="color:var(--color-primary-500, #cc9900)">${t("settings.unsubscribeAll")}</a>
      </div>
    </div>
  `;
}

function renderLoading(): string {
  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:p-3.5 flex items-center justify-center min-h-[200px]">
      <span class="text-sm" style="color:var(--color-text-secondary)">${t("common.loading")}</span>
    </div>
  `;
}

function renderEmpty(): string {
  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:p-3.5 flex items-center justify-center min-h-[200px]">
      <p class="text-sm m-0" style="color:var(--color-text-secondary)">Henüz e-posta tercihi yapılandırılmamış.</p>
    </div>
  `;
}

function renderError(): string {
  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:p-3.5 flex flex-col items-center justify-center gap-3 min-h-[200px]">
      <p class="text-sm m-0" style="color:var(--color-text-secondary)">Tercihler yüklenirken bir hata oluştu.</p>
      <button type="button" id="email-prefs-retry" class="text-sm bg-none border-none cursor-pointer hover:underline" style="color:var(--color-primary-500, #cc9900)">Tekrar dene</button>
    </div>
  `;
}

// ── Exports ─────────────────────────────────────────────────────

export function SettingsEmailPreferences(): string {
  return `<div id="email-prefs-root">${renderLoading()}</div>`;
}

export function initSettingsEmailPreferences(): void {
  const root = document.getElementById("email-prefs-root")!;
  if (!root) return;

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── Helpers ──

  function isAnyChecked(): boolean {
    return Array.from(root.querySelectorAll<HTMLInputElement>("[data-email-check]")).some(
      (cb) => cb.checked
    );
  }

  function syncToggleWithCheckboxes(category: Element): void {
    const toggle = category.querySelector<HTMLInputElement>("[data-cat-toggle]");
    if (!toggle) return;
    const anyChecked = Array.from(
      category.querySelectorAll<HTMLInputElement>("[data-email-check]")
    ).some((cb) => cb.checked);
    toggle.checked = anyChecked;
  }

  function updateUnsubscribeLabel(): void {
    const btn = document.getElementById("email-prefs-unsubscribe-all");
    if (!btn) return;
    btn.textContent = isAnyChecked() ? t("settings.unsubscribeAll") : t("settings.resubscribeAll");
  }

  function onPrefsChanged(): void {
    updateUnsubscribeLabel();
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const toggles: Record<string, boolean> = {};
      const checks: Record<string, boolean> = {};
      root.querySelectorAll<HTMLInputElement>("[data-cat-toggle]").forEach((el) => {
        toggles[el.dataset.catToggle!] = el.checked;
      });
      root.querySelectorAll<HTMLInputElement>("[data-email-check]").forEach((el) => {
        checks[el.dataset.emailCheck!] = el.checked;
      });
      savePrefsToAPI(toggles, checks);
    }, 500);
  }

  // ── Events ──

  function bindEvents(): void {
    root.querySelectorAll<HTMLInputElement>("[data-cat-toggle]").forEach((toggle) => {
      toggle.addEventListener("change", () => {
        const category = toggle.closest(".email-pref__category");
        if (category) {
          category.querySelectorAll<HTMLInputElement>("[data-email-check]").forEach((cb) => {
            cb.checked = toggle.checked;
          });
        }
        onPrefsChanged();
      });
    });

    root.querySelectorAll<HTMLInputElement>("[data-email-check]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const category = cb.closest(".email-pref__category");
        if (category) syncToggleWithCheckboxes(category);
        onPrefsChanged();
      });
    });

    const unsubBtn = document.getElementById("email-prefs-unsubscribe-all");
    if (unsubBtn) {
      unsubBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const newState = !isAnyChecked();
        root.querySelectorAll<HTMLInputElement>("[data-cat-toggle]").forEach((el) => {
          el.checked = newState;
        });
        root.querySelectorAll<HTMLInputElement>("[data-email-check]").forEach((el) => {
          el.checked = newState;
        });
        onPrefsChanged();
      });
    }
  }

  // ── Load ──

  async function loadAndRender(): Promise<void> {
    root.innerHTML = renderLoading();
    const categories = await fetchEmailPreferences();

    // null = API hatası, [] = henüz kategori yok
    if (categories === null) {
      root.innerHTML = renderError();
      document.getElementById("email-prefs-retry")?.addEventListener("click", loadAndRender);
      return;
    }

    if (categories.length === 0) {
      root.innerHTML = renderEmpty();
      return;
    }

    root.innerHTML = renderContent(categories);
    root.querySelectorAll(".email-pref__category").forEach((cat) => syncToggleWithCheckboxes(cat));
    bindEvents();
    updateUnsubscribeLabel();
  }

  loadAndRender();
}
