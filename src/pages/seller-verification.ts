/**
 * Doğrulanmış Tedarikçi Olun — Entry Point
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
      ${Breadcrumb([{ label: 'Doğrulanmış Tedarikçi Olun' }])}
    </div>
    ${InfoPageLayout({
      title: 'Doğrulanmış Tedarikçi Olun',
      subtitle: 'Güvenilir tedarikçi rozetinizi kazanın',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/></svg>',
      sections: [
        {
          title: 'Doğrulama Avantajları',
          content: `
            <p>iSTOC Doğrulanmış Tedarikçi rozeti, platformdaki güvenilirliğinizin en güçlü göstergesidir. Doğrulanmış tedarikçiler, arama sonuçlarında %40 daha fazla görünürlük elde eder ve alıcıların %78'i doğrulanmış tedarikçileri tercih etmektedir.</p>
            <p>Rozetiniz, mağaza profilinizde, ürün listelerinizde ve arama sonuçlarında belirgin şekilde görüntülenir. Alıcılar, doğrulanmış tedarikçilere daha yüksek güvenle sipariş verir; bu da dönüşüm oranınızı önemli ölçüde artırır. Ayrıca, doğrulanmış tedarikçilere özel kampanyalara ve vitrin alanlarına erişim hakkı kazanırsınız.</p>
            <p>Doğrulanmış tedarikçiler, iSTOC'un öncelikli destek hattından yararlanır, özel eğitim programlarına katılabilir ve iSTOC iş geliştirme etkinliklerinde ağırlıklı olarak yer alır.</p>
          `
        },
        {
          title: 'Doğrulama Gereksinimleri',
          content: `
            <p>Doğrulama sürecine başvurmak için aşağıdaki temel belgelerin hazır olması gerekmektedir: güncel ticaret sicil gazetesi, vergi levhası, imza sirküleri, son 2 yıla ait bilanço ve gelir tablosu, üretim tesisi fotoğrafları ve faaliyet belgesi.</p>
            <p>Firmanızın en az 2 yıldır faaliyette olması, geçerli bir ticaret sicil kaydına sahip olması ve iSTOC platformunda en az 6 aydır aktif satıcı olarak kayıtlı bulunması gerekmektedir. Ayrıca, son 6 ayda müşteri memnuniyet puanınızın 4.0/5.0 üzerinde olması beklenmektedir.</p>
          `
        },
        {
          title: 'Başvuru Süreci',
          content: `
            <p>Doğrulama başvurusu 4 basit adımda tamamlanır. İlk olarak, satıcı panelinizden "Doğrulama Başvurusu" bölümüne gidin ve çevrimiçi başvuru formunu doldurun. İkinci adımda, gerekli belgeleri sisteme yükleyin. Üçüncü adımda, iSTOC doğrulama ekibi belgelerinizi inceleyecek ve gerekirse ek bilgi talep edecektir.</p>
            <p>Dördüncü ve son adımda, Gelişmiş ve Premium doğrulama seviyeleri için iSTOC temsilcisi tarafından iş yerinize ziyaret gerçekleştirilir. Tüm süreç ortalama 10-15 iş günü içinde tamamlanır. Başvurunuzun durumunu satıcı panelinizden anlık olarak takip edebilirsiniz.</p>
          `
        },
        {
          title: 'Doğrulama Seviyeleri',
          content: `
            <p><strong>Temel Doğrulama:</strong> Şirket tescil belgelerinin ve vergi mükellefiyet durumunun doğrulanması. Bu seviye, firmanızın yasal olarak faaliyet gösterdiğini teyit eder. Ücretsiz olarak sunulmaktadır.</p>
            <p><strong>Gelişmiş Doğrulama:</strong> Temel doğrulamaya ek olarak, üretim kapasitesi değerlendirmesi ve yerinde denetim içerir. Fabrika ziyareti sırasında üretim hatları, kalite kontrol süreçleri ve depolama koşulları incelenir. Yıllık 2.990 TL doğrulama ücreti uygulanır.</p>
            <p><strong>Premium Doğrulama:</strong> En üst düzey güvenilirlik rozetidir. Gelişmiş doğrulamaya ek olarak, finansal sağlamlık analizi, müşteri referans kontrolü ve yıllık düzenli denetimler içerir. Premium doğrulanmış tedarikçiler, iSTOC'un en güvenilir iş ortakları olarak öne çıkarılır. Yıllık 7.990 TL doğrulama ücreti uygulanır.</p>
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
