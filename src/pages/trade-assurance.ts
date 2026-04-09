/**
 * Trade Assurance — Ana Landing Page
 * iSTOC Trade Assurance tarzında tasarlanmış, tüm korumaları kapsayan ana sayfa
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { TradeAssuranceFooterCards } from '../components/shared/TradeAssuranceFooterCards'
import Swiper from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/swiper-bundle.css'

import tradeAssuranceBg from '../assets/images/Trade Assurance.avif'
import videoPaymentImg from '../assets/images/videopayment.avif'
import limanImg from '../assets/images/liman.avif'
import taLogoUrl from '../assets/images/ta-logo.svg'

/* ═══════════════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════════════ */

const shieldCheckIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>`

const dollarIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`

const truckIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`

const wrenchIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437"/></svg>`

/* playIcon kaldırıldı — videolar artık autoplay */

/* ═══════════════════════════════════════════════════════════════
   SVG BACKGROUND PATTERN (kalkan dolar deseni)
   ═══════════════════════════════════════════════════════════════ */

const bgPatternSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><g fill="none" fill-rule="evenodd"><g fill="#FF9D00" fill-opacity="0.12"><path d="M60 10c-1.1 0-2.2.2-3.2.6L42 17l.1 19.8h-16.6v-10c-.1-1.4-1.2-2.5-2.7-2.5h-.2c-.3 0-.6.1-.8.2l-18.1 7.2c-1.1.4-1.8 1.5-1.7 2.6l5.9 82.9c.1 1.6 1.1 3 2.6 3.7l50.2 22.3c1.1.5 2.3.8 3.5.8s2.4-.3 3.5-.8l50.2-22.3c1.5-.7 2.5-2.1 2.6-3.7l5.9-82.9c.1-1.1-.6-2.2-1.7-2.6l-18.1-7.2c-.3-.1-.6-.2-.8-.2h-.2c-1.1 0-2.1.6-2.5 1.6-.1.3-.2.6-.2.9v10H87V17l-14.7-5.7c-1.1-.5-2.2-.7-3.3-.7zm0 4c.6 0 1.2.1 1.7.3l16.8 6.7v17.6h16.5v-7.8l15.1 6L104.3 109c0 .2-.1.3-.3.4l-50.3 22.3c-.6.3-1.2.4-1.8.4s-1.2-.1-1.8-.4L0 109.3c-.2-.1-.3-.2-.3-.4L-6.1 37.2l15.1-6V39h16.5V21l16.8-6.7c.5-.2 1.1-.3 1.7-.3z"/><path d="M75.2 76c-3 -2.5-7.5-4.6-13.3-6.4-2.5-.9-4.9-2-7.1-3.4-1.2-.8-1.9-2.1-1.9-3.5 0-1.5.7-2.9 1.9-3.9 1.4-1.1 3.2-1.7 5-1.6 2.6 0 4.6.5 6 1.6 1.3 1.1 2 3 2 5.5h11.4l.1-.2c.1-4.9-1.6-8.7-5.1-11.4-2.5-1.9-5.5-3.1-8.6-3.6V44H54v8.1c-2.9.5-5.7 1.7-8.1 3.4-3.4 2.3-5.4 6.2-5.3 10.3 0 4.4 1.5 7.7 4.6 10 3 2.3 7.7 4.5 14 6.6 3.1 1.1 5.2 2.1 6.4 3.1 1.2 1 1.8 2.5 1.7 4.1.1 1.5-.6 2.9-1.8 3.8-1.2 1-3 1.5-5.5 1.5-3 0-5.2-.6-6.7-1.8-1.4-1.2-2.2-3.3-2.2-6.3h-11.5l-.1.2c-.1 5.8 1.8 10.1 6.2 12.8 2.6 1.7 5.5 2.9 8.5 3.5v8.4h10.7v-8.2c3.3-.4 6.4-1.6 9.1-3.5 3.4-2.4 5.4-6.3 5.2-10.5 0-4.4-1.5-7.9-4.6-10.5z"/></g></g></svg>`)}`

