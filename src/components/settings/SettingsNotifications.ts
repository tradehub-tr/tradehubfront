/**
 * SettingsNotifications — Ayarlar > Bildirimler (`#bildirimler`).
 *
 * Olay × kanal tercihleri, e-posta sıklığı, push sessiz saatleri ve ticari ileti
 * izni tek ekranda. Eski "E-posta tercihleri" (`#eposta`) girişinin yerini alır.
 * Tasarım: `desing/bildirim-sablonlari-2026-10-02/01-tercihler-storefront/`.
 *
 * Davranış: `alpine/settingsNotifications.ts`. Bu dosya yalnız şablondur.
 * Sunucudan gelen metinler (olay adı, gerekçe, kaynak, hedef) `x-text` ile basılır;
 * hiçbir yerde `innerHTML`/`x-html` yoktur.
 *
 * Veri yalnız gerçek uçtan gelir (`services/notificationPreferencesService.ts`); örnek veri
 * ya da "henüz bağlı değil" yedeği yoktur.
 *
 * ÜRÜN KARARI BEKLEYENLER ekranda söz olarak yazılmaz:
 *   · sessiz saatte biriken push → "Varsayım" etiketli not
 *   · özet saati/günü → metinde saat yok; zaman sunucudan (`digest.daily/weekly`) gelir
 *   · ticari iznin sahibi ekran (T12) → "yalnız buradan yönetilir" denmez
 */
import { t } from "../../i18n";

// ── İkonlar (1.5 çizgi, currentColor) ─────────────────────────────

function ico(path: string, cls = "size-4"): string {
  return `<svg class="${cls} shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
}

const P = {
  lock: `<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`,
  check: `<path d="M5 12.5l4.5 4.5L19 7.5"/>`,
  x: `<path d="M6 6l12 12M18 6L6 18"/>`,
  minus: `<path d="M6 12h12"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  moon: `<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>`,
  alert: `<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17.5h.01"/>`,
  chevron: `<path d="M6 9l6 6 6-6"/>`,
  scale: `<path d="M12 3v18M4 21h16M3 7h18"/><path d="M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z"/>`,
  zap: `<path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12l1-8z"/>`,
  layers: `<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 17l9 5 9-5"/>`,
};

// ── Ortak sınıflar ────────────────────────────────────────────────

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]";
const CARD = "rounded-md border border-border-default bg-surface";
const H3 = "m-0 text-[17px] font-bold text-text-primary";
const H4 = "m-0 mb-2 text-[15px] font-bold text-text-primary";
const DESC = "m-0 mt-1 text-[13px] leading-5 text-text-secondary";
const BTN_GHOST = `inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[#6b6b6b] bg-transparent px-4 text-[13px] font-semibold text-text-primary no-underline transition-colors duration-150 hover:bg-surface-raised aria-disabled:cursor-wait aria-disabled:opacity-55 motion-reduce:transition-none ${FOCUS}`;
const BTN_PRIMARY = `inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--color-surface-inverse,#0a0a0a)] bg-[var(--color-surface-inverse,#0a0a0a)] px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#333] aria-disabled:cursor-wait aria-disabled:opacity-55 motion-reduce:transition-none ${FOCUS}`;
const BTN_TONE = `th-no-press inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-current bg-transparent px-4 text-[13px] font-semibold text-inherit transition-colors duration-150 hover:bg-white/60 disabled:cursor-wait disabled:opacity-55 motion-reduce:transition-none ${FOCUS}`;

/**
 * Switch: 44×44 dokunma alanı, içinde 40×22 ray. Açık ray `primary-700` (#ad5b00) —
 * `primary-500` beyaz zeminde 2,6:1 kalıyor (1.4.11). Topuz RTL'de ters yöne kayar.
 */
function switchButton(attrs: string): string {
  return `
    <button type="button" role="switch" ${attrs}
      class="th-no-press group/sw relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-45 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1d4ed8]">
      <span aria-hidden="true" class="relative block h-[22px] w-10 rounded-full border-[1.5px] border-[#6b6b6b] bg-surface transition-colors duration-150 ease-out group-aria-checked/sw:border-primary-700 group-aria-checked/sw:bg-primary-700 motion-reduce:transition-none">
        <span class="absolute start-[3px] top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-[#6b6b6b] transition-transform duration-150 ease-out group-aria-checked/sw:translate-x-[17px] group-aria-checked/sw:bg-white motion-reduce:transition-none rtl:group-aria-checked/sw:-translate-x-[17px]"></span>
      </span>
    </button>`;
}

