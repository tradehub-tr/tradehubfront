/**
 * RFQ Form Page (Step 2) — Alibaba-style detailed RFQ form
 * Product name, detailed requirements, file upload, sourcing quantity + unit,
 * consent checkboxes, "Post request" button. Right sidebar with "How to use RFQ".
 */

import '../style.css'
import { t, getCurrentLang } from '../i18n'
import trLocale from '../i18n/locales/tr'
import enLocale from '../i18n/locales/en'
import { showToast } from '../utils/toast'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'
import { requireAuth } from '../utils/auth-guard'

import { TopBar, SubHeader, initMobileDrawer, initStickyHeaderSearch, MegaMenu, initMegaMenu } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { UOM_OPTIONS } from '../data/inquiries-mock-data' // fallback
import aiGifUrl from '../assets/images/O1CN01c52zHR1b2SGRtmBlT_!!6000000003407-1-tps-300-300.gif'
import { FILE_UPLOAD_CONFIG } from '../types/rfq'
import { getCsrfToken } from '../utils/api'
import { getListingDetail } from '../services/listingService'

await requireAuth();

// Read details from URL params (passed from rfq.html step 1 or product card)
const params = new URLSearchParams(window.location.search);
const prefillDetails = params.get('details') || '';
const prefillProductName = params.get('productName') || '';
const prefillProductId = params.get('productId') || '';

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
              <div class="relative">
                <label class="block text-sm font-semibold text-gray-800 mb-2"><span class="text-red-500 mr-0.5">*</span>${t('rfq.productName')}</label>
                <input type="text" id="rfq-product-name" autocomplete="off" placeholder="${t('rfq.productNamePlaceholder')}" class="w-full max-w-full h-10 px-3 text-sm border border-gray-300 rounded bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-800 transition-colors" />
                <div id="rfq-category-result" class="hidden mt-1 text-sm text-gray-500">
                  <span class="text-gray-400">Product category:</span>
                  <a href="#" id="rfq-category-link" class="text-gray-700 underline ml-1"></a>
                </div>
                <input type="hidden" id="rfq-category" value="" />
                <div id="rfq-category-dropdown" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"></div>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2"><span class="text-red-500 mr-0.5">*</span>${t('rfq.detailedRequirements')}</label>
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                  <div class="px-3 py-2 border-b border-gray-100">
                    <span class="inline-flex items-center gap-1.5 text-sm text-blue-600">
                      <img src="${aiGifUrl}" alt="AI" class="h-5 w-5 shrink-0 object-contain" />
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
                <input type="file" id="rfq-file-input" class="hidden" multiple accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
                <div id="rfq-file-list" class="mt-2 space-y-1"></div>
              </div>
              <!-- Sourcing Quantity (inside outer card) -->
              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2"><span class="text-red-500 mr-0.5">*</span>${t('rfq.sourcingQuantity')}</label>
                <div class="flex gap-3 max-sm:flex-col">
                  <input type="number" id="rfq-quantity" min="1" placeholder="${t('rfq.quantityPlaceholder')}" class="flex-1 min-w-0 h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-800 transition-colors" />
                  <select id="rfq-unit" class="w-44 max-sm:w-full min-w-0 h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 outline-none focus:border-gray-800 cursor-pointer transition-colors">
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
            <input type="checkbox" id="rfq-share-card" class="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />
            <span class="text-sm text-gray-600">${t('rfq.agreeShareCard').replace(t('rfq.businessCard'), `<a href="#" class="text-blue-600 underline hover:text-blue-800">${t('rfq.businessCard')}</a>`)}</span>
          </label>
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" id="rfq-agree-rules" class="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />
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

// ── Load UOM from backend with i18n labels ──
const PRIORITY_UOMS = ['Nos','Unit','Box','Pair','Kg','Gram','Metre','Meter','Set','Ton','Tonne','Bag','Roll','Pack','Dozen','Litre','Pallet','Carton','Bundle','Sheet','Ream','Piece'];

