/**
 * Sell Page — Entry Point
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { Breadcrumb } from '../components/shared/Breadcrumb'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { SellPageLayout } from '../components/sell'
import { t } from '../i18n'
import { routeToSellerFlow } from '../utils/sellerRouter'
import {
  fetchPricingPlans,
  getCachedPricingPlans,
  type PricingPlansResponse,
} from '../services/pricingService'

// Redirect #register-form hash to the actual register page
if (window.location.hash === '#register-form') {
  window.location.replace('/pages/auth/register.html?type=supplier');
}

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');

// FAZ 4.1 — Pricing data hibrit yükleme:
//   1. Cache fresh ise hemen render (FOUC yok).
//   2. Cache yoksa veya bayatsa: cache + arka planda fetch (SWR pattern).
//   3. Fetch tamamlandığında pricing section'ı yeniden render et.
let pricingData: PricingPlansResponse = getCachedPricingPlans();

function buildPage(data: PricingPlansResponse): string {
  return `
    <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
      ${TopBar()}
      ${SubHeader()}
    </div>
    ${MegaMenu()}
    <main class="flex-1 min-w-0 bg-white">
      <div class="container-boxed">
        ${Breadcrumb([{ label: t('seller.sellOnIstoc') }])}
      </div>
      ${SellPageLayout(data)}
    </main>
    <footer class="mt-auto">
      ${FooterLinks()}
    </footer>
    ${FloatingPanel()}
  `;
}

// Eğer cache yoksa fetch'i await et — boş card göstermeyelim.
if (!pricingData.plans.length) {
  pricingData = await fetchPricingPlans();
}

appEl.innerHTML = buildPage(pricingData);

initMegaMenu();
initFlowbite();
mountChatPopup();
initChatTriggers();
startAlpine();
initStickyHeaderSearch();
initMobileDrawer();
initLanguageSelector();

// Seller CTA: tüm satıcı yönlendirmeleri sellerRouter üzerinden tek noktada.
document.addEventListener('click', async (e) => {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-seller-cta]');
  if (!link) return;
  e.preventDefault();
  await routeToSellerFlow();
});

// O8: Stale-while-revalidate — cache TTL'sine bakmadan HER zaman arka planda
// fetch. Cache TTL artık sadece "ilk paint için FOUC suppression"; tazelik için
// kullanılmıyor. Backend'de değişiklik (CTA/oran/feature) her sayfa yüklemesinde
// kullanıcıya yansır. Eski `!isCacheFresh()` guard backend invalidation ile
// frontend cache arasında 5dk gecikme bırakıyordu.
if (pricingData.plans.length) {
  fetchPricingPlans().then((fresh) => {
    if (!fresh.plans.length) return;
    // updated_at değişmediyse re-render skip (gereksiz DOM swap)
    if (
      fresh.meta?.updated_at &&
      pricingData.meta?.updated_at &&
      fresh.meta.updated_at === pricingData.meta.updated_at
    ) {
      return;
    }
    // Sadece pricing section'ı re-render et. Tüm DOM'u yeniden basmak Alpine state'ini
    // kaybettirir — biz section'ı bulup yerinde değiştiriyoruz.
    const oldSection = document.getElementById('paketler');
    if (!oldSection) return;
    const tpl = document.createElement('template');
    tpl.innerHTML = buildPage(fresh);
    const newSection = tpl.content.querySelector('#paketler');
    if (newSection) {
      oldSection.replaceWith(newSection);
      // Alpine yeni section'ı otomatik discover eder (initTree).
    }
  });
}