/* ═══════════════════════════════════════════════════════════════
   SECTION: HERO BANNER
   ═══════════════════════════════════════════════════════════════ */

function HeroBanner(): string {
  return `
    <section class="relative overflow-hidden" style="min-height:500px">
      <!-- Background Image -->
      <img src="${tradeAssuranceBg}" alt="" class="absolute inset-0 w-full h-full object-cover" />
      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
      <!-- Content -->
      <div class="relative z-10 container-boxed px-4 sm:px-6 lg:px-8 flex items-center" style="min-height:500px">
        <div class="max-w-[640px]">
          <h1 class="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white leading-tight mb-6">
            iSTOC'da ödemeden teslimata korumadan faydalanın
          </h1>
          <a href="#how-it-works" class="th-btn inline-flex items-center gap-2 font-semibold px-7 py-3.5 text-base shadow-lg">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Süreç şu şekilde işler:
          </a>
        </div>
      </div>
      <!-- Yellow bottom bar -->
      <div class="absolute bottom-0 left-0 right-0 h-2 bg-[#FFC200]"></div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: SERVICE INFO (sarı arka plan + istatistikler)
   ═══════════════════════════════════════════════════════════════ */

function ServiceInfoSection(): string {
  return `
    <section class="relative overflow-hidden" style="background-color:#FFC200; padding:74px 0">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <!-- Left: Text -->
          <div class="lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              Trade Assurance, satın alım yolculuğunuzun her aşamasını kapsar
            </h2>
            <p class="text-gray-800 text-base leading-relaxed mb-6">
              iSTOC'daki alıcılara güvenli ödeme yapma imkanı sunuyoruz, ürün veya nakliye sorunları gibi öngörülemeyen durumlara karşı koruma sağlıyoruz ve satın almayla ilgili sorunları çözmek için alıcılarla tedarikçiler arasında arabuluculuk yapıyoruz.
            </p>
            <div class="flex items-center gap-3 mb-4">
              <img src="${taLogoUrl}" alt="Trade Assurance" class="h-6" />
            </div>
            <a href="/pages/info/trade-assurance-detail" class="text-gray-900 font-medium underline hover:no-underline text-base">
              Daha fazla bilgi almak için izleyin
            </a>
          </div>
          <!-- Right: Stats Grid -->
          <div class="lg:w-1/2 grid grid-cols-2 gap-x-10 gap-y-8">
            <div class="border-l-4 border-red-600 pl-5">
              <div class="text-4xl sm:text-5xl font-bold text-gray-900">160M+</div>
              <div class="text-gray-800 text-sm mt-1">Trade Assurance siparişleri</div>
            </div>
            <div class="border-l-4 border-red-600 pl-5">
              <div class="text-4xl sm:text-5xl font-bold text-gray-900">37M+</div>
              <div class="text-gray-800 text-sm mt-1">Bizden satın alındı</div>
            </div>
            <div class="border-l-4 border-red-600 pl-5">
              <div class="text-4xl sm:text-5xl font-bold text-gray-900">200B+</div>
              <div class="text-gray-800 text-sm mt-1">Tedarikçiler</div>
            </div>
            <div class="border-l-4 border-red-600 pl-5">
              <div class="text-4xl sm:text-5xl font-bold text-gray-900">280M+</div>
              <div class="text-gray-800 text-sm mt-1">Ürünler</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: HOW IT WORKS (4 adım)
   ═══════════════════════════════════════════════════════════════ */

function HowItWorks(): string {
  return `
    <!-- White part: title + steps -->
    <section id="how-it-works" class="bg-white pt-16 sm:pt-20 lg:pt-24 pb-8">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-4">
          iSTOC'da ödemelerinizi nasıl koruyoruz?
        </h2>
        <p class="text-gray-600 text-base sm:text-lg text-center max-w-[800px] mx-auto mb-14">
          Trade Assurance, küresel olarak iş yapmayı hem alıcılar hem de satıcılar için daha kolay ve daha güvenli hale getirir. Süreç şu şekilde işler:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 mb-12">
          ${stepCard('01', 'Trade Assurance siparişini başlat', 'iSTOC\'da bir tedarikçiyle sipariş anlaşması yaptınız.')}
          ${stepCard('02', 'iSTOC üzerinden ödeme yapın', 'Bir çevrimiçi ödeme yöntemiyle satın alın veya iSTOC aracılığıyla banka havalesi yapın.')}
          ${stepCard('03', 'Ödeme geçici olarak tutuluyor', 'Ödemeniz emanette tutuluyor. Siz ürünü teslim alıp onayladıktan sonra tedarikçiye gönderilecek.')}
          ${stepCard('04', 'Sipariş koşulları karşılanmazsa paranızı geri alın', 'Para iadelerinde ve sorunlu siparişlerde tazminat talebinde bulunduğunuzda bir çözüme ulaşmanız için size yardımcı olacağız.')}
        </div>
        <!-- Escrow Video -->
        <div class="max-w-[1000px] mx-auto rounded-md overflow-hidden">
          <video class="w-full object-cover auto-play-video" style="aspect-ratio:1200/362" muted loop playsinline preload="metadata">
            <source src="/src/assets/video/güvenliödeme video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>

    <!-- Yellow part: Kapsamdakiler -->
    <section class="relative py-14 sm:py-16" style="background-color:#FFC200;background-image:url('${bgPatternSvg}');background-size:400px">
      <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">Kapsamdakiler</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          ${coverageCard(shieldCheckIcon, 'Güvenli ve kolay ödemeler', '#section-payments')}
          ${coverageCard(dollarIcon, 'Para iade politikası', '#section-refund')}
          ${coverageCard(truckIcon, 'Gönderim ve lojistik hizmetleri', '#section-shipping')}
          ${coverageCard(wrenchIcon, 'Satış sonrası korumaları', '#section-after-sales')}
        </div>
      </div>
    </section>
  `
}

function stepCard(num: string, title: string, desc: string): string {
  return `
    <div class="flex gap-5">
      <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-base font-bold" style="background:#FFF3C4;color:#92400e">
        ${num}
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">${title}</h3>
        <p class="text-gray-600 text-sm leading-relaxed">${desc}</p>
      </div>
    </div>
  `
}

/* CoverageNav artık HowItWorks içinde entegre */

function coverageCard(icon: string, title: string, href: string): string {
  return `
    <a href="${href}" class="bg-white rounded-md hover:shadow-md transition-all duration-300 group block" style="padding:26px 26px 38px">
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-6" style="background:#FFF3C4;color:#92400e">
        ${icon}
      </div>
      <h3 class="text-sm sm:text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-snug">${title}</h3>
    </a>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: GÜVENLI ÖDEME (video + ödeme yöntemleri)
   ═══════════════════════════════════════════════════════════════ */

function SecurePaymentsSection(): string {
  return `
    <section id="section-payments" class="bg-white py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <!-- Left: Text -->
          <div class="lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              Güvenli ve çeşitli ödeme seçenekleri
            </h2>
            <p class="text-gray-600 text-base leading-relaxed mb-4">
              iSTOC aracılığıyla yaptığınız her ödeme şifrelenmiştir, güvenlidir ve 2 saat gibi kısa bir sürede işlenir.
            </p>
            <p class="text-gray-600 text-base leading-relaxed mb-8">
              Kredi/banka kartları, dijital cüzdanlar, doğrudan banka hesabına transferler ve esnek ödeme planları* dahil olmak üzere bildiğiniz ve güvendiğiniz ödeme yöntemlerini destekliyoruz.
            </p>
            <div class="flex flex-wrap gap-3 mb-4">
              <a href="/pages/info/payments" class="th-btn inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                Destekleyici ürünleri tedarik edin
              </a>
              <a href="/pages/info/payments" class="th-btn-outline inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                Nasıl çalıştığını öğrenin
              </a>
            </div>
            <p class="text-xs text-gray-400 mt-2">*Uygun alıcılar için</p>
          </div>
          <!-- Right: Image + Payment Card Overlay (iSTOC tarzı) -->
          <div class="lg:w-1/2">
            <div class="relative">
              <!-- Ana görsel -->
              <img src="${videoPaymentImg}" alt="Güvenli ödeme" class="w-[65%] rounded-md object-cover shadow-lg" style="aspect-ratio:4/4.5" />
              <!-- Ödeme kartları overlay -->
              <div class="absolute top-8 right-0 w-[55%] bg-white rounded-md shadow-xl p-5" style="z-index:2">
                <p class="text-xs font-semibold text-gray-700 mb-3">Pay online via our checkout</p>
                <div class="grid grid-cols-3 gap-2 mb-4">
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-[#1a1f71]">VISA</span>
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-[#eb001b]">MC</span>
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-[#006fcf]">AMEX</span>
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-[#003087]">PayPal</span>
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-gray-800">Apple Pay</span>
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-gray-600">G Pay</span>
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-[#00c386]">TROY</span>
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-[#5f259f]">Klarna</span>
                  <span class="flex items-center justify-center h-9 rounded-lg border border-gray-200 text-xs font-bold text-gray-400">...</span>
                </div>
                <p class="text-xs font-semibold text-gray-700 mb-2">Pay via wire transfer</p>
                <div class="flex gap-2">
                  <span class="flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-700">J.P.Morgan</span>
                  <span class="flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 text-[10px] font-bold text-[#003d8f]">citibank</span>
                </div>
              </div>
            </div>
            <!-- Currencies -->
            <div class="mt-6 flex flex-wrap gap-2">
              <span class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 font-medium">USD - $</span>
              <span class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 font-medium">TRY - ₺</span>
              <span class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 font-medium">GBP - &pound;</span>
              <span class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 font-medium">EUR - &euro;</span>
              <span class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 font-medium">JPY - &yen;/円</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: PARA İADE POLİTİKASI
   ═══════════════════════════════════════════════════════════════ */

function RefundPolicySection(): string {
  return `
    <section id="section-refund" class="py-16 sm:py-20 lg:py-24" style="background:#f7f7f7">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <!-- Left: Video (autoplay on scroll) -->
          <div class="lg:w-1/2 order-2 lg:order-1">
            <div class="rounded-md overflow-hidden shadow-xl">
              <video class="w-full object-cover auto-play-video" style="aspect-ratio:528/564" muted loop playsinline preload="metadata">
                <source src="/src/assets/video/kargo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
          <!-- Right: Text -->
          <div class="lg:w-1/2 order-1 lg:order-2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              Para iade politikası
            </h2>
            <p class="text-gray-600 text-base leading-relaxed mb-4">
              Siparişiniz gönderilmezse, kaybolursa veya kusurlu, yanlış, hasarlı veya başka bir sorunla elinize ulaşırsa paranızı geri almak için para iadesi talebinde bulunun.
            </p>
            <p class="text-gray-600 text-base leading-relaxed mb-8">
              Uygun bir ülkede* bulunuyorsanız kusurlu ürünleri yerel olarak ücretsiz iade etmek için Easy Return hizmetimizden de yararlanabilirsiniz.
            </p>
            <div class="flex flex-wrap gap-3 mb-4">
              <a href="/pages/info/refund-policy" class="th-btn inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                Destekleyici ürünleri tedarik edin
              </a>
              <a href="/pages/info/refund-policy" class="th-btn-outline inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                Nasıl çalıştığını öğrenin
              </a>
            </div>
            <p class="text-xs text-gray-400">*Uygun ülkelerin listesi için <a href="/pages/info/refund-policy" class="underline hover:no-underline">buraya</a> tıklayın</p>
          </div>
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: GÖNDERİM VE LOJİSTİK HİZMETLERİ
   ═══════════════════════════════════════════════════════════════ */

function ShippingSection(): string {
  return `
    <section id="section-shipping" class="bg-white py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="max-w-[900px]">
          <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
            Gönderim ve lojistik hizmetleri
          </h2>
          <p class="text-gray-600 text-base leading-relaxed mb-4">
            Siparişiniz planlanan tarihte teslim edilsin veya gecikme için bir tazminat alın.
          </p>
          <p class="text-gray-600 text-base leading-relaxed mb-8">
            iSTOC Logistics ile lojistik ağımızın güvenilirliğinden yararlanabilir ve gönderinizi dünyanın birçok ülkesi ve bölgesinde gerçek zamanlı olarak takip edebilirsiniz.
          </p>
          <a href="/pages/info/shipping-logistics" class="th-btn-outline inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
            Nasıl çalıştığını öğrenin
          </a>
        </div>
        <!-- Liman Görseli -->
        <div class="mt-12 rounded-md overflow-hidden shadow-lg">
          <img src="${limanImg}" alt="Lojistik ve Gönderim" class="w-full h-auto max-h-[500px] object-cover" />
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: SATIŞ SONRASI KORUMALARI
   ═══════════════════════════════════════════════════════════════ */

function AfterSalesSection(): string {
  return `
    <section id="section-after-sales" class="py-16 sm:py-20 lg:py-24" style="background:#f7f7f7">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <!-- Left: Video (autoplay on scroll) -->
          <div class="lg:w-1/2">
            <div class="rounded-md overflow-hidden shadow-xl">
              <video class="w-full object-cover auto-play-video" style="aspect-ratio:528/564" muted loop playsinline preload="metadata">
                <source src="/src/assets/video/service.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
          <!-- Right: Text -->
          <div class="lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              Satış sonrası korumaları
            </h2>
            <p class="text-gray-600 text-base leading-relaxed mb-8">
              Uygun ürünlerde yerinde kurulum, bakım, onarım ve ücretsiz yedek parça hizmetlerimizle hizmet kapınıza gelsin.
            </p>
            <div class="flex flex-wrap gap-3">
              <a href="/pages/info/after-sales" class="th-btn inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                Destekleyici ürünleri tedarik edin
              </a>
              <a href="/pages/info/after-sales" class="th-btn-outline inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm">
                Nasıl çalıştığını öğrenin
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Yellow separator bar -->
    <div class="h-1.5 bg-[#FFC200]"></div>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: ALICI SESLERİ SLIDER
   ═══════════════════════════════════════════════════════════════ */

function TestimonialsSection(): string {
  const testimonials = [
    {
      quote: '"İşlem süresince hem tedarikçinin hem de kendimin koruma altında olduğunu bilmek içimi rahatlatıyor."',
      company: 'Nodnal',
      name: 'Brandon Cubina',
    },
    {
      quote: '"Trade Assurance kullandığınız ve korunduğunuz gerçeğini bildiğiniz için endişelenmenize gerek kalmaz."',
      company: 'LifeToo',
      name: 'Darren Tang',
    },
    {
      quote: '"iSTOC üzerinden ödeme yapmak çok güvenli hissettiriyor, emanet sistemi alıcılar için gerçek bir güvence."',
      company: 'TechImport',
      name: 'Ayşe Kılıç',
    },
    {
      quote: '"Satış sonrası destek ve hızlı iade süreci beklentilerimizin çok üzerindeydi."',
      company: 'EuroTrade',
      name: 'Mehmet Demir',
    },
  ]

  return `
    <section class="relative py-16 sm:py-20 overflow-hidden" style="background-color:#FFC200;background-image:url('${bgPatternSvg}');background-size:400px">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">Alıcı sesleri</h2>
        <p class="text-gray-800 text-base text-center mb-12">
          Trade Assurance'ın sizin gibi diğer insanlara nasıl avantajlar sağladığını öğrenin.
        </p>

        <!-- Swiper -->
        <div class="swiper testimonial-swiper max-w-[950px] mx-auto">
          <div class="swiper-wrapper">
            ${testimonials.map(t => `
              <div class="swiper-slide">
                <div class="text-center px-4 sm:px-8">
                  <!-- Video placeholder -->
                  <div class="relative rounded-md overflow-hidden shadow-xl mx-auto max-w-[780px] mb-8 cursor-pointer group" data-video-trigger="testimonial">
                    <div class="w-full aspect-video bg-gray-800 flex items-center justify-center">
                      <div class="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center group-hover:bg-white/50 transition-colors">
                        <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                  <!-- Quote -->
                  <p class="text-lg sm:text-xl font-semibold text-gray-900 mb-6 max-w-[700px] mx-auto leading-relaxed">
                    ${t.quote}
                  </p>
                  <div class="text-gray-800 text-sm font-medium">${t.company}</div>
                  <div class="text-gray-700 text-sm">${t.name}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Navigation (Swiper dışında, tam ortalı) -->
        <div class="flex items-center justify-center gap-5 mt-12">
          <button class="testimonial-prev w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-900 hover:text-white text-gray-900 transition-colors flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <div class="testimonial-pagination flex items-center gap-2"></div>
          <button class="testimonial-next w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-900 hover:text-white text-gray-900 transition-colors flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ASSEMBLY
   ═══════════════════════════════════════════════════════════════ */

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.classList.add('relative')
appEl.innerHTML = `
  <!-- Sticky Header -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <main class="flex-1 min-w-0">
    ${HeroBanner()}
    ${ServiceInfoSection()}
    ${HowItWorks()}
    ${SecurePaymentsSection()}
    ${RefundPolicySection()}
    ${ShippingSection()}
    ${AfterSalesSection()}
    ${TestimonialsSection()}
    ${TradeAssuranceFooterCards()}
  </main>

  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>
  ${FloatingPanel()}
`

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */

initMegaMenu()
initFlowbite()
startAlpine()
initStickyHeaderSearch()
initMobileDrawer()
initLanguageSelector()

// Initialize Swiper for testimonials
new Swiper('.testimonial-swiper', {
  modules: [Navigation, Pagination],
  slidesPerView: 1,
  spaceBetween: 30,
  loop: true,
  navigation: {
    nextEl: '.testimonial-next',
    prevEl: '.testimonial-prev',
  },
  pagination: {
    el: '.testimonial-pagination',
    clickable: true,
    renderBullet(_index: number, className: string) {
      return `<span class="${className}" style="width:12px;height:12px;border-radius:50%;display:inline-block;cursor:pointer;background:rgba(0,0,0,0.25);transition:background 0.2s"></span>`
    },
  },
  on: {
    init(swiper) {
      // Override Swiper's absolute positioning on pagination
      const pg = swiper.pagination.el as HTMLElement | null
      if (pg) {
        pg.style.position = 'static'
        pg.style.width = 'auto'
      }
    },
    paginationUpdate(swiper) {
      // Mark active bullet
      const bullets = swiper.pagination.bullets
      if (bullets) {
        bullets.forEach((b: HTMLElement, i: number) => {
          b.style.background = i === swiper.realIndex ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.25)'
        })
      }
    },
  },
})

// Auto-play videos when they scroll into view (IntersectionObserver)
const autoPlayVideos = document.querySelectorAll<HTMLVideoElement>('.auto-play-video')
if (autoPlayVideos.length) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target as HTMLVideoElement
      if (entry.isIntersecting) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, { threshold: 0.3 })
  autoPlayVideos.forEach(v => videoObserver.observe(v))
}

