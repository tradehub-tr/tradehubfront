/**
 * Güvenli ve Kolay Ödemeler — Trade Assurance Payment Page
 * iSTOC Trade Assurance tarzında tasarlanmış ödeme bilgilendirme sayfası
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { TradeAssuranceFooterCards } from '../components/shared/TradeAssuranceFooterCards'
import guvenliOdemelerImg from '../assets/images/güvenliödemeler.avif'
import taLogoUrl from '../assets/images/ta-logo.svg'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
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
          <div class="inline-flex items-center px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm mb-2">
            <img src="${taLogoUrl}" alt="Trade Assurance" class="h-7 sm:h-8" />
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight mb-4">
            Güvenli ve çeşitli ödeme seçenekleri
          </h1>
          <p class="text-white/80 text-base sm:text-lg">
            Karmaşık olmayan B2B ödemeleri
          </p>
        </div>
      </div>
    </section>

    <!-- Breadcrumb -->
    <div class="bg-white border-b border-gray-100">
      <div class="container-boxed px-3 sm:px-4 lg:px-6 py-4">
        <nav class="flex items-center gap-2 text-sm text-gray-500">
          <a href="/pages/info/trade-assurance-detail.html" class="hover:text-gray-700 transition-colors">Trade Assurance</a>
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
          <span class="text-gray-700">Güvenli ve çeşitli ödeme seçenekleri</span>
        </nav>
      </div>
    </div>

    <!-- ═══ MAIN CONTENT ═══ -->
    <section class="bg-white py-12 sm:py-16 lg:py-20">
      <div class="container-boxed px-3 sm:px-4 lg:px-6">

        <!-- Main Heading -->
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
          iSTOC nasıl ödemelerinizi güvenli ve basit tutar?
        </h2>
        <p class="text-gray-600 text-base sm:text-lg leading-relaxed max-w-[900px] mb-12">
          iSTOC üzerinden yapılan her ödeme SSL şifrelidir, PCI DSS uyumludur ve gerçek zamanlı olarak işleme alınır.
          Ödemenizi korumak için asla platform dışında ödeme yapmayın.
        </p>

        <!-- Two Feature Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">

          <!-- Card 1: İstediğiniz gibi ödeyin -->
          <div class="border border-gray-200 rounded-md hover:shadow-lg transition-shadow duration-300" style="padding:36px 19px 30px 30px">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mb-5" style="background-color:#FFE285">
              <svg class="w-8 h-8" viewBox="0 0 50 50" fill="none">
                <path d="M33.9285714,5.95238095 C37.6269068,5.95238095 40.625,8.96223137 40.625,12.67507 C40.625,16.3879087 37.6269068,19.3977591 33.9285714,19.3977591 C32.06392,19.3977591 30.377273,18.6326424 29.1631379,17.3980713 L24.498854,20.9113809 C24.8109828,21.8046044 24.9861953,22.7624836 24.9992175,23.7596455 L32.6655168,26.3258058 C33.6703576,24.8489324 35.3608084,23.8795518 37.2767857,23.8795518 C40.3587319,23.8795518 42.8571429,26.3877605 42.8571429,29.4817927 C42.8571429,32.5758249 40.3587319,35.0840336 37.2767857,35.0840336 C34.2125174,35.0840336 31.7251092,32.6045162 31.6966748,29.534976 L24.404768,27.1042798 C23.9035821,28.4087626 23.1072378,29.5659679 22.0979161,30.4933924 L25.5530133,35.1193396 C25.7374335,35.0960395 25.9253559,35.0840336 26.1160714,35.0840336 C28.5816283,35.0840336 30.5803571,37.0906006 30.5803571,39.5658263 C30.5803571,42.0410521 28.5816283,44.047619 26.1160714,44.047619 C23.6505145,44.047619 21.6517857,42.0410521 21.6517857,39.5658263 C21.6517857,38.5158954 22.0114073,37.550288 22.6137358,36.786377 L19.2347967,32.2642878 C18.2515211,32.6383706 17.1852943,32.8431373 16.0714286,32.8431373 C11.1403147,32.8431373 7.14285714,28.8300034 7.14285714,23.8795518 C7.14285714,18.9291003 11.1403147,14.9159664 16.0714286,14.9159664 C18.7561777,14.9159664 21.1641661,16.1055665 22.8009276,17.9883615 L27.4731212,14.4686944 C27.3160555,13.8976965 27.2321429,13.2962211 27.2321429,12.67507 C27.2321429,8.96223137 30.2302361,5.95238095 33.9285714,5.95238095 Z M26.1160714,38.4453782 C25.4996822,38.4453782 25,38.9470199 25,39.5658263 C25,40.1846328 25.4996822,40.6862745 26.1160714,40.6862745 C26.7324607,40.6862745 27.2321429,40.1846328 27.2321429,39.5658263 C27.2321429,38.9470199 26.7324607,38.4453782 26.1160714,38.4453782 Z M37.2767857,27.2408964 C36.0440073,27.2408964 35.0446429,28.2441798 35.0446429,29.4817927 C35.0446429,30.7194056 36.0440073,31.7226891 37.2767857,31.7226891 C38.5095642,31.7226891 39.5089286,30.7194056 39.5089286,29.4817927 C39.5089286,28.2441798 38.5095642,27.2408964 37.2767857,27.2408964 Z M16.0714286,18.2773109 C12.9894824,18.2773109 10.4910714,20.7855196 10.4910714,23.8795518 C10.4910714,26.973584 12.9894824,29.4817927 16.0714286,29.4817927 C19.1533747,29.4817927 21.6517857,26.973584 21.6517857,23.8795518 C21.6517857,20.7855196 19.1533747,18.2773109 16.0714286,18.2773109 Z M33.9285714,9.31372549 C32.0794037,9.31372549 30.5803571,10.8186507 30.5803571,12.67507 C30.5803571,14.5314894 32.0794037,16.0364146 33.9285714,16.0364146 C35.7777391,16.0364146 37.2767857,14.5314894 37.2767857,12.67507 C37.2767857,10.8186507 35.7777391,9.31372549 33.9285714,9.31372549 Z" fill="#222222" fill-rule="nonzero"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-4">İstediğiniz gibi ödeyin</h3>
            <p class="leading-relaxed mb-2" style="color:#444;font-size:16px">
              Kredi/banka kartları, dijital cüzdanlar ve doğrudan banka hesabı havaleleri dahil olmak üzere bildiğiniz ve güvendiğiniz ödeme yöntemlerini destekliyoruz. Her başarılı işlem için düşük bir ücret alınır.
            </p>
            <p class="leading-relaxed mb-2" style="color:#444;font-size:16px">
              Ayrıca iSTOC tarafından sunulan resmi banka bilgilerini kullanarak bankalar arası emanet korumalı havale işlemleri de yapabilirsiniz.
            </p>
            <p class="leading-relaxed" style="color:#444;font-size:16px">
              Satın alımlarınızda ve para iadelerinizde dönüştürme ücretlerinden tasarruf etmeniz için ödeme yapabileceğiniz 40'tan fazla para birimini destekliyoruz.
            </p>
          </div>

          <!-- Card 2: Esnek finansman çözümleri -->
          <div class="border border-gray-200 rounded-md hover:shadow-lg transition-shadow duration-300" style="padding:36px 19px 30px 30px">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mb-5" style="background-color:#FFE285">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24">
                <path d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-4">Esnek finansman çözümleri</h3>
            <p class="leading-relaxed mb-2" style="color:#444;font-size:16px">
              İlk ödemeyi yapmak için kullanılabilir ödeme yöntemlerinden ve para birimlerinden herhangi birini kullanın. Kalan bakiyeyi ertelenmiş ödeme hizmetimiz aracılığıyla ödeyin.
            </p>
            <p class="leading-relaxed" style="color:#444;font-size:16px">
              Ödeme Koşulları: 30/60 Gün* aracılığıyla ödeyin veya koşulları belirlemek için doğrudan tedarikçiyle iletişime geçin.
              Anlaşmalı bankalarımız aracılığıyla 3, 6, 9 ve 12 aya kadar taksit seçenekleri mevcuttur.
            </p>
          </div>

        </div>

        <!-- ═══ ORDER PROCESS SECTION ═══ -->
        <h2 id="process" class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-10">
          Trade Assurance ile sipariş verme ve ödeme yapma
        </h2>

        <div class="mb-16">

          <!-- Step 1 -->
          <div class="flex items-stretch gap-7 relative">
            <div class="flex flex-col items-center flex-shrink-0">
              <div class="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-900 font-bold text-base">01</div>
              <div class="w-0.5 bg-gray-300 flex-1"></div>
            </div>
            <div class="pb-10" style="padding-top:10px">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900">Trade Assurance'ı destekleyen bir tedarikçi bulun</h3>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex items-stretch gap-7 relative">
            <div class="flex flex-col items-center flex-shrink-0">
              <div class="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-900 font-bold text-base">02</div>
              <div class="w-0.5 bg-gray-300 flex-1"></div>
            </div>
            <div class="pb-10" style="padding-top:10px">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-5">Satın alın veya ayrıntıları tedarikçiyle belirleyin</h3>
              <div class="mb-4">
                <h4 class="font-bold text-gray-900 mb-1">Gönderilmeye hazır ürünlerde</h4>
                <p style="color:#444;font-size:16px" class="leading-relaxed">Satın almak istediğiniz ürün için "Siparişi başlat" seçeneğini işaretleyin ve satın alma işlemine devam edin.</p>
              </div>
              <div>
                <h4 class="font-bold text-gray-900 mb-1">Özelleştirilmiş ürünler için</h4>
                <p style="color:#444;font-size:16px" class="leading-relaxed">Tedarikçiyle doğrudan Messenger aracılığıyla iletişime geçerek, Fiyat Teklifi Talebi göndererek veya bir sipariş talebi göndererek sipariş ayrıntılarını belirleyin.</p>
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex items-start gap-7 relative">
            <div class="flex flex-col items-center flex-shrink-0">
              <div class="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-900 font-bold text-base">03</div>
            </div>
            <div style="padding-top:10px">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900">Tercih ettiğiniz ödeme yöntemini ve para birimini kullanarak ödeme yapın</h3>
            </div>
          </div>

        </div>

        <!-- Checkout Preview -->
        <div class="bg-gray-50 rounded-md border border-gray-200 p-6 sm:p-10 mb-16">
          <div class="max-w-[800px] mx-auto">
            <div class="bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden">
              <!-- Mock Checkout Header -->
              <div class="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z"/></svg>
                <span class="font-semibold text-gray-700 text-sm">Trade Assurance</span>
                <span class="text-gray-400 text-sm">Checkout</span>
              </div>
              <!-- Mock Payment Methods -->
              <div class="p-6 sm:p-8">
                <div class="flex items-center gap-3 mb-6">
                  <span class="text-sm font-medium text-gray-700">Ödeme yöntemi:</span>
                  <div class="flex items-center gap-2">
                    <div class="px-3 py-1.5 rounded-lg bg-orange-50 border-2 border-orange-400 text-xs font-bold text-orange-600">VISA</div>
                    <div class="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-500">MC</div>
                    <div class="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-500">TROY</div>
                    <div class="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-500">EFT</div>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div class="space-y-2">
                    <div class="h-10 bg-gray-100 rounded-lg border border-gray-200 px-3 flex items-center text-sm text-gray-400">Kart numarası</div>
                    <div class="grid grid-cols-2 gap-2">
                      <div class="h-10 bg-gray-100 rounded-lg border border-gray-200 px-3 flex items-center text-sm text-gray-400">AA/YY</div>
                      <div class="h-10 bg-gray-100 rounded-lg border border-gray-200 px-3 flex items-center text-sm text-gray-400">CVV</div>
                    </div>
                  </div>
                  <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Ürün tutarı</span>
                      <span class="font-medium">₺ 1.250,00</span>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Kargo ücreti</span>
                      <span class="font-medium">₺ 45,00</span>
                    </div>
                    <div class="border-t border-gray-200 pt-2 mt-2 flex justify-between text-sm font-bold text-gray-900">
                      <span>Toplam</span>
                      <span>₺ 1.295,00</span>
                    </div>
                    <button class="th-btn w-full mt-3 text-sm font-semibold py-2.5">
                      Şimdi öde
                    </button>
                    <div class="flex items-center justify-center gap-1.5 mt-3">
                      <svg class="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm5.207 8.207l-6.5 6.5a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L10 13.586l5.793-5.793a1 1 0 011.414 1.414z"/></svg>
                      <span class="text-xs text-gray-500">PCI DSS uyumlu, 256-bit SSL koruması</span>
                    </div>
                  </div>
                </div>
              </div>
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
