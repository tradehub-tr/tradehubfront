/**
 * Para İade Garantisi — Ticari Güvence iade süreci bilgilendirme sayfası
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { TradeAssuranceFooterCards } from '../components/shared/TradeAssuranceFooterCards'
import heroImage from '../assets/images/paraiadepolitikası.avif'
import taLogoUrl from '../assets/images/ta-logo.svg'

/* ───────────────────────── SVG Icons ───────────────────────── */

const requestIcon = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><rect width="22" height="22" fill="none"/><path d="M16.0416667,3.20833333 C16.8010582,3.20833333 17.4166667,3.8239418 17.4166667,4.58333333 L17.4166667,18.7916667 L11,15.9270833 L4.58333333,18.7916667 L4.58333333,4.58333333 C4.58333333,3.8239418 5.1989418,3.20833333 5.95833333,3.20833333 L16.0416667,3.20833333 Z M16.0416667,4.58333333 L5.95833333,4.58333333 L5.95833333,16.6720307 L11,14.4212866 L16.0416667,16.6720307 L16.0416667,4.58333333 Z M13.75,10.0833333 L13.75,11.4583333 L8.25,11.4583333 L8.25,10.0833333 L13.75,10.0833333 Z M13.75,6.875 L13.75,8.25 L8.25,8.25 L8.25,6.875 L13.75,6.875 Z" fill="#000" fill-rule="nonzero"/></g></svg>`

const reviewIcon = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><rect width="22" height="22" fill="none"/><path d="M11,3.66666667 C15.0501339,3.66666667 18.3333333,6.94986614 18.3333333,11 C18.3333333,15.0501339 15.0501339,18.3333333 11,18.3333333 C6.94986614,18.3333333 3.66666667,15.0501339 3.66666667,11 C3.66666667,6.94986614 6.94986614,3.66666667 11,3.66666667 Z M11,5.04166667 C7.70939496,5.04166667 5.04166667,7.70939496 5.04166667,11 C5.04166667,14.290605 7.70939496,16.9583333 11,16.9583333 C14.290605,16.9583333 16.9583333,14.290605 16.9583333,11 C16.9583333,7.70939496 14.290605,5.04166667 11,5.04166667 Z M11.6875,6.875 L11.6875,10.7135 L14.0625,12.0833333 L13.3750,13.1771 L10.3125,11.4583333 L10.3125,6.875 L11.6875,6.875 Z" fill="#000" fill-rule="nonzero"/></g></svg>`

