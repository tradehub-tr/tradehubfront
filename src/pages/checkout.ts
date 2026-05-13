/**
 * Checkout Page — Entry Point
 * Assembles header, checkout content, and footer.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { t, getCurrentLang } from '../i18n'
import { getBaseUrl } from '../utils/url'

import { isLoggedIn } from '../utils/auth'
import { apiCreateOrder, apiValidateCoupon, fetchShippingMethodsForListing, fetchCart, type BillingInfoPayload } from '../services/cartService'
import type { ListingShippingMethod } from '../services/cartService'
import { showToast } from '../utils/toast'

// Header components (reuse from main page)
// Checkout akışında distraction'ı azaltmak için minimal header kullanıyoruz
// (TopBar/SubHeader/MegaMenu KALDIRILDI — Amazon/Shopify checkout pattern'i).

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Checkout components
import { CheckoutHeader, CheckoutLayout, CheckoutMinimalHeader, initCheckoutMinimalHeader, ShippingAddressForm, OrderSummary, PaymentMethodSection, ItemsDeliverySection, BillingInfoSection, OrderProtectionModal, OrderReviewModal } from '../components/checkout'
import { modalSections, paymentIcons, infoBoxBullets } from '../data/mockCheckout'
import { cartStore } from '../components/cart/state/CartStore'
import { initCurrency, getSelectedCurrencyInfo, convertPrice } from '../services/currencyService'
import type { OrderSummary as OrderSummaryData } from '../types/checkout'
import type { CartProduct, CartSku, CartShippingMethod } from '../types/cart'
import type { CheckoutDeliveryOrderGroup, CheckoutDeliveryMethod } from '../components/checkout'
import { initStickyHeights } from '../utils/stickyHeights'
import { orderStore } from '../components/orders/state/OrderStore'
import type { Order } from '../types/order'

// Expose coupon validator for Alpine component
(window as unknown as Record<string, unknown>).__validateCoupon = apiValidateCoupon;

// Sample mode detection
const isSampleMode = new URLSearchParams(window.location.search).get('mode') === 'sample';

// Supplier filter — set when navigating from cart's "Bu satıcıya ödeme yap" button
// e.g. ?suppliers=SEL-00002 or ?suppliers=SEL-00001,SEL-00002 (global checkout)
const supplierFilter = new URLSearchParams(window.location.search).get('suppliers')?.split(',').filter(Boolean) ?? [];

interface SampleOrderData {
  productId: string;
  title: string;
  supplierName: string;
  samplePrice: number;
  unit: string;
  color: { id: string; label: string; imageUrl?: string } | null;
  quantity: number;
  shippingMethods?: CartShippingMethod[];
}

let sampleOrderData: SampleOrderData | null = null;

if (isSampleMode) {
  try {
    const raw = localStorage.getItem('tradehub_sample_order');
    if (raw) sampleOrderData = JSON.parse(raw) as SampleOrderData;
  } catch { /* ignore */ }
  if (!sampleOrderData) {
    window.location.replace('/');
  }
}

// CartStore'dan checkout order summary oluştur
cartStore.load();
if (cartStore.hasSelectedSkuMoqViolation()) {
  window.location.replace('/pages/cart.html');
}

