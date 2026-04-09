/**
 * Satış Sonrası Korumalar Landing Page
 */
import heroImg from '../../assets/images/satıssonrasıhizmetleri.avif'
import taLogoUrl from '../../assets/images/ta-logo.svg'
import { TradeAssuranceFooterCards } from '../shared/TradeAssuranceFooterCards'

/* ════════════════════════════════════════════════════
   ICONS (inline SVG)
   ════════════════════════════════════════════════════ */

const iconWrench = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743"/></svg>`

const iconCube = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>`

const iconCurrency = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`

/* ════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════ */

function yellowIcon(svgContent: string): string {
  return `<div class="w-[48px] h-[48px] rounded-full bg-[#FFE285] flex items-center justify-center shrink-0">${svgContent}</div>`
}

/* ════════════════════════════════════════════════════
   SECTION BUILDERS
   ════════════════════════════════════════════════════ */

function heroSection(): string {
  return `
    <section class="relative w-full min-h-[400px] flex items-center" style="background-image: url('${heroImg}'); background-size: cover; background-position: center;">
      <!-- dark overlay -->
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative z-10 container-boxed w-full py-16 sm:py-20">
        <!-- Trade Assurance badge -->
        <div class="inline-flex items-center px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm mb-6">
          <img src="${taLogoUrl}" alt="Trade Assurance" class="h-7 sm:h-8" />
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
          Satış sonrası korumaları
        </h1>
        <p class="text-base sm:text-lg text-white/90 max-w-2xl leading-relaxed">
          Ek hizmetler ve uygun ürünler için destek
        </p>
      </div>
    </section>
  `
}

function breadcrumbSection(): string {
  return `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <nav class="flex text-sm text-gray-500" aria-label="Breadcrumb">
        <ol class="flex items-center gap-1.5">
          <li><a href="#" class="hover:text-[#FFC800] transition-colors">Trade Assurance</a></li>
          <li class="text-gray-400">&gt;</li>
          <li class="text-gray-900 font-medium">Satış sonrası korumalar</li>
        </ol>
      </nav>
    </div>
  `
}

function warrantySection(): string {
  return `
    <section class="bg-white py-12 sm:py-16">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">1 yıl garanti</h2>
        <p class="text-gray-600 leading-relaxed max-w-4xl mb-4 text-base sm:text-lg">
          Satın alımdan sonra 1 yıl boyunca yerinde kurulum, bakım, onarım ve ücretsiz yedek parça hizmetlerimizle ek destek alın.
          Hizmet yerel bölgenizde sağlanır veya bir mühendis size gelir. Aldığınız hizmet üzerinde anlaşılan koşullardan farklılık
          gösterirse tazminat talebinde bulunun.
        </p>
        <p class="text-sm text-gray-400 mb-2">
          *Toplam sipariş tutarınızın %30'una varan veya maksimum 3000 USD tutarında geri ödeme alın.
        </p>
        <a href="#" class="text-sm text-gray-500 underline hover:text-[#FFC800] transition-colors">
          **Kampanya kapsamındaki ülkeleri ve kategorileri görüntüleyin
        </a>

        <!-- Feature highlights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div class="border border-gray-200 rounded-md p-6 flex flex-col gap-3">
            ${yellowIcon(iconWrench)}
            <h3 class="text-lg font-semibold text-gray-900">Yerinde teknik servis</h3>
            <p class="text-sm text-gray-600 leading-relaxed">Profesyonel mühendisler bölgenize gelerek kurulum, bakım ve onarım hizmeti sunar.</p>
          </div>
          <div class="border border-gray-200 rounded-md p-6 flex flex-col gap-3">
            ${yellowIcon(iconCube)}
            <h3 class="text-lg font-semibold text-gray-900">Ücretsiz yedek parça</h3>
            <p class="text-sm text-gray-600 leading-relaxed">Garanti kapsamındaki ürünler için yedek parçalar ücretsiz olarak temin edilir ve kargo masrafları karşılanır.</p>
          </div>
          <div class="border border-gray-200 rounded-md p-6 flex flex-col gap-3">
            ${yellowIcon(iconCurrency)}
            <h3 class="text-lg font-semibold text-gray-900">Tazminat hakkı</h3>
            <p class="text-sm text-gray-600 leading-relaxed">Hizmet beklentilerinizi karşılamazsa sipariş tutarınızın %30'una kadar geri ödeme talep edebilirsiniz.</p>
          </div>
        </div>
      </div>
    </section>
  `
}