const refundIcon = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><rect width="22" height="22" fill="none"/><path d="M11,3.66666667 C15.0501339,3.66666667 18.3333333,6.94986614 18.3333333,11 C18.3333333,15.0501339 15.0501339,18.3333333 11,18.3333333 C6.94986614,18.3333333 3.66666667,15.0501339 3.66666667,11 C3.66666667,6.94986614 6.94986614,3.66666667 11,3.66666667 Z M11,5.04166667 C7.70939496,5.04166667 5.04166667,7.70939496 5.04166667,11 C5.04166667,14.290605 7.70939496,16.9583333 11,16.9583333 C14.290605,16.9583333 16.9583333,14.290605 16.9583333,11 C16.9583333,7.70939496 14.290605,5.04166667 11,5.04166667 Z M11.6875,6.875 L11.6875,11.6875 L15.125,11.6875 L15.125,13.0625 L10.3125,13.0625 L10.3125,6.875 L11.6875,6.875 Z" fill="#000" fill-rule="nonzero"/><path d="M15,12 L17,14 L19,12" stroke="#000" stroke-width="1.2" fill="none" transform="translate(1,1)"/></g></svg>`

/* ───────────────────────── Helper: Timeline Step ───────────────────────── */

function timelineStep(
  stepNum: string,
  title: string,
  description: string,
  isLast: boolean = false
): string {
  return `
    <div class="relative flex gap-6 ${isLast ? '' : 'pb-12'}">
      ${!isLast ? '<div class="absolute left-[23px] top-[48px] bottom-0 w-[2px] bg-gray-200"></div>' : ''}
      <div class="flex-shrink-0 w-[48px] h-[48px] rounded-full bg-[#1C0C05] text-white flex items-center justify-center text-sm font-bold z-10">
        ${stepNum}
      </div>
      <div class="flex-1 pt-2">
        <h4 class="text-lg font-bold text-gray-900 mb-2">${title}</h4>
        ${description ? `<p class="text-gray-600 text-sm leading-relaxed">${description}</p>` : ''}
      </div>
    </div>
  `
}

/* ───────────────────────── Sections ───────────────────────── */

function HeroSection(): string {
  return `
    <section class="relative w-full h-[380px] md:h-[400px] overflow-hidden">
      <img src="${heroImage}" alt="Para İade Garantisi" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-r from-[#1C0C05]/90 via-[#1C0C05]/70 to-transparent"></div>
      <div class="relative z-10 h-full container-boxed flex items-center">
        <div class="max-w-xl">
          <div class="inline-flex items-center px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm mb-6">
            <img src="${taLogoUrl}" alt="Ticari Güvence" class="h-7 sm:h-8" />
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Para İade Garantisi
          </h1>
          <p class="text-white/80 text-base sm:text-lg leading-relaxed max-w-lg">
            Siparişinizle ilgili bir sorun yaşarsanız, iade talebinde bulunarak çözüme ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </section>
  `
}

function BreadcrumbSection(): string {
  return `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <nav class="text-sm text-gray-500">
        <a href="/pages/info/trade-assurance-detail.html" class="hover:text-gray-800 transition-colors">Ticari Güvence</a>
        <span class="mx-2">&gt;</span>
        <span class="text-gray-800 font-medium">Para İade Garantisi</span>
      </nav>
    </div>
  `
}

function MoneyBackPolicySection(): string {
  return `
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">İade süreci nasıl işler?</h2>
      <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-10 max-w-3xl">
        Siparişiniz gönderilmezse, eksik gelirse veya ürünleriniz sorunlu bir şekilde ulaşırsa (ör. kusurlu, hatalı, hasarlı) para iadesi talebinde bulunabilirsiniz.
      </p>

      <!-- 3 Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: İade Talebi -->
        <div class="border border-gray-200 rounded-md p-6 hover:shadow-md transition-shadow duration-300">
          <div class="mb-4">${requestIcon}</div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">İade Talebi Oluştur</h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            Siparişlerim sayfasından iade talebinizi doğrudan oluşturun. İade nedeninizi ve tutarı belirtin.
          </p>
        </div>
        <!-- Card 2: Satıcı Değerlendirmesi -->
        <div class="border border-gray-200 rounded-md p-6 hover:shadow-md transition-shadow duration-300">
          <div class="mb-4">${reviewIcon}</div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Satıcı Değerlendirmesi</h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            Satıcı talebinizi inceler ve onaylar veya reddeder. Talebiniz "Beklemede" durumundan sonuçlanır.
          </p>
        </div>
        <!-- Card 3: İade Sonuçlanması -->
        <div class="border border-gray-200 rounded-md p-6 hover:shadow-md transition-shadow duration-300">
          <div class="mb-4">${refundIcon}</div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">İade Sonuçlanması</h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            Onaylanan talepler için ödemeniz iade edilir. Her adımı sipariş detaylarınızdan takip edebilirsiniz.
          </p>
        </div>
      </div>
    </section>
  `
}

function HowToApplySection(): string {
  return `
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 bg-[#fafafa]">
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">Para iadesi başvurusu nasıl yapılır?</h2>

      <div class="max-w-3xl">
        ${timelineStep(
          '01',
          'Sipariş Detaylarına Gidin',
          'Siparişlerim > Sipariş Detayları sayfasına giderek ilgili siparişinizi açın ve "İade Talebi Oluştur" butonuna tıklayın.'
        )}
        ${timelineStep(
          '02',
          'İade Nedenini ve Tutarını Belirtin',
          'İade talep etmenizin nedenini yazın ve iade edilmesini istediğiniz tutarı girin. Varsa fotoğraf veya ek belge yükleyin.'
        )}
        ${timelineStep(
          '03',
          'Satıcı İncelemesi',
          'Talebiniz satıcıya iletilir. Satıcı talebinizi "Onaylandı" veya "Reddedildi" olarak sonuçlandırır.'
        )}
        ${timelineStep(
          '04',
          'İadenizi Alın',
          'Talebiniz onaylandığında ödeme iadesi süreci başlatılır ve siparişiniz iade edilmiş olarak işaretlenir.',
          true
        )}
      </div>

      <!-- Info Note -->
      <div class="mt-10 bg-white border-l-4 border-amber-500 rounded-r-md p-5 max-w-3xl">
        <div class="flex gap-3">
          <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"/>
          </svg>
          <div>
            <h4 class="font-bold text-gray-900 text-sm mb-1">İade süreci hakkında</h4>
            <p class="text-gray-700 text-sm leading-relaxed">
              Sipariş sürecinizin her aşamasında doğrudan satıcıyla mesajlaşarak sorunları çözebilirsiniz. Satıcı ile anlaşmazlık halinde iade talebinizi oluşturabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </section>
  `
}

/* ───────────────────────── Page Assembly ───────────────────────── */

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.classList.add('relative')
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <main class="flex-1 min-w-0 bg-white">
    ${HeroSection()}
    ${BreadcrumbSection()}
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"><hr class="border-gray-100" /></div>
    ${MoneyBackPolicySection()}
    ${HowToApplySection()}
    ${TradeAssuranceFooterCards()}
  </main>

  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>
  ${FloatingPanel()}
`

initMegaMenu()
initFlowbite()
startAlpine()
initStickyHeaderSearch()
initMobileDrawer()
initLanguageSelector()
