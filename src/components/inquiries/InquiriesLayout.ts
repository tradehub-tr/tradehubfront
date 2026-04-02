/**
 * InquiriesLayout Component
 * Alibaba-style "My Inquiries" + "My RFQs" dashboard.
 * Two tabs, list views with mock data, inquiry detail slide-out panel.
 */

import { t } from '../../i18n';
import { getMockInquiries, getMockRFQs } from '../../data/inquiries-mock-data';
import type { MockInquiry, MockRFQ } from '../../data/inquiries-mock-data';

// ── Helpers ──────────────────────────────────────────────────────────────────

function avatarPlaceholder(name: string): string {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return `<div class="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">${initials}</div>`;
}

function statusBadge(status: MockRFQ['status']): string {
  const colors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Closed: 'bg-gray-100 text-gray-600',
    Rejected: 'bg-red-100 text-red-700',
    Completed: 'bg-blue-100 text-blue-700',
    'Not Paid': 'bg-orange-100 text-orange-700',
  };
  const label: Record<string, () => string> = {
    Pending: () => t('inquiries.statusPending'),
    Approved: () => t('inquiries.statusApproved'),
    Closed: () => t('inquiries.statusClosed'),
    Rejected: () => t('inquiries.statusRejected'),
    Completed: () => t('inquiries.statusCompleted'),
    'Not Paid': () => t('inquiries.statusNotPaid'),
  };
  return `<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}">${(label[status] || (() => status))()}</span>`;
}

// ── Empty State SVG ──────────────────────────────────────────────────────────

function emptyStateSvg(): string {
  return `<svg width="140" height="120" viewBox="0 0 140 120" fill="none">
    <rect x="20" y="30" width="80" height="60" rx="4" fill="#FFECD2"/>
    <path d="M20 38c0-4.4 3.6-8 8-8h20l8 8h36c4.4 0 8 3.6 8 8v44c0 4.4-3.6 8-8 8H28c-4.4 0-8-3.6-8-8V38z" fill="#FFD8A8" stroke="#F7A84B" stroke-width="1"/>
    <rect x="30" y="50" width="60" height="4" rx="2" fill="#F7A84B" opacity="0.3"/>
    <rect x="30" y="60" width="45" height="4" rx="2" fill="#F7A84B" opacity="0.3"/>
    <rect x="30" y="70" width="50" height="4" rx="2" fill="#F7A84B" opacity="0.3"/>
    <circle cx="110" cy="50" r="8" fill="#FFD8A8"/>
    <rect x="104" y="60" width="12" height="20" rx="4" fill="#F7A84B" opacity="0.6"/>
    <rect x="101" y="62" width="6" height="14" rx="3" fill="#F7A84B" opacity="0.4"/>
    <rect x="113" y="62" width="6" height="14" rx="3" fill="#F7A84B" opacity="0.4"/>
    <rect x="104" y="80" width="5" height="12" rx="2" fill="#F7A84B" opacity="0.5"/>
    <rect x="111" y="80" width="5" height="12" rx="2" fill="#F7A84B" opacity="0.5"/>
  </svg>`;
}

// ── Inquiry List Render ──────────────────────────────────────────────────────

function renderInquiryList(inquiries: MockInquiry[]): string {
  if (!inquiries.length) {
    return `<div class="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div class="w-[140px] h-[120px]">${emptyStateSvg()}</div>
      <p class="text-sm text-gray-500">${t('inquiries.emptyState')}</p>
    </div>`;
  }

  return `
    <!-- Table Header -->
    <div class="hidden sm:grid grid-cols-[1fr_1fr_auto] items-center px-5 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
      <span>${t('inquiries.inquiry')}</span>
      <span>${t('inquiries.sendTo')}</span>
      <span>${t('inquiries.action')}</span>
    </div>
    <!-- Rows -->
    ${inquiries.map(inq => `
      <div class="inq-row sm:grid sm:grid-cols-[1fr_1fr_auto] sm:items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer" data-inquiry-id="${inq.id}">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span>${inq.date}</span>
            <span class="text-gray-300 max-sm:hidden">|</span>
            <span>ID: ${inq.id}</span>
          </div>
          <p class="mt-1 text-sm text-gray-700 line-clamp-2">${inq.message}</p>
        </div>
        <div class="flex items-center gap-3 mt-2 sm:mt-0">
          ${avatarPlaceholder(inq.sellerName)}
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">${inq.sellerName}</p>
            <p class="text-xs text-gray-400 truncate">${inq.sellerCompany}</p>
          </div>
        </div>
        <button class="inq-detail-btn text-sm text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap mt-2 sm:mt-0" data-inquiry-id="${inq.id}">${t('inquiries.viewDetail')}</button>
      </div>
    `).join('')}
  `;
}

