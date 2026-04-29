/**
 * Satış Vergisi ve KDV — Entry Point
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
      ${Breadcrumb([{ label: 'Satış Vergisi ve KDV' }])}
    </div>
    ${InfoPageLayout({
      title: 'Satış Vergisi ve KDV',
      subtitle: 'Vergi bilgilendirmesi ve fatura düzenleme',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>',
      sections: [
        {
          title: 'KDV Bilgilendirmesi',
          content: `
            <p>iSTOC TradeHub üzerinden gerçekleştirilen tüm ticari işlemler, Türkiye Cumhuriyeti vergi mevzuatına uygun olarak yürütülmektedir. Yurt içi satışlarda geçerli KDV oranları ürün kategorisine göre %1, %10 veya %20 olarak uygulanır. Ürün sayfalarında gösterilen fiyatlar KDV hariç olup, sepet ve ödeme aşamalarında KDV tutarı ayrıca belirtilir.</p>
            <p>B2B alışverişlerde KDV, alıcı firmanın vergi mükellefiyet durumuna göre hesaplanır. Vergi numaranızı hesap bilgilerinize ekleyerek, uygun KDV indirimi ve muafiyet haklarından yararlanabilirsiniz. Sistem, girilen vergi numarasını Gelir İdaresi Başkanlığı veritabanı üzerinden otomatik olarak doğrular.</p>
          `
        },
        {
          title: 'B2B Vergi Muafiyetleri',
          content: `
            <p>Kurumsal alıcılar, belirli koşulları sağladığında KDV muafiyetinden yararlanabilir. İhracat amaçlı yapılan alımlarda, geçerli ihracatçı belgesi ibrazıyla KDV muafiyeti uygulanır. Serbest bölge firmalarına yapılan satışlarda da KDV tahakkuk ettirilmez.</p>
            <p>Diplomatik muafiyet, uluslararası kuruluş muafiyeti ve teşvik belgesi kapsamındaki alımlar için özel vergi prosedürleri mevcuttur. Bu tür muafiyetlerden yararlanmak için ilgili belgelerin sisteme yüklenmesi gerekmektedir. Muafiyet başvuruları genellikle 1-3 iş günü içinde sonuçlanır.</p>
          `
        },
        {
          title: 'Fatura Türleri',
          content: `
            <p>iSTOC platformunda elektronik fatura (e-Fatura) ve elektronik arşiv fatura (e-Arşiv) düzenlenmektedir. E-Fatura mükellefi olan alıcılara otomatik olarak e-Fatura, diğer alıcılara ise e-Arşiv fatura gönderilir. Tüm faturalar, Gelir İdaresi Başkanlığı onaylı entegrasyon üzerinden düzenlenir.</p>
            <p>Faturalarınıza hesabınızdaki "Faturalarım" bölümünden erişebilirsiniz. PDF formatında indirme, e-posta ile yeniden gönderme ve toplu fatura indirme özellikleri mevcuttur. Proforma fatura, sevk irsaliyesi ve gümrük faturası gibi ek belgelere de aynı bölümden ulaşabilirsiniz.</p>
          `
        },
        {
          title: 'Sınır Ötesi Vergilendirme',
          content: `
            <p>Uluslararası ticarette vergi uygulamaları ülkeden ülkeye farklılık gösterir. iSTOC, ithalat ve ihracat işlemlerinde uygulanacak gümrük vergileri, özel tüketim vergileri ve diğer yasal yükümlülükler hakkında bilgilendirme yapar. Ancak nihai vergi hesaplamaları için profesyonel danışmanlık alınması önerilir.</p>
            <p>AB ülkeleriyle yapılan ticarette ETGB (Elektronik Ticaret Gümrük Beyannamesi) süreçleri platformumuz üzerinden takip edilebilir. Gümrük tarife kodları (GTİP/HS Code), menşe belgeleri ve tercihli ticaret anlaşmaları hakkında detaylı bilgi, her ürün kategorisi altında yer almaktadır. İhracat teşvikleri ve devlet destekleri hakkında güncel bilgilere de "iSTOC Okumalar" bölümünden ulaşabilirsiniz.</p>
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
