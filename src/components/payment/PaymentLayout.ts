/**
 * PaymentLayout Component
 * Internal left-nav with grouped sections:
 *   Özet: Ödeme yönetimi, İşlemler
 *
 * Modals: "Yeni bir kart ekle"
 */

import { paymentCardStore } from "./state/PaymentCardStore";
import { t } from "../../i18n";

/* ────────────────────────────────────────
   NAV STRUCTURE
   ──────────────────────────────────────── */
interface PayNavGroup {
  title: string;
  items: { id: string; label: string }[];
}

const NAV_GROUPS: PayNavGroup[] = [
  {
    title: t("payment.navSummary"),
    items: [
      { id: "payment-management", label: t("payment.paymentManagement") },
      { id: "transactions", label: t("payment.transactions") },
    ],
  },
];

/* ────────────────────────────────────────
   SHARED ICONS
   ──────────────────────────────────────── */
const RECEIPT_ICON = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="10" y="4" width="28" height="36" rx="3" fill="#E5E7EB" stroke="#D1D5DB" stroke-width="1"/><rect x="16" y="12" width="16" height="2.5" rx="1.25" fill="#D1D5DB"/><rect x="16" y="18" width="12" height="2.5" rx="1.25" fill="#D1D5DB"/><rect x="16" y="24" width="14" height="2.5" rx="1.25" fill="#D1D5DB"/><path d="M10 40l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V4H10v36z" fill="#E5E7EB"/></svg>`;

/* ────────────────────────────────────────
   SECTION: Ödeme yönetimi
   ──────────────────────────────────────── */
function renderPaymentManagement(): string {
  const cards = paymentCardStore.getCards();
  const savedCardsHtml =
    cards.length > 0
      ? cards
          .map(
            (c) => `
      <div data-card-id="${c.id}" class="relative shrink-0 w-[200px] max-sm:w-[160px] h-[120px] max-sm:h-[100px] rounded-md p-4 max-sm:p-3 flex flex-col justify-between group cursor-default"
           style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.18);">
        <div class="flex items-center justify-between">
          <span class="text-[11px] max-sm:text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded ml-auto"
                style="background: rgba(255,255,255,0.15); color: white;">${c.brand}</span>
        </div>
        <div>
          <div class="text-sm max-sm:text-xs font-mono font-bold text-white tracking-widest mb-1 truncate">${c.cardNumber}</div>
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <div class="text-[9px] max-sm:text-[8px] text-white/40 uppercase tracking-wide">${t("payment.nameLabel")}</div>
              <div class="text-[11px] max-sm:text-[10px] text-white font-medium truncate">${c.cardholderName}</div>
            </div>
            <div class="text-right shrink-0 ml-2">
              <div class="text-[9px] max-sm:text-[8px] text-white/40 uppercase tracking-wide">${t("payment.lastUsedLabel")}</div>
              <div class="text-[11px] max-sm:text-[10px] text-white font-medium">${c.expiry || "—"}</div>
            </div>
          </div>
        </div>
        <!-- Edit + Sil buttons -->
        <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="w-5 h-5 rounded-full flex items-center justify-center text-white bg-white/20 hover:bg-white/40 border-none cursor-pointer transition-colors"
                  onclick="if(window.editSavedCard) window.editSavedCard('${c.id}')" title="${t("payment.editCardBtn")}">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2L4 10H2v-2l6.5-6.5z" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="w-5 h-5 rounded-full flex items-center justify-center text-white bg-red-500/70 hover:bg-red-500 border-none cursor-pointer text-[10px] font-bold transition-colors"
                  onclick="this.closest('[data-card-id]').remove(); if(window.removeSavedCard) window.removeSavedCard('${c.id}')" title="${t("payment.deleteBtn")}">
            &times;
          </button>
        </div>
      </div>
  `
          )
          .join("")
      : "";

  // Add-card button as a card-shaped tile
  const addCardTile = `
    <div id="pay-add-card-btn" class="pay-add-card shrink-0 w-[200px] max-sm:w-[160px] h-[120px] max-sm:h-[100px] rounded-md flex flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer transition-[border-color,background] duration-200"
         style="border-color: var(--color-border-strong, #ccc); background: transparent;"
         data-action="open-card-modal"
         onmouseenter="this.style.borderColor='var(--btn-bg, #ff6600)'; this.style.background='var(--color-primary-50, #fff9f5)';"
         onmouseleave="this.style.borderColor='var(--color-border-strong, #ccc)'; this.style.background='transparent';">
      <span style="font-size: 28px; line-height: 1; color: var(--color-text-secondary, #888);">+</span>
      <span class="text-xs font-medium text-center px-2" style="color: var(--color-text-primary, #333);">${t("payment.addNewCard")}</span>
    </div>
  `;

  return `
    <div class="mb-6"><h1 class="text-[22px] font-bold text-text-primary m-0 max-sm:text-lg truncate">${t("payment.paymentManagementTitle")}</h1></div>

    <!-- Kayıtlı kartlar -->
    <div class="mb-8">
      <h2 class="text-base font-semibold text-text-primary mb-4">${t("payment.savedCardsTitle")}</h2>
      <div class="flex gap-4 max-sm:gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/35 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.2)_transparent]">
        ${savedCardsHtml}
        ${addCardTile}
      </div>
    </div>

    <!-- İşlemler (Alpine-driven) -->
    <div class="mb-8" x-data="paymentManagement">
      <h2 class="text-base font-semibold text-text-primary mb-4">${t("payment.transactionsTitle")}</h2>
      <div class="flex border-b border-border-default overflow-x-auto overflow-y-hidden">
        <button @click="activeTab = 'payments'" :class="activeTab === 'payments' ? '!text-text-primary !font-semibold !border-b-[#222]' : ''" class="py-3 px-5 max-sm:py-2.5 max-sm:px-3 text-[13px] max-sm:text-xs font-medium text-text-secondary bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-[color,border-color] duration-150 -mb-px whitespace-nowrap hover:text-text-primary">${t("payment.paymentsTab")}</button>
        <button @click="activeTab = 'refunds'" :class="activeTab === 'refunds' ? '!text-text-primary !font-semibold !border-b-[#222]' : ''" class="py-3 px-5 max-sm:py-2.5 max-sm:px-3 text-[13px] max-sm:text-xs font-medium text-text-secondary bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-[color,border-color] duration-150 -mb-px whitespace-nowrap hover:text-text-primary">${t("payment.refundsTab")}</button>
      </div>

      <!-- Loading -->
      <div x-show="loading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      </div>

      <!-- Ödemeler Tab -->
      <div x-show="!loading && activeTab === 'payments'" x-cloak>
        <template x-if="payments.length === 0">
          <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div class="opacity-50 mb-4">${RECEIPT_ICON}</div>
            <p class="text-sm text-text-tertiary m-0">${t("payment.noPaymentRecord")}</p>
          </div>
        </template>
        <template x-if="payments.length > 0">
          <div class="overflow-x-auto mt-2">
            <table class="w-full border-collapse text-[13px]">
              <thead><tr>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thSendTime")}</th>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thSupplier")}</th>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thPaymentMethod")}</th>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thAmount")}</th>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thStatus")}</th>
              </tr></thead>
              <tbody>
                <template x-for="tx in payments" :key="tx.name">
                  <tr class="border-b border-border-default hover:bg-surface-muted transition-colors">
                    <td class="py-3 px-4 whitespace-nowrap" x-text="formatDate(tx.transaction_date)"></td>
                    <td class="py-3 px-4" x-text="tx.seller_name || '—'"></td>
                    <td class="py-3 px-4" x-text="tx.payment_method || '—'"></td>
                    <td class="py-3 px-4 font-medium" x-text="formatAmount(tx.amount, tx.currency)"></td>
                    <td class="py-3 px-4"><span class="text-xs font-medium" :class="tx.status_color" x-text="tx.status_en"></span></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- İadeler Tab -->
      <div x-show="!loading && activeTab === 'refunds'" x-cloak>
        <template x-if="refunds.length === 0">
          <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div class="opacity-50 mb-4">${RECEIPT_ICON}</div>
            <p class="text-sm text-text-tertiary m-0">${t("payment.noRefundRecord")}</p>
          </div>
        </template>
        <template x-if="refunds.length > 0">
          <div class="overflow-x-auto mt-2">
            <table class="w-full border-collapse text-[13px]">
              <thead><tr>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thSendTime")}</th>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thSupplier")}</th>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thAmount")}</th>
                <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thStatus")}</th>
              </tr></thead>
              <tbody>
                <template x-for="tx in refunds" :key="tx.name">
                  <tr class="border-b border-border-default hover:bg-surface-muted transition-colors">
                    <td class="py-3 px-4 whitespace-nowrap" x-text="formatDate(tx.transaction_date)"></td>
                    <td class="py-3 px-4" x-text="tx.seller_name || '—'"></td>
                    <td class="py-3 px-4 font-medium" x-text="formatAmount(tx.amount, tx.currency)"></td>
                    <td class="py-3 px-4"><span class="text-xs font-medium" :class="tx.status_color" x-text="tx.status_en"></span></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal: Yeni bir kart ekle (Interactive Card) -->
    <div class="pay-modal hidden fixed inset-0 z-[9999] items-center justify-center" id="pay-card-modal">
      <div class="pay-modal__overlay fixed inset-0 bg-black/45 z-[1]"></div>
      <div class="pay-modal__dialog relative z-[2] bg-surface rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-[90%] max-w-[570px] max-h-[90vh] overflow-y-auto animate-[payModalIn_200ms_ease-out]"
           x-data="interactiveCard">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 max-sm:px-4 pt-5 pb-4">
          <h3 id="pay-card-modal-title" class="text-lg max-sm:text-base font-bold text-text-primary m-0 truncate mr-2">${t("payment.addCardModalTitle")}</h3>
          <button class="pay-modal__close flex items-center justify-center w-8 h-8 shrink-0 bg-transparent border-none rounded-md cursor-pointer transition-[background] duration-150 hover:bg-surface-raised" aria-label="${t("payment.closeBtn")}">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="#333" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Interactive 3D Card Preview — pure Tailwind v4 3D transforms -->
        <div class="px-6 max-sm:px-4 pb-2">
          <div class="relative mx-auto max-w-[430px] h-[270px] max-sm:max-w-[310px] max-sm:h-[220px] w-full z-[2] perspective-[2000px]">

            <!-- FRONT SIDE -->
            <div class="absolute inset-0 transform-3d backface-hidden transition-transform duration-800 ease-[cubic-bezier(0.71,0.03,0.56,0.85)] rounded-[15px] overflow-hidden shadow-[0_20px_60px_0_rgba(14,42,90,0.55)] h-full"
                 :class="isFlipped ? 'rotate-y-180' : 'rotate-y-0'">
              <!-- Cover background -->
              <div class="absolute inset-0 h-full left-0 top-0 w-full rounded-[15px] overflow-hidden after:content-[''] after:absolute after:inset-0 after:bg-[rgba(6,2,29,0.45)]"
                   style="background: linear-gradient(135deg, #0c1220 0%, #162544 40%, #1a3a6e 70%, #0f2847 100%);"></div>
              <!-- Card content -->
              <div class="relative z-[4] h-full p-[25px_15px] max-sm:p-[20px_10px] flex flex-col select-none"
                   style="font-family: 'Source Code Pro', monospace; text-shadow: 7px 6px 10px rgba(14,42,90,0.8);">
                <!-- Top: Chip + Brand -->
                <div class="flex items-start justify-between mb-10 max-sm:mb-6 px-2.5">
                  <svg width="50" height="40" viewBox="0 0 50 40" fill="none" class="max-sm:w-10">
                    <rect x="1" y="4" width="48" height="32" rx="6" fill="url(#chipGrad2)" stroke="#b8963e" stroke-width="0.6"/>
                    <rect x="9" y="11" width="32" height="18" rx="2.5" stroke="#c9a84c" stroke-width="0.6" fill="none"/>
                    <line x1="25" y1="11" x2="25" y2="29" stroke="#c9a84c" stroke-width="0.5"/>
                    <line x1="9" y1="20" x2="41" y2="20" stroke="#c9a84c" stroke-width="0.5"/>
                    <defs><linearGradient id="chipGrad2" x1="0" y1="0" x2="48" y2="36"><stop offset="0%" stop-color="#e8cb80"/><stop offset="50%" stop-color="#d4a84a"/><stop offset="100%" stop-color="#c49a3c"/></linearGradient></defs>
                  </svg>
                  <div class="h-[45px] max-sm:h-10 flex items-center justify-end max-w-[100px] ml-auto w-full relative">
                    <template x-if="brand === 'VISA'">
                      <svg width="70" height="24" viewBox="0 0 70 24" fill="none"><text x="0" y="20" font-family="Arial,sans-serif" font-size="24" font-weight="bold" font-style="italic" fill="white" opacity="0.95">VISA</text></svg>
                    </template>
                    <template x-if="brand === 'MC'">
                      <div class="flex items-center"><div class="w-9 h-9 rounded-full bg-[#eb001b] opacity-90"></div><div class="w-9 h-9 rounded-full bg-[#f79e1b] opacity-90 -ml-4"></div></div>
                    </template>
                    <template x-if="brand === 'AMEX'">
                      <span class="text-base font-black tracking-[2px] text-white/90">AMEX</span>
                    </template>
                    <template x-if="brand === 'TROY'">
                      <span class="text-base font-bold tracking-wider text-[#00a0e3]">TROY</span>
                    </template>
                    <template x-if="!brand">
                      <span class="text-xs font-medium tracking-[3px] text-white/30 uppercase">KART</span>
                    </template>
                  </div>
                </div>
                <!-- Card Number -->
                <div class="text-white font-medium leading-none text-[27px] max-sm:text-[21px] mb-9 max-sm:mb-4 px-[15px] max-sm:px-2.5 whitespace-nowrap"
                     x-text="displayNumber"></div>
                <!-- Bottom: Name + Expiry -->
                <div class="flex items-start mt-auto text-white">
                  <div class="flex-1 min-w-0 px-[15px] max-sm:px-2.5 py-2.5 max-w-[calc(100%-85px)]">
                    <div class="text-[13px] max-sm:text-xs opacity-70 mb-1.5">Kart Sahibi</div>
                    <div class="text-lg max-sm:text-base font-medium leading-none uppercase truncate"
                         x-text="cardName || 'AD SOYAD'"></div>
                  </div>
                  <div class="shrink-0 w-20 px-2.5 py-2.5 flex flex-wrap whitespace-nowrap">
                    <div class="text-[13px] max-sm:text-xs opacity-70 pb-1.5 w-full">SKT</div>
                    <span x-text="displayExpiry" class="text-lg max-sm:text-base font-medium leading-none"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- BACK SIDE -->
            <div class="absolute inset-0 transform-3d backface-hidden transition-transform duration-800 ease-[cubic-bezier(0.71,0.03,0.56,0.85)] z-[2] rounded-[15px] overflow-hidden shadow-[0_20px_60px_0_rgba(14,42,90,0.55)] p-0"
                 :class="isFlipped ? 'rotate-y-0' : '-rotate-y-180'">
              <!-- Cover (counter-rotated to prevent mirror) -->
              <div class="rotate-y-180 absolute inset-0 h-full left-0 top-0 w-full rounded-[15px] overflow-hidden after:content-[''] after:absolute after:inset-0 after:bg-[rgba(6,2,29,0.45)]"
                   style="background: linear-gradient(135deg, #0c1220 0%, #162544 40%, #1a3a6e 70%, #0f2847 100%);"></div>
              <!-- Magnetic strip -->
              <div class="relative z-[2] w-full h-[50px] max-sm:h-10 mt-[30px] max-sm:mt-5 bg-[rgba(0,0,19,0.8)]"></div>
              <!-- CVV section -->
              <div class="relative z-[2] text-right p-[15px] max-sm:p-[10px_15px]">
                <div class="text-[15px] font-medium text-white pr-2.5 mb-1">CVV</div>
                <div class="h-[45px] max-sm:h-10 bg-white mb-[30px] max-sm:mb-5 flex items-center justify-end pr-2.5 text-[#1a3b5d] text-lg rounded shadow-[0px_10px_20px_-7px_rgba(32,56,117,0.35)]">
                  <span class="font-mono tracking-[4px]" x-text="cvv ? cvv.replace(/./g, '*') : ''"></span>
                </div>
                <div class="h-[45px] max-sm:h-10 flex items-center justify-end max-w-[100px] ml-auto relative opacity-70">
                  <template x-if="brand === 'VISA'">
                    <svg width="60" height="20" viewBox="0 0 60 20" fill="none"><text x="0" y="17" font-family="Arial,sans-serif" font-size="20" font-weight="bold" font-style="italic" fill="white">VISA</text></svg>
                  </template>
                  <template x-if="brand === 'MC'">
                    <div class="flex items-center"><div class="w-7 h-7 rounded-full bg-[#eb001b]"></div><div class="w-7 h-7 rounded-full bg-[#f79e1b] -ml-3"></div></div>
                  </template>
                  <template x-if="brand === 'AMEX'">
                    <span class="text-sm font-black tracking-wider text-white">AMEX</span>
                  </template>
                  <template x-if="brand === 'TROY'">
                    <span class="text-sm font-bold tracking-wider text-[#00a0e3]">TROY</span>
                  </template>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Form -->
        <div class="pay-modal__body px-6 max-sm:px-4 pt-4 pb-5">
          <!-- Card Number -->
          <div class="mb-3">
            <label class="text-xs font-medium text-text-secondary mb-1.5 block">${t("payment.cardNumberPlaceholder")}</label>
            <input id="pay-card-num" type="text" class="th-input th-input-md font-mono tracking-wider"
                   x-model="cardNumber"
                   @input="formatCardNumber()"
                   @focus="focusField = 'number'; isFlipped = false"
                   maxlength="19"
                   placeholder="0000 0000 0000 0000"
                   inputmode="numeric" />
          </div>
          <!-- Cardholder Name -->
          <div class="mb-3">
            <label class="text-xs font-medium text-text-secondary mb-1.5 block">Kart Sahibi</label>
            <input id="pay-card-fn" type="text" class="th-input th-input-md"
                   x-model="firstName"
                   @focus="focusField = 'name'; isFlipped = false"
                   placeholder="${t("payment.firstNamePlaceholder")}" />
          </div>
          <div class="mb-3 hidden">
            <input id="pay-card-ln" type="text" x-model="lastName" />
          </div>
          <!-- Expiry + CVV row -->
          <div class="flex gap-3 max-sm:gap-2">
            <div class="flex-1">
              <label class="text-xs font-medium text-text-secondary mb-1.5 block">Son Kullanma Tarihi</label>
              <div class="flex gap-2 items-center">
                <select id="pay-card-month" class="th-input th-input-md flex-1 cursor-pointer"
                        x-model="month"
                        @focus="focusField = 'expiry'; isFlipped = false">
                  <option value="">${t("payment.monthPlaceholder")}</option>
                  ${Array.from({ length: 12 }, (_, i) => `<option value="${String(i + 1).padStart(2, "0")}">${String(i + 1).padStart(2, "0")}</option>`).join("")}
                </select>
                <span class="text-text-tertiary">/</span>
                <select id="pay-card-year" class="th-input th-input-md flex-1 cursor-pointer"
                        x-model="year"
                        @focus="focusField = 'expiry'; isFlipped = false">
                  <option value="">${t("payment.yearPlaceholder")}</option>
                  ${Array.from({ length: 10 }, (_, i) => `<option value="${2025 + i}">${2025 + i}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="w-[120px] max-sm:w-[100px]">
              <label class="text-xs font-medium text-text-secondary mb-1.5 block">CVV</label>
              <input id="pay-card-cvv" type="text" class="th-input th-input-md font-mono tracking-widest text-center"
                     x-model="cvv"
                     @focus="focusField = 'cvv'; isFlipped = true"
                     @blur="isFlipped = false"
                     @input="cvv = cvv.replace(/\\D/g, '').substring(0, brand === 'AMEX' ? 4 : 3)"
                     :maxlength="brand === 'AMEX' ? 4 : 3"
                     placeholder="***"
                     inputmode="numeric" />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2.5 px-6 max-sm:px-4 pb-5 pt-4 border-t border-[#f0f0f0]">
          <button class="pay-modal__btn--primary th-btn-dark max-sm:w-full">${t("payment.saveBtn")}</button>
        </div>
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────
   SECTION: İşlemler (Tüm İşlemler)
   ──────────────────────────────────────── */
function renderTransactions(): string {
  return `
    <div x-data="transactionList">
    <div class="text-[13px] text-text-tertiary mb-2">${t("payment.breadcrumbTransactions")}</div>
    <div class="mb-6"><h1 class="text-[22px] font-bold text-text-primary m-0 max-sm:text-lg truncate">${t("payment.allTransactions")}</h1></div>

    <!-- Tabs -->
    <div class="flex border-b border-border-default overflow-x-auto overflow-y-hidden">
      <button @click="setTab('payment')" :class="activeTab === 'payment' ? '!text-text-primary !font-semibold !border-b-[#222]' : ''" class="py-3 px-5 max-sm:py-2.5 max-sm:px-3 text-[13px] max-sm:text-xs font-medium text-text-secondary bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-[color,border-color] duration-150 -mb-px whitespace-nowrap hover:text-text-primary">${t("payment.paymentTab")}</button>
      <button @click="setTab('refund')" :class="activeTab === 'refund' ? '!text-text-primary !font-semibold !border-b-[#222]' : ''" class="py-3 px-5 max-sm:py-2.5 max-sm:px-3 text-[13px] max-sm:text-xs font-medium text-text-secondary bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-[color,border-color] duration-150 -mb-px whitespace-nowrap hover:text-text-primary">${t("payment.refundTab")}</button>
    </div>

    <!-- Status pills -->
    <div class="flex items-center gap-3 py-4 flex-wrap">
      <span class="text-[13px] font-semibold text-text-primary whitespace-nowrap">${t("payment.statusLabel")}</span>
      <div class="flex flex-wrap gap-2">
        <template x-for="s in [{key:'all',label:'${t("payment.statusAll")}'},{key:'not_arrived',label:'${t("payment.paymentsNotArrived")}'},{key:'pending_match',label:'${t("payment.pendingSupplierMatch")}'},{key:'completed',label:'${t("payment.completed")}'}]" :key="s.key">
          <button @click="setStatus(s.key)" :class="activeStatus === s.key ? '!text-white !bg-[#222] !border-[#222]' : 'text-text-secondary bg-surface-raised border-border-default hover:border-[#bbb] hover:bg-[#eee]'" class="py-1.5 px-3.5 text-xs rounded-md border cursor-pointer whitespace-nowrap transition-all duration-150" x-text="s.label"></button>
        </template>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center justify-between gap-3 py-3 flex-wrap max-md:flex-col max-md:items-start">
      <div class="flex items-center gap-2.5 flex-wrap">
        <div class="relative flex items-center gap-1.5">
          <input type="date" x-model="filters.dateFrom" @change="loadTransactions()" class="th-input th-input-sm min-w-[140px] max-sm:min-w-0 max-sm:w-full" />
        </div>
        <div class="relative flex items-center gap-1.5">
          <input type="date" x-model="filters.dateTo" @change="loadTransactions()" class="th-input th-input-sm min-w-[140px] max-sm:min-w-0 max-sm:w-full" />
        </div>
        <input type="text" x-model="filters.amount" @change="loadTransactions()" class="th-input th-input-sm min-w-[140px] max-sm:min-w-0 max-sm:w-full" placeholder="${t("payment.searchByAmount")}" />
        <select x-model="filters.currency" @change="loadTransactions()" class="th-input th-input-sm min-w-[100px] cursor-pointer">
          <option value="">${t("payment.currencyLabel")}</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="TRY">TRY</option>
        </select>
        <a href="#" @click.prevent="clearFilters()" class="text-[13px] text-text-secondary no-underline whitespace-nowrap transition-[color] duration-150 hover:text-text-primary hover:underline">${t("payment.removeFilters")}</a>
      </div>
      <button @click="exportData()" class="th-btn-dark inline-flex items-center gap-1.5 whitespace-nowrap">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12h10" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t("payment.exportDetails")}
      </button>
    </div>

    <!-- Loading -->
    <div x-show="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>

    <!-- Empty State -->
    <template x-if="!loading && transactions.length === 0">
      <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div class="opacity-50 mb-4">${RECEIPT_ICON}</div>
        <p class="text-sm text-text-tertiary m-0">${t("payment.noPaymentRecord")}</p>
      </div>
    </template>

    <!-- Table -->
    <template x-if="!loading && transactions.length > 0">
      <div>
        <div class="overflow-x-auto mt-2">
          <table class="w-full border-collapse text-[13px]">
            <thead><tr>
              <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thSendTime")}</th>
              <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thSupplier")}</th>
              <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thPaymentMethod")}</th>
              <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thAmount")}</th>
              <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thTransactionFee")}</th>
              <th class="text-left py-3 px-4 font-semibold text-text-secondary bg-surface-muted border-b border-border-default whitespace-nowrap">${t("payment.thStatus")}</th>
            </tr></thead>
            <tbody>
              <template x-for="tx in transactions" :key="tx.name">
                <tr class="border-b border-border-default hover:bg-surface-muted transition-colors">
                  <td class="py-3 px-4 whitespace-nowrap" x-text="formatDate(tx.transaction_date)"></td>
                  <td class="py-3 px-4" x-text="tx.seller_name || '—'"></td>
                  <td class="py-3 px-4" x-text="tx.payment_method || '—'"></td>
                  <td class="py-3 px-4 font-medium" x-text="formatAmount(tx.amount, tx.currency)"></td>
                  <td class="py-3 px-4" x-text="formatAmount(tx.transaction_fee, tx.currency)"></td>
                  <td class="py-3 px-4"><span class="text-xs font-medium" :class="tx.status_color" x-text="tx.status_en"></span></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div class="flex items-center justify-between py-4 text-[13px] text-text-secondary">
          <span x-text="'Toplam ' + pagination.total + ' kayıt'"></span>
          <div class="flex items-center gap-2">
            <button @click="prevPage()" :disabled="pagination.page <= 1" class="px-3 py-1.5 rounded border border-border-default bg-surface text-text-secondary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-muted">&laquo;</button>
            <span x-text="pagination.page + ' / ' + totalPages"></span>
            <button @click="nextPage()" :disabled="pagination.page >= totalPages" class="px-3 py-1.5 rounded border border-border-default bg-surface text-text-secondary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-muted">&raquo;</button>
          </div>
        </div>
      </div>
    </template>
    </div>
  `;
}

/* ────────────────────────────────────────
   SECTION MAP
   ──────────────────────────────────────── */
const SECTIONS: Record<string, () => string> = {
  "payment-management": renderPaymentManagement,
  transactions: renderTransactions,
};

function getActiveSection(): string {
  const hash = window.location.hash.replace("#", "");
  return SECTIONS[hash] ? hash : "payment-management";
}

/* ────────────────────────────────────────
   NAV RENDERER
   ──────────────────────────────────────── */
function renderNav(activeId: string): string {
  return NAV_GROUPS.map((group) => {
    const items = group.items
      .map((item) => {
        const active =
          item.id === activeId
            ? "pay-nav__link--active font-semibold text-text-primary !border-l-[#222] bg-[#f9f9f9] max-md:!border-l-transparent max-md:!border-b-[#222]"
            : "";
        return `<a href="#${item.id}" class="pay-nav__link block py-2 px-5 text-sm text-text-primary no-underline border-l-[3px] border-transparent transition-[color,background,border-color] duration-150 leading-[1.4] hover:bg-surface-muted hover:text-text-primary max-md:border-l-0 max-md:border-b-2 max-md:border-transparent max-md:py-1.5 max-md:px-3 max-md:text-[13px] max-md:truncate ${active}" data-nav="${item.id}">${item.label}</a>`;
      })
      .join("");
    return `
      <div class="pay-nav__group mb-2 max-md:flex max-md:items-center max-md:mb-0 max-md:min-w-0">
        <span class="block py-2 px-5 text-xs font-semibold text-text-tertiary uppercase tracking-wide max-md:py-1 max-md:px-2 max-md:text-[11px] max-md:shrink-0 max-md:whitespace-nowrap">${group.title}</span>
        ${items}
      </div>
    `;
  }).join("");
}

/* ────────────────────────────────────────
   MAIN LAYOUT
   ──────────────────────────────────────── */
export function PaymentLayout(): string {
  const activeId = getActiveSection();
  const renderFn = SECTIONS[activeId] ?? renderPaymentManagement;

  return `
    <div class="pay-layout flex bg-surface rounded-lg min-h-[calc(100vh-80px)] overflow-hidden max-md:flex-col">
      <aside class="pay-nav w-[220px] shrink-0 border-r border-[#f0f0f0] py-6 sticky top-0 self-start max-h-[calc(100vh-80px)] overflow-y-auto max-md:w-full max-md:static max-md:max-h-none max-md:border-r-0 max-md:border-b max-md:border-[#f0f0f0] max-md:py-4 max-md:flex max-md:flex-wrap max-md:items-center max-md:overflow-x-auto">
        <h2 class="text-base font-bold text-text-primary px-5 pb-4 max-md:w-full max-md:px-4 max-md:pb-2">${t("payment.paymentTitle")}</h2>
        ${renderNav(activeId)}
      </aside>
      <div class="pay-content flex-1 min-w-0 py-6 px-7 max-md:py-4 max-md:px-5 max-sm:py-3 max-sm:px-3" id="pay-content">
        ${renderFn()}
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────
   INIT
   ──────────────────────────────────────── */
export function initPaymentLayout(): void {
  const contentEl = document.getElementById("pay-content");
  if (!contentEl) return;

  function navigate(): void {
    const activeId = getActiveSection();
    const renderFn = SECTIONS[activeId] ?? renderPaymentManagement;
    contentEl!.innerHTML = renderFn();

    document.querySelectorAll<HTMLAnchorElement>(".pay-nav__link").forEach((link) => {
      const isActive = link.dataset.nav === activeId;
      link.classList.toggle("pay-nav__link--active", isActive);
      link.classList.toggle("font-semibold", isActive);
      link.classList.toggle("!border-l-[#222]", isActive);
      link.classList.toggle("bg-[#f9f9f9]", isActive);
    });

    initPayTabs();
    initPayModals();
    initPayPills();
  }

  window.addEventListener("hashchange", navigate);

  // Nav link clicks
  document.querySelectorAll<HTMLAnchorElement>(".pay-nav__link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.dataset.nav ?? "payment-management";
      window.location.hash = id;
    });
  });

  initPayTabs();
  initPayModals();
  initPayPills();
}