// ── RFQ List Render ──────────────────────────────────────────────────────────

function renderRfqList(rfqs: MockRFQ[]): string {
  if (!rfqs.length) {
    return `<div class="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div class="w-[140px] h-[120px]">${emptyStateSvg()}</div>
      <p class="text-sm text-gray-500">${t('inquiries.emptyRfqState')}</p>
    </div>`;
  }

  return `
    <!-- Table Header -->
    <div class="hidden sm:grid grid-cols-[1fr_1fr_auto] items-center px-5 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
      <span>RFQ</span>
      <span>${t('inquiries.quotationFrom')}</span>
      <span>${t('inquiries.status')}</span>
    </div>
    <!-- Rows -->
    ${rfqs.map(rfq => `
      <div class="sm:grid sm:grid-cols-[1fr_1fr_auto] sm:items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
        <div>
          <p class="text-sm text-gray-700">${rfq.title}</p>
          <p class="text-xs text-gray-400 mt-0.5">${rfq.date}</p>
        </div>
        <div class="flex items-center gap-3 mt-2 sm:mt-0">
          ${rfq.quotationFrom ? `
            ${avatarPlaceholder(rfq.quotationFrom)}
            <p class="text-sm text-gray-700 truncate">${rfq.quotationFrom}</p>
          ` : '<span class="text-xs text-gray-300">—</span>'}
        </div>
        <div>${statusBadge(rfq.status)}</div>
      </div>
    `).join('')}
  `;
}

// ── Inquiry Detail Panel ─────────────────────────────────────────────────────

function renderDetailPanel(inq: MockInquiry): string {
  return `
    <div class="border-l border-gray-200 bg-white h-full">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 class="text-base font-semibold text-gray-800">${t('inquiries.inquiryDetails')}</h3>
        <button id="inq-detail-close" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="px-5 py-4">
        <!-- Seller info -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400">To:</span>
            ${avatarPlaceholder(inq.sellerName)}
            <div>
              <p class="text-sm font-medium text-gray-800">${inq.sellerName}</p>
              <p class="text-xs text-gray-400">${inq.sellerCompany}</p>
            </div>
          </div>
          <a href="#" class="inline-flex items-center px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors">${t('inquiries.contactNow')}</a>
        </div>
        <!-- Meta -->
        <div class="flex items-center justify-between text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
          <span>ID: ${inq.id}</span>
          <span>${inq.date}</span>
        </div>
        <!-- Message -->
        <p class="text-sm text-gray-700 leading-relaxed">${inq.message}</p>
      </div>
    </div>
  `;
}

// ── Filter Dropdown Render ───────────────────────────────────────────────────

function renderFilterDropdown(type: 'inquiry' | 'rfq'): string {
  if (type === 'inquiry') {
    return `
      <div class="inq-filter-dropdown hidden absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
        <button class="inq-filter-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-filter="all">${t('inquiries.allInquiries')}</button>
        <button class="inq-filter-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-filter="trash">${t('inquiries.trash')}</button>
        <div class="border-t border-gray-100 my-1"></div>
        <div class="px-4 py-2 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">${t('inquiries.myFolders')}</span>
          <button class="text-gray-400 hover:text-gray-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg></button>
        </div>
        <button class="inq-filter-option w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50" data-filter="ungroup">${t('inquiries.ungroup')}</button>
      </div>`;
  }
  return `
    <div class="rfq-filter-dropdown hidden absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
      <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="all">${t('inquiries.allStatus')}</button>
      <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Closed">${t('inquiries.statusClosed')}</button>
      <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Not Paid">${t('inquiries.statusNotPaid')}</button>
      <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-gray-50" data-status="Approved">${t('inquiries.statusApproved')}</button>
      <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Completed">${t('inquiries.statusCompleted')}</button>
      <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Rejected">${t('inquiries.statusRejected')}</button>
      <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Pending">${t('inquiries.statusPending')}</button>
    </div>`;
}

