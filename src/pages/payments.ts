/**
 * Güvenli ve Kolay Ödemeler — Entry Point
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
      ${Breadcrumb([{ label: 'Güvenli ve Kolay Ödemeler' }])}
    </div>
    ${InfoPageLayout({
      title: 'Güvenli ve Kolay Ödemeler',
      subtitle: "iSTOC'ta güvenli ödeme yöntemleri ve alıcı koruması",
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>',
      sections: [
        {
          title: 'Desteklenen Ödeme Yöntemleri',
          content: `
            <p>iSTOC TradeHub, B2B ticaretiniz için geniş bir ödeme yelpazesi sunar. Kredi kartı ve banka kartı ile anında ödeme yapabilir, Visa, Mastercard ve Troy kartlarınızı güvenle kullanabilirsiniz. Tüm kart işlemleri 3D Secure teknolojisi ile korunmaktadır.</p>
            <p>Banka havalesi ve EFT ile de ödeme yapmanız mümkündür. Havale ödemelerinde iSTOC güvence hesabı üzerinden işlem gerçekleştirilir; böylece ödemeniz, ürün teslim alınana kadar güvende kalır. Büyük hacimli siparişlerde taksitli ödeme seçenekleri ve vadeli ödeme planları da mevcuttur.</p>
            <p>Escrow (emanet) ödeme sistemi sayesinde, alıcı ve satıcı arasında güvenilir bir köprü oluşturulur. Ödemeniz, sipariş onaylanana ve ürün teslim edilene kadar iSTOC güvence hesabında tutulur. Bu sistem, her iki tarafın da haklarını koruma altına alır.</p>
          `
        },
        {
          title: 'Alıcı Koruma Programı',
          content: `
            <p>iSTOC Alıcı Koruma Programı, platformumuzda yapılan her alışverişte sizi güvence altına alır. Sipariş ettiğiniz ürün açıklamayla uyuşmuyorsa, hasarlı ulaştıysa veya hiç teslim edilmediyse, ödemenizin tamamını geri alabilirsiniz.</p>
            <p>Koruma programımız, sipariş tarihinden itibaren 60 güne kadar geçerlidir. Bu süre zarfında herhangi bir sorun yaşamanız halinde, tek tıkla anlaşmazlık süreci başlatabilir ve uzman müşteri temsilcilerimizin desteğinden yararlanabilirsiniz. Alıcı koruması, tüm doğrulanmış tedarikçi siparişlerinde otomatik olarak aktiftir.</p>
          `
        },
        {
          title: 'Güvenli İşlem Garantisi',
          content: `
            <p>Platformumuz, uluslararası PCI DSS (Payment Card Industry Data Security Standard) standartlarına tam uyumlu olarak çalışmaktadır. Tüm ödeme bilgileriniz 256-bit SSL şifreleme ile korunur ve kart bilgileriniz hiçbir koşulda sunucularımızda saklanmaz.</p>
            <p>Dolandırıcılık tespit ve önleme sistemlerimiz, yapay zeka destekli algoritmalar kullanarak şüpheli işlemleri anında tespit eder. Her işlem, çok katmanlı güvenlik kontrollerinden geçirilir. Ayrıca, iki faktörlü kimlik doğrulama (2FA) seçeneğiyle hesap güvenliğinizi bir üst seviyeye taşıyabilirsiniz.</p>
          `
        },
        {
          title: 'Sıkça Sorulan Sorular',
          content: `
            <p><strong>Hangi para birimlerinde ödeme yapabilirim?</strong> iSTOC, Türk Lirası (TRY), ABD Doları (USD) ve Euro (EUR) olmak üzere üç ana para biriminde ödeme kabul etmektedir. Döviz kurları, işlem anında güncel piyasa kurlarına göre hesaplanır.</p>
            <p><strong>Taksitli ödeme seçenekleri var mı?</strong> Evet, anlaşmalı bankalarımız aracılığıyla 3, 6, 9 ve 12 aya kadar taksit seçenekleri sunulmaktadır. Taksit oranları, banka ve kart tipine göre değişiklik gösterebilir.</p>
            <p><strong>Ödeme bilgilerim güvende mi?</strong> Kesinlikle. Tüm ödeme işlemleri PCI DSS uyumlu altyapımızda, 256-bit SSL şifreleme ve 3D Secure teknolojisi ile gerçekleştirilir. Kart bilgileriniz hiçbir şekilde saklanmaz.</p>
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