// ── Durum blokları ────────────────────────────────────────────────

function renderSkeleton(): string {
  const row = `<div class="h-4 rounded bg-surface-raised"></div>`;
  const card = (rows: number) =>
    `<div class="${CARD} space-y-4 p-4"><div class="h-5 w-2/5 rounded bg-surface-raised"></div>${row.repeat(rows)}</div>`;
  return `
    <div x-show="phase === 'idle' || phase === 'loading'" aria-hidden="true" class="animate-pulse space-y-3 motion-reduce:animate-none">
      <div class="${CARD} grid grid-cols-3 gap-4 p-4">${`<div class="h-9 rounded bg-surface-raised"></div>`.repeat(3)}</div>
      ${card(4)}${card(2)}${card(2)}
    </div>
    <p class="sr-only" role="status" aria-live="polite" x-text="statusText"></p>`;
}

function renderLoadError(): string {
  return `
    <div x-show="phase === 'error'" x-cloak class="${CARD} flex flex-col items-start gap-3 p-5" role="alert">
      <p class="m-0 flex items-start gap-2 text-sm font-semibold text-[#b91c1c]">${ico(P.alert, "mt-0.5 size-4")}<span>${t("notifPrefs.loadError")}</span></p>
      <button type="button" class="${BTN_GHOST}" @click="load()">${t("notifPrefs.retryLoad")}</button>
    </div>`;
}

// ── Sonuç özeti + bölüm gezinmesi ─────────────────────────────────

function renderSummary(): string {
  const cell = (label: string, body: string) => `
    <div class="min-w-0 px-3 py-2.5 md:px-4">
      <dt class="text-xs text-text-secondary">${label}</dt>
      <dd class="m-0 mt-0.5 text-sm font-bold text-text-primary">${body}</dd>
    </div>`;
  return `
    <dl class="${CARD} m-0 grid grid-cols-3 divide-x divide-border-default rtl:divide-x-reverse">
      ${cell(t("notifPrefs.summary.emailLabel"), `<span x-text="sumEmail"></span>`)}
      ${cell(
        t("notifPrefs.summary.pushLabel"),
        `<span x-text="sumPush"></span>
         <span x-show="sumPushBlocked" class="mt-0.5 flex items-start gap-1 text-xs font-semibold text-[#92400e]">${ico(P.alert, "mt-0.5 size-3.5")}<span>${t("notifPrefs.summary.pushBlocked")}</span></span>`
      )}
      ${cell(t("notifPrefs.summary.digestLabel"), `<span x-text="sumDigest"></span>`)}
    </dl>`;
}

function renderJump(): string {
  const items = ["events", "timing", "quiet", "consent"];
  return `
    <nav aria-label="${t("notifPrefs.jump.label")}" class="sticky z-(--z-sticky,20) -mx-1 mt-3 grid grid-cols-4 border-b border-border-default bg-[#F5F5F5] px-1 md:flex md:gap-6" :style="'top:' + stickyTop + 'px'">
      ${items
        .map(
          (id, i) => `
      <button type="button" @click="jumpTo(${i})" :aria-current="currentJump === ${i} ? 'true' : null"
        class="th-no-press min-h-11 min-w-11 cursor-pointer border-0 border-b-2 border-solid border-transparent bg-transparent px-1 py-1.5 text-center text-xs leading-4 font-semibold text-text-secondary aria-[current]:border-primary-700 aria-[current]:text-text-primary min-[480px]:text-[13px] ${FOCUS}">${t(`notifPrefs.jump.${id}`)}</button>`
        )
        .join("")}
    </nav>`;
}

// ── Bölüm 1: olaylar ──────────────────────────────────────────────