// ── Action Bar (different per tab) ───────────────────────────────────────────

function renderInquiryActionBar(): string {
  return `
    <div class="flex items-center justify-between px-5 max-md:px-3 py-3 border-b border-gray-100 gap-3 flex-wrap" id="inq-action-bar">
      <div class="flex items-center gap-2">
        <div class="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] text-gray-500 border border-gray-300 rounded cursor-pointer bg-white hover:border-gray-400">
          <span>${t('inquiries.moveTo')}</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </div>
        <button class="px-4 py-1.5 text-[13px] text-gray-700 border border-gray-700 rounded bg-transparent hover:bg-gray-50">${t('inquiries.deleteBtn')}</button>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <label class="inline-flex items-center gap-1.5 text-[13px] text-gray-500 cursor-pointer">
          <input type="checkbox" class="w-3.5 h-3.5 accent-amber-500" />
          <span>${t('inquiries.newReply')}</span>
        </label>
        <div class="relative">
          <button id="inq-filter-toggle" class="inline-flex items-center gap-1 px-3.5 py-1.5 text-[13px] text-gray-800 border border-gray-300 rounded-full bg-white hover:border-gray-400">
            <span id="inq-filter-label">${t('inquiries.allInquiries')}</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          ${renderFilterDropdown('inquiry')}
        </div>
        <div class="inline-flex items-center border border-gray-300 rounded overflow-hidden">
          <input type="text" placeholder="${t('inquiries.searchPlaceholder')}" class="w-40 max-md:w-20 h-8 px-2.5 text-[13px] text-gray-700 border-none outline-none bg-white placeholder:text-gray-400 focus:shadow-[inset_0_0_0_1px_#ca8a04]" />
          <button class="flex items-center justify-center w-8 h-8 border-l border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

function renderRfqActionBar(): string {
  return `
    <div class="flex items-center justify-between px-5 max-md:px-3 py-3 border-b border-gray-100 gap-3 flex-wrap" id="rfq-action-bar">
      <a href="/pages/dashboard/rfq.html" class="inline-flex items-center px-5 py-2 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm">${t('inquiries.postRfq')}</a>
      <div class="flex items-center gap-3 flex-wrap">
        <label class="inline-flex items-center gap-1.5 text-[13px] text-gray-500 cursor-pointer">
          <input type="checkbox" class="w-3.5 h-3.5 accent-amber-500" />
          <span>${t('inquiries.newQuotation')}</span>
        </label>
        <div class="relative">
          <button id="rfq-filter-toggle" class="inline-flex items-center gap-1 px-3.5 py-1.5 text-[13px] text-gray-800 border border-gray-300 rounded bg-white hover:border-gray-400">
            <span id="rfq-filter-label">${t('inquiries.allStatus')}</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          ${renderFilterDropdown('rfq')}
        </div>
      </div>
    </div>`;
}

// ── Main Layout ──────────────────────────────────────────────────────────────

export function InquiriesLayout(): string {
  const inquiries = getMockInquiries();
  const rfqs = getMockRFQs();

  return `
    <div class="bg-white rounded-lg min-h-[calc(100vh-80px)] flex flex-col">
      <!-- Tabs -->
      <div class="flex border-b border-gray-200 overflow-x-auto">
        <button class="inq-tabs__tab inq-tabs__tab--active px-6 py-3.5 text-[13px] font-semibold text-gray-800 bg-transparent border-none border-b-2 border-gray-800 cursor-pointer transition-[color,border-color] duration-150 whitespace-nowrap" data-tab="inquiries">
          ${t('inquiries.myInquiries')}
        </button>
        <button class="inq-tabs__tab px-6 py-3.5 text-[13px] font-normal text-gray-500 bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-[color,border-color] duration-150 whitespace-nowrap hover:text-gray-700" data-tab="rfq">
          ${t('inquiries.rfqRequests')}
        </button>
      </div>

      <!-- Inquiry Action Bar (default visible) -->
      <div id="tab-inquiry-bar">${renderInquiryActionBar()}</div>
      <!-- RFQ Action Bar (hidden by default) -->
      <div id="tab-rfq-bar" class="hidden">${renderRfqActionBar()}</div>

      <!-- Content Area (with optional detail panel) -->
      <div class="flex flex-1 min-h-[400px]">
        <!-- List -->
        <div class="flex-1 min-w-0" id="inq-list-area">
          <div id="tab-inquiry-content">${renderInquiryList(inquiries)}</div>
          <div id="tab-rfq-content" class="hidden">${renderRfqList(rfqs)}</div>
        </div>
        <!-- Detail Panel (hidden by default) -->
        <div id="inq-detail-panel" class="hidden w-[380px] max-lg:w-[320px] max-sm:absolute max-sm:right-0 max-sm:top-0 max-sm:h-full max-sm:w-full max-sm:z-50 shrink-0"></div>
      </div>
    </div>
  `;
}

// ── Init (Tab switching, detail panel, filter dropdowns) ─────────────────────

export function initInquiriesLayout(): void {
  const inquiries = getMockInquiries();

  // ── Tab switching ──
  const tabs = document.querySelectorAll<HTMLButtonElement>('.inq-tabs__tab');
  const inquiryBar = document.getElementById('tab-inquiry-bar');
  const rfqBar = document.getElementById('tab-rfq-bar');
  const inquiryContent = document.getElementById('tab-inquiry-content');
  const rfqContent = document.getElementById('tab-rfq-content');
  const detailPanel = document.getElementById('inq-detail-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      tabs.forEach(t => {
        t.classList.remove('inq-tabs__tab--active', 'font-semibold', 'text-gray-800', 'border-gray-800');
        t.classList.add('font-normal', 'text-gray-500', 'border-transparent');
      });
      tab.classList.add('inq-tabs__tab--active', 'font-semibold', 'text-gray-800', 'border-gray-800');
      tab.classList.remove('font-normal', 'text-gray-500', 'border-transparent');

      if (tabId === 'inquiries') {
        inquiryBar?.classList.remove('hidden');
        rfqBar?.classList.add('hidden');
        inquiryContent?.classList.remove('hidden');
        rfqContent?.classList.add('hidden');
      } else {
        inquiryBar?.classList.add('hidden');
        rfqBar?.classList.remove('hidden');
        inquiryContent?.classList.add('hidden');
        rfqContent?.classList.remove('hidden');
        detailPanel?.classList.add('hidden');
      }
    });
  });

  // ── Inquiry detail slide-out ──
  document.querySelectorAll<HTMLButtonElement>('.inq-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.inquiryId;
      const inq = inquiries.find(i => i.id === id);
      if (!inq || !detailPanel) return;
      detailPanel.innerHTML = renderDetailPanel(inq);
      detailPanel.classList.remove('hidden');

      document.getElementById('inq-detail-close')?.addEventListener('click', () => {
        detailPanel.classList.add('hidden');
      });
    });
  });

  // Row click also opens detail
  document.querySelectorAll<HTMLDivElement>('.inq-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.inquiryId;
      const btn = row.querySelector<HTMLButtonElement>('.inq-detail-btn');
      if (btn) btn.click();
    });
  });

  // ── Filter dropdowns ──
  setupDropdown('inq-filter-toggle', '.inq-filter-dropdown', '.inq-filter-option', 'inq-filter-label');
  setupDropdown('rfq-filter-toggle', '.rfq-filter-dropdown', '.rfq-status-option', 'rfq-filter-label');
}

function setupDropdown(toggleId: string, dropdownSel: string, optionSel: string, labelId: string): void {
  const toggle = document.getElementById(toggleId);
  const dropdown = document.querySelector<HTMLDivElement>(dropdownSel);
  const label = document.getElementById(labelId);
  if (!toggle || !dropdown) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  dropdown.querySelectorAll<HTMLButtonElement>(optionSel).forEach(opt => {
    opt.addEventListener('click', () => {
      if (label) label.textContent = opt.textContent?.trim() || '';
      dropdown.classList.add('hidden');
    });
  });

  document.addEventListener('click', () => dropdown.classList.add('hidden'));
}
