/**
 * SelectMenu — progressive enhancement for native `<select>`.
 *
 * The native `<select>` stays in the DOM (visually hidden) so form
 * semantics, `change` events and existing `data-field`/Alpine `x-model`
 * handlers keep working unchanged. A custom trigger + panel is rendered
 * next to it, matching the FavoritesLayout dropdown pattern
 * (FavoritesLayout.ts sort/filter menus) instead of the browser's native
 * option list.
 *
 * Usage: called centrally from `src/alpine/index.ts:startAlpine()` — no need
 * to call it per-page. It's idempotent — a MutationObserver keeps enhancing
 * `<select>` elements added later (modals, dynamic forms), so a page's DOM
 * doesn't need to exist yet when `startAlpine()` runs.
 *
 * Opt out a specific select with `data-native-select` (kept for elements
 * whose surrounding JS is too tightly coupled to native select behaviour
 * to safely rewire — see TopBar.ts / ThemeEditorPanel.ts callers).
 */
import { escapeHtml } from "../../utils/sanitize";
import { t } from "../../i18n";

const ENHANCED_ATTR = "data-select-menu-enhanced";
const SEARCH_THRESHOLD = 20;

const CHECK_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const CHEVRON_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-text-tertiary"><path d="M6 9l6 6 6-6"/></svg>';

// Panel içeriği (`bg-white border ... p-1.5` vb.) hem kapalı-hâlde-wrap-içi
// hem açık-hâlde-body-portal class dizisinde ortak; sadece konumlama
// stratejisi (absolute-in-wrap vs. fixed-in-body) değişiyor.
const PANEL_BASE_CLASS =
  "min-w-[200px] max-h-[320px] overflow-y-auto bg-white border border-border-default rounded-md " +
  "shadow-[0_24px_60px_-12px_rgba(20,20,18,0.18),0_8px_20px_-6px_rgba(20,20,18,0.08)] p-1.5";
const PANEL_CLOSED_CLASS = `hidden absolute z-30 top-[calc(100%+6px)] start-0 w-full ${PANEL_BASE_CLASS}`;
// z-[9999] — bu kod tabanında fixed-portal dropdown paterninin (FavoritesDropdown)
// kullandığı değerle aynı; select'in en derin modal/drawer (z-[9999] dahil pek
// çoğu) içinde açılması ihtimaline karşı en üstte kalması gerekiyor.
const PANEL_OPEN_CLASS = `fixed z-[9999] ${PANEL_BASE_CLASS}`;

let initialized = false;
let closeOpenPanel: (() => void) | null = null;

/**
 * Panel açıkken `document.body`'ye taşınıyor (kırpan `overflow-hidden`
 * ata'lardan kaçmak için — bkz. Settings sayfası ülke select'i bug'ı).
 * Trigger'ın rect'ine göre fixed konumlanır; aşağıda yer yoksa yukarı açılır.
 */
function positionPanel(trigger: HTMLElement, panel: HTMLElement): void {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUpward = spaceBelow < 330 && spaceAbove > spaceBelow;

  panel.style.left = `${rect.left}px`;
  panel.style.width = `${rect.width}px`;
  if (openUpward) {
    panel.style.top = "";
    panel.style.bottom = `${window.innerHeight - rect.top + 6}px`;
  } else {
    panel.style.bottom = "";
    panel.style.top = `${rect.bottom + 6}px`;
  }
}

export function initSelectMenus(): void {
  if (initialized) return;
  initialized = true;

  document.querySelectorAll<HTMLSelectElement>("select").forEach(enhanceSelect);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node instanceof HTMLSelectElement) enhanceSelect(node);
        node.querySelectorAll<HTMLSelectElement>("select").forEach(enhanceSelect);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Tek bir global outside-click/Escape — her enhance edilen select kendi
  // listener'ını eklemek yerine paylaşılan tek kapatıcıyı kullanır. Panel açıkken
  // body'ye portallandığı için wrap dışında yaşar — `data-select-menu-panel` de
  // ayrıca kontrol edilmeli, yoksa panel içindeki her tık paneli kapatır.
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-select-menu-wrap]") || target.closest("[data-select-menu-panel]")) return;
    closeOpenPanel?.();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOpenPanel?.();
  });
}

function isEligible(select: HTMLSelectElement): boolean {
  return (
    !select.multiple &&
    !(select.hasAttribute("size") && Number(select.getAttribute("size")) > 1) &&
    !select.hasAttribute("data-native-select") &&
    !select.hasAttribute(ENHANCED_ATTR) &&
    !!select.parentElement
  );
}