function renderPushDevice(): string {
  return `
    <div id="np-push-note" aria-live="polite"
      class="mt-3 flex flex-wrap items-start gap-x-3 gap-y-2 rounded-md border px-4 py-3"
      :class="pushReady ? 'border-border-default bg-surface text-text-primary' : 'border-[#fcd34d] bg-[#fffbeb] text-[#92400e]'"
      :data-state="pushState">
      <span class="mt-0.5">
        <span x-show="pushReady" class="text-[#166534]">${ico(P.check, "size-[18px]")}</span>
        <span x-show="!pushReady">${ico(P.alert, "size-[18px]")}</span>
      </span>
      <div class="min-w-0 flex-1 basis-56">
        <p class="m-0 text-sm font-semibold" x-text="pushTitle"></p>
        <p class="m-0 mt-0.5 text-[13px] leading-5" :class="pushReady ? 'max-md:sr-only' : ''" x-text="pushText"></p>
      </div>
      <div x-show="pushState === 'izin-yok' || pushState === 'cihaz-yok'" class="flex flex-wrap gap-2">
        <button type="button" class="${BTN_TONE}" @click="grantPush()" :disabled="pushBusy" x-text="pushGrantLabel"></button>
      </div>
      <p x-show="pushIssueText" :data-issue="pushIssue" role="alert" class="m-0 w-full text-[13px] leading-5 font-semibold" x-text="pushIssueText"></p>
    </div>`;
}

function renderCell(): string {
  return `
    <div class="flex min-h-11 items-center gap-2" :class="cell.padOnly ? 'max-xl:hidden' : ''" :data-ch="cell.ch" :data-state="cell.kind">
      <template x-if="cell.kind === 'switch'">
        <div class="flex items-center gap-2">
          ${switchButton(
            `:aria-checked="cell.on ? 'true' : 'false'" :aria-label="cell.ariaLabel" :aria-describedby="cell.ch === 'push' ? 'np-push-note' : null" @click="toggleEvent(row.key, cell.ch)"`
          )}
          <span class="leading-tight" aria-hidden="true">
            <span class="block text-[13px] font-semibold text-text-primary xl:hidden" x-text="cell.channelLabel"></span>
            <span class="block text-[13px] text-text-secondary" x-text="cell.valueText"></span>
          </span>
        </div>
      </template>
      <template x-if="cell.kind !== 'switch'">
        <div class="flex items-center gap-2">
          <span aria-hidden="true" class="mx-0.5 inline-flex h-[22px] w-10 shrink-0 items-center justify-center rounded-full"
            :class="cell.kind === 'locked' ? 'bg-surface-raised text-text-primary' : 'border border-dashed border-[#6b6b6b] text-text-secondary'">
            <span x-show="cell.kind === 'locked'">${ico(P.lock, "size-3.5")}</span>
            <span x-show="cell.kind !== 'locked'">${ico(P.minus, "size-3.5")}</span>
          </span>
          <span class="leading-tight">
            <span class="block text-[13px] font-semibold text-text-primary xl:sr-only" x-text="cell.channelLabel"></span>
            <span class="block text-[13px]" :class="cell.kind === 'locked' ? 'font-bold text-text-primary' : 'text-text-secondary'" x-text="cell.valueText"></span>
          </span>
        </div>
      </template>
    </div>`;
}

