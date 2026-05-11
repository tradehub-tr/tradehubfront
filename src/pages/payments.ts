/**
 * Güvenli ve Esnek Ödeme Yöntemleri — Ticari Güvence ödeme bilgilendirme sayfası
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { TradeAssuranceFooterCards } from '../components/shared/TradeAssuranceFooterCards'
import { TradeAssuranceBadge } from '../components/shared/TradeAssuranceBadge'
import guvenliOdemelerImg from '../assets/images/güvenliödemeler.avif'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar({ hideNotice: true })}
    ${SubHeader()}
  </div>
  ${MegaMenu()}

  <main class="flex-1 min-w-0">

    <!-- ═══ HERO BANNER ═══ -->
    <section class="relative w-full overflow-hidden" style="min-height:320px">
      <img src="${guvenliOdemelerImg}" alt="Güvenli ödeme" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent"></div>
      <div class="relative container-boxed px-3 sm:px-4 lg:px-6 flex flex-col justify-center" style="min-height:320px">
        <div class="max-w-[550px] py-12 sm:py-16 lg:py-20">
          ${TradeAssuranceBadge({ className: 'mb-3' })}
          <h1 class="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight mb-4">
            Güvenli ve esnek ödeme yöntemleri
          </h1>
          <p class="text-white/80 text-base sm:text-lg">
            Basit, şeffaf B2B ödemeleri
          </p>
        </div>
      </div>
    </section>

    <!-- Breadcrumb -->
    <div class="bg-white border-b border-gray-100">
      <div class="container-boxed px-3 sm:px-4 lg:px-6 py-4">
        <nav class="flex items-center gap-2 text-sm text-gray-500">
          <a href="/pages/info/trade-assurance-detail.html" class="hover:text-gray-700 transition-colors">Ticari Güvence</a>
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
          <span class="text-gray-700">Güvenli ve esnek ödeme yöntemleri</span>
        </nav>
      </div>
    </div>

    <!-- ═══ MAIN CONTENT ═══ -->
    <section class="bg-white py-12 sm:py-16 lg:py-20">
      <div class="container-boxed px-3 sm:px-4 lg:px-6">

        <!-- Main Heading -->
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
          iSTOC ödemelerinizi nasıl güvenli tutar?
        </h2>
        <p class="text-gray-600 text-base sm:text-lg leading-relaxed max-w-[900px] mb-12">
          iSTOC üzerinden yapılan tüm ödemeler platform üzerinden yönetilir ve sipariş sürecine entegre şekilde takip edilir.
          <strong class="text-gray-900">Ödemenizi korumak için asla platform dışında ödeme yapmayın.</strong>
        </p>

        <!-- 4 Payment Methods -->
        <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Desteklenen ödeme yöntemleri</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

          <!-- Method 1: Banka Havalesi -->
          <div class="border border-gray-200 rounded-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4" style="background-color:#FFE285">
              <svg class="w-7 h-7" fill="none" stroke="#222" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Banka Havalesi</h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-3">
              iSTOC'un resmi banka hesabına havale yaparak siparişinizi tamamlayın. Havale sonrası dekontunuzu platform üzerinden yükleyerek ödemenizi belgeleyin.
            </p>
            <div class="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              <span>Dekont yükleme desteği</span>
            </div>
          </div>

          <!-- Method 2: EFT -->
          <div class="border border-gray-200 rounded-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4" style="background-color:#FFE285">
              <svg class="w-7 h-7" fill="none" stroke="#222" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">EFT / Havale</h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-3">
              Anlık elektronik fon transferi ile siparişinizi hızlıca tamamlayın. İşlem tarihi, tutarı ve gönderen bilgileri sipariş detaylarınıza otomatik kaydedilir.
            </p>
            <div class="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              <span>İşlem bilgileri otomatik kaydedilir</span>
            </div>
          </div>

          <!-- Method 3: Çek / Senet -->
          <div class="border border-gray-200 rounded-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4" style="background-color:#FFE285">
              <svg class="w-7 h-7" fill="none" stroke="#222" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Çek / Senet</h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-3">
              Vadeli ticari ödemeleriniz için çek veya senet ile ödeme seçeneği. B2B ticaretin klasik yöntemlerini platform güvencesi altında kullanın.
            </p>
            <div class="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              <span>Vadeli ödeme desteği</span>
            </div>
          </div>

          <!-- Method 4: Elden Taksit -->
          <div class="border border-gray-200 rounded-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4" style="background-color:#FFE285">
              <svg class="w-7 h-7" fill="none" stroke="#222" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Elden Taksit</h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-3">
              Satıcı ile doğrudan anlaşmalı taksitli ödeme seçeneği. Büyük hacimli siparişlerde satıcıyla taksit planı oluşturabilirsiniz.
            </p>
            <div class="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              <span>Satıcıyla anlaşmalı plan</span>
            </div>
          </div>

        </div>

        <!-- Currency Support Banner -->
        <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 p-6 sm:p-8 mb-16">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div class="flex-shrink-0 w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
              <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-2">5 farklı para biriminde alım-satım</h3>
              <p class="text-gray-700 text-sm sm:text-base leading-relaxed mb-3">
                iSTOC üzerinde Türk Lirası (TRY), ABD Doları (USD), Euro (EUR), İngiliz Sterlini (GBP) ve Çin Yuanı (CNY) ile ödeme yapabilir ve satış gerçekleştirebilirsiniz.
              </p>
              <div class="flex flex-wrap gap-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-gray-800">₺ TRY</span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-gray-800">$ USD</span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-gray-800">€ EUR</span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-gray-800">£ GBP</span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-gray-800">¥ CNY</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ ORDER PROCESS SECTION ═══ -->
        <h2 id="process" class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-10">
          Ödeme süreci nasıl işler?
        </h2>

        <div class="mb-16">

          <!-- Step 1 -->
          <div class="flex items-stretch gap-7 relative">
            <div class="flex flex-col items-center flex-shrink-0">
              <div class="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-900 font-bold text-base">01</div>
              <div class="w-0.5 bg-gray-300 flex-1"></div>
            </div>
            <div class="pb-10" style="padding-top:10px">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-2">Tedarikçinizi bulun ve siparişi oluşturun</h3>
              <p style="color:#444;font-size:16px" class="leading-relaxed">
                iSTOC üzerinden ürününüzü seçin, tedarikçiyle anlaşın ve siparişinizi başlatın. Hazır ürünlerde doğrudan, özel üretimlerde tedarikçiyle mesajlaşarak detayları belirleyin.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex items-stretch gap-7 relative">
            <div class="flex flex-col items-center flex-shrink-0">
              <div class="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-900 font-bold text-base">02</div>
              <div class="w-0.5 bg-gray-300 flex-1"></div>
            </div>
            <div class="pb-10" style="padding-top:10px">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-2">Ödeme yönteminizi seçin</h3>
              <p style="color:#444;font-size:16px" class="leading-relaxed">
                Banka havalesi, EFT, çek/senet veya elden taksit seçeneklerinden size uygun olanı seçin. Para birimini de (TRY, USD, EUR, GBP, CNY) ihtiyacınıza göre belirleyin.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex items-stretch gap-7 relative">
            <div class="flex flex-col items-center flex-shrink-0">
              <div class="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-900 font-bold text-base">03</div>
              <div class="w-0.5 bg-gray-300 flex-1"></div>
            </div>
            <div class="pb-10" style="padding-top:10px">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-2">Ödemenizi yapın ve dekontu yükleyin</h3>
              <p style="color:#444;font-size:16px" class="leading-relaxed">
                Havale veya EFT yöntemlerinde dekontunuzu "Siparişlerim > Sipariş Detayları" sayfası üzerinden yükleyin. Platform gönderen adı, tarih ve tutarı otomatik olarak kaydeder.
              </p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="flex items-start gap-7 relative">
            <div class="flex flex-col items-center flex-shrink-0">
              <div class="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-900 font-bold text-base">04</div>
            </div>
            <div style="padding-top:10px">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-2">Sipariş onayı ve takip</h3>
              <p style="color:#444;font-size:16px" class="leading-relaxed">
                Ödeme doğrulandıktan sonra satıcı siparişinizi hazırlamaya başlar. Sürecin her aşamasını "Siparişlerim" sayfasından takip edebilirsiniz.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- ═══ FOOTER CARDS ═══ -->
    ${TradeAssuranceFooterCards()}

  </main>

  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>
  ${FloatingPanel()}
`;

initMegaMenu();
initFlowbite();
startAlpine();
initStickyHeaderSearch();
initMobileDrawer();
initLanguageSelector();