function initPayTabs(): void {
  document.querySelectorAll<HTMLElement>(".pay-tabs").forEach((tabGroup) => {
    const tabs = tabGroup.querySelectorAll<HTMLButtonElement>(".pay-tabs__tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetId = tab.dataset.tab;
        if (!targetId) return;
        tabs.forEach((t) => {
          t.classList.remove("pay-tabs__tab--active");
          t.classList.remove("!text-text-primary", "!font-semibold", "!border-b-[#222]");
        });
        tab.classList.add("pay-tabs__tab--active");
        tab.classList.add("!text-text-primary", "!font-semibold", "!border-b-[#222]");
        const parent = tabGroup.parentElement;
        if (!parent) return;
        parent.querySelectorAll<HTMLElement>("[data-tab-panel]").forEach((panel) => {
          const isActive = panel.dataset.content === targetId;
          panel.classList.toggle("hidden", !isActive);
          panel.classList.toggle("block", isActive);
        });
      });
    });
  });

  // Apply active styles to initially active tabs
  document.querySelectorAll<HTMLButtonElement>(".pay-tabs__tab--active").forEach((tab) => {
    tab.classList.add("!text-text-primary", "!font-semibold", "!border-b-[#222]");
  });
}

function initPayPills(): void {
  document.querySelectorAll<HTMLElement>(".pay-pills").forEach((group) => {
    const pills = group.querySelectorAll<HTMLButtonElement>(".pay-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => {
          p.classList.remove("pay-pill--active");
          p.classList.remove("!text-white", "!bg-[#222]", "!border-[#222]");
          p.classList.add("text-text-secondary", "bg-surface-raised", "border-border-default");
        });
        pill.classList.add("pay-pill--active");
        pill.classList.add("!text-white", "!bg-[#222]", "!border-[#222]");
        pill.classList.remove("text-text-secondary", "bg-surface-raised", "border-border-default");
      });
    });
  });
}