function renderCategories(): string {
  return `
    <div class="mt-3 space-y-3">
      <template x-for="cat in cats" :key="cat.id">
        <section class="${CARD}" :aria-labelledby="'np-cat-' + cat.id">
          <h4 class="m-0">
            <button type="button" :id="'np-cat-' + cat.id" @click="toggleCat(cat.id)"
              :aria-expanded="cat.open ? 'true' : 'false'" :aria-controls="'np-cat-body-' + cat.id"
              class="th-no-press flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent px-4 py-2.5 text-start focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1d4ed8]">
              <span class="min-w-0 flex-1">
                <span class="block text-[15px] font-bold text-text-primary" x-text="cat.title"></span>
                <span class="mt-0.5 block text-[13px] text-text-secondary" x-text="cat.countText"></span>
              </span>
              <span class="text-text-primary transition-transform duration-150 motion-reduce:transition-none" :class="cat.open ? 'rotate-180' : ''">${ico(P.chevron, "size-5")}</span>
            </button>
          </h4>
          <div :id="'np-cat-body-' + cat.id" x-show="cat.open">
            <div x-show="cat.bulks.length > 0" role="group" :aria-label="cat.bulkLabel"
              class="flex flex-wrap gap-x-5 border-t border-border-default bg-surface-muted px-4 xl:justify-end">
              <template x-for="b in cat.bulks" :key="b.ch">
                <button type="button" @click="bulk(cat.id, b.ch)" x-text="b.text"
                  class="th-no-press min-h-11 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-primary-700 underline underline-offset-4 ${FOCUS}"></button>
              </template>
            </div>
            <div aria-hidden="true" class="hidden gap-x-4 border-t border-border-default bg-surface-muted px-4 py-2 text-xs font-semibold text-text-secondary xl:grid" :class="cat.gridClass">
              <span>${t("notifPrefs.events.colEvent")}</span>
              <template x-for="col in cat.cols" :key="col.ch"><span x-text="col.label"></span></template>
            </div>
            <ul class="m-0 list-none p-0">
              <template x-for="row in cat.rows" :key="row.key">
                <li class="border-t border-border-default px-4 py-3 xl:grid xl:items-center xl:gap-x-4 xl:py-1" :class="cat.gridClass" :data-event="row.key">
                  <div class="flex items-start justify-between gap-x-3 gap-y-0.5 xl:flex-wrap xl:items-center xl:justify-start xl:py-1.5">
                    <span class="text-sm font-semibold text-text-primary" x-text="row.name"></span>
                    <span x-show="row.delivery" class="inline-flex shrink-0 items-center gap-1 text-xs text-text-secondary">
                      <span x-show="row.delivery === 'aninda'">${ico(P.zap, "size-3.5")}</span>
                      <span x-show="row.delivery === 'ozetlenebilir'">${ico(P.layers, "size-3.5")}</span>
                      <span><span class="sr-only">${t("notifPrefs.delivery.srPrefix")}</span><span x-text="row.deliveryLabel"></span></span>
                    </span>
                  </div>
                  <div class="mt-1 grid grid-cols-2 gap-x-3 sm:grid-cols-3 xl:mt-0 xl:contents">
                    <template x-for="cell in row.cells" :key="cell.ch">${renderCell()}</template>
                  </div>
                </li>
              </template>
            </ul>
          </div>
        </section>
      </template>
    </div>`;
}

function renderMandatory(): string {
  return `
    <details class="${CARD} group/mand mt-3" x-show="mandatory.length > 0">
      <summary class="flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-md px-4 text-sm text-text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1d4ed8] [&::-webkit-details-marker]:hidden">
        <span class="text-text-secondary">${ico(P.lock, "size-[18px]")}</span>
        <span class="min-w-0 flex-1"><strong class="font-bold" x-text="mandatoryCount"></strong> ${t("notifPrefs.mandatory.suffix")}</span>
        <span class="transition-transform duration-150 group-open/mand:rotate-180 motion-reduce:transition-none">${ico(P.chevron, "size-5")}</span>
      </summary>
      <p class="m-0 px-4 pb-3 text-[13px] leading-5 text-text-secondary">${t("notifPrefs.mandatory.why")}</p>
      <ul class="m-0 list-none p-0">
        <template x-for="item in mandatory" :key="item.key">
          <li class="border-t border-border-default px-4 py-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-4">
            <span class="block text-sm font-semibold text-text-primary" x-text="item.name"></span>
            <span class="mt-0.5 flex items-center gap-1 text-xs text-text-secondary md:mt-0 md:justify-end">${ico(P.lock, "size-3.5")}<span x-text="item.meta"></span></span>
            <span class="mt-1 block text-[13px] leading-5 text-text-secondary md:col-span-2" x-text="item.why"></span>
          </li>
        </template>
      </ul>
    </details>`;
}

// ── Bölüm 2: gönderim zamanı ──────────────────────────────────────

