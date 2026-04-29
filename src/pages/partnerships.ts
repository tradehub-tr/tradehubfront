/**
 * Ortaklıklar — Entry Point
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
      ${Breadcrumb([{ label: 'Ortaklıklar' }])}
    </div>
    ${InfoPageLayout({
      title: 'Ortaklıklar',
      subtitle: 'İş ortaklığı fırsatları ve programları',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>',
      sections: [
        {
          title: 'Ortaklık Türleri',
          content: `
            <p><strong>Teknoloji Ortaklığı:</strong> ERP, CRM, muhasebe yazılımları ve lojistik sistemleri gibi teknoloji çözümleri sunan firmalarla entegrasyon ortaklıkları kuruyoruz. API entegrasyonları aracılığıyla müşterilerimize kesintisiz bir ticaret deneyimi sunuyoruz.</p>
            <p><strong>Lojistik Ortaklığı:</strong> Kargo şirketleri, gümrük müşavirleri ve depolama hizmeti sağlayıcılarıyla stratejik ortaklıklar geliştiriyoruz. Bu ortaklıklar sayesinde platformumuzdaki kullanıcılara rekabetçi kargo fiyatları ve geniş teslimat ağı sunuyoruz.</p>
            <p><strong>İş Geliştirme Ortaklığı:</strong> Ticaret odaları, sanayi kuruluşları, sektörel dernekler ve ihracatçı birlikleriyle işbirliği yaparak üyelerimize katma değerli hizmetler ve ticaret fırsatları sağlıyoruz.</p>
          `
        },
        {
          title: 'Ortaklık Avantajları',
          content: `
            <p>iSTOC iş ortakları, platformumuzun geniş kullanıcı tabanına erişim kazanır. Binlerce aktif alıcı ve satıcıya çözümlerinizi tanıtma fırsatı elde edersiniz. Ortak pazarlama kampanyaları, karşılıklı müşteri yönlendirmesi ve gelir paylaşımı modelleri ile iş hacminizi büyütebilirsiniz.</p>
            <p>Teknoloji ortaklarımız, iSTOC API ekosisteminde listelenme, teknik dokümantasyon desteği ve ortak geliştirme kaynakları gibi avantajlardan yararlanır. Lojistik ortaklarımız ise garantili hacim taahhütleri ve özel iş akışı entegrasyonlarından faydalanır. Tüm ortaklarımız, iSTOC sektör etkinliklerine sponsor veya katılımcı olarak davet edilir.</p>
          `
        },
        {
          title: 'Başvuru Süreci',
          content: `
            <p>Ortaklık başvurusu yapmak için aşağıdaki adımları izleyebilirsiniz. İlk olarak, ortaklık ilgi alanınızı belirleyin ve partnerships@istoc.com adresine firmanızı tanıtan kısa bir e-posta gönderin. İş geliştirme ekibimiz, başvurunuzu 5 iş günü içinde değerlendirecektir.</p>
            <p>Başvurunuz olumlu değerlendirildiğinde, karşılıklı tanışma toplantısı düzenlenir. Bu toplantıda ortaklık kapsamı, beklentiler ve iş modeli detaylandırılır. Anlaşma sağlandığında, ortaklık sözleşmesi imzalanır ve entegrasyon süreci başlar. Teknik ortaklıklarda entegrasyon süresi genellikle 2-4 hafta arasında değişmektedir.</p>
          `
        },
        {
          title: 'Mevcut Ortaklarımız',
          content: `
            <p>iSTOC, Türkiye'nin ve dünyanın önde gelen kurumlarıyla güçlü iş ortaklıkları sürdürmektedir. Lojistik alanında Aras Kargo, Yurtiçi Kargo ve UPS ile stratejik ortaklıklarımız bulunmaktadır. Finansal hizmetlerde ise Türkiye'nin büyük bankaları ve fintech şirketleriyle iş birliği yapıyoruz.</p>
            <p>Teknoloji tarafında, bulut altyapı sağlayıcıları, siber güvenlik firmaları ve iş yazılımı geliştiricileriyle entegrasyonlarımız mevcuttur. Sektörel kuruluşlardan TİM (Türkiye İhracatçılar Meclisi), TOBB ve çeşitli sanayi odaları ile işbirliği protokollerimiz bulunmaktadır. Ortaklık ağımız sürekli genişlemektedir ve yeni iş birliklerine her zaman açığız.</p>
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
