/**
 * RFQ Quotes Comparison Page — iSTOC-style quote comparison table.
 */

import '../style.css'
import { t } from '../i18n'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'
import { requireAuth } from '../utils/auth-guard'
import { getCsrfToken, checkEmailNotVerifiedResponse, isEmailNotVerifiedError } from '../utils/api'
import { showToast } from '../utils/toast'
import { escapeHtml, sanitizeUrl } from '../utils/sanitize'

import { TopBar, SubHeader, initStickyHeaderSearch, MegaMenu, initMegaMenu } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'

function formatCurrency(amount: number | string | null | undefined, currencyCode: string | null | undefined): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount ?? ''));
  if (!isFinite(num)) return '-';
  const code = (currencyCode || 'TRY').toUpperCase();
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: code }).format(num);
  } catch {
    return `${code} ${num}`;
  }
}

import {
  type RfqAttachment,
  renderAttachmentsSection,
  renderAttachmentModal,
  setupAttachmentInteractions,
} from '../components/rfq/attachments';

/** Bir tedarikçi tarafından gönderilen teklif kaydı (RFQ detail API response item) */
interface Quote {
  name: string;
  seller_name?: string;
  seller_company?: string;
  seller_country?: string;
  seller_type?: string;
  seller_year_established?: string | number;
  seller_employee_count?: string | number;
  listing_image?: string;
  listing_title?: string;
  total_price?: number;
  price_per_unit?: number;
  currency?: string;
  lead_time_days?: number;
  message?: string;
  status?: string;
}

await requireAuth();

const params = new URLSearchParams(window.location.search);
const rfqId = params.get('rfq') || '';

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');

// Initial loading state
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
    ${TopBar()}${SubHeader()}
  </div>
  ${MegaMenu()}
  <main class="bg-gray-50 min-h-screen">
    <div class="container-boxed py-8">
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  </main>
  <footer>${FooterLinks()}</footer>
