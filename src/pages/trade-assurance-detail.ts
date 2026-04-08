/**
 * Trade Assurance Detay — "Daha fazla bilgi" sayfası
 * iSTOC'taki "iSTOC.com'da ödemeden teslimata korumadan faydalanın" detay sayfası
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
import taLogoUrl from '../assets/images/ta-logo.svg'
import guvenliOdemeVideo from '../assets/video/güvenliödeme video.mp4'
import taShieldPattern from '../assets/images/ta-shield-pattern.svg'
import videoPaymentImg from '../assets/images/videopayment.avif'
import kargoVideo from '../assets/video/kargo.mp4'
import limanImg from '../assets/images/liman.avif'
import serviceVideo from '../assets/video/service.mp4'

/* ═══════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════ */

function HeroSection(): string {
  return `
    <section class="relative overflow-hidden" style="min-height:440px">
      <img src="${tradeAssuranceBg}" alt="" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
      <div class="relative z-10 container-boxed px-4 sm:px-6 lg:px-8 flex items-center" style="min-height:440px">
        <div class="max-w-[640px]">
          <h1 class="text-3xl sm:text-4xl lg:text-[48px] font-bold text-white leading-tight mb-6">
            iSTOC'da ödemeden teslimata korumadan faydalanın
          </h1>
          <a href="#process" class="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-7 py-3.5 text-base transition-colors shadow-lg">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Süreç şu şekilde işler:
          </a>
        </div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 h-2 bg-[#FFC200]"></div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SERVICE INFO (sarı bölüm + istatistikler)
   ═══════════════════════════════════════════════════════════════ */

function ServiceInfo(): string {
  return `
    <section class="relative overflow-hidden" style="background-color:#FFC200; padding:74px 0">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div class="lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              Trade Assurance, satın alım yolculuğunuzun her aşamasını kapsar
            </h2>
            <p class="text-gray-800 text-base leading-relaxed mb-6">
              iSTOC'daki alıcılara güvenli ödeme yapma imkanı sunuyoruz, ürün veya nakliye sorunları gibi öngörülemeyen durumlara karşı koruma sağlıyoruz ve satın almayla ilgili sorunları çözmek için alıcılarla tedarikçiler arasında arabuluculuk yapıyoruz.
            </p>
            <div class="inline-flex items-center gap-2">
              <img src="${taLogoUrl}" alt="Trade Assurance" class="h-6" />
              <span class="font-bold text-gray-900 text-sm">Trade Assurance</span>
            </div>
          </div>
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
   PROCESS SECTION — 4 adım detaylı
   ═══════════════════════════════════════════════════════════════ */

function processStep(num: string, title: string, desc: string): string {
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

function ProcessSection(): string {
  return `
    <section id="process" class="bg-white py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-4">
          iSTOC'da ödemelerinizi nasıl koruyoruz?
        </h2>
        <p class="text-gray-600 text-base sm:text-lg text-center max-w-[800px] mx-auto mb-14">
          Trade Assurance, küresel olarak iş yapmayı hem alıcılar hem de satıcılar için daha kolay ve daha güvenli hale getirir. Süreç şu şekilde işler:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-[1000px] mx-auto mb-16">
          ${processStep('01', 'Trade Assurance siparişini başlat', 'iSTOC\'da bir tedarikçiyle sipariş anlaşması yaptınız. Tedarikçi, siparişinizi onaylar ve ürününüzü hazırlamaya başlar.')}
          ${processStep('02', 'iSTOC üzerinden ödeme yapın', 'Bir çevrimiçi ödeme yöntemiyle satın alın veya iSTOC aracılığıyla banka havalesi yapın. Tüm ödemeler SSL şifreleme ile korunur.')}
          ${processStep('03', 'Ödeme geçici olarak tutuluyor', 'Ödemeniz emanette tutuluyor. Siz ürünü teslim alıp onayladıktan sonra tedarikçiye gönderilecek. Bu, her iki taraf için de güvence sağlar.')}
          ${processStep('04', 'Sipariş koşulları karşılanmazsa paranızı geri alın', 'Para iadelerinde ve sorunlu siparişlerde tazminat talebinde bulunduğunuzda bir çözüme ulaşmanız için size yardımcı olacağız.')}
        </div>

        <!-- Video (auto-play on scroll) -->
        <div class="mx-auto">
          <video id="escrow-video" class="w-full" muted playsinline preload="metadata" loop>
            <source src="${guvenliOdemeVideo}" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  `
}


/* ═══════════════════════════════════════════════════════════════
   WHAT'S COVERED DETAILED
   ═══════════════════════════════════════════════════════════════ */

function WhatsCovered(): string {
  return `
    <section class="relative overflow-hidden" style="background-color:#FFC200; background-image:url('${taShieldPattern}'); background-size:cover; background-position:center; padding:80px 0 110px;">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-10">Kapsamdakiler</h2>

        <!-- 4 Card Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <!-- 1: Güvenli Ödemeler -->
          <a href="/pages/info/payments.html" class="block bg-white rounded-2xl p-6 pt-7 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-5" style="background:#FFF3C4">
              <svg class="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Güvenli ve kolay ödemeler</h3>
          </a>

          <!-- 2: Para İade -->
          <a href="/pages/info/refund-policy.html" class="block bg-white rounded-2xl p-6 pt-7 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-5" style="background:#FFF3C4">
              <svg class="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Para iade politikası</h3>
          </a>

          <!-- 3: Kargo & Lojistik -->
          <a href="/pages/info/shipping-logistics.html" class="block bg-white rounded-2xl p-6 pt-7 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-5" style="background:#FFF3C4">
              <svg class="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Gönderim ve lojistik hizmetleri</h3>
          </a>

          <!-- 4: Satış Sonrası -->
          <a href="/pages/info/after-sales.html" class="block bg-white rounded-2xl p-6 pt-7 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-5" style="background:#FFF3C4">
              <svg class="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Satış sonrası korumaları</h3>
          </a>

        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   PAYMENT HERO SECTION
   ═══════════════════════════════════════════════════════════════ */

function PaymentHeroSection(): string {
  return `
    <section class="bg-white py-12 sm:py-16 lg:py-20">
      <div class="container-boxed px-3 sm:px-4 lg:px-6">
        <div class="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          <!-- Left: Text Content -->
          <div class="w-full lg:w-1/2 max-w-[500px]">
            <h2 class="text-3xl sm:text-4xl lg:text-[42px] font-bold text-gray-900 leading-tight mb-6">
              Güvenli ve çeşitli ödeme seçenekleri
            </h2>
            <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
              iSTOC aracılığıyla yaptığınız her ödeme şifrelenmiştir, güvenlidir ve 2 saat gibi kısa bir sürede işlenir.
            </p>
            <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
              Kredi/banka kartları, dijital cüzdanlar, doğrudan banka hesabına transferler ve esnek ödeme planları* dahil olmak üzere bildiğiniz ve güvendiğiniz ödeme yöntemlerini destekliyoruz.
            </p>
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <a href="#" class="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-6 py-3 text-sm sm:text-base transition-colors">
                Destekleyici ürünleri tedarik edin
              </a>
              <a href="#" class="inline-flex items-center justify-center border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold rounded-full px-6 py-3 text-sm sm:text-base transition-colors">
                Nasıl çalıştığını öğrenin
              </a>
            </div>
            <p class="text-gray-400 text-xs">*Uygun alıcılar için</p>
          </div>

          <!-- Right: Media -->
          <div class="w-full lg:w-1/2">
            <div class="rounded-2xl overflow-hidden shadow-lg">
              <img src="${videoPaymentImg}" alt="Güvenli ödeme" class="w-full h-auto object-cover" />
            </div>
          </div>

        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   REFUND POLICY SECTION
   ═══════════════════════════════════════════════════════════════ */

function RefundPolicySection(): string {
  return `
    <section class="bg-[#f5f5f5] py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-3 sm:px-4 lg:px-6">
        <div class="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          <!-- Left: Video -->
          <div class="w-full lg:w-1/2">
            <video id="kargo-video" class="w-full rounded-2xl shadow-lg" muted playsinline preload="metadata" loop>
              <source src="${kargoVideo}" type="video/mp4" />
            </video>
          </div>

          <!-- Right: Text Content -->
          <div class="w-full lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
              Para iade politikası
            </h2>
            <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
              Siparişiniz gönderilmezse, kaybolursa veya kusurlu, yanlış, hasarlı veya başka bir sorunla elinize ulaşırsa paranızı geri almak için para iadesi talebinde bulunun.
            </p>
            <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
              Uygun bir ülkede* bulunuyorsanız kusurlu ürünleri yerel olarak ücretsiz iade etmek için Easy Return hizmetimizden de yararlanabilirsiniz.
            </p>
            <div class="flex flex-wrap items-center gap-3 mb-6">
              <a href="/pages/info/refund-policy.html" class="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-6 py-3 text-sm sm:text-base transition-colors">
                Destekleyici ürünleri tedarik edin
              </a>
              <a href="/pages/info/refund-policy.html" class="inline-flex items-center justify-center border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold rounded-full px-6 py-3 text-sm sm:text-base transition-colors">
                Nasıl çalıştığını öğrenin
              </a>
            </div>
            <p class="text-gray-400 text-sm">*Uygun ülkelerin listesi için <a href="#" class="underline hover:text-gray-600">buraya</a> tıklayın</p>
          </div>

        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   SHIPPING SECTION
   ═══════════════════════════════════════════════════════════════ */

function ShippingSection(): string {
  return `
    <section class="bg-white py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-3 sm:px-4 lg:px-6">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
          Gönderim ve lojistik hizmetleri
        </h2>
        <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
          Siparişiniz planlanan tarihte teslim edilsin veya gecikme için bir tazminat alın.
        </p>
        <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
          iSTOC Logistics ile lojistik ağımızın güvenilirliğinden yararlanabilir ve gönderinizi dünyanın birçok ülkesi ve bölgesinde gerçek zamanlı olarak takip edebilirsiniz.
        </p>
        <div class="mb-10">
          <a href="/pages/info/shipping-logistics.html" class="inline-flex items-center justify-center border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold rounded-full px-6 py-3 text-sm sm:text-base transition-colors">
            Nasıl çalıştığını öğrenin
          </a>
        </div>
        <div class="rounded-2xl overflow-hidden shadow-lg">
          <img src="${limanImg}" alt="Gönderim ve lojistik" class="w-full h-auto object-cover" />
        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   AFTER SALES SECTION
   ═══════════════════════════════════════════════════════════════ */

function AfterSalesSection(): string {
  return `
    <section class="bg-[#f5f5f5] py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-3 sm:px-4 lg:px-6">
        <div class="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          <!-- Left: Video -->
          <div class="w-full lg:w-1/2">
            <video id="service-video" class="w-full rounded-2xl shadow-lg" muted playsinline preload="metadata" loop>
              <source src="${serviceVideo}" type="video/mp4" />
            </video>
          </div>

          <!-- Right: Text Content -->
          <div class="w-full lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
              Satış sonrası korumaları
            </h2>
            <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
              Uygun ürünlerde yerinde kurulum, bakım, onarım ve ücretsiz yedek parça hizmetlerimizle hizmet kapınıza gelsin.
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <a href="/pages/info/after-sales.html" class="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-6 py-3 text-sm sm:text-base transition-colors">
                Destekleyici ürünleri tedarik edin
              </a>
              <a href="/pages/info/after-sales.html" class="inline-flex items-center justify-center border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold rounded-full px-6 py-3 text-sm sm:text-base transition-colors">
                Nasıl çalıştığını öğrenin
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS SECTION
   ═══════════════════════════════════════════════════════════════ */

const testimonials = [
  {
    quote: '"İşlem süresince hem tedarikçinin hem de kendimin koruma altında olduğunu bilmek içimi rahatlatıyor."',
    company: 'Nodnal',
    name: 'Brandon Cubina',
  },
  {
    quote: '"iSTOC sayesinde uluslararası tedarikçilerle güvenle çalışabiliyoruz. Ödeme koruması gerçekten işe yarıyor."',
    company: 'TechSupply',
    name: 'Ayşe Demir',
  },
  {
    quote: '"Satış sonrası destek ve para iade politikası bizi iSTOC\'a bağlayan en önemli faktörler."',
    company: 'GlobalTrade',
    name: 'Mehmet Yılmaz',
  },
]

function TestimonialsSection(): string {
  return `
    <section class="relative overflow-hidden py-16 sm:py-20 lg:py-24" style="background-color:#FFC200; background-image:url('${taShieldPattern}'); background-size:cover; background-position:center;">
      <div class="container-boxed px-3 sm:px-4 lg:px-6">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-3">Alıcı sesleri</h2>
        <p class="text-gray-800 text-base sm:text-lg text-center mb-10">
          Trade Assurance'ın sizin gibi diğer insanlara nasıl avantajlar sağladığını öğrenin.
        </p>

        <!-- Swiper -->
        <div class="swiper testimonials-swiper max-w-[900px] mx-auto">
          <div class="swiper-wrapper">
            ${testimonials.map(item => `
              <div class="swiper-slide">
                <div class="text-center">
                  <div class="relative rounded-2xl overflow-hidden shadow-xl mb-8 mx-auto max-w-[800px] bg-gray-200 aspect-video flex items-center justify-center">
                    <div class="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                      <svg class="w-8 h-8 text-gray-700 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <p class="text-gray-900 text-base sm:text-lg font-semibold leading-relaxed mb-6 max-w-[800px] mx-auto">
                    ${item.quote}
                  </p>
                  <p class="text-gray-700 text-sm">${item.company}</p>
                  <p class="text-gray-900 font-bold text-sm">${item.name}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Navigation + Pagination -->
        <div class="flex items-center justify-center gap-5 mt-10">
          <button class="testimonials-prev w-10 h-10 shrink-0 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors text-gray-900">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <div class="testimonials-pagination !w-auto flex items-center gap-2"></div>
          <button class="testimonials-next w-10 h-10 shrink-0 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors text-gray-900">
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
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <main class="flex-1 min-w-0">
    ${HeroSection()}
    ${ServiceInfo()}
    ${ProcessSection()}
    ${WhatsCovered()}
    ${PaymentHeroSection()}
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

initMegaMenu()
initFlowbite()
startAlpine()
initStickyHeaderSearch()
initMobileDrawer()
initLanguageSelector()

// Init testimonials slider
new Swiper('.testimonials-swiper', {
  modules: [Navigation, Pagination],
  slidesPerView: 1,
  spaceBetween: 30,
  navigation: {
    prevEl: '.testimonials-prev',
    nextEl: '.testimonials-next',
  },
  pagination: {
    el: '.testimonials-pagination',
    clickable: true,
    bulletClass: 'swiper-pagination-bullet w-3.5 h-3.5 rounded-full border-2 border-gray-900 bg-transparent cursor-pointer transition-colors inline-block opacity-100',
    bulletActiveClass: '!bg-gray-900',
  },
  on: {
    slideChange() {
      document.querySelectorAll<HTMLVideoElement>('.testimonial-video').forEach(v => v.pause())
    }
  }
})

// Auto-play videos on scroll
document.querySelectorAll<HTMLVideoElement>('#escrow-video, #kargo-video, #service-video').forEach(video => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play()
      } else {
        video.pause()
      }
    })
  }, { threshold: 0.3 })
  observer.observe(video)
})
