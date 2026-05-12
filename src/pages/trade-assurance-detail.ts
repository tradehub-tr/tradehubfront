/**
 * Ticari Güvence Detay — "Daha fazla bilgi" sayfası
 * iSTOC'taki "Ticari Güvence Sistemi ile Güvenli Ticaret" detay sayfası
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { TradeAssuranceFooterCards } from '../components/shared/TradeAssuranceFooterCards'

import tradeAssuranceBg from '../assets/images/Trade Assurance.avif'
import taLogoUrl from '../assets/images/ta-logo.svg'
import taShieldPattern from '../assets/images/ta-shield-pattern.svg'
import limanImg from '../assets/images/liman.avif'

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
            Ticari Güvence Sistemi ile Güvenli Ticaret
          </h1>
          <p class="text-white/90 text-base sm:text-lg leading-relaxed mb-6">
            İşlemlerinizin her aşamasında güven ve şeffaflık sağlayarak, uzun vadeli iş ortaklıkları kurmanıza yardımcı oluyoruz.
          </p>
          <a href="#process" class="th-btn inline-flex items-center gap-2 font-semibold px-7 py-3.5 text-base shadow-lg">
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
   SERVICE INFO (sarı bölüm + 6 sistem özelliği)
   ═══════════════════════════════════════════════════════════════ */

function featureItem(iconPath: string, title: string, desc: string): string {
  return `
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}"/>
        </svg>
      </div>
      <div>
        <div class="font-bold text-gray-900 text-base">${title}</div>
        <p class="text-gray-800 text-sm mt-1">${desc}</p>
      </div>
    </div>
  `
}

function ServiceInfo(): string {
  return `
    <section class="relative overflow-hidden" style="background-color:#FFC200; padding:74px 0">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div class="lg:w-1/2">
            <h2 class="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 leading-tight mb-6">
              Ticari Güvence, satın alım yolculuğunuzun her aşamasını kapsar
            </h2>
            <p class="text-gray-800 text-base leading-relaxed mb-6">
              İstoc Ticari Güvence Sistemi, alıcı ve satıcılar arasında sorunsuz ticaretin temelini oluşturur. Güvenli ödeme, tarafsız çözüm mekanizmaları ve uçtan uca takip ile öngörülemeyen durumlara karşı koruma sağlıyoruz.
            </p>
            <div class="inline-flex items-center gap-2">
              <img src="${taLogoUrl}" alt="Ticari Güvence" class="h-6" />
              <span class="font-bold text-gray-900 text-sm">Ticari Güvence</span>
            </div>
          </div>
          <div class="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            ${featureItem(
              'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
              'Dijital Ödeme Kanalları',
              'Çoklu ödeme yöntemleriyle hızlı ve güvenli işlem.'
            )}
            ${featureItem(
              'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
              'Otomatik Kalite Kontrol',
              'Her siparişte otomatik ürün kalite kontrol süreçleri.'
            )}
            ${featureItem(
              'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
              'Akıllı Sözleşmeler',
              'Tarafların haklarını otomatik olarak güvence altına alır.'
            )}
            ${featureItem(
              'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
              'Ödeme Güvenliği',
              'SSL şifreleme ve bloke hesap koruması.'
            )}
            ${featureItem(
              'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
              'İade ve Değişim',
              'Sorunsuz iade ve değişim politikaları desteği.'
            )}
            ${featureItem(
              'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
              'Tarafsız Çözüm',
              'Anlaşmazlıklarda tarafsız hakemlik mekanizması.'
            )}
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
          Ticari Güvence, alıcı ve satıcılar arasındaki işlemleri her iki taraf için de daha kolay ve daha güvenli hale getirir. Süreç şu şekilde işler:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-[1000px] mx-auto mb-16">
          ${processStep('01', 'Ticari Güvence siparişini başlat', 'iSTOC\'da bir tedarikçiyle sipariş anlaşması yaptınız. Tedarikçi, siparişinizi onaylar ve ürününüzü hazırlamaya başlar.')}
          ${processStep('02', 'iSTOC üzerinden ödeme yapın', 'Kredi kartı, doğrudan borçlandırma veya banka havalesi ile güvenle ödeme yapın. Tüm ödemeler SSL şifreleme ile korunur.')}
          ${processStep('03', 'Ödeme bloke hesapta tutulur', 'Ödemeniz, ürün teslim edilip onaylandığı ana kadar bloke hesapta tutulur. Bu, her iki taraf için de güvence sağlar.')}
          ${processStep('04', 'Sorun olursa paranızı geri alın', 'Sipariş koşulları karşılanmazsa, özel temsilciniz süreci takip eder ve paranızın iade edilmesi için size yardımcı olur.')}
        </div>
      </div>
    </section>
  `
}