function applicationStepsSection(): string {
  const steps = [
    {
      num: '01',
      title: '1 yıllık garantiyi destekleyen ürünleri keşfedin',
      description: 'Makine ve cihaz kategorisindeki ürünlerde "1 yıl garanti" etiketini arayın.',
    },
    {
      num: '02',
      title: 'Hizmet için başvurun',
      description: 'iSTOC Hesabım &gt; Siparişler &gt; Sipariş detayları &gt; 1 yıllık garanti hizmeti başvurusunda bulun adımlarını takip edin. Sevkiyat tarihinden itibaren 13 ay içinde gönderebilirsiniz.',
    },
    {
      num: '03',
      title: 'Hizmet alın',
      description: 'Satıcı yedek parça sağlayacak ve iSTOC kargo masraflarını karşılayacaktır. Üçüncü taraf bir hizmet tercih etmeniz durumunda onarım sürecinde bu masrafları karşılarız.',
    },
  ]

  return `
    <section class="bg-gray-50 py-12 sm:py-16">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
          Satış sonrası hizmet ve destek başvurusu nasıl yapılır?
        </h2>

        <div class="relative pl-8 sm:pl-12">
          <!-- vertical connector line -->
          <div class="absolute left-[19px] sm:left-[23px] top-6 bottom-6 w-[2px] bg-gray-200"></div>

          ${steps.map((step, i) => `
            <div class="relative mb-12 ${i === steps.length - 1 ? 'mb-0' : ''}">
              <!-- step circle -->
              <div class="absolute -left-8 sm:-left-12 top-0 w-[38px] h-[38px] sm:w-[46px] sm:h-[46px] rounded-full border-2 border-[#FFC800] bg-white flex items-center justify-center z-10">
                <span class="text-sm sm:text-base font-bold text-gray-900">${step.num}</span>
              </div>
              <div class="pt-1 sm:pt-2">
                <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-2">${step.title}</h3>
                <p class="text-sm text-gray-600 leading-relaxed max-w-2xl">${step.description}</p>

                ${step.num === '02' ? `
                  <!-- Visual step guide -->
                  <div class="mt-6 bg-white rounded-md border border-gray-200 p-6 sm:p-8 max-w-4xl">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                      <!-- Step 1: My orders -->
                      <div>
                        <div class="flex items-start gap-3 mb-4">
                          <div class="w-8 h-8 rounded-full bg-[#FFC800] text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                          <div>
                            <p class="font-semibold text-gray-900 text-sm">Siparişlerim</p>
                            <p class="text-xs text-gray-500 mt-0.5">"Sipariş detaylarını görüntüle" butonuna tıklayın</p>
                          </div>
                        </div>
                        <div class="bg-gray-100 rounded-lg h-[180px] flex items-center justify-center border border-gray-200">
                          <div class="text-center px-4">
                            <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/></svg>
                            <p class="text-xs text-gray-400">Sipariş listesi ekranı</p>
                          </div>
                        </div>
                      </div>
                      <!-- Step 2: Order details -->
                      <div>
                        <div class="flex items-start gap-3 mb-4">
                          <div class="w-8 h-8 rounded-full bg-[#FFC800] text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                          <div>
                            <p class="font-semibold text-gray-900 text-sm">Sipariş detayları</p>
                            <p class="text-xs text-gray-500 mt-0.5">"1 yıllık garanti hizmeti için başvur" butonuna tıklayın</p>
                          </div>
                        </div>
                        <div class="bg-gray-100 rounded-lg h-[180px] flex items-center justify-center border border-gray-200">
                          <div class="text-center px-4">
                            <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>
                            <p class="text-xs text-gray-400">Sipariş detay ekranı</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `
}

/* ════════════════════════════════════════════════════
   EXPORTS
   ════════════════════════════════════════════════════ */

export function AfterSalesPage(): string {
  return `
    ${heroSection()}
    ${breadcrumbSection()}
    ${warrantySection()}
    ${applicationStepsSection()}
    ${TradeAssuranceFooterCards()}
  `
}

export function initAfterSalesPage(): void {
  // future interactivity hooks
}
