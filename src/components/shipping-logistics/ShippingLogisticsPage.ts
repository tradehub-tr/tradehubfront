/**
 * Shipping & Logistics Services Landing Page
 */
import kargoImg from '../../assets/images/kargo.avif'
import taLogoUrl from '../../assets/images/ta-logo.svg'
import logisticsPattern from '../../assets/images/svgviewer-output.svg'
import { TradeAssuranceFooterCards } from '../shared/TradeAssuranceFooterCards'

/* ════════════════════════════════════════════════════
   ICONS (inline SVG)
   ════════════════════════════════════════════════════ */

const iconHouseBox = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>`

const iconDollarDoc = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`

const iconChartTrend = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>`



/* ════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════ */

function yellowIcon(svgContent: string): string {
  return `<div class="w-[48px] h-[48px] rounded-full bg-[#FFE285] flex items-center justify-center shrink-0">${svgContent}</div>`
}

function featureCard(icon: string, title: string, description: string): string {
  return `
    <div class="border border-gray-200 rounded-md p-6 flex flex-col gap-3">
      ${yellowIcon(icon)}
      <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
      <p class="text-sm text-gray-600 leading-relaxed">${description}</p>
    </div>
  `
}

/* ════════════════════════════════════════════════════
   SECTION BUILDERS
   ════════════════════════════════════════════════════ */

function heroSection(): string {
  return `
    <section class="relative w-full min-h-[400px] flex items-center" style="background-image: url('${kargoImg}'); background-size: cover; background-position: center;">
      <!-- dark overlay -->
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="relative z-10 container-boxed w-full py-16 sm:py-20">
        <!-- Trade Assurance badge -->
        <div class="inline-flex items-center px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm mb-6">
          <img src="${taLogoUrl}" alt="Trade Assurance" class="h-7 sm:h-8" />
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
          Gönderim ve lojistik hizmetleri
        </h1>
        <p class="text-base sm:text-lg text-white/90 max-w-2xl leading-relaxed">
          Zamanında Teslimat Garantisiyle envanter belirsizliğini azaltın ve gönderinizi iSTOC Lojistik ile takip edin
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
          <li class="text-gray-900 font-medium">Kargo ve lojistik hizmetleri</li>
        </ol>
      </nav>
    </div>
  `
}

function deliverySection(): string {
  return `
    <section class="bg-white py-12 sm:py-16">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">iSTOC Logistics tarafından teslimat</h2>
        <p class="text-gray-600 leading-relaxed max-w-3xl mb-10">
          Siparişiniz planlanan tarihte teslim edilsin veya %10 gecikme tazminatı* alın. Ürünleriniz teslimat sırasında hasar görürse veya kaybolursa da tazminat almaya hak kazanırsınız.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${featureCard(
            iconHouseBox,
            'Stok yönetimi',
            'Siparişlerinizin zamanında teslim edileceğini bilerek daha iyi plan yapın ve envanterinizi yönetin.'
          )}
          ${featureCard(
            iconDollarDoc,
            'Gecikme tazminatı',
            'Geç teslimat durumunda gelecek siparişlerinizde kullanabileceğiniz bir kupon kazanın.'
          )}
          ${featureCard(
            iconChartTrend,
            'Basitleştirilmiş süreç',
            'iSTOC talebinizi doğrudan inceleyerek sizi tedarikçilerle* pazarlık yaparak zaman harcamaktan kurtarır.'
          )}
        </div>
        <p class="text-xs text-gray-400 mt-6 leading-relaxed">
          *100 USD'ye varan tazminat alın. Seed alıcılarının tazminatı almak için talepte bulunmaları gerekir.
        </p>
      </div>
    </section>
  `
}

function timelineSection(): string {
  const steps = [
    {
      num: '01',
      title: 'Zamanında Teslimat Garantisini destekleyen ürünleri bulun',
      description: '',
    },
    {
      num: '02',
      title: "iSTOC'da ödeyin",
      description: 'Tercih ettiğiniz ödeme yöntemini kullanarak iSTOC platformu üzerinden ödeme gerçekleştirin.',
    },
    {
      num: '03',
      title: 'Gecikme durumunda talepte bulunun',
      description: 'Ürünler anlaşılan tarihe kadar teslim edilmezse Siparişlerim &gt; Sipariş ayrıntıları adımlarını takip ederek bir talepte bulunun. Scaleup, Enterprise ve Enterprise Pro buyer\'lar için tazminatlar otomatik olarak hesaba tanımlanır.',
    },
    {
      num: '04',
      title: 'Tazminatınızı alın.',
      description: 'Alacağınız tazminatları sonraki iSTOC alışverişlerinizde kullanmak üzere toplayın.',
    },
  ]

  return `
    <section class="bg-white py-12 sm:py-16">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">Süreç nasıl işler?</h2>
        <div class="relative pl-8 sm:pl-12">
          <!-- vertical connector line -->
          <div class="absolute left-[19px] sm:left-[23px] top-6 bottom-6 w-[2px] bg-gray-200"></div>

          ${steps.map((step, i) => `
            <div class="relative mb-10 ${i === steps.length - 1 ? 'mb-0' : ''}">
              <!-- step circle -->
              <div class="absolute -left-8 sm:-left-12 top-0 w-[38px] h-[38px] sm:w-[46px] sm:h-[46px] rounded-full border-2 border-[#FFC800] bg-white flex items-center justify-center z-10">
                <span class="text-sm sm:text-base font-bold text-gray-900">${step.num}</span>
              </div>
              <div class="pt-1 sm:pt-2">
                <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-1">${step.title}</h3>
                ${step.description ? `<p class="text-sm text-gray-600 leading-relaxed max-w-2xl">${step.description}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `
}

/* Custom SVG icons for "More About" section */
const iconCustomization = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><path d="M5.056 3.161a1.571 1.571 0 0 1 2.222 0l3.623 3.572 3.837-3.676a1.571 1.571 0 0 1 2.206.016l2.5 2.465a1.571 1.571 0 0 1-.016 2.222l-3.805 3.643 2.926 2.883a1.571 1.571 0 0 1 0 2.19l-2.501 2.465a1.571 1.571 0 0 1-2.222 0l-2.993-2.95-2.02 1.936-3.72 1.253a1.571 1.571 0 0 1-1.94-1.84l1.03-4.07 2.02-1.934-3.556-3.506a1.571 1.571 0 0 1 0-2.19l2.5-2.465ZM5.507 14.06l-.921 3.641 3.386-1.14 7.291-6.987-2.474-2.492-7.282 6.978ZM6.167 4.256l-2.5 2.465 1.031 1.018 1.589-1.566 1.11 1.095-1.588 1.566 1.429 1.409 2.537-2.43-3.608-3.557Z" fill="#000"/></g></svg>`

const iconGlobeCustom = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><path d="M11 2.095a8.905 8.905 0 1 1 0 17.81 8.905 8.905 0 0 1 0-17.81Zm0 1.572c-3.533 0-6.48 2.494-7.177 5.82h.853c.21 0 .406.017.74.06l.747.1c.191.024.334.036.457.04h.117c.091 0 .16-.006.202-.017l-.007.001.037-.035c.702-.617 1.97-.604 2.885-.133l.167.094c.341.208.54.454.875.972l.106.162c.248.377.351.476.381.476 1.267 0 2.498.896 2.498 2.086 0 .588-.39.931-.91 1.072a3.6 3.6 0 0 1-.468.08l-.209.017-.534.034-.152.014-.121.016c-.053 1.57-.577 2.83-1.875 2.83-.302 0-.524-.03-.867-.1l-.261-.049c-.26-.04-.44-.02-.77.12l-.16.055c.96.59 2.18.928 3.478.928 4.052 0 7.333-3.281 7.333-7.333 0-.473-.045-.935-.13-1.382l-.105.04-.157.044c-.025.092-.054.216-.09.38l-.087.417-.076.327c-.291 1.172-.703 1.794-1.68 1.794-1.177 0-1.687-.81-1.744-1.951a7.7 7.7 0 0 1-.006-.214l.003-.23.01-.277a3.8 3.8 0 0 0-.471-.172l-.133-.079c-.86-.531-1.356-1.25-1.356-2.348 0-1.151.61-2.121 1.761-2.918A7.26 7.26 0 0 0 11 3.667ZM9.203 10.943c-.395-.241-1.066-.258-1.193-.126-.432.449-.878.521-1.83.418l-.272-.033-.769-.103a3.8 3.8 0 0 0-.405-.039h-.122l-.944.003.003.185c.057 1.756.73 3.355 1.81 4.588.627.194 1.183.193 1.694.005a2.66 2.66 0 0 1 1.15-.524l.291.057c.188.036.306.049.456.049.068 0 .308-.67.308-1.532 0-.595.37-.996.904-1.179.282-.097.556-.132 1.03-.16l.078-.004c-.157-.077-.349-.131-.549-.131-.79 0-1.17-.373-1.752-1.272l-.147-.224a2.3 2.3 0 0 0-.238-.234Z" fill="#222"/></g></svg>`

const iconMoneyDoc = `<svg width="64" height="64" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="15" fill="#FFE285"/><g transform="translate(4,4)"><path d="M16.762 2.095c.868 0 1.571.704 1.571 1.572v14.666c0 .868-.703 1.572-1.571 1.572H5.238a1.571 1.571 0 0 1-1.571-1.572V3.667c0-.868.703-1.572 1.571-1.572h11.524Zm0 1.572H5.238v14.666h11.524V3.667Zm-2.619 12.047v1.572H7.857v-1.572h6.286Zm-2.095-11v.913c.24.05.49.113.75.191l-.451 1.505c-1.522-.456-2.027-.31-2.096.239-.024.195.263.445 1.193.88l.162.076.203.097c1.025.507 1.55 1.034 1.55 2.013 0 .932-.535 1.68-1.31 2.013v.978h-1.571v-.87a3.3 3.3 0 0 1-.366-.117 5.5 5.5 0 0 1-.911-.449l-.273-.151-.418-.24.79-1.358c.494.287.879.497 1.145.627l.133.063.11.046c.64.252 1.099-.054 1.099-.542 0-.205-.176-.369-.778-.655l-.376-.177C9.193 9.106 8.549 8.5 8.69 7.366c.138-1.1.778-1.694 1.786-1.83v-.822h1.572Z" fill="#222"/></g></svg>`

function moreAboutSection(): string {
  return `
    <section class="relative py-12 sm:py-16 overflow-hidden" style="background: #F4F4F4 url('${logisticsPattern}') center/cover no-repeat">
      <div class="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">iSTOC logistics hakkında daha fazlası</h2>
        <p class="text-gray-600 leading-relaxed max-w-3xl mb-10">
          iSTOC Lojistik, saygın lojistik sağlayıcıları bulmanıza ve gönderileri gerçek zamanlı olarak takip etmenize yardımcı olan resmi pazar yerimizdir.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-3">
            <div class="w-16 h-16">${iconCustomization}</div>
            <h3 class="text-lg font-semibold text-gray-900">Daha akıllı kargo</h3>
            <p class="text-sm text-gray-600 leading-relaxed">Akıllı platformumuz; gönderilerinizin görünürlüğünü ve planlama sürecini iyileştirmek için net maliyetler, en uygun rotalar ve gerçek zamanlı takip fırsatı sunar.</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-3">
            <div class="w-16 h-16">${iconGlobeCustom}</div>
            <h3 class="text-lg font-semibold text-gray-900">Dünya çapında teminat</h3>
            <p class="text-sm text-gray-600 leading-relaxed">Dünya çapında pek çok ülkede ve bölgede teslimat takibinin tadını çıkarın.</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-3">
            <div class="w-16 h-16">${iconMoneyDoc}</div>
            <h3 class="text-lg font-semibold text-gray-900">Güvenilirlik garantisi</h3>
            <p class="text-sm text-gray-600 leading-relaxed">200'den fazla ülke/bölgede teslimat garantisi* ve kayıp veya hasarlı gönderilere karşı tam finansal koruma ile içiniz rahat olsun. *Yalnızca uygun siparişlerde geçerlidir</p>
          </div>
        </div>
      </div>
    </section>
  `
}


/* ════════════════════════════════════════════════════
   EXPORTS
   ════════════════════════════════════════════════════ */

export function ShippingLogisticsPage(): string {
  return `
    ${heroSection()}
    ${breadcrumbSection()}
    ${deliverySection()}
    ${timelineSection()}
    ${moreAboutSection()}
    ${TradeAssuranceFooterCards()}
  `
}

export function initShippingLogisticsPage(): void {
  // future interactivity hooks
}
