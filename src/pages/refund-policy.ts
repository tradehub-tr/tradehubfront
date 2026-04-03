/**
 * Para İade Politikası — Entry Point
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
import bgPattern from '../assets/images/svgviewer-output.svg'
import taLogoUrl from '../assets/images/ta-logo.svg'

/* ───────────────────────── SVG Icons ───────────────────────── */

const timerIcon = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><rect width="22" height="22" fill="none"/><path d="M11,3.4375 C15.1766522,3.4375 18.5625,6.82332019 18.5625,10.9999439 C18.5625,15.1765855 15.1766342,18.5625 11,18.5625 L10.9454395,18.5603316 C8.97994405,18.4038548 7.38435835,17.7421437 6.18725146,16.5833528 L6.1875,18.1041667 L4.8125,18.1041667 L4.8125,13.75 L8.70833333,13.75 L8.70833333,15.125 L6.71386738,15.1256914 C7.70754091,16.34793 9.13072447,17.0310253 11.0270889,17.187442 L11.1705605,17.1851945 C14.5089432,17.0948417 17.1875,14.3601611 17.1875,10.9999439 C17.1875,7.58271424 14.4172631,4.8125 11,4.8125 C7.58273685,4.8125 4.8125,7.58271424 4.8125,10.9999439 L3.4375,10.9999439 C3.4375,6.82332019 6.82334784,3.4375 11,3.4375 Z M10.0833333,6.875 L11.4583333,6.875 L11.4575,10.3115 L14.8958333,10.3125 L14.8958333,11.6875 L10.0833333,11.6875 L10.0833333,6.875 Z" fill="#000" fill-rule="nonzero"/></g></svg>`

const lightningIcon = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><rect width="22" height="22" fill="none"/><path d="M13.9030912,3.66666667 C14.4093522,3.66666667 14.8197579,4.07707231 14.8197579,4.58333333 C14.8197579,4.70449978 14.7957362,4.82446405 14.749082,4.93628845 L13.2516682,8.52540856 L15.7024894,8.52540856 C16.2087504,8.52540856 16.6191561,8.93581421 16.6191561,9.44207523 C16.6191561,9.65158171 16.5473897,9.8547666 16.415807,10.0177971 L9.83608201,18.1700558 C9.51811957,18.5640103 8.94099691,18.625614 8.54704245,18.3076515 C8.28111949,18.0930239 8.15666177,17.7482936 8.22415309,17.4132937 L9.10004756,13.0657035 L6.15408596,13.0657035 C5.64782494,13.0657035 5.2374193,12.6552979 5.2374193,12.1490368 C5.2374193,12.029656 5.26073832,11.9114246 5.30606652,11.800984 L8.41126045,4.23528046 C8.55244447,3.89129023 8.88744363,3.66666667 9.2592799,3.66666667 L13.9030912,3.66666667 Z M9.56660145,5.04166667 L6.83763529,11.6907035 L10.7796915,11.6907035 L9.94176531,15.8498342 L14.7435738,9.90040856 L11.1881353,9.90040856 L13.2152469,5.04166667 L9.56660145,5.04166667 Z" fill="#000" fill-rule="nonzero"/></g></svg>`

const clipboardIcon = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><rect width="22" height="22" fill="none"/><path d="M16.0416667,3.20833333 C16.8010582,3.20833333 17.4166667,3.8239418 17.4166667,4.58333333 L17.4166667,18.7916667 L11,15.9270833 L4.58333333,18.7916667 L4.58333333,4.58333333 C4.58333333,3.8239418 5.1989418,3.20833333 5.95833333,3.20833333 L16.0416667,3.20833333 Z M16.0416667,4.58333333 L5.95833333,4.58333333 L5.95833333,16.6720307 L11,14.4212866 L16.0416667,16.6720307 L16.0416667,4.58333333 Z M13.75,10.0833333 L13.75,11.4583333 L8.25,11.4583333 L8.25,10.0833333 L13.75,10.0833333 Z M13.75,6.875 L13.75,8.25 L8.25,8.25 L8.25,6.875 L13.75,6.875 Z" fill="#000" fill-rule="nonzero"/></g></svg>`

/* ───────────────────────── Step Image Placeholders ───────────────────────── */

const stepImagePlaceholder = `
  <div class="flex gap-4 mt-6">
    <div class="relative w-[220px] h-[150px] bg-gray-100 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div class="bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-600">Adım 1: Siparişlerim</div>
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center px-4">
          <svg class="w-8 h-8 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg>
          <p class="text-[10px] text-gray-400">Sipariş listesi görünümü</p>
        </div>
      </div>
    </div>
    <div class="relative w-[220px] h-[150px] bg-gray-100 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col -ml-4 mt-4">
      <div class="bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-600">Adım 2: Sipariş Detayları</div>
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center px-4">
          <svg class="w-8 h-8 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          <p class="text-[10px] text-gray-400">İade talebi oluştur</p>
        </div>
      </div>
    </div>
  </div>