const unitSelect = document.getElementById('rfq-unit') as HTMLSelectElement;
fetch(((window as any).API_BASE || '/api') + '/method/tradehub_core.api.rfq.get_uom_list', { credentials: 'include' })
  .then(r => r.json())
  .then(d => {
    const uoms: string[] = d.message || [];
    if (uoms.length) {
      const locale = getCurrentLang() === 'tr' ? trLocale : enLocale;
      const uomTranslations = ((locale as any).translation?.rfq?.uom || {}) as Record<string, string>;
      const priority = PRIORITY_UOMS.filter(u => uoms.includes(u));
      const rest = uoms.filter(u => !PRIORITY_UOMS.includes(u));
      const sorted = [...priority, ...rest];
      unitSelect.innerHTML = sorted.map(u => {
        const label = uomTranslations[u] || u;
        return `<option value="${u}" ${u === 'Nos' ? 'selected' : ''}>${label}</option>`;
      }).join('');
    }
  })
  .catch(() => { /* fallback: static options already in HTML */ });

// ── Category autocomplete ──
const productNameInput = document.getElementById('rfq-product-name') as HTMLInputElement;
const categoryDropdown = document.getElementById('rfq-category-dropdown') as HTMLDivElement;
const categoryResult = document.getElementById('rfq-category-result') as HTMLDivElement;
const categoryLink = document.getElementById('rfq-category-link') as HTMLAnchorElement;
const categoryHidden = document.getElementById('rfq-category') as HTMLInputElement;
let searchTimeout: ReturnType<typeof setTimeout>;

productNameInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = productNameInput.value.trim();
  if (q.length < 2) { categoryDropdown.classList.add('hidden'); return; }
  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/method/tradehub_core.api.rfq.search_categories?query=${encodeURIComponent(q)}`, { credentials: 'include' });
      const d = await res.json();
      const cats = d.message || [];
      if (cats.length) {
        categoryDropdown.innerHTML = '';
        cats.forEach((c: any) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'rfq-cat-option w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors';
          btn.dataset.name = c.name;
          btn.dataset.path = c.path;
          btn.textContent = c.path;
          btn.addEventListener('click', () => {
            categoryHidden.value = c.name || '';
            categoryLink.textContent = c.path || '';
            categoryResult.classList.remove('hidden');
            categoryDropdown.classList.add('hidden');
          });
          categoryDropdown.appendChild(btn);
        });
        categoryDropdown.classList.remove('hidden');
      } else {
        categoryDropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">No matching category found.</div>';
        categoryDropdown.classList.remove('hidden');
      }
    } catch { categoryDropdown.classList.add('hidden'); }
  }, 300);
});

document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('#rfq-product-name') && !(e.target as HTMLElement).closest('#rfq-category-dropdown')) {
    categoryDropdown.classList.add('hidden');
  }
});

// ── File upload ──
const uploadArea = document.getElementById('rfq-upload-area')!;
const fileInput = document.getElementById('rfq-file-input') as HTMLInputElement;
const fileList = document.getElementById('rfq-file-list')!;
let selectedFiles: File[] = [];

uploadArea.addEventListener('click', () => fileInput.click());

function isAllowedFile(file: File): boolean {
  const ext = ('.' + file.name.split('.').pop()!.toLowerCase());
  if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(ext as any)) {
    showToast({ message: t('rfq.unsupportedFormat', { fileName: file.name }), type: 'error' });
    return false;
  }
  return true;
}

function addFiles(files: FileList | File[]) {
  for (const f of Array.from(files)) {
    if (selectedFiles.length >= FILE_UPLOAD_CONFIG.maxFiles) {
      showToast({ message: t('rfq.maxFilesAlert'), type: 'warning' });
      break;
    }
    if (!isAllowedFile(f)) continue;
    selectedFiles.push(f);
  }
  renderFileList();
}

fileInput.addEventListener('change', () => {
  if (!fileInput.files) return;
  addFiles(fileInput.files);
  fileInput.value = '';
});

// Drag-and-drop on upload area
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('border-amber-400', 'bg-amber-50');
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('border-amber-400', 'bg-amber-50');
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('border-amber-400', 'bg-amber-50');
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
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

// ── Load files from IndexedDB (transferred from rfq.html) ──
if (params.get('hasFiles') === '1') {
  try {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const req = indexedDB.open('rfq_files', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const allKeys = await new Promise<IDBValidKey[]>((resolve) => {
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result);
    });
    for (const key of allKeys) {
      const file: File = await new Promise((resolve) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
      });
      if (file && file instanceof File && isAllowedFile(file)) {
        selectedFiles.push(file);
      }
    }
    db.close();
    // Clear stored files
    indexedDB.deleteDatabase('rfq_files');
    if (selectedFiles.length) renderFileList();
  } catch { /* ignore — files are optional */ }
}

// ── Pre-fill from product card (productId / productName) ──
if (prefillProductName) {
  productNameInput.value = decodeURIComponent(prefillProductName);
}

if (prefillProductId) {
  getListingDetail(prefillProductId).then(product => {
    // Pre-fill product name if not already set
    if (!productNameInput.value && product.title) {
      productNameInput.value = product.title;
    }

    // Pre-fill category from product data
    const catId = product.productCategoryId;
    if (catId) {
      categoryHidden.value = catId;
      const pathText = Array.isArray(product.category)
        ? product.category.map((c: any) => typeof c === 'string' ? c : c.name || '').join(' >> ')
        : '';
      if (pathText) {
        categoryLink.textContent = pathText;
        categoryResult.classList.remove('hidden');
      }
    }

    // Pre-fill requirements from specs and description
    const requirementsEl = document.getElementById('rfq-requirements') as HTMLTextAreaElement;
    if (!requirementsEl.value.trim()) {
      const lines: string[] = [];
      lines.push(t('rfq.prefillLookingFor', { product: product.title }));
      if (product.specs && product.specs.length > 0) {
        lines.push(t('rfq.prefillSpecs'));
        for (const spec of product.specs) {
          lines.push(`· ${spec.key}: ${spec.value}`);
        }
      }
      requirementsEl.value = lines.join('\n');
    }

    // Pre-fill product image as file attachment
    if (product.images && product.images.length > 0) {
      const imgSrc = product.images[0].src;
      if (imgSrc) {
        fetch(imgSrc, { credentials: 'include' })
          .then(r => r.blob())
          .then(blob => {
            const fileName = imgSrc.split('/').pop() || 'product-image.jpg';
            const file = new File([blob], fileName, { type: blob.type });
            addFiles([file]);
          })
          .catch(() => { /* image fetch failed, skip */ });
      }
    }
  }).catch(err => {
    console.warn('[RFQ Form] Failed to load product details:', err);
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

  const agreeRules = (document.getElementById('rfq-agree-rules') as HTMLInputElement)?.checked;
  if (!agreeRules) {
    showToast({ message: t('rfq.agreePostingRules'), type: 'warning' });
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  submitBtn.disabled = true;
  submitBtn.textContent = '...';

  async function submitRfq() {
    // 1. Create RFQ
    const res = await fetch(((window as any).API_BASE || '/api') + '/method/tradehub_core.api.rfq.create_rfq', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': getCsrfToken() },
      body: JSON.stringify({
        product_name: productName,
        description: requirements,
        quantity: Number(quantity),
        unit,
        category: categoryHidden?.value || '',
        share_business_card: (document.getElementById('rfq-share-card') as HTMLInputElement)?.checked ? 1 : 0,
        ai_enabled: 0,
      }),
    });
    const data = await res.json();
    if (!data.message?.success) {
      throw new Error(data.exception || 'RFQ oluşturulamadı');
    }
    const rfqId = data.message.rfq_id;

    // 2. Upload files and attach to RFQ child table
    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doctype', 'RFQ');
      fd.append('docname', rfqId);
      fd.append('is_private', '0');
      const uploadRes = await fetch(((window as any).API_BASE || '/api') + '/method/upload_file', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData?.message?.file_url;
      if (fileUrl) {
        await fetch(((window as any).API_BASE || '/api') + '/method/tradehub_core.api.rfq.add_rfq_attachment', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': getCsrfToken() },
          body: JSON.stringify({ rfq_id: rfqId, file_url: fileUrl, file_name: file.name }),
        });
      }
    }

    return rfqId;
  }

  submitRfq()
    .then(() => {
      sessionStorage.setItem('rfq_submitted', '1');
      window.location.href = '/pages/dashboard/rfq-success.html';
    })
    .catch((err) => {
      showToast({ message: err.message || 'Sunucu hatası', type: 'error' });
      submitBtn.disabled = false;
      submitBtn.textContent = t('rfq.postRequest');
    });
});
