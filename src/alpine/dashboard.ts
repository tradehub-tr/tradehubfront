import Alpine from 'alpinejs'
import Swiper from 'swiper'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { getSessionUser } from '../utils/auth'
import { callMethod } from '../utils/api'
import { t } from '../i18n'

Alpine.data('buyerUserInfo', () => ({
  userName: '',
  userInitial: '',

  init() {
    this.loadUser();
  },

  async loadUser() {
    try {
      const user = await getSessionUser();
      if (user) {
        this.userName = user.full_name || '';
        this.userInitial = (user.full_name || user.email || '?').charAt(0).toLowerCase();

        // Update TopBar greeting if present
        const greetingEl = document.querySelector('#user-dropdown-menu [data-i18n="header.hello"]');
        if (greetingEl) {
          greetingEl.textContent = t('header.hello', { name: user.full_name });
        }

        // Update auth area (show user button if login buttons are shown)
        const authArea = document.querySelector('[data-auth-area]');
        if (authArea && !document.getElementById('user-dropdown-btn')) {
          // Session loaded but TopBar rendered before session — page needs a reload
          // This is handled by auth-guard in production; for now just update greeting
        }
      }
    } catch { /* ignore */ }
  },
}));

Alpine.data('dashboardBanners', () => ({
  banners: [] as { title: string; link_text: string; link_href: string }[],
  swiperInstance: null as Swiper | null,

  async init() {
    try {
      const result = await callMethod<{
        success: boolean;
        banners: { title: string; link_text: string; link_href: string }[];
      }>('tradehub_core.api.banner.get_active_banners');

      if (result?.success && Array.isArray(result.banners)) {
        this.banners = result.banners;
      }
    } catch (err) {
      console.warn('[DashboardBanners] API fetch failed:', err);
      this.banners = [];
    }

    if (this.banners.length > 0) {
      this.$nextTick(() => this.initSwiper());
    }
  },

  initSwiper() {
    const container = (this.$el as HTMLElement).querySelector<HTMLElement>('.operation-slider__swiper');
    if (!container) return;

    const hasMultiple = this.banners.length > 1;

    this.swiperInstance = new Swiper(container, {
      modules: [Navigation, Pagination, Autoplay],
      slidesPerView: 1,
      loop: hasMultiple,
      autoplay: hasMultiple ? { delay: 5000, disableOnInteraction: false } : false,
      navigation: hasMultiple
        ? { nextEl: '.operation-slider__next', prevEl: '.operation-slider__prev' }
        : false,
      pagination: hasMultiple
        ? { el: '.operation-slider__pagination', clickable: true }
        : false,
    });
  },

  destroy() {
    this.swiperInstance?.destroy(true, true);
  },
}));