`

/* ───────────────────────── Helper: Timeline Step ───────────────────────── */

function timelineStep(
  stepNum: string,
  title: string,
  description: string,
  extra: string = '',
  isLast: boolean = false
): string {
  return `
    <div class="relative flex gap-6 ${isLast ? '' : 'pb-12'}">
      <!-- Vertical line -->
      ${!isLast ? '<div class="absolute left-[23px] top-[48px] bottom-0 w-[2px] bg-gray-200"></div>' : ''}
      <!-- Circle number -->
      <div class="flex-shrink-0 w-[48px] h-[48px] rounded-full bg-[#1C0C05] text-white flex items-center justify-center text-sm font-bold z-10">
        ${stepNum}
      </div>
      <!-- Content -->
      <div class="flex-1 pt-2">
        <h4 class="text-lg font-bold text-gray-900 mb-2">${title}</h4>
        ${description ? `<p class="text-gray-600 text-sm leading-relaxed">${description}</p>` : ''}
        ${extra}
      </div>
    </div>
  `
}

/* ───────────────────────── Sections ───────────────────────── */

function HeroSection(): string {
  return `
    <section class="relative w-full h-[380px] md:h-[400px] overflow-hidden">
      <!-- Background Image -->
      <img src="${heroImage}" alt="Para İade Politikası" class="absolute inset-0 w-full h-full object-cover" />
      <!-- Dark Overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#1C0C05]/90 via-[#1C0C05]/70 to-transparent"></div>
      <!-- Content -->
      <div class="relative z-10 h-full container-boxed flex items-center">
        <div class="max-w-xl">
          <!-- Badge -->
          <div class="inline-flex items-center px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm mb-6">
            <img src="${taLogoUrl}" alt="Trade Assurance" class="h-7 sm:h-8" />
          </div>
          <!-- Title -->
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Para iade politikası
          </h1>
          <!-- Description -->
          <p class="text-white/80 text-base sm:text-lg leading-relaxed max-w-lg">
            Ürün kalitesi sorunları veya hüküm ve koşullarımız kapsamında yapılan diğer ihlaller için geri ödeme veya tazminat dahil olmak üzere tatmin edici bir çözüme ulaşmanıza yardımcı olacağız.
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
        <a href="/pages/trade-assurance" class="hover:text-gray-800 transition-colors">Trade Assurance</a>
        <span class="mx-2">&gt;</span>
        <span class="text-gray-800 font-medium">Money-back policy</span>
      </nav>
    </div>
  `
}

function MoneyBackPolicySection(): string {
  return `
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <!-- Section Title -->
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Para iade politikası</h2>
      <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-10 max-w-3xl">
        Siparişiniz gönderilmezse, kayıpsa veya ürünleriniz sorunlu bir şekilde gelirse (ör. kusurlu, hatalı, hasarlı vb.) para iadesi talebinde bulunun.
      </p>

      <!-- 3 Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Card 1 -->
        <div class="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300">
          <div class="mb-4">${timerIcon}</div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">30 veya 60 günde para iadesi*</h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            Teslimat tarihinden sonra 30 veya 60 gün içinde para iadesi alabilirsiniz.
          </p>
        </div>
        <!-- Card 2 -->
        <div class="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300">
          <div class="mb-4">${lightningIcon}</div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Hızlı para iadeleri</h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            Ödemeden sonra 2 saat içinde siparişi iptal ederseniz ve sipariş henüz kargoya verilmediyse anında tam para iadesi talebinde bulunabilirsiniz.
          </p>
        </div>
        <!-- Card 3 -->
        <div class="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300">
          <div class="mb-4">${clipboardIcon}</div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Çözüm desteği</h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            Para iadenizle ilgili bir sorun yaşarsanız paranızı geri almanız için aracılık yapacağız.
          </p>
        </div>
      </div>

      <!-- Note -->
      <p class="text-xs text-gray-400 italic">
        *Enterprise ve Enterprise Pro buyer'lar 60 gün içinde alabilir.
      </p>
    </section>
  `
}

function HowToApplySection(): string {
  return `
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">Para iadesi başvurusu nasıl yapılır?</h2>

      <!-- Timeline Steps -->
      <div class="max-w-3xl">
        ${timelineStep(
          '01',
          'Siparişte anlaşılan koşullar karşılanmazsa iade talebinde bulunun',
          'Başvuru yapmak için Siparişlerim > Sipariş Detayları sayfasına gidin.',
          stepImagePlaceholder
        )}
        ${timelineStep(
          '02',
          'iSTOC başvurunuzu inceler',
          'Ekibimiz talebinizi değerlendirir ve sizi süreç hakkında bilgilendirir.'
        )}
        ${timelineStep(
          '03',
          'Paranızı geri alın',
          'Talebiniz olumlu sonuçlandığında, para iadeniz size ulaştırılır.',
          '',
          true
        )}
      </div>

      <!-- CTA Button -->
      <div class="mt-10">
        <a href="#" class="inline-flex items-center gap-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-full px-6 py-3 text-sm hover:bg-gray-900 hover:text-white transition-all duration-300">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
          Adım adım eğitim videolarını izleyin
        </a>
      </div>
    </section>
  `
}

function EasyReturnSection(): string {
  return `
    <section class="relative py-16 md:py-20" style="background-color:#f5f5f5; background-image:url('${bgPattern}'); background-repeat:repeat;">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Title -->
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Kolay İade ve Geri Ödeme</h2>
        <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-10 max-w-3xl">
          Ürünler arızalı, hatalı veya hasarlı gelirse paranızı geri alın ve iSTOC'un özel desteğiyle size en yakın yerel depoya ücretsiz iade imkanından yararlanın.
        </p>

        <!-- 3 Feature Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <!-- Card 1 -->
          <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div class="mb-4">${timerIcon}</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Kolay ve ücretsiz iadeler</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              Teslimat tarihinden sonra 30 gün boyunca zahmetsiz ve maliyetsiz iadelerin tadını çıkarın.
            </p>
          </div>
          <!-- Card 2 -->
          <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div class="mb-4">${lightningIcon}</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Teslimat için harcanan süreyi azaltın</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              Yerel deponuza hızlı teslimat hizmetiyle bekleme sürelerini kısaltın.
            </p>
          </div>
          <!-- Card 3 -->
          <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div class="mb-4">${clipboardIcon}</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Paranızı geri alın</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              İade işleme alındığında tam para iadesi alın.
            </p>
          </div>
        </div>

        <!-- Note -->
        <p class="text-xs text-gray-500 mt-2">
          Kolay İade ve Geri Ödeme şu ülkelerde geçerlidir: Türkiye, Almanya, Fransa, İspanya, İtalya, Hollanda, Belçika, Polonya, Çekya, Avusturya, İsviçre, İsveç, Norveç, Danimarka, Finlandiya, Portekiz, İrlanda ve Birleşik Krallık.
        </p>
      </div>
    </section>
  `
}

function EasyReturnStepsSection(): string {
  return `
    <section class="relative py-12 md:py-16" style="background-color:#f5f5f5; background-image:url('${bgPattern}'); background-repeat:repeat;">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">Easy Return başvurusunda bulunma</h2>

        <!-- Timeline Steps -->
        <div class="max-w-3xl">
          ${timelineStep(
            '01',
            'Kolay İade ve Geri Ödeme destekleyen ürünleri keşfedin',
            'Ürün arama sonuçlarında ve ürün detay sayfalarında "Easy Return" etiketine sahip ürünleri seçin.'
          )}
          ${timelineStep(
            '02',
            'Ürün üzerinde anlaşılan kaliteyi karşılamazsa para iadesi talebinde bulunun',
            'Başvuru yapmak için Siparişlerim > Sipariş Detayları sayfasına gidin.',
            stepImagePlaceholder
          )}
          ${timelineStep(
            '03',
            'Yerel depolara ücretsiz iade',
            'Sağlanan iade talimatlarına göre ürünü yerel bir depoya gönderin.'
          )}
          ${timelineStep(
            '04',
            'Paranızı geri alın',
            'İade işleme alındığında tam para iadesi alın.',
            '',
            true
          )}
        </div>

        <!-- CTA Button -->
        <div class="mt-10">
          <a href="#" class="inline-flex items-center gap-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-full px-6 py-3 text-sm hover:bg-gray-900 hover:text-white transition-all duration-300">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
            Adım adım eğitim videolarını izleyin
          </a>
        </div>
      </div>
    </section>
  `
}

/* ───────────────────────── Page Assembly ───────────────────────── */

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.classList.add('relative')
appEl.innerHTML = `
  <!-- Sticky Header -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <main class="flex-1 min-w-0 bg-white">
    <!-- Hero -->
    ${HeroSection()}

    <!-- Breadcrumb -->
    ${BreadcrumbSection()}

    <!-- Divider -->
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"><hr class="border-gray-100" /></div>

    <!-- Section: Para İade Politikası -->
    ${MoneyBackPolicySection()}

    <!-- Divider -->
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"><hr class="border-gray-100" /></div>

    <!-- Section: How To Apply -->
    ${HowToApplySection()}

    <!-- Section: Easy Return (with bg pattern) -->
    ${EasyReturnSection()}

    <!-- Section: Easy Return Steps -->
    ${EasyReturnStepsSection()}

    <!-- Trade Assurance Footer Cards -->
    ${TradeAssuranceFooterCards()}
  </main>

  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>
  ${FloatingPanel()}
`

/* ───────────────────────── Init ───────────────────────── */
initMegaMenu()
initFlowbite()
startAlpine()
initStickyHeaderSearch()
initMobileDrawer()
initLanguageSelector()