`;

initMegaMenu(); initFlowbite(); initStickyHeaderSearch(); initLanguageSelector(); mountChatPopup(); initChatTriggers(); startAlpine();

// Fetch RFQ detail + quotes
async function loadQuotes() {
  if (!rfqId) { window.location.href = '/pages/dashboard/inquiries.html'; return; }

  const res = await fetch(`/api/method/tradehub_core.api.rfq.get_rfq_detail?rfq_id=${encodeURIComponent(rfqId)}`, { credentials: 'include' });
  const d = await res.json();
  const rfq = d.message?.rfq;
  const quotes: Quote[] = d.message?.quotes || [];
  const attachments: RfqAttachment[] = (rfq?.attachments || []) as RfqAttachment[];

  if (!rfq) { window.location.href = '/pages/dashboard/inquiries.html'; return; }

  const mainEl = document.querySelector('main')!;
  mainEl.innerHTML = `
    ${renderAttachmentModal('buyer-detail')}
    <div class="container-boxed py-8">
      <!-- RFQ Header -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex max-md:flex-col gap-6 items-start justify-between">
        <div class="flex gap-4 items-start">
          <div class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs shrink-0">RFQ</div>
          <div>
            <h1 class="text-lg font-bold text-gray-800">${escapeHtml(rfq.product_name)}</h1>
            <p class="text-sm text-gray-500 mt-1">${t('rfq.quantityRequired')}: ${escapeHtml(rfq.quantity)} ${escapeHtml(rfq.unit)}</p>
            ${rfq.creation ? `<p class="text-xs text-gray-400 mt-0.5">${t('rfq.created')}: ${new Date(rfq.creation).toLocaleString('tr-TR')}</p>` : ''}
            ${rfq.description ? `<details class="mt-2"><summary class="text-sm text-gray-500 cursor-pointer">Show more</summary><p class="mt-1 text-sm text-gray-600">${escapeHtml(rfq.description)}</p></details>` : ''}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold ${rfq.status === 'Approved' ? 'text-green-600' : rfq.status === 'Pending' ? 'text-yellow-600' : rfq.status === 'Completed' ? 'text-blue-600' : rfq.status === 'Closed' ? 'text-gray-500' : 'text-gray-500'}">${escapeHtml(rfq.status)}</span>
          <button class="px-4 py-1.5 text-sm border border-gray-300 rounded-full [@media(hover:hover)and(pointer:fine)]:hover:bg-gray-50 ${rfq.additional_details ? 'opacity-50 cursor-not-allowed' : ''}" ${rfq.additional_details ? 'disabled' : ''} onclick="window.location.href='/pages/dashboard/rfq.html?edit=${encodeURIComponent(rfqId)}'">${t('rfq.addDetails')}</button>
          <a href="/pages/dashboard/rfq.html" class="px-4 py-1.5 text-sm border border-gray-300 rounded-full [@media(hover:hover)and(pointer:fine)]:hover:bg-gray-50">${t('rfq.postAgain')}</a>
          <button class="rfq-close-btn px-4 py-1.5 text-sm border border-gray-300 rounded-full [@media(hover:hover)and(pointer:fine)]:hover:bg-gray-50 ${rfq.status === 'Closed' || rfq.status === 'Completed' ? 'opacity-50 cursor-not-allowed' : ''}" data-rfq="${escapeHtml(rfqId)}" ${rfq.status === 'Closed' || rfq.status === 'Completed' ? 'disabled' : ''}>${t('rfq.closeRfq')}</button>
        </div>
      </div>

      ${renderAttachmentsSection(attachments, 'buyer-detail')}

      ${quotes.length ? `
        <!-- Comparison Table -->
        <h2 class="text-base font-bold text-gray-800 mb-4">${t('rfq.allQuotationsComparison')} (${quotes.length})</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse bg-white">
            <!-- Vendor Header Row -->
            <thead>
              <tr class="border-b border-gray-200">
                <th class="p-3 text-start text-sm font-normal w-40"></th>
                ${quotes.map((q) => `
                  <th class="p-3 text-center min-w-[200px] border-s border-gray-100 relative pt-8">
                    <button class="quote-dismiss-btn absolute top-2 end-3 text-gray-300 hover:text-gray-500 transition-colors" data-quote="${escapeHtml(q.name)}">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    <p class="text-sm font-medium text-gray-800">${escapeHtml(q.seller_name)}</p>
                    <p class="text-xs text-gray-400">${escapeHtml(q.seller_company)}</p>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <!-- Vendor Comparison Row -->
              <tr class="border-b border-gray-200">
                <td class="p-3 text-sm text-amber-600 font-medium align-top">${t('rfq.vendorComparison')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center text-sm border-s border-gray-100 align-top">
                    ${q.status === 'Submitted' ? `
                      <div class="flex justify-center gap-1.5">
                        <button class="quote-accept-btn px-3 py-1 rounded-full bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-xs font-medium border border-(--btn-border-color,#d39c00) active:scale-[0.97] transition-[transform,background-color] duration-150 motion-reduce:transition-none motion-reduce:active:scale-100" data-quote="${escapeHtml(q.name)}">${t('rfq.accept')}</button>
                        <button class="quote-reject-btn px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-xs font-medium [@media(hover:hover)and(pointer:fine)]:hover:bg-gray-50" data-quote="${escapeHtml(q.name)}">${t('rfq.reject')}</button>
                      </div>
                    ` : `<span class="text-xs font-medium ${q.status === 'Accepted' ? 'text-green-600' : q.status === 'Rejected' ? 'text-red-500' : 'text-gray-400'}">${escapeHtml(q.status)}</span>`}
                  </td>
                `).join('')}
              </tr>

              <!-- Product (Listing) Row -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.product')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center border-s border-gray-100">
                    ${q.listing_image ? `<img src="${escapeHtml(sanitizeUrl(q.listing_image))}" alt="" class="w-16 h-16 object-cover rounded mx-auto mb-1" />` : ''}
                    <p class="text-xs text-gray-700">${escapeHtml(q.listing_title || '-')}</p>
                  </td>
                `).join('')}
              </tr>

              <!-- Quotation Information Section Header -->
              <tr>
                <td colspan="${quotes.length + 1}" class="px-3 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">${t('rfq.quotationInfo')}</td>
              </tr>
              <!-- Unit Price -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.unitPrice')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center border-s border-gray-100">
                    ${q.price_per_unit ? `
                      <div class="text-xl font-bold text-gray-800 leading-tight tabular-nums">${formatCurrency(q.price_per_unit, q.currency)}</div>
                      ${rfq.unit ? `<div class="text-xs text-gray-400 mt-0.5">/${rfq.unit}</div>` : ''}
                    ` : `<span class="text-sm italic text-gray-500">${t('rfq.priceOnRequest')}</span>`}
                  </td>
                `).join('')}
              </tr>
              <!-- Lead Time -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.leadTime')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center text-sm border-s border-gray-100">${q.lead_time_days ? `${q.lead_time_days} ${t('rfq.days')}` : '-'}</td>
                `).join('')}
              </tr>
              <!-- Message -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.messageLbl')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center text-sm border-s border-gray-100 text-gray-600">${escapeHtml(q.message || '-')}</td>
                `).join('')}
              </tr>

              <!-- Company Information Section Header -->
              <tr>
                <td colspan="${quotes.length + 1}" class="px-3 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">${t('rfq.companyInfoSection')}</td>
              </tr>
              <!-- Company Name -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.companyName')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center text-sm border-s border-gray-100 text-gray-700">${escapeHtml(q.seller_company || '-')}</td>
                `).join('')}
              </tr>
              <!-- Country -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.country')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center text-sm border-s border-gray-100 text-gray-600">${escapeHtml(q.seller_country || '-')}</td>
                `).join('')}
              </tr>
              <!-- Business Type -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.businessType')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center text-sm border-s border-gray-100 text-gray-600">${escapeHtml(q.seller_type || '-')}</td>
                `).join('')}
              </tr>
              <!-- Year Established -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.yearEstablished')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center text-sm border-s border-gray-100 text-gray-600">${escapeHtml(q.seller_year_established || '-')}</td>
                `).join('')}
              </tr>
              <!-- Employee Count -->
              <tr class="border-b border-gray-100">
                <td class="p-3 text-sm text-gray-500">${t('rfq.employeeCount')}</td>
                ${quotes.map((q) => `
                  <td class="p-3 text-center text-sm border-s border-gray-100 text-gray-600">${escapeHtml(q.seller_employee_count || '-')}</td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      ` : `
        <div class="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p class="text-gray-500">${t('rfq.noQuotationsYet')}</p>
          <p class="text-sm text-gray-400 mt-1">${t('rfq.suppliersNotified')}</p>
        </div>
      `}

      <div class="mt-6 text-center">
        <a href="/pages/dashboard/inquiries.html" class="text-sm text-blue-600 hover:underline">${t('rfq.backToMyRfqs')}</a>
      </div>
    </div>
  `;

  setupAttachmentInteractions(document, attachments, 'buyer-detail');
}