function openPayModal(id: string): void {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closePayModal(modal: HTMLElement): void {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
  // Reset modal title if it was in edit mode
  if (modal.id === "pay-card-modal") {
    const titleEl = document.getElementById("pay-card-modal-title");
    if (titleEl) titleEl.textContent = t("payment.addCardModalTitle");
  }
}

function initPayModals(): void {
  // Card modal
  document
    .querySelector<HTMLElement>('[data-action="open-card-modal"]')
    ?.addEventListener("click", () => openPayModal("pay-card-modal"));

  // Close handlers for all modals
  document.querySelectorAll<HTMLElement>(".pay-modal").forEach((modal) => {
    modal
      .querySelector(".pay-modal__overlay")
      ?.addEventListener("click", () => closePayModal(modal));
    modal.querySelector(".pay-modal__close")?.addEventListener("click", () => closePayModal(modal));
    const cancelBtn = modal.querySelector(".pay-modal__btn--cancel");
    if (cancelBtn) cancelBtn.addEventListener("click", () => closePayModal(modal));
  });

  // Edit card: open modal with pre-filled data
  let editingCardId: string | null = null;
  window.editSavedCard = (id: string) => {
    const cards = paymentCardStore.getCards();
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    editingCardId = id;

    const titleEl = document.getElementById("pay-card-modal-title");
    if (titleEl) titleEl.textContent = t("payment.editCardModalTitle");

    const numEl = document.getElementById("pay-card-num") as HTMLInputElement;
    const fnEl = document.getElementById("pay-card-fn") as HTMLInputElement;
    const monthEl = document.getElementById("pay-card-month") as HTMLSelectElement;
    const yearEl = document.getElementById("pay-card-year") as HTMLSelectElement;

    // Pre-fill form with existing card data
    if (numEl) numEl.value = card.cardNumber;
    if (fnEl) fnEl.value = card.cardholderName;
    if (monthEl && card.expiry) monthEl.value = card.expiry.split("/")[0] || "";
    if (yearEl && card.expiry) yearEl.value = card.expiry.split("/")[1] || "";

    // Sync Alpine state
    const cardModalEl = document.getElementById("pay-card-modal");
    if (cardModalEl) {
      const alpineEl = cardModalEl.querySelector<HTMLElement>("[x-data]");
      if (alpineEl && (alpineEl as any)._x_dataStack) {
        const data = (alpineEl as any)._x_dataStack[0];
        if (data) {
          data.cardNumber = card.cardNumber;
          data.firstName = card.cardholderName;
          data.lastName = "";
          data.month = card.expiry?.split("/")[0] || "";
          data.year = card.expiry?.split("/")[1] || "";
          data.cvv = "";
          data.isFlipped = false;
        }
      }
      openPayModal("pay-card-modal");
    }
  };

  // Save card button in card modal
  const cardModal = document.getElementById("pay-card-modal");
  if (cardModal) {
    const saveBtn = cardModal.querySelector<HTMLElement>(".pay-modal__btn--primary");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const numEl = document.getElementById("pay-card-num") as HTMLInputElement;
        const fnEl = document.getElementById("pay-card-fn") as HTMLInputElement;
        const lnEl = document.getElementById("pay-card-ln") as HTMLInputElement;
        const monthEl = document.getElementById("pay-card-month") as HTMLSelectElement;
        const yearEl = document.getElementById("pay-card-year") as HTMLSelectElement;

        const cardNumber = numEl?.value?.trim();
        const firstName = fnEl?.value?.trim();
        const lastName = lnEl?.value?.trim();
        const month = monthEl?.value;
        const year = yearEl?.value;

        if (!cardNumber || !firstName) {
          numEl?.classList.toggle("!border-red-400", !cardNumber);
          fnEl?.classList.toggle("!border-red-400", !firstName);
          return;
        }

        const cardholderName = `${firstName} ${lastName}`.trim();
        const expiry = month && year ? `${month}/${year}` : "";
        // Detect brand from first digit
        const firstDigit = cardNumber[0];
        const brand =
          firstDigit === "4"
            ? "VISA"
            : firstDigit === "5"
              ? "MC"
              : firstDigit === "3"
                ? "AMEX"
                : "CARD";

        const isEditing = !!editingCardId;

        if (isEditing) {
          // Update existing card
          paymentCardStore.updateCard(editingCardId!, {
            cardNumber,
            expiry,
            cardholderName,
            brand,
          });
          editingCardId = null;
          const titleEl = document.getElementById("pay-card-modal-title");
          if (titleEl) titleEl.textContent = t("payment.addCardModalTitle");
        } else {
          // Save new card to store
          paymentCardStore.addCard({ cardNumber, expiry, cardholderName, brand });
        }

        // Clear inputs and close modal
        if (numEl) numEl.value = "";
        if (fnEl) fnEl.value = "";
        if (lnEl) lnEl.value = "";
        if (monthEl) monthEl.selectedIndex = 0;
        if (yearEl) yearEl.selectedIndex = 0;
        const cvvEl = document.getElementById("pay-card-cvv") as HTMLInputElement;
        if (cvvEl) cvvEl.value = "";
        // Reset Alpine state
        const alpineEl = cardModal.querySelector<HTMLElement>("[x-data]");
        if (alpineEl && (alpineEl as any)._x_dataStack) {
          const data = (alpineEl as any)._x_dataStack[0];
          if (data) {
            data.cardNumber = "";
            data.firstName = "";
            data.lastName = "";
            data.month = "";
            data.year = "";
            data.cvv = "";
            data.isFlipped = false;
          }
        }
        closePayModal(cardModal);

        // Re-render to show updated/new card
        window.dispatchEvent(new Event("hashchange"));
      });
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const open = document.querySelector<HTMLElement>(".pay-modal:not(.hidden)");
      if (open) closePayModal(open);
    }
  });
}