function renderFrequency(): string {
  const option = (value: string, title: string, desc: string, tag = "") => `
    <label class="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border-default bg-surface p-3 has-checked:border-text-primary has-checked:bg-surface-muted has-checked:outline has-checked:outline-1 has-checked:outline-text-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#1d4ed8] has-disabled:cursor-not-allowed">
      <input type="radio" name="np-frequency" value="${value}" x-model="draft.frequency" @change="edited()" class="peer sr-only" />
      <span aria-hidden="true" class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#6b6b6b] bg-surface after:size-2.5 after:rounded-full after:bg-text-primary after:opacity-0 after:content-[''] peer-checked:border-text-primary peer-checked:after:opacity-100"></span>
      <span class="min-w-0">
        <span class="flex flex-wrap items-center gap-2 text-sm font-semibold text-text-primary">${title}${tag}</span>
        <span class="mt-0.5 block text-[13px] leading-5 text-text-secondary">${desc}</span>
      </span>
    </label>`;
  const tag = `<span class="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800">${t("notifPrefs.frequency.recommended")}</span>`;
  return `
    <section aria-labelledby="np-h-frequency" class="mt-4">
      <h4 class="${H4}" id="np-h-frequency">${t("notifPrefs.frequency.heading")}</h4>
      <div class="${CARD} p-4">
        <fieldset class="m-0 min-w-0 border-0 p-0" :disabled="freqDisabled" aria-describedby="np-frequency-effect">
          <legend class="sr-only">${t("notifPrefs.frequency.legend")}</legend>
          <p id="np-frequency-effect" class="m-0 mb-3 flex items-start gap-2 text-[13px] leading-5 text-text-primary">${ico(P.info, "mt-0.5 size-4")}<span x-text="freqEffect"></span></p>
          <div class="space-y-2" :class="freqDisabled ? 'opacity-60' : ''">
            ${option("instant", t("notifPrefs.frequency.instant"), t("notifPrefs.frequency.instantDesc"))}
            ${option("daily", t("notifPrefs.frequency.daily"), t("notifPrefs.frequency.dailyDesc"), tag)}
            ${option("weekly", t("notifPrefs.frequency.weekly"), t("notifPrefs.frequency.weeklyDesc"))}
          </div>
        </fieldset>
      </div>
    </section>`;
}

function renderQuiet(): string {
  const field = (id: string, model: string, label: string, errorExpr: string) => `
    <div class="min-w-0">
      <label class="mb-1 block text-[13px] text-text-secondary" for="np-quiet-${id}">${label}</label>
      <input type="time" step="900" id="np-quiet-${id}" x-ref="quiet${id === "start" ? "Start" : "End"}" x-model="${model}" @input="quietEdited()" @change="quietEdited()"
        :disabled="!draft.quietEnabled" :aria-invalid="${errorExpr} ? 'true' : 'false'" aria-describedby="np-quiet-${id}-error"
        class="block h-12 w-full min-w-0 rounded-md border border-[#6b6b6b] bg-surface px-3 text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-2 aria-invalid:border-[#b91c1c] ${FOCUS}" />
      <p id="np-quiet-${id}-error" x-show="${errorExpr}" :data-source="quiet.fromServer ? 'server' : 'local'" class="m-0 mt-1.5 flex items-start gap-1.5 text-[13px] leading-5 font-semibold text-[#b91c1c]">${ico(P.alert, "mt-0.5 size-4")}<span x-text="${errorExpr}"></span></p>
    </div>`;
  return `
    <section aria-labelledby="np-h-quiet" class="mt-5" id="np-sessiz">
      <h4 class="${H4}" id="np-h-quiet">${t("notifPrefs.quiet.heading")}</h4>
      <div class="${CARD} p-4">
        <fieldset class="m-0 min-w-0 border-0 p-0">
          <legend class="sr-only">${t("notifPrefs.quiet.heading")}</legend>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-semibold text-text-primary" id="np-quiet-label">${t("notifPrefs.quiet.switchLabel")}</span>
            ${switchButton(`:aria-checked="draft.quietEnabled ? 'true' : 'false'" aria-labelledby="np-quiet-label" aria-describedby="np-quiet-summary" @click="toggleQuiet()"`)}
          </div>
          <div class="mt-2 grid grid-cols-2 gap-3 md:max-w-[28rem]">
            ${field("start", "draft.quietStart", t("notifPrefs.quiet.start"), "quiet.startError")}
            ${field("end", "draft.quietEnd", t("notifPrefs.quiet.end"), "quiet.endError")}
          </div>
          <p id="np-quiet-summary" aria-live="polite" class="m-0 mt-3 flex min-h-5 items-start gap-2 text-sm font-semibold text-text-primary">
            <span x-show="quiet.summary" class="mt-0.5">${ico(P.clock, "size-4")}</span><span x-text="quiet.summary"></span>
          </p>
          <p class="m-0 mt-2 flex items-start gap-2 text-[13px] leading-5 text-text-secondary">${ico(P.moon, "mt-0.5 size-4")}<span x-text="quietHelp"></span></p>
          <p class="m-0 mt-2 flex items-start gap-2 text-[13px] leading-5 text-text-secondary">
            <span class="shrink-0 rounded border border-dashed border-[#6b6b6b] px-1.5 text-xs font-semibold text-text-primary">${t("notifPrefs.quiet.assumptionTag")}</span>
            <span>${t("notifPrefs.quiet.assumption")}</span>
          </p>
        </fieldset>
      </div>
    </section>`;
}

