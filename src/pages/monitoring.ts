/**
 * Ürün İzleme Hizmetleri — Entry Point
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
      ${Breadcrumb([{ label: 'Ürün İzleme Hizmetleri' }])}
    </div>
    ${InfoPageLayout({
      title: 'Ürün İzleme Hizmetleri',
      subtitle: 'Ürün kalitesi ve tedarikçi güvenilirliğini takip edin',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>',
      sections: [
        {
          title: 'Kalite Denetimi',
          content: `
            <p>iSTOC Kalite Denetim Hizmeti, siparişinizin üretim ve sevkiyat aşamalarında profesyonel kontrol imkanı sunar. Bağımsız denetim uzmanlarımız, ürünlerinizi sipariş spesifikasyonlarına uygunluk, işçilik kalitesi ve ambalaj standartları açısından detaylı bir şekilde inceler.</p>
            <p>Denetim hizmeti üç aşamada sunulur: üretim öncesi (hammadde kontrolü), üretim sırası (süreç denetimi) ve sevkiyat öncesi (son kontrol). Her aşamada detaylı bir denetim raporu hazırlanır ve fotoğraflarla desteklenerek tarafınıza iletilir. Bu sayede, ürünleriniz elinize ulaşmadan önce kaliteden emin olabilirsiniz.</p>
          `
        },
        {
          title: 'Tedarikçi Doğrulama',
          content: `
            <p>Platformumuzdaki tedarikçiler, kapsamlı bir doğrulama sürecinden geçirilir. Şirket tescil belgeleri, üretim kapasitesi, finansal durum ve geçmiş ticari performans gibi kriterler detaylı olarak incelenir. Doğrulama sonuçları, tedarikçi profilinde şeffaf bir şekilde görüntülenir.</p>
            <p>iSTOC doğrulama sistemi üç seviyeden oluşur: Temel Doğrulama (şirket belgeleri), Gelişmiş Doğrulama (fabrika ziyareti dahil) ve Premium Doğrulama (yıllık düzenli denetimler). Alıcı olarak, tedarikçinin doğrulama seviyesini sipariş öncesinde kontrol edebilir ve güvenilir iş ortakları seçebilirsiniz.</p>
          `
        },
        {
          title: 'Ürün Sertifikasyonu',
          content: `
            <p>iSTOC, ürünlerin uluslararası standartlara uygunluğunu belgeleyen sertifikasyon hizmetleri sunar. CE, ISO, FDA, RoHS gibi yaygın sertifikalar için tedarikçi belgelerinin doğrulanması platformumuz üzerinden gerçekleştirilir.</p>
            <p>Sertifika doğrulama sistemi sayesinde, tedarikçinin sunduğu belgelerin geçerliliğini ve doğruluğunu kontrol edebilirsiniz. Sahte veya süresi dolmuş sertifikalar otomatik olarak tespit edilir ve tedarikçi uyarılır. Ürün sayfalarındaki sertifika rozetleri, yalnızca doğrulanmış belgelere sahip ürünlerde görüntülenir.</p>
          `
        },
        {
          title: 'İzleme Araçları',
          content: `
            <p>iSTOC kontrol panelinizdeki izleme araçları, tedarik zincirinizi uçtan uca takip etmenizi sağlar. Sipariş durumu, üretim aşaması, kalite kontrol sonuçları ve kargo takibi gibi tüm bilgilere tek bir ekrandan erişebilirsiniz.</p>
            <p>Otomatik uyarı sistemi sayesinde, belirlediğiniz kriterlere göre bildirimler alırsınız. Örneğin, bir tedarikçinin teslimat performansı düştüğünde, kalite puanı değiştiğinde veya sertifika süresi dolmak üzereyken otomatik olarak bilgilendirilirsiniz. Tüm izleme verileri raporlar halinde dışa aktarılabilir ve iç denetim süreçlerinizde kullanılabilir.</p>
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