function formatMonthDay(date: Date): string {
  const locale = getCurrentLang() === 'tr' ? 'tr-TR' : 'en-US';
  return date.toLocaleDateString(locale, { month: 'short', day: '2-digit' });
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function buildProductCard(product: CartProduct): { card: CheckoutDeliveryOrderGroup['products'][number] | null; subtotal: number } {
  const selectedSkus = product.skus.filter((sku) => sku.selected);
  if (selectedSkus.length === 0) return { card: null, subtotal: 0 };

  const skuLines = selectedSkus.map((sku: CartSku) => ({
    id: sku.id,
    image: sku.skuImage,
    variantText: sku.variantText,
    // Fiyatı baz para biriminden seçili display para birimine çevir (cart'la tutarlı)
    unitPrice: convertPrice(sku.unitPrice, sku.baseCurrency || 'USD'),
    quantity: sku.quantity,
    listingVariant: sku.listingVariant,
    isSample: sku.isSample,
  }));

  const subtotal = selectedSkus.reduce((sum, sku) => sum + (convertPrice(sku.unitPrice, sku.baseCurrency || 'USD') * sku.quantity), 0);
  const image = selectedSkus[0]?.skuImage || '';

  return {
    subtotal,
    card: {
      id: product.id,
      title: product.title,
      moqLabel: product.moqLabel,
      image,
      skuLines,
    },
  };
}

/** Backend'den her tedarikçinin listing kargo yöntemlerini çekip supplierShippingMethods'u doldurur */
async function enrichMissingShippingMethods(): Promise<void> {
  if (isSampleMode) return;

  const allSuppliers = cartStore.getSuppliers();
  const suppliers = supplierFilter.length > 0
    ? allSuppliers.filter((s) => supplierFilter.includes(s.id))
    : allSuppliers;
  const selectedSuppliers = suppliers.filter((s) =>
    s.products.some((p) => p.skus.some((sku) => sku.selected))
  );

  await Promise.all(
    selectedSuppliers.map(async (supplier) => {
      const selectedProducts = supplier.products.filter((p) =>
        p.skus.some((sku) => sku.selected)
      );

      // Her listing için kargo yöntemlerini paralel çek
      const allMethodsPerListing = await Promise.all(
        selectedProducts.map((p) =>
          fetchShippingMethodsForListing(p.id).catch(() => [] as ListingShippingMethod[])
        )
      );

      // Aynı method id'si için max maliyet al (birden fazla listing varsa birleştir)
      const methodMap = new Map<string, ListingShippingMethod>();
      for (const methods of allMethodsPerListing) {
        for (const m of methods) {
          const existing = methodMap.get(m.id);
          if (!existing || m.cost > existing.cost) {
            methodMap.set(m.id, m);
          }
        }
      }

      if (methodMap.size === 0) return; // Kargo tanımlanmamış → fallback devreye girer

      const now = new Date();
      const deliveryMethods: CheckoutDeliveryMethod[] = Array.from(methodMap.values()).map((m, i) => {
        let etaLabel: string;
        if (m.minDays && m.maxDays) {
          const start = addDays(now, m.minDays);
          const end = addDays(now, m.maxDays);
          etaLabel = `${m.method} – ${t('checkout.estimatedDeliveryRange', {
            start: formatMonthDay(start),
            end: formatMonthDay(end),
          })}`;
        } else {
          etaLabel = m.method;
        }
        return {
          id: `method-${supplier.id}-${m.id}`,
          etaLabel,
          shippingFee: m.cost,
          isDefault: i === 0,
        };
      });

      supplierShippingMethods[supplier.id] = deliveryMethods;
    })
  );
}

/** Build delivery orders for sample mode checkout */
function buildSampleDeliveryOrders(): CheckoutDeliveryOrderGroup[] {
  if (!sampleOrderData) return [];
  const now = new Date();
  return [{
    orderId: 'order-sample-1',
    orderLabel: 'Sample Order',
    sellerId: '',
    sellerName: sampleOrderData.supplierName,
    methods: sampleOrderData.shippingMethods?.map((sm, i) => ({
      id: sm.id || `sample-method-${i}`,
      etaLabel: `${sm.method} (${sm.estimatedDays})`,
      shippingFee: sm.baseCost,
      isDefault: i === 0,
    })) ?? [{
      id: 'sample-method-default',
      etaLabel: t('checkout.estimatedDeliveryRange', {
        start: formatMonthDay(addDays(now, 10)),
        end: formatMonthDay(addDays(now, 20)),
      }),
      shippingFee: 5,
      isDefault: true,
    }],
    products: [{
      id: sampleOrderData.productId,
      title: sampleOrderData.title,
      moqLabel: '1 pc',
      image: sampleOrderData.color?.imageUrl || '',
      skuLines: [{
        id: `sample-sku-${sampleOrderData.productId}`,
        image: sampleOrderData.color?.imageUrl || '',
        variantText: sampleOrderData.color?.label || '',
        unitPrice: sampleOrderData.samplePrice,
        quantity: sampleOrderData.quantity,
      }],
    }],
  }];
}

function buildDeliveryOrders(): CheckoutDeliveryOrderGroup[] {
  const allSuppliers = cartStore.getSuppliers();
  const suppliers = supplierFilter.length > 0
    ? allSuppliers.filter((s) => supplierFilter.includes(s.id))
    : allSuppliers;
  const selectedSuppliers = suppliers
    .map((supplier) => {
      const products = supplier.products
        .map((product) => buildProductCard(product))
        .filter((row): row is { card: CheckoutDeliveryOrderGroup['products'][number]; subtotal: number } => Boolean(row.card));

      const subtotal = products.reduce((sum, row) => sum + row.subtotal, 0);
      return {
        supplier,
        subtotal,
        products: products.map((row) => row.card),
      };
    })
    .filter((row) => row.subtotal > 0 && row.products.length > 0);

  if (selectedSuppliers.length === 0) return [];

  return selectedSuppliers.map((row, index) => {
    // Yalnızca backend'den çekilen gerçek kargo yöntemlerini kullan; yoksa boş bırak.
    const methods: CheckoutDeliveryMethod[] = supplierShippingMethods[row.supplier.id] ?? [];

    return {
      orderId: `order-${index + 1}`,
      orderLabel: `Order ${index + 1}`,
      sellerId: row.supplier.id,
      sellerName: row.supplier.name,
      methods,
      products: row.products,
    };
  });
}

/** Sadece supplierFilter'daki satıcıların seçili ürünlerini özetler; filtre yoksa tüm sepet */
function getFilteredCartSummary() {
  if (supplierFilter.length === 0) return cartStore.getSummary();

  const filtered = cartStore.getSuppliers().filter((s) => supplierFilter.includes(s.id));
  let selectedCount = 0;
  let productSubtotal = 0;
  const items: { image: string; quantity: number }[] = [];

  for (const supplier of filtered) {
    for (const product of supplier.products) {
      for (const sku of product.skus) {
        if (sku.selected && sku.isAvailable !== false) {
          selectedCount++;
          const converted = convertPrice(sku.unitPrice, sku.baseCurrency || 'USD');
          productSubtotal += converted * sku.quantity;
          items.push({ image: sku.skuImage, quantity: sku.quantity });
        }
      }
    }
  }

  return {
    selectedCount,
    items,
    productSubtotal,
    discount: 0,
    couponDiscount: 0,
    couponCode: '',
    shippingFee: 0,
    subtotal: productSubtotal,
    currency: getSelectedCurrencyInfo().symbol,
  };
}

// Tedarikçi bazlı gerçek kargo yöntemleri — enrichMissingShippingMethods ile doldurulur
const supplierShippingMethods: Record<string, CheckoutDeliveryMethod[]> = {};

// Modül düzeyinde tutulan checkout durumu — renderCheckout sonrası doldurulur
let checkoutDeliveryOrders: CheckoutDeliveryOrderGroup[] = [];
let currentDefaultShippingFee = 0;
let currentCheckoutOrderSummary: OrderSummaryData | null = null;

// Seçili kargo yöntemi ve kargo ücreti takibi
let selectedShippingMethodByOrderId: Record<string, string> = {};
let currentShippingFee = 0;
window.addEventListener('checkout:shipping-updated', (e: Event) => {
  const detail = (e as CustomEvent<{ shippingFee?: number; selectedMethodByOrderId?: Record<string, string> }>).detail;
  if (typeof detail?.shippingFee === 'number') currentShippingFee = detail.shippingFee;
  if (detail?.selectedMethodByOrderId) selectedShippingMethodByOrderId = { ...detail.selectedMethodByOrderId };
});

// Kupon takibi — Alpine'ın checkout:coupon-updated event'inden güncellenir
let currentCouponApplied: { code: string; type: string; value: number; description: string } | null = null;
let currentCouponDiscount = 0;
window.addEventListener('checkout:coupon-updated', (e: Event) => {
  const detail = (e as CustomEvent<{ coupon: typeof currentCouponApplied; couponDiscount: number }>).detail;
  currentCouponApplied = detail?.coupon ?? null;
  currentCouponDiscount = detail?.couponDiscount ?? 0;
});

// Tedarikçi notları takibi — Alpine'ın checkout:notes-updated event'inden güncellenir
let currentSupplierNotes: Record<string, string> = {};
window.addEventListener('checkout:notes-updated', (e: Event) => {
  const detail = (e as CustomEvent<{ notesByOrderId: Record<string, string> }>).detail;
  if (detail?.notesByOrderId) currentSupplierNotes = { ...detail.notesByOrderId };
});

// Build Order objects from checkout data
function buildOrdersFromCheckout(
  paymentMethod: string,
  shippingAddressStr = '',
  backendOrderNumbers: string[] = [],
): Order[] {
  const now = Date.now();
  const dateStr = new Date().toLocaleDateString('tr-TR', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  return checkoutDeliveryOrders.map((deliveryOrder, idx) => {
    const supplier = cartStore.getSupplier(deliveryOrder.sellerId);
    const selectedMethodId = selectedShippingMethodByOrderId[deliveryOrder.orderId];
    const selectedMethod = (selectedMethodId
      ? deliveryOrder.methods.find((m) => m.id === selectedMethodId)
      : null) ?? deliveryOrder.methods.find((m) => m.isDefault) ?? deliveryOrder.methods[0];
    const shippingFee = selectedMethod?.shippingFee ?? 0;

    const products = deliveryOrder.products.map((p) => {
      const totalQty = p.skuLines.reduce((sum, sku) => sum + sku.quantity, 0);
      const totalPrice = p.skuLines.reduce((sum, sku) => sum + sku.unitPrice * sku.quantity, 0);
      return {
        name: p.title,
        variation: p.skuLines.map((s) => s.variantText).filter(Boolean).join(', '),
        unitPrice: (totalPrice / totalQty).toFixed(2),
        quantity: totalQty,
        totalPrice: totalPrice.toFixed(2),
        image: p.image,
      };
    });

    const subtotal = products.reduce((sum, p) => sum + Number(p.totalPrice), 0);
    const grandTotal = subtotal + shippingFee;
    const orderNumber = backendOrderNumbers[idx] ?? `ORD-${(now + idx).toString(36).toUpperCase()}`;

    return {
      id: `ord-${now}-${idx}`,
      orderNumber,
      orderDate: dateStr,
      total: grandTotal.toFixed(2),
      currency: getSelectedCurrencyInfo().code,
      seller: supplier?.name ?? deliveryOrder.sellerName,
      status: 'Waiting for payment',
      statusColor: 'text-amber-600',
      statusDescription: 'Ödemenizi tamamlayın.',
      products,
      shipping: {
        trackingStatus: 'Pending',
        address: shippingAddressStr,
        shipFrom: '',
        method: selectedMethod?.etaLabel ?? '',
        incoterms: '',
      },
      payment: {
        status: 'Unpaid',
        hasRecord: false,
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
      },
      supplier: {
        name: supplier?.name ?? deliveryOrder.sellerName,
        contact: '',
        phone: '',
        email: '',
      },
      paymentMethod,
      createdAt: now,
    } as Order;
  });
}

// Gather review data from DOM + module-level state
function gatherReviewData() {
  // Shipping address: try selected address display first, then form fields
  const shippingSection = document.getElementById('shipping-address-section');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shippingAlpine = shippingSection && ((shippingSection as any)._x_dataStack as Record<string, unknown>[] | undefined)?.[0] as any;
  // shippingAddressId — backend'e gönderilecek `Addresses` DocType kayıt adı (ör: ADDR-0001).
  // shippingAddress — review modal ve local Order objesinde gösterilecek insanca okunur string.
  let shippingAddressId = '';
  let shippingAddress = '';
  if (shippingAlpine?.selectedAddressId) {
    shippingAddressId = String(shippingAlpine.selectedAddressId);
    const name = shippingAlpine.selectedAddressName ?? '';
    const phone = shippingAlpine.selectedAddressPhone ?? '';
    const line = shippingAlpine.selectedAddressLine ?? '';
    shippingAddress = [name, phone, line].filter(Boolean).join(', ');
  } else {
    const addrParts: string[] = [];
    const firstNameEl = document.querySelector<HTMLInputElement>('#first-name');
    const streetEl = document.querySelector<HTMLInputElement>('#street-address');
    const postalEl = document.querySelector<HTMLInputElement>('#postal-code');
    if (firstNameEl?.value) addrParts.push(firstNameEl.value);
    if (streetEl?.value) addrParts.push(streetEl.value);
    if (postalEl?.value) addrParts.push(postalEl.value);
    shippingAddress = addrParts.join(', ');
  }
  if (!shippingAddress) shippingAddress = 'Belirtilmedi';

  let paymentLabel = t('checkout.bankTransfer');
  const selected = document.querySelector<HTMLInputElement>('input[name="payment_method"]:checked');
  if (selected) {
    switch (selected.value) {
      case 'elden': paymentLabel = t('checkout.handInstallment'); break;
      case 'anlasmali': paymentLabel = t('checkout.negotiatedWithSupplier'); break;
      case 'banka_havale': paymentLabel = t('checkout.bankTransfer'); break;
      case 'cek_senet': paymentLabel = t('checkout.checkDraft'); break;
      default: paymentLabel = t('checkout.bankTransfer');
    }
  }

  const itemSubtotal = currentCheckoutOrderSummary?.itemSubtotal ?? 0;
  // implicit discount = baked-in cart discount (bulk pricing etc.)
  const implicitDiscount = currentCheckoutOrderSummary
    ? Number((currentCheckoutOrderSummary.itemSubtotal + currentCheckoutOrderSummary.shipping - currentCheckoutOrderSummary.total).toFixed(2))
    : 0;
  const shippingFee = currentShippingFee || currentDefaultShippingFee;
  const couponDiscount = currentCouponDiscount;
  const total = Number((itemSubtotal + shippingFee - implicitDiscount - couponDiscount).toFixed(2));

  // Billing — Alpine billingForm'dan window üzerinden çekilir
  const billingInfo = (
    (window as unknown as { __getBillingInfo?: () => BillingInfoPayload | null }).__getBillingInfo?.()
  ) ?? null;

  return {
    shippingAddress,
    shippingAddressId,
    paymentMethod: paymentLabel,
    orders: checkoutDeliveryOrders,
    billingInfo,
    summary: {
      itemSubtotal: itemSubtotal.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      couponDiscount: couponDiscount.toFixed(2),
      total: total.toFixed(2),
    },
  };
}

// Confirm Order (from review modal) → backend API + redirect — modül düzeyinde bir kez kayıt
window.addEventListener('checkout:confirm-order', () => {
  const orderCount = checkoutDeliveryOrders.length;

  const selected = document.querySelector<HTMLInputElement>('input[name="payment_method"]:checked');
  const selectedPaymentValue = selected?.value || 'banka_havale';

  const paymentMethodMap: Record<string, string> = {
    elden: 'installment',
    anlasmali: 'negotiated',
    cek_senet: 'check_promissory',
    banka_havale: 'bank_transfer',
    // Gelecekte eklenecek: kredi_karti → 'credit_card'
  };
  const paymentMethod = paymentMethodMap[selectedPaymentValue] || 'bank_transfer';

  // Anında ödeme tamamlanan yöntemler (ödeme gateway'i onaylar)
  const INSTANT_PAYMENT_METHODS = ['credit_card', 'iyzico', 'paytr', 'stripe'];

  const reviewData = gatherReviewData();
  const shippingAddress = reviewData.shippingAddress;
  const shippingAddressId = reviewData.shippingAddressId;

  // Kupon bilgisi — modül düzeyinde event'ten takip edilir
  const couponCode = currentCouponApplied?.code ?? '';
  const couponDiscount = currentCouponDiscount;

  // Backend'e gönderilecek sipariş objeleri — notlar dahil
  const backendOrders = checkoutDeliveryOrders.map((deliveryOrder) => {
    const selectedMethodId = selectedShippingMethodByOrderId[deliveryOrder.orderId];
    const selectedMethod = (selectedMethodId
      ? deliveryOrder.methods.find((m) => m.id === selectedMethodId)
      : null) ?? deliveryOrder.methods.find((m) => m.isDefault) ?? deliveryOrder.methods[0];
    return {
      seller_id: deliveryOrder.sellerId || '',
      seller_name: deliveryOrder.sellerName,
      shipping_fee: selectedMethod?.shippingFee ?? 0,
      shipping_method: selectedMethod?.etaLabel ?? '',
      currency: getSelectedCurrencyInfo().code,
      buyer_note: currentSupplierNotes[deliveryOrder.orderId] || '',
      products: deliveryOrder.products.flatMap((p) =>
        p.skuLines.filter((s) => s.quantity > 0).map((s) => ({
          listing: p.id,
          listing_title: p.title,
          listing_variant: s.listingVariant ?? null,
          variation: s.variantText || '',
          unit_price: s.unitPrice,
          quantity: s.quantity,
          total_price: s.unitPrice * s.quantity,
          image: p.image,
        }))
      ),
    };
  });

  // Onay butonunu devre dışı bırak (çift tıklama önlemi)
  const confirmBtn = document.getElementById('review-confirm-btn') as HTMLButtonElement | null;
  function setConfirmLoading(loading: boolean) {
    if (confirmBtn) {
      confirmBtn.disabled = loading;
      confirmBtn.style.opacity = loading ? '0.6' : '';
    }
  }

  function redirectAfterOrder(orderNumbers: string) {
    if (isSampleMode) localStorage.removeItem('tradehub_sample_order');
    const encoded = encodeURIComponent(orderNumbers);

    if (INSTANT_PAYMENT_METHODS.includes(paymentMethod)) {
      // Kredi kartı / gateway ödemesi → ödeme işleme sayfasına yönlendir
      window.location.href = `${getBaseUrl()}pages/order/payment-processing.html?method=${paymentMethod}&count=${orderCount}&orderNumbers=${encoded}`;
    } else {
      // Havale, çek/senet, elden taksit, anlaşmalı vade → pending sayfasına yönlendir (dekont yükleme)
      window.location.href = `${getBaseUrl()}pages/order/order-success.html?status=pending&count=${orderCount}&orderNumbers=${encoded}&method=${paymentMethod}`;
    }
  }

  if (!isLoggedIn()) {
    // Misafir: frontend üretilen numaralarla devam et
    const newOrders = buildOrdersFromCheckout(paymentMethod, shippingAddress);
    orderStore.load();
    redirectAfterOrder(newOrders.map((o) => o.orderNumber).join(','));
    return;
  }

  // Backend `Addresses` DocType kayıt adını (ADDR-XXXX) bekliyor — display string'i değil.
  // Kayıtlı bir adres seçilmediyse (manuel form girişi yapıldı ama Kaydet'e basılmadıysa)
  // ID boş kalır ve backend "Geçersiz teslimat adresi" hatası verir. Kullanıcıya net mesaj
  // gösterip backend çağrısını engelliyoruz.
  if (!shippingAddressId) {
    showToast({
      message: t('checkout.selectSavedAddress') || 'Lütfen kayıtlı bir teslimat adresi seçin veya yeni adresinizi kaydedin.',
      type: 'error',
      duration: 5000,
    });
    return;
  }

  setConfirmLoading(true);

  apiCreateOrder(backendOrders, shippingAddressId, paymentMethod, couponCode, couponDiscount, reviewData.billingInfo)
    .then((result) => {
      // Backend'den dönen gerçek sipariş numaralarını kullan
      type BackendResult = { order_number?: string; order_name?: string };
      const backendNums = (result.orders as BackendResult[])
        .map((o) => o.order_number ?? o.order_name ?? '')
        .filter(Boolean);

      orderStore.load();

      const orderNumbers = backendNums.join(',');

      redirectAfterOrder(orderNumbers);
    })
    .catch(async (err: unknown) => {
      setConfirmLoading(false);
      const { isEmailNotVerifiedError } = await import('../utils/api');
      if (isEmailNotVerifiedError(err)) return; // toast api.ts'te zaten gösterildi
      const msg = (err as { message?: string })?.message || t('checkout.orderCreateError') || 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.';
      showToast({ message: msg, type: 'error', duration: 5000 });
    });
});

// Checkout render'ı async — önce eksik shipping verisi çekilir, sonra sayfa render edilir
async function renderCheckout() {
await initCurrency();

// Auth kontrolü: giriş yapmamış kullanıcıları login sayfasına yönlendir
if (!isLoggedIn()) {
  const { getSessionUser } = await import('../utils/auth');
  const sessionUser = await getSessionUser().catch(() => null);
  if (!sessionUser) {
    window.location.replace(`/pages/auth/login.html?redirect=${encodeURIComponent(window.location.href)}`);
    return;
  }
}

// Giriş yapmış kullanıcılar için cart localStorage yerine backend'den yüklenir
// (CartStore.save() logged-in kullanıcılar için localStorage'a yazmaz)
if (isLoggedIn() && !isSampleMode) {
  try {
    const apiCart = await fetchCart();
    if (apiCart.suppliers.length > 0) {
      cartStore.init(apiCart.suppliers, 0, getSelectedCurrencyInfo().symbol, 0);
    }
  } catch { /* localStorage'daki veriyi koru */ }
}

await enrichMissingShippingMethods();

checkoutDeliveryOrders = isSampleMode ? buildSampleDeliveryOrders() : buildDeliveryOrders();
currentDefaultShippingFee = Number(
  checkoutDeliveryOrders.reduce((sum, order) => {
    const defaultMethod = order.methods.find((method) => method.isDefault) ?? order.methods[0];
    return sum + (defaultMethod?.shippingFee ?? 0);
  }, 0).toFixed(2),
);

const sampleSubtotal = sampleOrderData ? sampleOrderData.samplePrice * sampleOrderData.quantity : 0;

// Backend'den yükleme sonrası taze summary (sadece checkout'taki satıcı(lar))
const freshCartSummary = getFilteredCartSummary();

currentCheckoutOrderSummary = isSampleMode ? {
  itemCount: 1,
  thumbnails: sampleOrderData?.color?.imageUrl ? [{ image: sampleOrderData.color.imageUrl, quantity: 1 }] : [],
  itemSubtotal: sampleSubtotal,
  shipping: currentDefaultShippingFee,
  subtotal: sampleSubtotal + currentDefaultShippingFee,
  processingFee: 0,
  total: sampleSubtotal + currentDefaultShippingFee,
  currency: getSelectedCurrencyInfo().code,
} : {
  itemCount: freshCartSummary.selectedCount || freshCartSummary.items.reduce((s, i) => s + i.quantity, 0),
  thumbnails: freshCartSummary.items.map(i => ({ image: i.image, quantity: i.quantity })),
  itemSubtotal: freshCartSummary.productSubtotal,
  shipping: currentDefaultShippingFee,
  subtotal: freshCartSummary.productSubtotal + currentDefaultShippingFee - freshCartSummary.discount,
  processingFee: 0,
  total: freshCartSummary.productSubtotal + currentDefaultShippingFee - freshCartSummary.discount,
  currency: getSelectedCurrencyInfo().code,
};

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Minimal Checkout Header (logo + profilim) -->
  ${CheckoutMinimalHeader()}

  <!-- Main Content -->
  <main>
    <div class="max-w-[1680px] mx-auto px-4">
      ${Breadcrumb([{ label: t('cart.title'), href: '/pages/cart.html' }, { label: t('checkout.pageTitle') }])}
    </div>
    ${CheckoutLayout({
  leftContent: `
        ${CheckoutHeader({
          supplierCount: checkoutDeliveryOrders.length,
          itemCount: currentCheckoutOrderSummary?.itemCount ?? 0,
        })}
        ${ShippingAddressForm()}
        ${BillingInfoSection({ initialExpanded: true })}
        ${PaymentMethodSection({
          suppliers: cartStore.getSuppliers()
            .filter(s => supplierFilter.length === 0 || supplierFilter.includes(s.id))
            .filter(s => s.products.some(p => p.skus.some(sku => sku.selected))),
          isSupplierCheckout: supplierFilter.length > 0,
          initialExpanded: true,
        })}
        ${ItemsDeliverySection({ orders: checkoutDeliveryOrders })}
      `,
  rightContent: `
        ${OrderSummary({
  data: currentCheckoutOrderSummary!,
  // Tek-satıcı checkout ise (sepetteki satıcı bazlı "Ödeme yap" butonu) o satıcının
  // kartı gösterilir. Çok-satıcı global checkout ise payeeSuppliers boş kalır ve
  // OrderSummary fallback olarak platform (iSTOC) kartını gösterir — kullanıcı
  // teknik olarak iSTOC'a ödeme yapar, iSTOC satıcılara pay eder.
  payeeSuppliers: supplierFilter.length > 0
    ? cartStore
        .getSuppliers()
        .filter((s) => supplierFilter.includes(s.id))
        .filter((s) => s.products.some((p) => p.skus.some((sku) => sku.selected)))
        .map((s) => ({ id: s.id, name: s.name }))
    : [],
})}
      `
})}
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}

  <!-- Order Protection Modal -->
  ${OrderProtectionModal({ sections: modalSections, paymentIcons, infoBoxBullets })}

  <!-- Order Review Modal -->
  ${OrderReviewModal()}
`;

// Initialize behaviors
initFlowbite(); // Profil dropdown Flowbite data-dropdown-toggle ile çalışır
startAlpine();
initStickyHeights();
initCheckoutMinimalHeader(); // Logout button click handler

// Place Order → open review modal
const placeOrderBtn = document.getElementById('summary-place-order-btn');
if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', () => {
    // Validate shipping address before opening review
    const shippingSection = document.getElementById('shipping-address-section');
    if (shippingSection) {
      const alpineData = ((shippingSection as any)._x_dataStack as Record<string, unknown>[] | undefined)?.[0] as any;
      if (alpineData) {
        if (alpineData.showAddressForm) {
          alpineData.handleSubmit();
          if (Object.values(alpineData.errors || {}).some(e => e)) {
            return;
          }
        } else if (!alpineData.selectedAddressId) {
          alpineData.showAddressForm = true;
          return;
        }
      }
    }

    // Validate billing info — fatura tipi seçildiyse alanların doğruluğu
    const validateBilling = (window as unknown as { __validateBilling?: () => boolean }).__validateBilling;
    if (validateBilling && !validateBilling()) {
      const billingSection = document.getElementById('checkout-billing');
      billingSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast({ message: t('checkout.billingValidationError'), type: 'error', duration: 4000 });
      return;
    }

    const reviewData = gatherReviewData();
    window.dispatchEvent(new CustomEvent('checkout:open-review', { detail: reviewData }));
  });
}

} // renderCheckout sonu

renderCheckout();