loadQuotes().then(() => {
  // Bind Accept/Reject buttons
  document.querySelectorAll<HTMLButtonElement>('.quote-accept-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const quoteId = btn.dataset.quote;
      if (!quoteId || !confirm(t('ordersUi.confirmAcceptQuote'))) return;
      btn.disabled = true;
      btn.textContent = '...';
      try {
        const res = await fetch((window.API_BASE || '/api') + '/method/tradehub_core.api.rfq.accept_quote', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': getCsrfToken() },
          body: JSON.stringify({ quote_id: quoteId }),
        });
        await checkEmailNotVerifiedResponse(res);
        if (!res.ok) throw new Error();
        showToast({ message: t('rfq.quoteAccepted'), type: 'success' });
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = t('rfq.accept');
        if (isEmailNotVerifiedError(err)) return; // toast api.ts'te
        showToast({ message: t('rfq.quoteAcceptError'), type: 'error' });
      }
    });
  });
  document.querySelectorAll<HTMLButtonElement>('.quote-reject-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const quoteId = btn.dataset.quote;
      if (!quoteId || !confirm(t('ordersUi.confirmRejectQuote'))) return;
      btn.disabled = true;
      btn.textContent = '...';
      try {
        const res = await fetch((window.API_BASE || '/api') + '/method/tradehub_core.api.rfq.reject_quote', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': getCsrfToken() },
          body: JSON.stringify({ quote_id: quoteId }),
        });
        await checkEmailNotVerifiedResponse(res);
        if (!res.ok) throw new Error();
        showToast({ message: t('rfq.quoteRejected'), type: 'success' });
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = t('rfq.reject');
        if (isEmailNotVerifiedError(err)) return; // toast api.ts'te
        showToast({ message: t('rfq.quoteRejectError'), type: 'error' });
      }
    });
  });

  // Bind Dismiss (X) buttons — hide vendor column from comparison
  document.querySelectorAll<HTMLButtonElement>('.quote-dismiss-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const th = btn.closest('th');
      if (!th) return;
      const idx = Array.from(th.parentElement!.children).indexOf(th);
      document.querySelectorAll<HTMLTableRowElement>('table tr').forEach(row => {
        const cells = row.querySelectorAll('th, td');
        if (cells[idx]) (cells[idx] as HTMLElement).style.display = 'none';
      });
      // Update visible vendor count in heading
      const allHeaders = document.querySelectorAll<HTMLTableCellElement>('thead tr th');
      let visibleCount = 0;
      allHeaders.forEach((h, i) => { if (i > 0 && h.style.display !== 'none') visibleCount++; });
      const heading = document.querySelector('h2');
      if (heading) heading.textContent = `${t('rfq.allQuotationsComparison')} (${visibleCount})`;
    });
  });

  // Bind Close RFQ button
  const closeBtn = document.querySelector<HTMLButtonElement>('.rfq-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      if (!confirm(t('ordersUi.confirmCloseRfq'))) return;
      closeBtn.disabled = true;
      closeBtn.textContent = '...';
      try {
        const res = await fetch((window.API_BASE || '/api') + '/method/tradehub_core.api.rfq.close_rfq', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': getCsrfToken() },
          body: JSON.stringify({ rfq_id: rfqId }),
        });
        await checkEmailNotVerifiedResponse(res);
        if (!res.ok) throw new Error();
        showToast({ message: t('rfq.closeSuccess'), type: 'success' });
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        closeBtn.disabled = false;
        closeBtn.textContent = t('rfq.closeRfq');
        if (isEmailNotVerifiedError(err)) return;
        showToast({ message: t('rfq.closeError'), type: 'error' });
      }
    });
  }
}).catch(() => {
  const mainEl = document.querySelector('main');
  if (mainEl) mainEl.innerHTML = '<div class="container-boxed py-8 text-center text-red-500">Error loading quotes</div>';
});