/**
 * Native `.value =` / `.selectedIndex =` assignments elsewhere in the
 * codebase (currency resets, form-clear-after-save, Alpine `x-model`
 * two-way binding) don't fire a `change` event — so the visible trigger
 * label would go stale after a programmatic update. Shadowing the
 * instance accessor (same technique React uses for controlled inputs)
 * keeps the trigger label in sync without touching every call site.
 */
function shadowProperty(
  target: HTMLSelectElement,
  prop: "value" | "selectedIndex",
  onSet: () => void
): void {
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
  if (!desc?.get || !desc.set) return;
  Object.defineProperty(target, prop, {
    configurable: true,
    enumerable: true,
    get(): string | number {
      return desc.get!.call(target);
    },
    set(v: string | number): void {
      desc.set!.call(target, v);
      onSet();
    },
  });
}

function selectedLabel(select: HTMLSelectElement): string {
  return select.options[select.selectedIndex]?.text ?? "";
}

// Bazı select'ler kendi flex satırında `flex-1`/`w-44`/`shrink-0` gibi sınıflarla
// katılıyor (ör. PaymentLayout kart son kullanma ay/yıl `flex-1`, rfq-form birim
// select'i `w-44`). Wrap sadece "relative" olursa bu sınıflar select'in kendi
// üzerinde kalıp dış flex satırına hiç etki etmez → sütun genişliği yanlış
// hesaplanır. Sadece layout/boyut sınıflarını wrap'a taşıyoruz; padding/border/bg
// gibi görsel sınıfları TAŞIMIYORUZ — aksi halde trigger'ın kendi padding'iyle
// çift padding oluşur (TicketForm gibi h-* yerine py-* ile boyutlanan select'ler).
const LAYOUT_CLASS_RE = /^(?:[a-z0-9-]+:)*(?:w-|min-w-|max-w-|flex-|grow|shrink|basis-|self-|order-)/;

function extractLayoutClasses(classList: string): string {
  return classList
    .split(/\s+/)
    .filter((cls) => LAYOUT_CLASS_RE.test(cls))
    .join(" ");
}

function enhanceSelect(select: HTMLSelectElement): void {
  if (!isEligible(select)) return;
  select.setAttribute(ENHANCED_ATTR, "true");

  const baseClass = select.className;

  const wrap = document.createElement("div");
  wrap.className = `relative ${extractLayoutClasses(baseClass)}`.trim();
  wrap.setAttribute("data-select-menu-wrap", "");
  select.insertAdjacentElement("beforebegin", wrap);
  wrap.appendChild(select);
  select.classList.add("hidden");

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className =
    `${baseClass} th-no-press appearance-none focus:outline-none cursor-pointer ` +
    "text-start flex items-center justify-between gap-2";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const labelEl = document.createElement("span");
  labelEl.className = "truncate min-w-0 flex-1";
  trigger.appendChild(labelEl);
  trigger.insertAdjacentHTML("beforeend", CHEVRON_SVG);
  wrap.appendChild(trigger);

  const panel = document.createElement("div");
  panel.setAttribute("role", "listbox");
  panel.setAttribute("data-select-menu-panel", "");
  panel.className = PANEL_CLOSED_CLASS;
  wrap.appendChild(panel);

  const syncLabel = (): void => {
    labelEl.textContent = selectedLabel(select);
  };
  // `disabled` native select'te reflected attribute'tur (rfq-form.ts: birim
  // select'i backend UOM listesi gelene kadar disabled başlar, fetch sonrası
  // `.disabled = false` ile açılır) — trigger'ı senkron tutmazsak kullanıcı
  // veri hazır olmadan panel açabilir. Devralınan `disabled:*` Tailwind
  // variant'ları trigger'da da native `:disabled` pseudo'suyla otomatik çalışır.
  const syncDisabled = (): void => {
    trigger.disabled = select.disabled;
  };
  syncLabel();
  syncDisabled();
  select.addEventListener("change", syncLabel);
  shadowProperty(select, "value", syncLabel);
  shadowProperty(select, "selectedIndex", syncLabel);
  // Bazı formlar <option>'ları Alpine `x-for` ile async/reaktif dolduruyor
  // (AddressesLayout il/ilçe, OrdersPageLayout kargo yöntemi) — bu DOM
  // değişikliği ne "change" fırlatır ne de .value/.selectedIndex atar, o
  // yüzden kapalı trigger etiketi ayrıca option listesi değiştiğinde de
  // senkronize edilmeli.
  new MutationObserver(() => {
    syncLabel();
    syncDisabled();
  }).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });

  // rAF-throttled reposition — scroll/resize sırasında her event'te layout
  // okumaya gerek yok, tek bir frame'de son değer uygulanır.
  let positionRaf = 0;
  const schedulePosition = (): void => {
    if (positionRaf) return;
    positionRaf = requestAnimationFrame(() => {
      positionRaf = 0;
      positionPanel(trigger, panel);
    });
  };

  const closePanel = (): void => {
    window.removeEventListener("scroll", schedulePosition, true);
    window.removeEventListener("resize", schedulePosition);
    if (positionRaf) {
      cancelAnimationFrame(positionRaf);
      positionRaf = 0;
    }
    panel.className = PANEL_CLOSED_CLASS;
    panel.style.left = "";
    panel.style.top = "";
    panel.style.bottom = "";
    panel.style.width = "";
    // Kapalıyken tekrar wrap içine — yapısal olarak select/trigger'ın yanında
    // durması (DOM sırası, olası :has/sibling seçicileri) korunuyor.
    wrap.appendChild(panel);
    trigger.setAttribute("aria-expanded", "false");
    if (closeOpenPanel === closePanel) closeOpenPanel = null;
  };

  // Delegated — bağlanır BİR KEZ (panel her açılışta innerHTML ile yeniden
  // render edildiği için per-item listener yerine tek delegated handler).
  panel.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-select-menu-value]");
    if (!btn) return;
    select.value = btn.dataset.selectMenuValue ?? "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    closePanel();
  });

  const openPanel = (): void => {
    closeOpenPanel?.();
    renderPanelItems(select, panel);
    // Kırpan `overflow-hidden` ata'lardan (ör. Settings kart `bg-white
    // rounded-lg overflow-hidden`) kaçmak için panel body'ye portallanır.
    panel.className = PANEL_OPEN_CLASS;
    document.body.appendChild(panel);
    positionPanel(trigger, panel);
    trigger.setAttribute("aria-expanded", "true");
    closeOpenPanel = closePanel;
    window.addEventListener("scroll", schedulePosition, true);
    window.addEventListener("resize", schedulePosition);
    panel.querySelector<HTMLInputElement>("[data-select-menu-search]")?.focus();
  };

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel.classList.contains("hidden")) openPanel();
    else closePanel();
  });

  trigger.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (panel.classList.contains("hidden")) openPanel();
    panel.querySelector<HTMLElement>('[role="option"]')?.focus();
  });

  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePanel();
      trigger.focus();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const options = Array.from(panel.querySelectorAll<HTMLElement>('[role="option"]'));
    if (!options.length) return;
    const current = options.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown" ? Math.min(current + 1, options.length - 1) : Math.max(current - 1, 0);
    options[next]?.focus();
  });
}