// ── Bölüm 3: ticari ileti izni ────────────────────────────────────

function renderConsentRow(ch: "email" | "sms"): string {
  const v = `consentView('${ch}')`;
  return `
    <li class="border-b border-border-default p-4" data-ch="${ch}" :data-status="${v}.state">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <span class="block text-sm font-semibold text-text-primary" id="np-consent-${ch}-label">${t(`notifPrefs.consent.${ch}Title`)}</span>
          <span class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-text-secondary">
            <span class="break-all" :dir="${v}.targetMissing ? null : 'ltr'" x-text="${v}.targetText"></span>
            <span x-show="!${v}.targetMissing" class="inline-flex items-center gap-1 font-semibold" :class="${v}.verified ? 'text-[#166534]' : 'text-[#92400e]'">
              <span x-show="${v}.verified">${ico(P.check, "size-3.5")}</span>
              <span x-show="!${v}.verified">${ico(P.alert, "size-3.5")}</span>
              <span x-text="${v}.verifyLabel"></span>
            </span>
          </span>
        </div>
        ${switchButton(`x-ref="consent-${ch}" :aria-checked="${v}.granted ? 'true' : 'false'" :aria-disabled="${v}.locked ? 'true' : null" aria-labelledby="np-consent-${ch}-label" aria-describedby="np-consent-${ch}-status np-consent-${ch}-error" @click="toggleConsent('${ch}')"`)}
      </div>
      <div class="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p id="np-consent-${ch}-status" aria-live="polite" class="m-0 flex min-w-0 flex-1 basis-56 items-start gap-1.5 text-[13px] leading-5" :class="${v}.tone">
          <span class="mt-0.5">
            <span x-show="${v}.state === 'onayli'">${ico(P.check, "size-4")}</span>
            <span x-show="${v}.state === 'bekliyor'">${ico(P.clock, "size-4")}</span>
            <span x-show="${v}.state === 'geri-cekildi'">${ico(P.x, "size-4")}</span>
            <span x-show="${v}.state === 'yok'">${ico(P.minus, "size-4")}</span>
            <span x-show="${v}.state === 'basarisiz' || ${v}.state === 'hedef-eksik' || ${v}.state === 'hedef-dogrulanmadi'">${ico(P.alert, "size-4")}</span>
          </span>
          <span><strong class="font-bold" x-text="${v}.strong"></strong><span x-show="${v}.rest"> · </span><span x-text="${v}.rest"></span></span>
        </p>
        <template x-if="${v}.action === 'retry'">
          <button type="button" class="th-no-press ${BTN_GHOST}" @click="retryConsent('${ch}')" :aria-disabled="consentBusy.${ch} ? 'true' : null">${t("notifPrefs.consent.retry")}</button>
        </template>
        <template x-if="${v}.action === 'update' || ${v}.action === 'verify'">
          <a :href="${v}.actionHref" class="${BTN_GHOST}" x-text="${v}.actionLabel"></a>
        </template>
      </div>
      <p x-show="${v}.error" role="alert" id="np-consent-${ch}-error" class="m-0 mt-2 flex items-start gap-1.5 text-[13px] leading-5 font-semibold text-[#b91c1c]">${ico(P.alert, "mt-0.5 size-4")}<span x-text="${v}.error"></span></p>
    </li>`;
}