/* ═══════════════════════════════════════════════════════════════
   WHAT'S COVERED — 4 temel garanti
   ═══════════════════════════════════════════════════════════════ */

function WhatsCovered(): string {
  return `
    <section class="relative overflow-hidden" style="background-color:#FFC200; background-image:url('${taShieldPattern}'); background-size:cover; background-position:center; padding:80px 0 110px;">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-4">Kapsamdakiler</h2>
        <p class="text-gray-800 text-base sm:text-lg text-center max-w-[800px] mx-auto mb-10">
          Ticari Güvence Sistemi ile sahip olduğunuz temel garantiler
        </p>

        <!-- 4 Card Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <!-- 1: Güvenli Ödeme -->
          <a href="/pages/info/payments.html" class="block bg-white rounded-md p-6 pt-7 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-5" style="background:#FFF3C4">
              <svg class="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Güvenli Ödeme</h3>
            <p class="text-gray-600 text-sm leading-relaxed">Kredi kartı ve doğrudan borçlandırma ile yapılan ödemeler, sipariş tamamlanana kadar bloke hesapta güvenle tutulur.</p>
          </a>

          <!-- 2: Para İade Garantisi -->
          <a href="/pages/info/refund-policy.html" class="block bg-white rounded-md p-6 pt-7 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-5" style="background:#FFF3C4">
              <svg class="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Para İade Garantisi</h3>
            <p class="text-gray-600 text-sm leading-relaxed">Siparişle ilgili bir problem yaşanırsa paranızın iadesi güvence altındadır.</p>
          </a>

          <!-- 3: Özel Temsilci -->
          <a href="#" class="block bg-white rounded-md p-6 pt-7 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-5" style="background:#FFF3C4">
              <svg class="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Özel Temsilci</h3>
            <p class="text-gray-600 text-sm leading-relaxed">Siparişiniz eksiksiz tamamlanana kadar özel bir temsilci süreci sizin için takip eder.</p>
          </a>

          <!-- 4: Tam Güvence -->
          <a href="#" class="block bg-white rounded-md p-6 pt-7 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-5" style="background:#FFF3C4">
              <svg class="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2.25l8.954 5.371a.75.75 0 01.046.253v4.5c0 5.625-3.75 9.127-9 10.875-5.25-1.748-9-5.25-9-10.875v-4.5a.75.75 0 01.046-.253L12 2.25z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Tam Güvence</h3>
            <p class="text-gray-600 text-sm leading-relaxed">Üretimden teslimata kadar tüm aşamalar iSTOC ekibi tarafından izlenir; aksaklıkta tarafsız hakemlik devreye girer.</p>
          </a>

        </div>
      </div>
    </section>
  `
}

/* ═══════════════════════════════════════════════════════════════
   TWO-LAYER PROTECTION — Sistem nasıl çalışır? (iki katmanlı koruma)
   ═══════════════════════════════════════════════════════════════ */

