/**
 * HelpCenterHeader Component
 * Dedicated Help Center header — logo + "Help Center for Buyer" title on the left,
 * navigation links on the right with horizontal scroll on mobile.
 */

import { t, getCurrentLang } from '../../i18n';
import { waitForAuth } from '../../utils/auth';

const languageOptions = [
  { code: 'TR', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'EN', name: 'English', flag: '🇬🇧' },
];

const getBaseUrl = (): string => {
  const viteBase = typeof import.meta !== 'undefined' ? import.meta.env?.BASE_URL : undefined;
  if (viteBase && viteBase !== '/') return viteBase;
  if (window.location.pathname.startsWith('/tradehub/')) return '/tradehub/';
  return '/';
};

type ActivePage = 'home' | 'faq' | 'contact' | 'ticket-new' | 'tickets' | 'terms' | 'privacy' | 'cookies' | 'returns' | 'notice' | 'product-listing' | 'ip' | 'accessibility';

interface HelpCenterHeaderOptions {
  activePage?: ActivePage;
}

const NAV_LINKS: { id: ActivePage; label: string; href: string; authOnly?: boolean }[] = [
  { id: 'home', label: t('helpCenter.navHome'), href: '/pages/help/help-center.html' },
  { id: 'faq', label: t('helpCenter.navFaq'), href: '/pages/help/faq.html' },
  { id: 'contact', label: t('helpCenter.navContact'), href: '/pages/help/contact.html' },
  { id: 'ticket-new', label: t('helpCenter.navNewTicket'), href: '/pages/help/help-ticket-new.html', authOnly: true },
  { id: 'tickets', label: t('helpCenter.navMyTickets'), href: '/pages/help/help-tickets.html', authOnly: true },
];

export function HelpCenterHeader(opts: HelpCenterHeaderOptions = {}): string {
  const { activePage = 'home' } = opts;
  const baseUrl = getBaseUrl();

  const currentLang = getCurrentLang();
  const currentLangCode = currentLang === 'tr' ? 'TR' : 'EN';
  const currentLangOption = languageOptions.find(l => l.code === currentLangCode);
  const currentLangLabel = currentLangOption ? currentLangOption.name : 'English';

  const activeStyle = 'color:var(--color-primary-500); border-bottom:2px solid var(--color-primary-500); padding-bottom:6px; font-weight:600;';
  const inactiveStyle = 'color:#555; font-weight:500;';

  return `
    <header
      class="w-full bg-white border-b border-gray-200 sticky top-0 z-50"
      style="box-shadow: 0 1px 4px rgba(0,0,0,0.08);"
    >
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-[56px]">

        <!-- Left: Logo + title -->
        <div class="flex items-center gap-3 shrink-0">
          <a href="${baseUrl}" class="flex items-center hover:opacity-80 transition-opacity shrink-0">
            <img src="${baseUrl}images/istoc-logo.png" alt="iSTOC" class="h-[26px]" />
          </a>
          <span class="hidden sm:block text-gray-300 font-light text-xl mx-1">|</span>
          <span class="hidden sm:flex items-center gap-1.5 text-[15px] font-semibold text-gray-700 tracking-tight whitespace-nowrap">
            <svg class="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
            </svg>
            ${t('helpCenter.headerTitle')}
          </span>
        </div>

        <!-- Right: Nav links + language selector -->
        <div class="flex items-center gap-1 ml-2">
          <nav class="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            ${NAV_LINKS.map(link => `
              <a
                id="hc-nav-${link.id}"
                href="${link.href}"
                ${link.authOnly ? 'data-auth-only="1" style="display:none;"' : `style="${activePage === link.id ? activeStyle : inactiveStyle}"`}
                class="relative px-3 py-1.5 text-sm transition-colors whitespace-nowrap"
              >
                ${link.label}
              </a>
            `).join('')}
          </nav>

          <!-- Language Selector -->
          <div class="relative shrink-0 ml-2">
            <button
              data-popover-target="hc-popover-language"
              data-popover-placement="bottom-end"
              class="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer rounded-md hover:bg-gray-100"
              type="button"
              aria-label="${t('header.language') || 'Dil'}"
            >
              <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-4.247m0 0A8.959 8.959 0 0 1 3 12c0-1.177.227-2.302.637-3.332" />
              </svg>
              <span class="hidden sm:inline font-medium" id="hc-lang-label">${currentLangLabel}</span>
            </button>

            <!-- Language Popover -->
            <div data-popover id="hc-popover-language" role="tooltip"
              class="absolute z-50 invisible inline-block w-64 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 transition-opacity duration-300"
            >
              <div class="p-4">
                <h3 class="text-sm font-bold text-gray-900 mb-3">${t('header.language') || 'Dil'}</h3>
                <select id="hc-lang-select" class="th-input th-input-sm cursor-pointer">
                  ${languageOptions.map(lang => `
                    <option value="${lang.code}" ${lang.code === currentLangCode ? 'selected' : ''}>${lang.flag} ${lang.name}</option>
                  `).join('')}
                </select>
                <button type="button" id="hc-lang-save-btn" class="th-btn mt-3 w-full px-4 py-2 text-sm font-medium hover: cursor-pointer">
                  ${t('common.save') || 'Kaydet'}
                </button>
              </div>
              <div data-popper-arrow></div>
            </div>
          </div>
        </div>

      </div>
    </header>
  `;
}

/**
 * Initialize the language selector in HelpCenterHeader.
 * Call this after the header HTML is inserted into the DOM and after initFlowbite().
 */
export function initHelpCenterLangSelector(): void {
  const langSelect = document.getElementById('hc-lang-select') as HTMLSelectElement | null;
  const saveBtn = document.getElementById('hc-lang-save-btn');
  const langMap: Record<string, string> = { TR: 'tr', EN: 'en' };

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const selectedCode = langSelect?.value || 'EN';
      const lang = langMap[selectedCode] || 'en';
      localStorage.setItem('i18nextLng', lang);
      window.location.reload();
    });
  }

  // Auth durumuna göre "Talep Oluştur" + "Taleplerim" linklerini göster
  waitForAuth().then(user => {
    if (!user) return;
    document.querySelectorAll<HTMLElement>('[data-auth-only="1"]').forEach(el => {
      el.style.display = '';
    });
  });
}
