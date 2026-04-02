/**
 * RFQ Form Page (Step 2) — Alibaba-style detailed RFQ form
 * Product name, detailed requirements, file upload, sourcing quantity + unit,
 * consent checkboxes, "Post request" button. Right sidebar with "How to use RFQ".
 */

import '../style.css'
import { t } from '../i18n'
import { showToast } from '../utils/toast'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'
import { requireAuth } from '../utils/auth-guard'

import { TopBar, SubHeader, initMobileDrawer, initStickyHeaderSearch, MegaMenu, initMegaMenu } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { UOM_OPTIONS } from '../data/inquiries-mock-data'
import { FILE_UPLOAD_CONFIG } from '../types/rfq'

await requireAuth();

// Read details from URL params (passed from rfq.html step 1)
const params = new URLSearchParams(window.location.search);
const prefillDetails = params.get('details') || '';

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Header -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-(--header-scroll-border) bg-(--header-scroll-bg)">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <!-- Main -->
  <main class="bg-white min-h-screen">
    <!-- Top bar: Request for Quotation | Manage RFQ -->
    <div class="border-b border-gray-200">
      <div class="container-boxed flex items-center gap-4 py-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-500 text-white text-xs font-bold">RFQ</span>
          <span class="text-base font-semibold text-gray-800">${t('rfq.requestQuote')}</span>
        </div>
        <a href="/pages/dashboard/inquiries.html" class="text-sm text-gray-500 hover:text-gray-700">${t('rfq.manageRfq')}</a>
      </div>
    </div>

    <div class="container-boxed py-8">
      <!-- Page Title -->
      <h1 class="text-xl font-bold text-gray-800 mb-6 max-w-5xl mx-auto">${t('rfq.postYourRequest')}</h1>

      <form id="rfq-detail-form" novalidate>
        <!-- OUTER card: everything inside -->
        <div class="max-w-5xl mx-auto border border-gray-200 rounded-xl bg-white p-3 sm:p-6 lg:p-8">
          <div class="flex gap-6 items-start max-lg:flex-col">
            <!-- Left: all form fields -->
            <div class="flex-1 min-w-0 space-y-6 max-w-full">
              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2"><span class="text-red-500 mr-0.5">*</span>${t('rfq.productName')}</label>
                <input type="text" id="rfq-product-name" placeholder="${t('rfq.productNamePlaceholder')}" class="w-full max-w-full h-10 px-3 text-sm border border-gray-300 rounded bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-800 transition-colors" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2"><span class="text-red-500 mr-0.5">*</span>${t('rfq.detailedRequirements')}</label>
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                  <div class="px-3 py-2 border-b border-gray-100">
                    <span class="inline-flex items-center gap-1.5 text-sm text-blue-600">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#3B82F6" opacity="0.2"/><circle cx="10" cy="10" r="4" fill="#3B82F6"/></svg>
                      ${t('rfq.writeWithAi')}
                    </span>
                  </div>
                  <textarea id="rfq-requirements" rows="14" placeholder="${t('rfq.detailedReqPlaceholder')}" class="w-full px-3 py-3 text-sm text-gray-800 placeholder:text-gray-400 border-none outline-none resize-none focus:ring-0">${prefillDetails}</textarea>
                </div>
              </div>
              <!-- File Upload (inside outer card) -->
              <div>
                <div id="rfq-upload-area" class="inline-flex flex-col items-center gap-1.5 px-8 py-5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 transition-colors text-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                  <span class="text-xs text-gray-400 leading-tight">${t('rfq.uploadHint')}</span>
                </div>
                <input type="file" id="rfq-file-input" class="hidden" multiple accept="${FILE_UPLOAD_CONFIG.allowedExtensions.join(',')}" />
                <div id="rfq-file-list" class="mt-2 space-y-1"></div>
              </div>
              <!-- Sourcing Quantity (inside outer card) -->
              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2"><span class="text-red-500 mr-0.5">*</span>${t('rfq.sourcingQuantity')}</label>
                <div class="flex gap-3 max-sm:flex-col">
                  <input type="number" id="rfq-quantity" min="1" placeholder="${t('rfq.quantityPlaceholder')}" class="flex-1 min-w-0 h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-800 transition-colors" />
                  <select id="rfq-unit" class="w-44 max-sm:w-full h-10 px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 outline-none focus:border-gray-800 cursor-pointer transition-colors appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]">
                    ${UOM_OPTIONS.map(u => `<option value="${u}" ${u === 'pieces' ? 'selected' : ''}>${u}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
            <!-- Right: sidebar with its own inner bordered card -->
            <div class="w-[300px] max-sm:hidden max-lg:w-full shrink-0 max-lg:shrink">
              <div class="border border-gray-100 rounded-lg bg-[#f5f5f5] px-7 py-6">
                <h3 class="flex items-center gap-2 text-base font-bold text-gray-800 mb-5">
                  <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-500 text-white text-[10px] font-bold">RFQ</span>
                  ${t('rfq.howToUseRfq')}
                </h3>
                <div class="space-y-5">
                  <div class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold shrink-0">1</span><div><p class="text-sm font-semibold text-gray-800">${t('rfq.step1Title')}</p><p class="text-xs text-gray-500 mt-0.5">${t('rfq.step1Desc')}</p></div></div>
                  <div class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold shrink-0">2</span><div><p class="text-sm font-semibold text-gray-800">${t('rfq.step2Title')}</p><p class="text-xs text-gray-500 mt-0.5">${t('rfq.step2Desc')}</p></div></div>
                  <div class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold shrink-0">3</span><div><p class="text-sm font-semibold text-gray-800">${t('rfq.step3Title')}</p><p class="text-xs text-gray-500 mt-0.5">${t('rfq.step3Desc')}</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Consent -->
        <div class="mt-5 max-w-5xl mx-auto space-y-2.5">
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" id="rfq-share-card" checked class="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />
            <span class="text-sm text-gray-600">${t('rfq.agreeShareCard').replace(t('rfq.businessCard'), `<a href="#" class="text-blue-600 underline hover:text-blue-800">${t('rfq.businessCard')}</a>`)}</span>
          </label>
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" id="rfq-agree-rules" checked class="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />
            <span class="text-sm text-gray-600">${t('rfq.agreePostingRules').replace(t('rfq.postingRules'), `<a href="#" class="text-blue-600 underline hover:text-blue-800">${t('rfq.postingRules')}</a>`)}</span>
          </label>
          <p class="text-xs text-gray-400 pl-6">${t('rfq.createRfqDesc')}</p>
        </div>

        <!-- Submit (sticky bottom like Alibaba) -->
        <div class="sticky bottom-0 z-10 mt-5 py-3 flex justify-center bg-white/90 backdrop-blur-sm">
          <button type="submit" class="px-16 h-11 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm">
            ${t('rfq.postRequest')}
          </button>
        </div>
      </form>
    </div>
  </main>

  <footer>${FooterLinks()}</footer>
`;

// ── Init ──
initMegaMenu();
initFlowbite();
initStickyHeaderSearch();
initMobileDrawer();
initLanguageSelector();
startAlpine();

// ── File upload ──
const uploadArea = document.getElementById('rfq-upload-area')!;
const fileInput = document.getElementById('rfq-file-input') as HTMLInputElement;
const fileList = document.getElementById('rfq-file-list')!;
let selectedFiles: File[] = [];

uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (!fileInput.files) return;
  for (const f of Array.from(fileInput.files)) {
    if (selectedFiles.length >= FILE_UPLOAD_CONFIG.maxFiles) {
      showToast({ message: t('rfq.maxFilesAlert'), type: 'warning' });
      break;
    }
    selectedFiles.push(f);
  }
  renderFileList();
});

