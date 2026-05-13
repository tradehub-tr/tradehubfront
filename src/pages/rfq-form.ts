/**
 * RFQ Form Page (Step 2) — iSTOC-style detailed RFQ form
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
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { getFileBadge, getFilePreviewUrl, revokeFilePreview, openFilePreviewLightbox } from '../components/rfq/attachments'
import { renderDropzone, bindDropzone } from '../components/rfq/dropzone'
import { getCsrfToken, checkEmailNotVerifiedResponse, isEmailNotVerifiedError } from '../utils/api'
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
          <span class="inline-flex items-center justify-center w-7 h-7 rounded bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a) text-xs font-bold">RFQ</span>
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
        <div class="max-w-5xl mx-auto border border-gray-200 rounded-md bg-white p-3 sm:p-6 lg:p-8">
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
                  <textarea id="rfq-requirements" rows="14" placeholder="${t('rfq.detailedReqPlaceholder')}" class="w-full px-3 py-3 text-sm text-gray-800 placeholder:text-gray-400 border-none outline-none resize-none focus:ring-0">${prefillDetails}</textarea>
                </div>
              </div>
              <!-- File Upload — Dropzone (inside outer card) -->
              <div>
                ${renderDropzone({ id: 'rfq-upload-area', inputId: 'rfq-file-input' })}
                <div id="rfq-file-list" class="mt-3 space-y-2"></div>
              </div>
              <!-- Sourcing Quantity (inside outer card) -->
              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2"><span class="text-red-500 mr-0.5">*</span>${t('rfq.sourcingQuantity')}</label>
                <div class="flex gap-3 max-sm:flex-col">
                  <input type="number" id="rfq-quantity" min="1" placeholder="${t('rfq.quantityPlaceholder')}" class="flex-1 min-w-0 h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-800 transition-colors" />
                  <select id="rfq-unit" disabled class="w-44 max-sm:w-full min-w-0 h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 outline-none focus:border-gray-800 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait">
                    <option value="">${t('rfq.unitLoading')}</option>
                  </select>
                </div>
              </div>
            </div>
            <!-- Right: sidebar with its own inner bordered card -->
            <div class="w-[300px] max-sm:hidden max-lg:w-full shrink-0 max-lg:shrink">
              <div class="border border-gray-100 rounded-lg bg-[#f5f5f5] px-7 py-6">
                <h3 class="flex items-center gap-2 text-base font-bold text-gray-800 mb-5">
                  <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a) text-[10px] font-bold">RFQ</span>
                  ${t('rfq.howToUseRfq')}
                </h3>
                <div class="space-y-5">
                  <div class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-full bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a) text-sm font-bold shrink-0">1</span><div><p class="text-sm font-semibold text-gray-800">${t('rfq.step1Title')}</p><p class="text-xs text-gray-500 mt-0.5">${t('rfq.step1Desc')}</p></div></div>
                  <div class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-full bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a) text-sm font-bold shrink-0">2</span><div><p class="text-sm font-semibold text-gray-800">${t('rfq.step2Title')}</p><p class="text-xs text-gray-500 mt-0.5">${t('rfq.step2Desc')}</p></div></div>
                  <div class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-full bg-(--btn-bg,#f5b800) text-(--btn-text,#1a1a1a) text-sm font-bold shrink-0">3</span><div><p class="text-sm font-semibold text-gray-800">${t('rfq.step3Title')}</p><p class="text-xs text-gray-500 mt-0.5">${t('rfq.step3Desc')}</p></div></div>
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

        <!-- Submit (sticky bottom iSTOC-style) -->
        <div class="sticky bottom-0 z-10 mt-5 py-3 flex justify-center bg-white/90 backdrop-blur-sm">
          <button type="submit" class="px-16 h-11 rounded-full bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-sm font-semibold border border-(--btn-border-color,#d39c00) shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-150">
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
mountChatPopup();
initChatTriggers();
startAlpine();

// ── Load UOM from backend ──
// UOM kayıtları Türkçeleştirildiği için (bkz. tradehub_core/patches/localize_uom_tr.py)
// çeviri katmanı yok, name doğrudan kullanılır.
type UomOption = { name: string };

const PRIORITY_UOMS = ['Adet', 'Birim', 'Kutu', 'Çift', 'Kg', 'Gram', 'Metre', 'Set', 'Ton', 'Litre'];

const unitSelect = document.getElementById('rfq-unit') as HTMLSelectElement;
fetch(((window as any).API_BASE || '/api') + '/method/tradehub_core.api.rfq.get_uom_list', { credentials: 'include' })
  .then(r => r.json())
  .then(d => {
    const uoms: UomOption[] = d.message || [];
    if (!uoms.length) {
      unitSelect.innerHTML = `<option value="">${t('rfq.unitLoadFailed')}</option>`;
      return;
    }
    const byName = new Map(uoms.map(u => [u.name, u]));
    const priority = PRIORITY_UOMS.map(n => byName.get(n)).filter((u): u is UomOption => !!u);
    const prioritySet = new Set(priority.map(u => u.name));
    const rest = uoms.filter(u => !prioritySet.has(u.name));
    const sorted = [...priority, ...rest];
    unitSelect.innerHTML = sorted.map(u =>
      `<option value="${u.name}" ${u.name === 'Adet' ? 'selected' : ''}>${u.name}</option>`
    ).join('');
    unitSelect.disabled = false;
  })
  .catch(() => {
    unitSelect.innerHTML = `<option value="">${t('rfq.unitLoadFailed')}</option>`;
  });

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
            const current = productNameInput.value.trim();
            const catName = (c.category_name || '') as string;
            // Akıllı doldurma: input boş veya kategori adının prefix'i ise tam ada genişlet
            if (catName && (!current || catName.toLowerCase().startsWith(current.toLowerCase()))) {
              productNameInput.value = catName + ' ';
              productNameInput.focus();
              productNameInput.setSelectionRange(productNameInput.value.length, productNameInput.value.length);
            }
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

// ── File upload — Dropzone ──
const fileList = document.getElementById('rfq-file-list')!;
const selectedFiles: File[] = [];

function addFiles(files: File[]) {
  selectedFiles.push(...files);
  renderFileList();
}

bindDropzone(
  { id: 'rfq-upload-area', inputId: 'rfq-file-input' },
  {
    getCurrentFiles: () => selectedFiles,
    onAdd: addFiles,
  },
);

function renderFileList() {
  fileList.innerHTML = selectedFiles.map((f, i) => {
    const isImage = f.type?.startsWith('image/');
    const badge = getFileBadge(f.name);
    const previewUrl = isImage ? getFilePreviewUrl(f) : '';
    const thumb = isImage
      ? `<img src="${previewUrl}" alt="" class="rfq-thumb-preview w-12 h-12 object-cover rounded cursor-zoom-in border border-gray-200" data-file-idx="${i}" />`
      : `<div class="w-12 h-12 rounded ${badge.cls} text-white text-[10px] font-bold flex items-center justify-center shrink-0">${badge.label}</div>`;
    return `
      <div class="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded">
        ${thumb}
        <span class="flex-1 text-sm text-gray-700 truncate" title="${f.name}">${f.name}</span>
        <button type="button" data-remove="${i}" class="rfq-remove-file text-red-400 hover:text-red-600 px-2 text-lg leading-none">&times;</button>
      </div>
    `;
  }).join('');

  fileList.querySelectorAll<HTMLImageElement>('.rfq-thumb-preview').forEach(img => {
    img.addEventListener('click', () => {
      const idx = Number(img.dataset.fileIdx);
      const file = selectedFiles[idx];
      if (file) openFilePreviewLightbox(file, 'rfq-form-preview');
    });
  });

  fileList.querySelectorAll('.rfq-remove-file').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number((btn as HTMLElement).dataset.remove);
      const file = selectedFiles[idx];
      if (file) revokeFilePreview(file);
      selectedFiles.splice(idx, 1);
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
      if (file && file instanceof File) {
        // Already validated in Step 1 — accept as-is
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
  if (productName.length < 2) {
    showToast({ message: t('rfq.productNameTooShort'), type: 'warning' });
    return;
  }
  if (!categoryHidden?.value) {
    showToast({ message: t('rfq.categoryRequired'), type: 'warning' });
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
  if (!unit) {
    showToast({ message: t('rfq.unitNotReady'), type: 'warning' });
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
    // EMAIL_NOT_VERIFIED gating'ini early-throw ile yakala (api wrapper'la
    // aynı davranış). Toast api tarafında gösterilir, raw exception caller'a
    // ulaşmaz.
    await checkEmailNotVerifiedResponse(res);
    const data = await res.json();
    if (!data.message?.success) {
      throw new Error(data.exception || 'RFQ oluşturulamadı');
    }
    const rfqId = data.message.rfq_id;

    // 2. Upload files as private RFQ attachments. Frappe records the
    //    parent link (attached_to_doctype=RFQ) automatically — no separate
    //    child-table call needed. Access is gated by RFQ.has_permission.
    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doctype', 'RFQ');
      fd.append('docname', rfqId);
      fd.append('is_private', '1');
      await fetch(((window as any).API_BASE || '/api') + '/method/upload_file', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
    }

    return rfqId;
  }

  submitRfq()
    .then(() => {
      sessionStorage.setItem('rfq_submitted', '1');
      window.location.href = '/pages/dashboard/rfq-success.html';
    })
    .catch((err) => {
      submitBtn.disabled = false;
      submitBtn.textContent = t('rfq.postRequest');
      if (isEmailNotVerifiedError(err)) return; // toast api.ts'te gösterildi
      showToast({ message: err.message || 'Sunucu hatası', type: 'error' });
    });
});
