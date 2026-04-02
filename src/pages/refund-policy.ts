/**
 * Para İade Politikası — Entry Point
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
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
    ${SubHeader()}
  </div>
  ${MegaMenu()}
  <main class="flex-1 min-w-0 bg-white">
    <div class="container-boxed">
      ${Breadcrumb([{ label: 'Para İade Politikası' }])}
    </div>
    ${InfoPageLayout({
      title: 'Para İade Politikası',
      subtitle: 'Alışverişlerinizde tam koruma garantisi',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>',
      sections: [
        {
          title: 'İade Koşulları',
          content: `
            <p>iSTOC TradeHub'da yapılan tüm alışverişler, kapsamlı iade politikamız ile güvence altındadır. Aşağıdaki durumlarda tam para iadesi talep edebilirsiniz: ürün açıklamayla uyuşmuyorsa, hasarlı veya kusurlu teslim edildiyse, sipariş hiç ulaşmadıysa veya yanlış ürün gönderildiyse.</p>
            <p>İade talebi oluşturmak için sipariş tarihinden itibaren 15 iş günü içinde başvurmanız gerekmektedir. Özel üretim veya kişiselleştirilmiş ürünlerde iade koşulları farklılık gösterebilir; bu tür siparişlerde satıcı ile ön anlaşma yapılması önerilir.</p>
            <p>Toplu siparişlerde kısmi iade de mümkündür. Partinin bir kısmı kusurlu çıktığında, yalnızca kusurlu ürünler için iade işlemi başlatılabilir. Kalite kontrol raporları, iade sürecinde önemli bir kanıt niteliği taşır.</p>
          `
        },
        {
          title: 'İade Süreci',
          content: `
            <p>İade sürecini başlatmak oldukça kolaydır. Hesabınızdaki "Siparişlerim" bölümünden ilgili siparişi seçin, "İade Talebi Oluştur" butonuna tıklayın ve iade nedeninizi belirtin. Fotoğraf veya video gibi destekleyici belgeler eklemeniz, sürecin hızlanmasına yardımcı olur.</p>
            <p>Talebiniz oluşturulduktan sonra, satıcıya 3 iş günü içinde yanıt verme süresi tanınır. Satıcının talebi kabul etmesi halinde iade işlemi başlatılır. Anlaşmazlık durumunda, iSTOC arabuluculuk ekibi devreye girerek her iki tarafın da haklarını gözeten bir çözüm sunar.</p>
          `
        },
        {
          title: 'İade Süreleri',
          content: `
            <p>Kredi kartı ile yapılan ödemelerde, iade onaylandıktan sonra tutar 5-10 iş günü içinde kartınıza yansır. Banka havalesi ile yapılan ödemelerde ise iade tutarı 3-5 iş günü içinde belirttiğiniz banka hesabına aktarılır.</p>
            <p>Escrow (emanet) hesap üzerinden yapılan ödemelerde, anlaşmazlık çözüldükten sonra tutar 1-2 iş günü içinde iade edilir. Tüm iade süreçlerini hesabınızın "İade Takibi" bölümünden anlık olarak izleyebilirsiniz. Her aşamada e-posta ve SMS bildirimleri alırsınız.</p>
          `
        },
        {
          title: 'Anlaşmazlık Çözümü',
          content: `
            <p>Alıcı ve satıcı arasında iade konusunda bir anlaşmazlık yaşandığında, iSTOC profesyonel arabuluculuk hizmeti devreye girer. Uzman ekibimiz, her iki tarafın beyanlarını ve sunulan kanıtları detaylı bir şekilde inceleyerek adil bir karar verir.</p>
            <p>Arabuluculuk süreci genellikle 5-7 iş günü içinde sonuçlanır. Bu süreçte alıcının ödeme tutarı güvence altında tutulur. Karara itiraz hakkınız da bulunmaktadır; itiraz durumunda dosya üst düzey inceleme ekibine yönlendirilir. iSTOC olarak amacımız, her zaman adil ve şeffaf bir çözüm sunmaktır.</p>
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