function renderHistory(): string {
  const th = (label: string) =>
    `<th scope="col" class="px-4 py-2 text-start text-xs font-semibold text-text-secondary">${label}</th>`;
  const td = (label: string, body: string) =>
    `<td data-col="${label}" class="px-4 py-1 align-top text-[13px] text-text-primary before:block before:text-xs before:text-text-secondary before:content-[attr(data-col)] md:py-2.5 md:before:hidden">${body}</td>`;
  return `
    <button type="button" @click="historyOpen = !historyOpen" :aria-expanded="historyOpen ? 'true' : 'false'" aria-controls="np-history"
      class="th-no-press flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-md border-0 bg-transparent px-4 text-start text-sm font-semibold text-text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1d4ed8]">
      <span>${t("notifPrefs.history.toggle")}</span>
      <span class="transition-transform duration-150 motion-reduce:transition-none" :class="historyOpen ? 'rotate-180' : ''">${ico(P.chevron, "size-5")}</span>
    </button>
    <div id="np-history" x-show="historyOpen" class="border-t border-border-default">
      <p x-show="historyRows.length === 0" class="m-0 p-4 text-[13px] text-text-secondary">${t("notifPrefs.history.empty")}</p>
      <table x-show="historyRows.length > 0" class="w-full border-collapse max-md:block">
        <caption class="sr-only">${t("notifPrefs.history.caption")}</caption>
        <thead class="max-md:sr-only">
          <tr>${th(t("notifPrefs.history.colDate"))}${th(t("notifPrefs.history.colChannel"))}${th(t("notifPrefs.history.colAction"))}${th(t("notifPrefs.history.colSource"))}${th(t("notifPrefs.history.colSync"))}</tr>
        </thead>
        <tbody class="max-md:block">
          <template x-for="h in historyRows" :key="h.id">
            <tr class="border-t border-border-default first:border-t-0 max-md:grid max-md:grid-cols-2 max-md:py-2 md:border-t" :data-sync="h.sync">
              ${td(t("notifPrefs.history.colDate"), `<span x-text="h.date"></span>`)}
              ${td(t("notifPrefs.history.colChannel"), `<span x-text="h.channel"></span>`)}
              ${td(
                t("notifPrefs.history.colAction"),
                `<span class="inline-flex items-center gap-1 font-semibold" :class="h.grant ? 'text-[#166534]' : 'text-[#b91c1c]'"><span x-show="h.grant">${ico(P.check, "size-3.5")}</span><span x-show="!h.grant">${ico(P.x, "size-3.5")}</span><span x-text="h.action"></span></span>`
              )}
              ${td(t("notifPrefs.history.colSource"), `<span x-text="h.source"></span>`)}
              ${td(
                t("notifPrefs.history.colSync"),
                `<span class="inline-flex items-center gap-1 font-semibold" :class="h.sync === 'islendi' ? 'text-text-primary' : (h.sync === 'bekliyor' ? 'text-[#92400e]' : 'text-[#b91c1c]')"><span x-show="h.sync === 'islendi'">${ico(P.check, "size-3.5")}</span><span x-show="h.sync === 'bekliyor'">${ico(P.clock, "size-3.5")}</span><span x-show="h.sync === 'basarisiz'">${ico(P.alert, "size-3.5")}</span><span x-text="h.syncLabel"></span></span>`
              )}
            </tr>
          </template>
        </tbody>
      </table>
    </div>`;
}

function renderConsent(): string {
  return `
    <section aria-labelledby="np-h-consent" id="np-izin" class="mt-8 border-t border-border-default pt-6">
      <p class="m-0 mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary">${ico(P.scale, "size-3.5")}<span>${t("notifPrefs.consent.legalTag")}</span></p>
      <h3 class="${H3}" id="np-h-consent">${t("notifPrefs.consent.heading")}</h3>
      <p class="${DESC}">${t("notifPrefs.consent.desc")}</p>
      <div class="${CARD} mt-3">
        <ul class="m-0 list-none p-0">
          ${renderConsentRow("email")}
          ${renderConsentRow("sms")}
        </ul>
        <p class="m-0 px-4 pt-4 text-[13px] leading-5 text-text-secondary">${t("notifPrefs.consent.legal")}</p>
        <p class="m-0 border-b border-border-default px-4 pt-2 pb-4 text-[13px] leading-5 text-text-secondary">
          ${t("notifPrefs.consent.related")}
          <a href="#onay-yonetimi" class="font-semibold text-text-primary underline underline-offset-2 ${FOCUS}">${t("notifPrefs.consent.relatedLink")}</a>
        </p>
        ${renderHistory()}
      </div>
    </section>`;
}

// ── Kayıt çubuğu + çıkış onayı ────────────────────────────────────

