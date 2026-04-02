/**
 * Satış Sonrası Korumalar — Entry Point
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
      ${Breadcrumb([{ label: 'Satış Sonrası Korumalar' }])}
    </div>
    ${InfoPageLayout({
      title: 'Satış Sonrası Korumalar',
      subtitle: 'Satın alma sonrası destek ve garanti hizmetleri',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>',
      sections: [
        {
          title: 'Garanti Hizmetleri',
          content: `
            <p>iSTOC platformunda satılan tüm ürünler, satıcı tarafından belirtilen garanti süresine tabidir. Doğrulanmış tedarikçilerimiz, minimum 12 ay ürün garantisi sunmakla yükümlüdür. Garanti kapsamında üretim hatası, malzeme kusuru ve normal kullanımda oluşan arızalar yer almaktadır.</p>
            <p>Garanti talebinizi iSTOC üzerinden kolayca oluşturabilirsiniz. Ürünün fotoğraflarını ve arıza açıklamasını sisteme yükledikten sonra, satıcı 48 saat içinde yanıt vermekle yükümlüdür. Garanti kapsamındaki ürünler için onarım, değişim veya iade seçenekleri sunulur.</p>
          `
        },
        {
          title: 'Teknik Destek',
          content: `
            <p>Satın aldığınız ürünlerle ilgili teknik sorularınız için 7/24 destek hattımız hizmetinizdedir. Uzman teknik ekibimiz, ürün kurulumu, kullanım rehberliği ve sorun giderme konularında size yardımcı olur. Canlı sohbet, e-posta ve telefon kanalları üzerinden destek alabilirsiniz.</p>
            <p>Ayrıca, her ürün için detaylı kullanım kılavuzları ve video rehberler platformumuzda mevcuttur. Tedarikçilerin hazırladığı teknik dokümantasyona ürün sayfası üzerinden erişebilirsiniz. Toplu siparişlerde yerinde teknik destek hizmeti de talep edilebilir.</p>
          `
        },
        {
          title: 'Değişim Politikası',
          content: `
            <p>Ürünün kusurlu veya hatalı olması durumunda, teslimat tarihinden itibaren 30 gün içinde ücretsiz değişim talep edebilirsiniz. Değişim süreci, iade sürecine benzer şekilde işler; ancak yeni ürün, iade onayı beklenmeden hızlandırılmış kargo ile gönderilir.</p>
            <p>Toplu siparişlerde partinin bir kısmının kusurlu olması halinde, yalnızca kusurlu birimler için değişim yapılabilir. Değişim ürünleri, orijinal sipariş ile aynı garanti koşullarına tabidir. Değişim sırasında oluşan tüm kargo masrafları satıcı tarafından karşılanır.</p>
          `
        },
        {
          title: 'Şikayet Süreci',
          content: `
            <p>Herhangi bir memnuniyetsizlik durumunda, iSTOC şikayet yönetim sistemi aracılığıyla resmi şikayet kaydı oluşturabilirsiniz. Şikayetiniz, öncelik seviyesine göre sınıflandırılır ve en kısa sürede uzman bir temsilciye atanır.</p>
            <p>Standart şikayetler 3 iş günü, acil şikayetler ise 24 saat içinde yanıtlanır. Süreç boyunca şikayetinizin durumunu anlık olarak takip edebilirsiniz. iSTOC, tedarikçi performansını şikayet oranlarına göre değerlendirir; bu sayede platformdaki hizmet kalitesi sürekli olarak yüksek tutulur.</p>
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
