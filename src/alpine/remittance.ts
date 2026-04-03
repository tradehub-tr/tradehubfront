import Alpine from 'alpinejs'
import { callMethod } from '../utils/api'
import { getSelectedCurrencyInfo, convertPrice } from '../services/currencyService'

Alpine.data('remittanceComponent', () => ({
  step: 'iban' as 'iban' | 'upload' | 'form' | 'submitting' | 'success',
  dragging: false,

  // Order & seller bank info
  orderNumber: '',
  orderTotal: 0 as number,
  orderCurrency: 'TRY' as string,
  paymentMethod: '' as string,
  sellerIban: '',
  sellerBankName: '',
  sellerAccountHolder: '',
  sellerName: '',
  loadingBank: false,

  // File state
  file: null as File | null,
  fileName: '',
  fileSize: '',
  filePreviewUrl: '' as string,
  fileType: '' as string,

  // Form data
  form: {
    remittanceDate: '',
    currency: 'USD',
    amount: '',
    bankName: '',
    senderName: '',
  },

  // Validation
  errors: {} as Record<string, string>,
  submitted: false,
  apiError: '',

  // Computed
  get isCheckPayment(): boolean {
    return this.paymentMethod === 'check_promissory';
  },

  get isFormValid(): boolean {
    const f = this.form;
    return !!(f.bankName && f.senderName);
  },

  get hasFile(): boolean {
    return this.file !== null;
  },

  init() {
    // Listen for open event dispatched by "Ödeme Yap" button
    document.addEventListener('remittance:open', async (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const orderNumber = detail.orderNumber || '';
      const orderTotal = typeof detail.orderTotal === 'number' ? detail.orderTotal : parseFloat(detail.orderTotal || '0');
      const orderCurrency = detail.orderCurrency || 'TRY';

      this.orderNumber = orderNumber;
      this.orderTotal = orderTotal;
      this.orderCurrency = orderCurrency;
      this.paymentMethod = detail.paymentMethod || '';
      this.reset(false); // reset state without closing modal

      // Bugünün tarihi ve sipariş tutarını otomatik doldur
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      this.form.remittanceDate = today;
      if (orderTotal > 0) {
        const displayCurrency = getSelectedCurrencyInfo();
        const convertedAmount = convertPrice(orderTotal, orderCurrency || 'USD');
        this.form.currency = displayCurrency.code;
        this.form.amount = convertedAmount.toFixed(2);
      }

      // Open modal
      const modal = document.getElementById('remittance-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
      document.body.style.overflow = 'hidden';

      // Fetch seller bank info then show IBAN step
      this.step = 'iban';
      if (orderNumber) {
        await this.fetchSellerBankInfo(orderNumber);
      }
    });
  },

  async fetchSellerBankInfo(orderNumber: string) {
    this.loadingBank = true;
    try {
      const res = await callMethod<{
        iban: string;
        bank_name: string;
        account_holder: string;
        seller_name: string;
      }>('tradehub_core.api.order.get_seller_bank_info', { order_number: orderNumber });
      this.sellerIban = res.iban || '';
      this.sellerBankName = res.bank_name || '';
      this.sellerAccountHolder = res.account_holder || '';
      this.sellerName = res.seller_name || '';
    } catch {
      this.sellerIban = '';
      this.sellerBankName = '';
      this.sellerAccountHolder = '';
      this.sellerName = '';
    } finally {
      this.loadingBank = false;
    }
  },

  // File handling
  handleFiles(files: FileList) {
    if (!files.length) return;
    const file = files[0];
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

    if (!allowed.includes(file.type)) {
      this.errors = { file: 'Desteklenmeyen dosya formatı' };
      return;
    }
    if (file.size > maxSize) {
      this.errors = { file: 'Dosya boyutu 20MB\'ı aşıyor' };
      return;
    }

    this.file = file;
    this.fileName = file.name;
    this.fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    this.fileType = file.type;
    this.errors = {};

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => { this.filePreviewUrl = e.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.filePreviewUrl = '';
    }
  },

  removeFile() {
    this.file = null;
    this.fileName = '';
    this.fileSize = '';
    this.filePreviewUrl = '';
    this.fileType = '';
    this.step = 'upload';
  },

  goToUpload() {
    this.step = 'upload';
  },

  goToForm() {
    if (!this.file) return;
    this.step = 'form';
  },

  // Validation
  validateField(field: string) {
    const val = (this.form as any)[field];
    if (!val || !String(val).trim()) {
      this.errors[field] = 'required';
    } else {
      delete this.errors[field];
    }
  },

  validateAll(): boolean {
    this.errors = {};
    const required = ['bankName', 'senderName'];
    required.forEach(f => this.validateField(f));
    return Object.keys(this.errors).length === 0;
  },

  // Upload receipt file via custom endpoint (base64) and return file URL
  async uploadReceiptFile(orderNumber: string): Promise<string> {
    if (!this.file) return '';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(',')[1]; // strip data:...;base64,
          const res = await callMethod<{ file_url: string }>(
            'tradehub_core.api.order.upload_receipt',
            { order_number: orderNumber, file_name: this.file!.name, file_data: base64 },
            true,
          );
          resolve(res.file_url || '');
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsDataURL(this.file!);
    });
  },

  // Submit — API integration
  async submitRemittance() {
    this.submitted = true;
    this.apiError = '';
    if (!this.validateAll()) return;

    this.step = 'submitting';

    try {
      const receiptUrl = await this.uploadReceiptFile(this.orderNumber);

      await callMethod<{ success: boolean }>(
        'tradehub_core.api.order.submit_remittance',
        {
          order_number: this.orderNumber,
          remittance_date: this.form.remittanceDate,
          currency: this.form.currency,
          amount: this.form.amount,
          bank_name: this.form.bankName,
          sender_name: this.form.senderName,
          receipt_url: receiptUrl,
        },
        true,
      );

      this.step = 'success';

      // Redirect to thank you page after short delay
      setTimeout(() => {
        this.reset(true);
        window.location.href = `/pages/order/order-success.html?status=success&count=1&orderNumbers=${encodeURIComponent(this.orderNumber)}`;
      }, 1500);
    } catch (err: any) {
      this.apiError = err?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
      this.step = 'form';
    }
  },

  // Reset state (optionally close modal)
  reset(closeModal = true) {
    this.step = 'iban';
    this.file = null;
    this.fileName = '';
    this.fileSize = '';
    this.filePreviewUrl = '';
    this.fileType = '';
    this.form = { remittanceDate: '', currency: 'USD', amount: '', bankName: '', senderName: '' };
    this.errors = {};
    this.submitted = false;
    this.dragging = false;
    this.apiError = '';

    if (closeModal) {
      this.orderNumber = '';
      this.orderTotal = 0;
      this.orderCurrency = 'TRY';
      this.paymentMethod = '';
      this.sellerIban = '';
      this.sellerBankName = '';
      this.sellerAccountHolder = '';
      this.sellerName = '';
      const modal = document.getElementById('remittance-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      document.body.style.overflow = '';
    }
  },

  clearForm() {
    this.form = { remittanceDate: '', currency: 'USD', amount: '', bankName: '', senderName: '' };
    this.errors = {};
  },
}));
