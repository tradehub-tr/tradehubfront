/**
 * Para İade Garantisi — Ticari Güvence iade süreci bilgilendirme sayfası.
 * Layout: koyu hero bandı + bandın üzerine binen sticky başvuru kartı (sol)
 * ve akan içerik (sağ); 880px altında tek kolona katlanır.
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { TradeAssuranceFooterCards } from '../components/shared/TradeAssuranceFooterCards'
import { TradeAssuranceBadge } from '../components/shared/TradeAssuranceBadge'
import { t } from '../i18n'

/* ───────────────────────── SVG Icons (lucide, stroke) ───────────────────────── */

const svg = (paths: string): string =>
  `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

const requestIcon = svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/>')
const reviewIcon = svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>')
const payoutIcon = svg('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>')
const warnIcon = svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>')
const arrowIcon = svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>')

/* ───────────────────────── Helpers ───────────────────────── */

function timelineStep(stepNum: string, title: string, description: string, isLast: boolean = false): string {
  return `
    <div class="relative flex gap-5 ${isLast ? '' : 'pb-10'}">
      ${!isLast ? '<div class="absolute start-[21px] top-[46px] bottom-0 w-[2px] bg-gray-200"></div>' : ''}
      <div class="flex-shrink-0 size-11 rounded-full bg-[#1C0C05] text-white flex items-center justify-center text-sm font-bold z-10">
        ${stepNum}
      </div>
      <div class="flex-1 min-w-0 pt-1.5">
        <h4 class="text-base font-bold text-gray-900 mb-1.5">${title}</h4>
        <p class="text-gray-600 text-sm leading-relaxed max-w-[58ch]">${description}</p>
      </div>
    </div>
  `
}

function processRow(icon: string, title: string, description: string): string {
  return `
    <div class="flex gap-4 p-5">
      <div class="flex-shrink-0 size-10 rounded-md bg-[#FFF7DF] text-[#1C0C05] flex items-center justify-center">${icon}</div>
      <div class="min-w-0">
        <h3 class="text-[15px] font-bold text-gray-900 mb-0.5">${title}</h3>
        <p class="text-gray-600 text-sm leading-relaxed">${description}</p>
      </div>
    </div>
  `
}

function factCard(value: string, label: string): string {
  return `
    <div class="border border-gray-200 rounded-md px-3.5 py-3">
      <span class="block text-lg font-bold text-gray-900 tracking-tight">${value}</span>
      <span class="text-xs font-semibold text-gray-500">${label}</span>
    </div>
  `
}

function sectionHead(eyebrow: string, title: string, intro: string = ''): string {
  return `
    <p class="text-xs font-bold tracking-[0.14em] uppercase text-[#B58900] mb-2">${eyebrow}</p>
    <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-balance">${title}</h2>
    ${intro ? `<p class="text-gray-600 text-base leading-relaxed max-w-[66ch]">${intro}</p>` : ''}
  `
}

/* ───────────────────────── Sections ───────────────────────── */

function HeroSection(): string {
  return `
    <section class="relative overflow-hidden bg-[#1C0C05]">
      <div class="absolute inset-0 bg-[radial-gradient(560px_280px_at_85%_0%,rgba(245,184,0,0.20),transparent_62%),radial-gradient(500px_260px_at_10%_110%,rgba(245,184,0,0.10),transparent_60%)]"></div>
      <div class="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-14 pb-20 lg:pb-24">
        ${TradeAssuranceBadge({ className: 'mb-5' })}
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight text-balance max-w-xl">
          ${t('infoPages.refundHeroTitle')}
        </h1>
        <p class="mt-4 text-white/75 text-base sm:text-lg leading-relaxed max-w-lg">
          ${t('infoPages.refundHeroSubtitle')}
        </p>
      </div>
    </section>
  `
}

function BreadcrumbSection(): string {
  return `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
      <nav class="text-sm text-gray-500 truncate">
        <a href="/ticaret-guvencesi/detay" class="hover:text-gray-800 transition-colors">${t('infoPages.tradeAssurance')}</a>
        <span class="mx-2">&gt;</span>
        <span class="text-gray-800 font-medium">${t('infoPages.refundHeroTitle')}</span>
      </nav>
    </div>
  `
}

function PanelCard(): string {
  return `
    <aside class="relative -mt-12 lg:-mt-14 min-[880px]:sticky min-[880px]:top-[88px] bg-white border border-gray-200 rounded-md shadow-[0_18px_44px_-20px_rgba(28,12,5,0.30)] p-5 sm:p-6 flex flex-col gap-4">
      <h2 class="text-base font-bold text-gray-900">${t('infoPages.refundPanelTitle')}</h2>
      <p class="text-gray-600 text-sm leading-relaxed">${t('infoPages.refundPanelDesc')}</p>
      <div class="grid grid-cols-2 gap-2.5">
        ${factCard(t('infoPages.refundFact1Value'), t('infoPages.refundFact1Label'))}
        ${factCard(t('infoPages.refundFact2Value'), t('infoPages.refundFact2Label'))}
      </div>
      <a href="/hesabim/siparisler" class="th-btn w-full">${t('infoPages.refundCard1Title')}${arrowIcon}</a>
      <a href="/ticaret-guvencesi/detay" class="th-btn-outline w-full">${t('infoPages.tradeAssurance')}</a>
      <div class="bg-[#FFF7DF] border border-[#F0E2B4] rounded-md p-4 flex gap-3">
        <span class="flex-shrink-0 text-[#B58900] mt-0.5">${warnIcon}</span>
        <div>
          <h3 class="font-bold text-gray-900 text-sm mb-1">${t('infoPages.refundNoteTitle')}</h3>
          <p class="text-gray-700 text-sm leading-relaxed">${t('infoPages.refundNoteDesc')}</p>
        </div>
      </div>
    </aside>
  `
}

function ContentColumn(): string {
  return `
    <div class="min-w-0 pt-2 min-[880px]:pt-8 flex flex-col gap-12 lg:gap-14">
      <section>
        ${sectionHead(t('infoPages.refundEyebrowProcess'), t('infoPages.refundProcessTitle'), t('infoPages.refundProcessIntro'))}
        <div class="mt-6 border border-gray-200 rounded-md divide-y divide-gray-200 bg-white">
          ${processRow(requestIcon, t('infoPages.refundCard1Title'), t('infoPages.refundCard1Desc'))}
          ${processRow(reviewIcon, t('infoPages.refundCard2Title'), t('infoPages.refundCard2Desc'))}
          ${processRow(payoutIcon, t('infoPages.refundCard3Title'), t('infoPages.refundCard3Desc'))}
        </div>
      </section>

      <section>
        ${sectionHead(t('infoPages.refundEyebrowApply'), t('infoPages.refundApplyTitle'))}
        <div class="mt-7">
          ${timelineStep('01', t('infoPages.refundStep1Title'), t('infoPages.refundStep1Desc'))}
          ${timelineStep('02', t('infoPages.refundStep2Title'), t('infoPages.refundStep2Desc'))}
          ${timelineStep('03', t('infoPages.refundStep3Title'), t('infoPages.refundStep3Desc'))}
          ${timelineStep('04', t('infoPages.refundStep4Title'), t('infoPages.refundStep4Desc'), true)}
        </div>
      </section>
    </div>
  `
}

function BodySection(): string {
  return `
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-14 lg:pb-20">
      <div class="grid grid-cols-1 min-[880px]:grid-cols-[320px_1fr] gap-8 min-[880px]:gap-10 items-start">
        ${PanelCard()}
        ${ContentColumn()}
      </div>
    </section>
  `
}

/* ───────────────────────── Page Assembly ───────────────────────── */

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.classList.add('relative')
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <main class="flex-1 min-w-0 bg-white">
    ${BreadcrumbSection()}
    ${HeroSection()}
    ${BodySection()}
    ${TradeAssuranceFooterCards()}
  </main>

  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>
  ${FloatingPanel()}
`

initMegaMenu()
initFlowbite()
mountChatPopup()
initChatTriggers()
startAlpine()
initStickyHeaderSearch()
initLanguageSelector()
