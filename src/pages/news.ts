/**
 * Haber Merkezi — Entry Point
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
      ${Breadcrumb([{ label: 'Haber Merkezi' }])}
    </div>
    ${InfoPageLayout({
      title: 'Haber Merkezi',
      subtitle: "iSTOC'tan en güncel haberler ve duyurular",
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"/></svg>',
      sections: [
        {
          title: 'Son Haberler',
          content: `
            <p>iSTOC TradeHub olarak, B2B ticaret ekosistemindeki önemli gelişmeleri ve platform yeniliklerimizi bu bölümde sizinle paylaşıyoruz. Platform güncellemeleri, yeni özellikler, sektörel iş birlikleri ve başarı hikayelerimiz hakkında en güncel bilgilere buradan ulaşabilirsiniz.</p>
            <p>Haber bültenimize abone olarak, en son gelişmelerden anında haberdar olabilirsiniz. Haftalık özet e-postamız, kaçırmış olabileceğiniz önemli haberleri derli toplu bir şekilde sunar. Ayrıca sosyal medya hesaplarımızdan da anlık güncellemeleri takip edebilirsiniz.</p>
            <p>Bu bölüm yakında detaylı haber arşivimiz ve arama fonksiyonuyla zenginleştirilecektir. En son haberlerimizi takip etmeye devam edin!</p>
          `
        },
        {
          title: 'Basın Bültenleri',
          content: `
            <p>iSTOC'un resmi basın bültenleri, önemli iş ortaklıkları, yatırım haberleri, yeni pazar açılımları ve stratejik kararlar hakkında detaylı bilgi içermektedir. Basın bültenlerimiz, medya kuruluşları ve analistler için güvenilir bir bilgi kaynağı niteliğindedir.</p>
            <p>Basın bültenleri, yayınlandığı tarih itibarıyla bu sayfada arşivlenmektedir. Medya kuruluşları, basın bültenlerimizi kaynak göstermek koşuluyla serbestçe kullanabilir. Özel röportaj ve bilgi talepleri için basın ilişkileri ekibimizle press@istoc.com üzerinden iletişime geçebilirsiniz.</p>
          `
        },
        {
          title: 'Şirket Güncellemeleri',
          content: `
            <p>iSTOC ailesinin büyümesi, yeni ofis açılışları, ekip genişlemeleri ve organizasyonel gelişmeler bu kategoride paylaşılmaktadır. Şirket kültürümüz, değerlerimiz ve vizyonumuzdaki yenilikler hakkında şeffaf bir şekilde bilgilendirme yapıyoruz.</p>
            <p>Platform altyapı güncellemeleri, performans iyileştirmeleri ve yeni özellik duyuruları da bu bölümde yer almaktadır. Kullanıcılarımızın deneyimini sürekli iyileştirmek için yaptığımız yatırımları ve geliştirmeleri detaylı olarak açıklıyoruz. Bakım çalışmaları ve planlı kesintiler de önceden bu sayfa üzerinden duyurulmaktadır.</p>
          `
        },
        {
          title: 'Medya İletişim',
          content: `
            <p>Medya mensupları ve analistler için iSTOC basın kiti, şirket logoları, yönetim kadrosu fotoğrafları ve kurumsal bilgi dokümanlarını içermektedir. Basın kitimizi bu sayfadan indirip kullanabilirsiniz.</p>
            <p>Röportaj talepleri, basın davetleri ve medya ile ilgili tüm sorularınız için basın ilişkileri ekibimize ulaşabilirsiniz. E-posta: press@istoc.com | Telefon: +90 212 XXX XX XX. Basın ilişkileri ekibimiz, gelen taleplere en geç 24 saat içinde yanıt vermektedir. Acil durumlarda, basın acil hattımız 7/24 ulaşılabilir durumdadır.</p>
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
