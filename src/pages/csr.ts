/**
 * Kurumsal Sorumluluk — Entry Point
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
      ${Breadcrumb([{ label: 'Kurumsal Sorumluluk' }])}
    </div>
    ${InfoPageLayout({
      title: 'Kurumsal Sorumluluk',
      subtitle: 'Sürdürülebilir ticaret ve toplumsal sorumluluk',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438a2.253 2.253 0 01-1.699 2.652l-.829.207a8.955 8.955 0 01-4.146-2.76"/></svg>',
      sections: [
        {
          title: 'Sürdürülebilirlik Taahhüdü',
          content: `
            <p>iSTOC olarak, sürdürülebilir ticaretin geleceğin temelini oluşturduğuna inanıyoruz. Karbon ayak izimizi azaltmak, çevre dostu iş uygulamalarını teşvik etmek ve yeşil tedarik zincirleri oluşturmak için kapsamlı bir sürdürülebilirlik stratejisi yürütüyoruz.</p>
            <p>2025 yılı itibarıyla veri merkezlerimizin %100'ü yenilenebilir enerji kaynaklarıyla çalışmaktadır. Ofislerimizde sıfır atık politikası uygulanmakta ve tüm iş süreçlerimizde kağıtsız operasyon modeline geçiş tamamlanmıştır. Platformumuzda "Yeşil Tedarikçi" rozeti taşıyan satıcıları öne çıkararak, çevre bilincini tedarik zincirine yaymayı hedefliyoruz.</p>
          `
        },
        {
          title: 'Etik Ticaret İlkeleri',
          content: `
            <p>iSTOC, platformunda faaliyet gösteren tüm tedarikçilerin etik ticaret ilkelerine uymasını zorunlu kılar. Çocuk işçiliği, zorla çalıştırma ve her türlü ayrımcılık kesinlikle yasaklanmıştır. Tedarikçilerimiz, uluslararası çalışma standartlarına ve insan hakları ilkelerine bağlı kalmayı taahhüt eder.</p>
            <p>Etik uyum denetimlerimiz, bağımsız denetçiler tarafından düzenli olarak gerçekleştirilmektedir. Çalışma koşulları, ücret politikaları ve iş güvenliği standartları bu denetimlerin temel odak noktalarıdır. Etik ihlal bildirimi için anonim şikayet hattımız 7/24 hizmet vermektedir. İhlal tespit edilen tedarikçilere düzeltici eylem planı uygulanır; tekrarlayan ihlallerde platformdan çıkarma kararı alınabilir.</p>
          `
        },
        {
          title: 'Toplumsal Katkı Programları',
          content: `
            <p>iSTOC Toplumsal Katkı Programı kapsamında, eğitim, girişimcilik ve dijital okuryazarlık alanlarında çeşitli projeler yürütmekteyiz. "Dijital Ticaret Akademisi" programımızla her yıl binlerce küçük işletme sahibine ücretsiz e-ticaret eğitimi veriyoruz.</p>
            <p>"Kadın Girişimciler için Ticaret Köprüsü" projemiz, kadın girişimcilerin B2B ticarete erişimini kolaylaştırmak amacıyla mentorluk, eğitim ve finansman desteği sağlamaktadır. Ayrıca, meslek lisesi ve üniversite öğrencilerine yönelik staj programlarımızla genç yeteneklerin sektöre kazandırılmasına katkıda bulunuyoruz.</p>
          `
        },
        {
          title: 'Çevre İnisiyatifleri',
          content: `
            <p>iSTOC Yeşil Lojistik Programı ile kargo operasyonlarında karbon emisyonunu azaltmayı hedefliyoruz. Lojistik ortaklarımızla birlikte elektrikli araç filosuna geçiş, rota optimizasyonu ve toplu sevkiyat teşvikleri gibi uygulamalar hayata geçirilmektedir.</p>
            <p>"Yeşil Ambalaj Taahhüdü" kapsamında, tedarikçilerimizi geri dönüştürülebilir ve biyolojik olarak parçalanabilir ambalaj malzemeleri kullanmaya teşvik ediyoruz. Bu taahhüdü benimseyen tedarikçilere ambalaj maliyetlerinde %10 indirim sağlanmaktadır. Platformumuzdaki her işlem için karbon dengeleme programına katkıda bulunuyor ve orman ağaçlandırma projelerini destekliyoruz.</p>
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