function renderFileList() {
  fileList.innerHTML = selectedFiles.map((f, i) => `
    <div class="flex items-center gap-2 text-sm text-gray-600">
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
      <span class="truncate max-w-xs">${f.name}</span>
      <button type="button" data-remove="${i}" class="rfq-remove-file text-red-400 hover:text-red-600 ml-1">&times;</button>
    </div>
  `).join('');
  fileList.querySelectorAll('.rfq-remove-file').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedFiles.splice(Number((btn as HTMLElement).dataset.remove), 1);
      renderFileList();
    });
  });
}

// ── Form submission ──
const form = document.getElementById('rfq-detail-form') as HTMLFormElement;

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const productName = (document.getElementById('rfq-product-name') as HTMLInputElement).value.trim();
  const requirements = (document.getElementById('rfq-requirements') as HTMLTextAreaElement).value.trim();
  const quantity = (document.getElementById('rfq-quantity') as HTMLInputElement).value;
  const unit = (document.getElementById('rfq-unit') as HTMLSelectElement).value;

  if (!productName) {
    showToast({ message: t('rfq.productName') + ' gerekli', type: 'warning' });
    return;
  }
  if (!requirements) {
    showToast({ message: t('rfq.detailedRequirements') + ' gerekli', type: 'warning' });
    return;
  }
  if (!quantity || Number(quantity) <= 0) {
    showToast({ message: t('rfq.sourcingQuantity') + ' gerekli', type: 'warning' });
    return;
  }

  // Mock submission — backend bağlantısı aşama 2'de yapılacak
  console.log('[RFQ Form]', { productName, requirements, quantity, unit, files: selectedFiles.length });
  window.location.href = '/pages/dashboard/rfq-success.html';
});