function renderSaveBar(): string {
  return `
    <div x-ref="savebar" x-show="saveState !== 'temiz'" x-cloak role="region" aria-label="${t("notifPrefs.save.regionLabel")}" :data-state="saveState"
      x-transition:enter="transition ease-out duration-200 motion-reduce:transition-none" x-transition:enter-start="translate-y-full" x-transition:enter-end="translate-y-0"
      x-transition:leave="transition ease-out duration-150 motion-reduce:transition-none" x-transition:leave-start="translate-y-0" x-transition:leave-end="translate-y-full"
      class="fixed inset-x-0 z-(--z-fixed,40) border-t border-border-default bg-surface shadow-[0_-2px_8px_rgba(0,0,0,0.06)]" :style="'bottom:' + bottomOffset + 'px'">
      <div class="container-boxed flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
        <template x-if="saveState === 'basarisiz'">
          <div role="alert" class="flex w-full items-start gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[13px] leading-5 text-[#b91c1c]">
            ${ico(P.alert, "mt-0.5 size-4")}
            <p class="m-0"><strong class="font-bold">${t("notifPrefs.save.errorTitle")}</strong> <span x-text="saveErrorText"></span></p>
          </div>
        </template>
        <p class="m-0 text-sm font-semibold text-text-primary" aria-live="polite" aria-atomic="true" x-text="countText"></p>
        <div class="ms-auto flex items-center gap-2">
          <button type="button" class="${BTN_GHOST}" @click="discard()" :aria-disabled="saving ? 'true' : null">${t("notifPrefs.save.discard")}</button>
          <button type="button" class="${BTN_PRIMARY}" @click="save()" :aria-disabled="saving ? 'true' : null" x-text="saveLabel"></button>
        </div>
      </div>
    </div>`;
}

function renderLeaveDialog(): string {
  return `
    <dialog x-ref="leaveDialog" aria-labelledby="np-leave-title" aria-describedby="np-leave-desc"
      class="m-auto w-[min(92vw,420px)] rounded-md border border-border-default bg-surface p-5 text-text-primary backdrop:bg-black/50">
      <h3 class="m-0 text-[17px] font-bold" id="np-leave-title">${t("notifPrefs.leave.title")}</h3>
      <p class="m-0 mt-2 text-sm leading-5 text-text-secondary" id="np-leave-desc" x-text="leaveText"></p>
      <div class="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" class="${BTN_GHOST}" @click="leave()">${t("notifPrefs.leave.go")}</button>
        <button type="button" class="${BTN_PRIMARY}" @click="stay()" autofocus>${t("notifPrefs.leave.stay")}</button>
      </div>
    </dialog>`;
}

// ── Dışa açılan ───────────────────────────────────────────────────

export function SettingsNotifications(): string {
  return `
    <div x-data="settingsNotifications" @hashchange.window="onHash()" :class="saveState !== 'temiz' ? 'pb-28' : 'pb-4'" id="np-root">
      <h2 class="m-0 text-xl font-bold text-text-primary">${t("notifPrefs.title")}</h2>
      <p class="m-0 mt-1 mb-3 text-sm leading-5 text-text-secondary">${t("notifPrefs.lead")}</p>

      ${renderSkeleton()}
      ${renderLoadError()}

      <div x-show="phase === 'ready'" x-cloak :inert="saving" :aria-busy="saving ? 'true' : 'false'"
        class="transition-opacity duration-150 motion-reduce:transition-none" :class="saving ? 'opacity-60' : ''">
        ${renderSummary()}
        ${renderJump()}

        <section aria-labelledby="np-h-events" id="np-olaylar" class="mt-5">
          <h3 class="${H3}" id="np-h-events">${t("notifPrefs.events.heading")}</h3>
          <p class="${DESC}">${t("notifPrefs.events.desc")}</p>
          ${renderPushDevice()}
          ${renderCategories()}
          ${renderMandatory()}
        </section>

        <section aria-labelledby="np-h-timing" id="np-zaman" class="mt-8">
          <h3 class="${H3}" id="np-h-timing">${t("notifPrefs.timing.heading")}</h3>
          <p class="${DESC}">${t("notifPrefs.timing.desc")}</p>
          ${renderFrequency()}
          ${renderQuiet()}
        </section>

        ${renderConsent()}
      </div>

      ${renderSaveBar()}
      ${renderLeaveDialog()}
    </div>`;
}