function TwoLayerProtection(): string {
  return `
    <section class="bg-white py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-4">
          Sistem Nasıl Çalışır?
        </h2>
        <p class="text-gray-600 text-base sm:text-lg text-center max-w-[800px] mx-auto mb-14">
          Ticari Güvence Sistemi, siparişinizin türüne göre iki katmanlı koruma sunar.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-[1100px] mx-auto">

          <!-- Katman 1: Para Güvencesi -->
          <div class="bg-[#f9f9f9] rounded-lg p-8 border-t-4 border-amber-500">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">1</div>
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Para Güvencesi</h3>
            </div>
            <p class="text-gray-700 text-base leading-relaxed mb-4">
              Alıcının ödemesi, ürün teslim edilene kadar bloke edilir.
            </p>
            <p class="text-gray-700 text-base leading-relaxed">
              Sipariş eksiksiz tamamlandıktan sonra para satıcıya aktarılır. Tüm standart siparişlerde otomatik olarak devreye girer.
            </p>
          </div>

          <!-- Katman 2: Tam Güvence -->
          <div class="bg-[#f9f9f9] rounded-lg p-8 border-t-4 border-red-600">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg">2</div>
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Tam Güvence</h3>
            </div>
            <p class="text-gray-700 text-base leading-relaxed mb-4">
              Özel üretim veya baskılı ürün siparişlerinde daha kapsamlı koruma sağlanır. Sistem şunları garantiler:
            </p>
            <ul class="space-y-2.5">
              <li class="flex items-start gap-2 text-gray-700 text-sm">
                <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Ürün hazırlanmasından kargolanmasına kadar tüm adımların iSTOC ekibi tarafından takibi</span>
              </li>
              <li class="flex items-start gap-2 text-gray-700 text-sm">
                <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Müşteriye eksiksiz ve kusursuz teslimatın yapılması</span>
              </li>
              <li class="flex items-start gap-2 text-gray-700 text-sm">
                <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Ürün doğruluğu, kalite kontrolü ve zamanında teslimat kontrolü</span>
              </li>
              <li class="flex items-start gap-2 text-gray-700 text-sm">
                <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Gerekirse ürün kurulumu ve sevkiyat desteği</span>
              </li>
              <li class="flex items-start gap-2 text-gray-700 text-sm">
                <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Şartlar yerine getirilmediğinde para iadesi veya satıcıya tazminat uygulanması</span>
              </li>
            </ul>
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
    <section class="bg-[#f5f5f5] py-16 sm:py-20 lg:py-24">
      <div class="container-boxed px-3 sm:px-4 lg:px-6">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
          Gönderim ve lojistik hizmetleri
        </h2>
        <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
          Siparişinize uygun kargo tipini seçin — Express, Hava, Deniz, Kara veya Standart kargo seçenekleri mevcuttur.
        </p>
        <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
          Siparişiniz kargoya verildiğinde takip numarası ve kargo firması bilgisi otomatik olarak sipariş detaylarınıza eklenir. Kargoya verildiği andan teslim alınana kadar süreci platform üzerinden izleyebilirsiniz.
        </p>
        <div class="mb-10">
          <a href="/pages/info/shipping-logistics.html" class="inline-flex items-center justify-center border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold rounded-full px-6 py-3 text-sm sm:text-base transition-colors">
            Nasıl çalıştığını öğrenin
          </a>
        </div>
        <div class="rounded-md overflow-hidden shadow-lg">
          <img src="${limanImg}" alt="Gönderim ve lojistik" class="w-full h-auto object-cover" />
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
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <main class="flex-1 min-w-0">
    ${HeroSection()}
    ${ServiceInfo()}
    ${ProcessSection()}
    ${WhatsCovered()}
    ${TwoLayerProtection()}
    ${ShippingSection()}
    ${TradeAssuranceFooterCards()}
  </main>

  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>
  ${FloatingPanel()}
`

initMegaMenu()
initFlowbite()
mountChatPopup();
initChatTriggers();
startAlpine()
initStickyHeaderSearch()
initMobileDrawer()
initLanguageSelector()
