/**
 * Üyelik Programı — Entry Point
 */
import '../style.css'
import { initFlowbite } from 'flowbite'
import { TopBar, SubHeader, MegaMenu, initMegaMenu, initStickyHeaderSearch, initMobileDrawer } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
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
      ${Breadcrumb([{ label: 'Üyelik Programı' }])}
    </div>
    ${InfoPageLayout({
      title: 'Üyelik Programı',
      subtitle: 'iSTOC üyelik avantajları ve özel fırsatlar',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>',
      sections: [
        {
          title: 'Üyelik Seviyeleri',
          content: `
            <p><strong>Ücretsiz Üyelik:</strong> iSTOC platformuna kaydolan her kullanıcı, temel üyelik avantajlarından otomatik olarak yararlanır. Ücretsiz üyelikte sınırsız ürün arama, tedarikçi iletişimi, temel alıcı koruması ve aylık 5 teklif talebi (RFQ) hakkı bulunmaktadır.</p>
            <p><strong>Premium Üyelik:</strong> Aylık 499 TL karşılığında sunulan Premium üyelik, ticaret hacminizi büyütmek isteyenler için tasarlanmıştır. Sınırsız RFQ, öncelikli müşteri desteği, gelişmiş analitik raporlar, özel indirim kuponları ve VIP tedarikçi erişimi avantajlarından yararlanabilirsiniz.</p>
            <p><strong>Kurumsal Üyelik:</strong> Büyük ölçekli işletmeler için özel fiyatlandırma ile sunulan Kurumsal üyelik, tüm Premium özelliklere ek olarak özel hesap yöneticisi, API erişimi, çoklu kullanıcı yönetimi, özel entegrasyon desteği ve yıllık strateji danışmanlığı içerir.</p>
          `
        },
        {
          title: 'Üyelik Avantajları',
          content: `
            <p>iSTOC üyelik programı, B2B ticaretinizi her yönden destekler. Premium ve Kurumsal üyeler, platform genelindeki ürünlerde %3 ila %8 arasında özel indirimlerden yararlanır. Ayrıca, sezonluk kampanyalara erken erişim ve özel fırsat bildirimlerinden haberdar olursunuz.</p>
            <p>Üyelik seviyeniz yükseldikçe, tedarikçi kalite raporlarına, pazar analiz araçlarına ve rekabet istihbaratı verilerine erişiminiz genişler. Premium üyeler, profesyonel kalite denetim hizmetinden yılda 2 kez ücretsiz yararlanabilir. Kurumsal üyeler ise sınırsız denetim hakkına sahiptir.</p>
          `
        },
        {
          title: 'Fiyatlandırma',
          content: `
            <p>iSTOC üyelik planları, her bütçeye uygun esnek fiyatlandırma seçenekleri sunar. Yıllık ödeme tercih ettiğinizde, aylık plana kıyasla %20 tasarruf sağlarsınız. Tüm planlar için 14 günlük ücretsiz deneme süresi mevcuttur; bu süre zarfında herhangi bir ücret alınmaz.</p>
            <p>Ücretsiz plan: 0 TL/ay | Premium plan: 499 TL/ay (yıllık ödemede 399 TL/ay) | Kurumsal plan: Özel fiyatlandırma (satış ekibimizle iletişime geçin). Tüm fiyatlara KDV dahildir. Plan değişikliğini istediğiniz zaman yapabilir, kalan süreniz oransal olarak yeni planınıza aktarılır.</p>
          `
        },
        {
          title: 'Üyelik Yükseltme',
          content: `
            <p>Üyeliğinizi yükseltmek son derece kolaydır. Hesap ayarlarınızdan "Üyelik Planı" bölümüne gidin, istediğiniz planı seçin ve ödeme bilgilerinizi girin. Yükseltme işlemi anında geçerli olur ve yeni avantajlarınızdan hemen yararlanmaya başlarsınız.</p>
            <p>Mevcut planınızdan daha düşük bir plana geçiş yapmak isterseniz, mevcut dönem sonunda değişiklik uygulanır. İptal durumunda da dönem sonuna kadar aktif üyelik avantajlarınız devam eder. Üyelik yükseltme veya değişiklik işlemlerinde herhangi bir ceza veya ek ücret uygulanmaz.</p>
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
mountChatPopup();
initChatTriggers();
startAlpine();
initStickyHeaderSearch();
initMobileDrawer();
initLanguageSelector();