function renderPanelItems(select: HTMLSelectElement, panel: HTMLElement): void {
  const allOptions = Array.from(select.options);
  const needsSearch = allOptions.length > SEARCH_THRESHOLD;

  const itemsHtml = (query: string): string => {
    const q = query.trim().toLocaleLowerCase("tr");
    const filtered = q
      ? allOptions.filter((opt) => opt.text.toLocaleLowerCase("tr").includes(q))
      : allOptions;
    if (!filtered.length) {
      return `<div class="px-2.5 py-3 text-[12.5px] text-text-tertiary text-center">${escapeHtml(t("search.noResults", { defaultValue: "Sonuç bulunamadı" }))}</div>`;
    }
    return filtered
      .map((opt) => {
        const on = opt.value === select.value;
        return `<button type="button" role="option" aria-selected="${on}" data-select-menu-value="${escapeHtml(opt.value)}"
          class="th-no-press w-full flex items-center justify-between gap-2 bg-transparent border-0 px-2.5 py-2 rounded-md text-[13px] cursor-pointer text-start transition-colors hover:bg-surface-raised appearance-none focus:outline-none ${on ? "font-semibold text-[var(--color-cta-primary,#F5B800)]" : "text-text-primary"}">
          <span class="truncate">${escapeHtml(opt.text)}</span>
          ${on ? CHECK_SVG : ""}
        </button>`;
      })
      .join("");
  };

  if (!needsSearch) {
    panel.innerHTML = `<div data-select-menu-items>${itemsHtml("")}</div>`;
    return;
  }

  panel.innerHTML = `
    <div class="sticky top-0 -m-1.5 mb-1 p-1.5 bg-white border-b border-border-default">
      <input type="text" data-select-menu-search placeholder="${escapeHtml(t("common.search", { defaultValue: "Ara" }))}"
        class="w-full h-8 px-2.5 text-[12.5px] bg-white border border-border-default rounded-md focus:border-[var(--color-cta-primary,#F5B800)] focus:outline-none appearance-none" />
    </div>
    <div data-select-menu-items>${itemsHtml("")}</div>
  `;

  const search = panel.querySelector<HTMLInputElement>("[data-select-menu-search]");
  search?.addEventListener("input", () => {
    const itemsWrap = panel.querySelector<HTMLElement>("[data-select-menu-items]");
    if (itemsWrap) itemsWrap.innerHTML = itemsHtml(search.value);
  });
}
