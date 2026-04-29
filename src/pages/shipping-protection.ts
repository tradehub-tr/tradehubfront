/**
 * Zamanında Teslimat Garantisi — Entry Point
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'
import { Breadcrumb } from '../components/shared/Breadcrumb'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { InfoPageLayout } from '../components/info/InfoPageLayout'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200 border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}
  <main class="flex-1 min-w-0 bg-white">
    <div class="container-boxed">
      ${Breadcrumb([{ label: 'Zamanında Teslimat Garantisi' }])}
    </div>
    ${InfoPageLayout({
      title: 'Zamanında Teslimat Garantisi',
      subtitle: 'Siparişleriniz zamanında ve güvenle elinize ulaşsın',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>',
      sections: [
        {
          title: 'Teslimat Garantisi Kapsamı',
          content: `
            <p>iSTOC Zamanında Teslimat Garantisi, siparişinizin söz verilen tarihte elinize ulaşmasını sağlar. Satıcı tarafından belirtilen tahmini teslimat süresinin aşılması halinde, kargo ücretinin tamamı iade edilir ve siparişiniz öncelikli olarak yeniden gönderilir.</p>
            <p>Garanti kapsamı, sipariş onayından itibaren başlar ve ürünün teslim adresine ulaşmasına kadar devam eder. Yurt içi gönderilerde 3-7 iş günü, uluslararası gönderilerde 10-25 iş günü standart teslimat süresi olarak belirlenmektedir. Ekspres kargo seçenekleriyle bu süreleri önemli ölçüde kısaltabilirsiniz.</p>
          `
        },
        {
          title: 'Gerçek Zamanlı Kargo Takibi',
          content: `
            <p>Her siparişiniz için anlık kargo takip numarası sağlanır. iSTOC panelinizdeki "Sipariş Takibi" bölümünden paketinizin tam konumunu, tahmini varış süresini ve geçirdiği aşamaları harita üzerinde görüntüleyebilirsiniz.</p>
            <p>Otomatik bildirim sistemi sayesinde, paketiniz her önemli noktaya ulaştığında anlık bilgilendirilirsiniz. Kargoya verildiğinde, gümrükten geçtiğinde, dağıtıma çıktığında ve teslim edildiğinde e-posta ve SMS bildirimleri alırsınız. Ayrıca mobil uygulamamız üzerinden de kargo durumunuzu takip edebilirsiniz.</p>
          `
        },
        {
          title: 'Kargo Sigortası',
          content: `
            <p>Tüm iSTOC gönderileri otomatik olarak temel kargo sigortası kapsamındadır. Bu sigorta, taşıma sırasında oluşabilecek hasar, kayıp veya hırsızlık durumlarında ürün bedelinin tamamını karşılar. Ek bir ücret ödemeden bu korumadan yararlanabilirsiniz.</p>
            <p>Yüksek değerli siparişleriniz için genişletilmiş kargo sigortası seçeneği de mevcuttur. Bu kapsamlı sigorta, doğal afet, savaş hali ve benzeri mücbir sebepler dahil tüm riskleri kapsar. Sigorta primleri, sipariş tutarının yalnızca %0.5 ila %1'i arasında değişmektedir.</p>
          `
        },
        {
          title: 'Gecikmeli Teslimat Tazminatı',
          content: `
            <p>Siparişiniz taahhüt edilen tarihten sonra teslim edilirse, iSTOC otomatik tazminat mekanizması devreye girer. Gecikmenin süresine bağlı olarak, sipariş tutarının %5 ila %15'i arasında indirim kuponu veya nakit iade hakkı kazanırsınız.</p>
            <p>1-3 gün gecikmelerde sipariş tutarının %5'i, 4-7 gün gecikmelerde %10'u, 7 günden fazla gecikmelerde ise %15'i tazminat olarak ödenir. Ayrıca, 30 günü aşan gecikmelerde siparişi tamamen iptal etme ve tam iade alma hakkınız bulunmaktadır. Tazminat talepleri otomatik olarak işlenir; ekstra bir başvuru yapmanıza gerek yoktur.</p>
          `
        }
      ]
    })}
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
