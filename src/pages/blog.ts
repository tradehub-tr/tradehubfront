/**
 * iSTOC Okumalar — Entry Point
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
      ${Breadcrumb([{ label: 'iSTOC Okumalar' }])}
    </div>
    ${InfoPageLayout({
      title: 'iSTOC Okumalar',
      subtitle: 'Sektör haberleri, trendler ve ticaret rehberleri',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>',
      sections: [
        {
          title: 'Son Yayınlanan Yazılar',
          content: `
            <p>iSTOC Okumalar, B2B ticaret dünyasındaki en güncel gelişmeleri, uzman analizlerini ve pratik rehberleri sizinle buluşturur. Editör ekibimiz, sektörün önde gelen uzmanlarıyla iş birliği yaparak, ticaret stratejilerinizi güçlendirecek içerikler hazırlamaktadır.</p>
            <p>Her hafta yayınlanan yeni makalelerimizde tedarik zinciri yönetimi, dijital ticaret trendleri, ihracat rehberleri ve başarı hikayeleri gibi konuları derinlemesine ele alıyoruz. E-posta bültenimize abone olarak en son yayınlardan anında haberdar olabilirsiniz.</p>
            <p>Yakında bu bölümde en son makalelerimiz, sektör raporlarımız ve özel içeriklerimiz yer alacaktır. Takipte kalın!</p>
          `
        },
        {
          title: 'Sektör Haberleri',
          content: `
            <p>Türkiye ve dünya ticaretindeki son gelişmeleri yakından takip edin. Gümrük mevzuatı değişiklikleri, yeni ticaret anlaşmaları, sektörel fuarlar ve ekonomik göstergeler hakkında güncel bilgilere ulaşın. İhracatçılar ve ithalatçılar için önemli duyurular ve yasal düzenlemeler bu kategoride paylaşılmaktadır.</p>
            <p>Sektör haberlerimiz, güvenilir kaynaklardan derlenerek uzman yorumlarıyla zenginleştirilir. Ticaret politikaları, gümrük tarifeleri ve uluslararası düzenlemeler hakkında anlaşılır analizler sunuyoruz.</p>
          `
        },
        {
          title: 'Ticaret Rehberleri',
          content: `
            <p>İster ilk kez B2B ticaret yapıyor olun ister deneyimli bir alıcı/satıcı, rehber serimiz her seviyeye hitap eden pratik bilgiler sunar. "Tedarikçi Seçimi Rehberi", "İhracata İlk Adım", "Fiyat Müzakere Teknikleri" ve "Kalite Kontrol Süreçleri" en popüler rehberlerimiz arasındadır.</p>
            <p>Adım adım kılavuzlarımız, gerçek ticaret senaryoları üzerine kurulmuştur. Kontrol listeleri, şablonlar ve örnek belgeler ile rehberlerimizi pratiğe dönüştürmeniz kolaylaşır. Her rehber, alanında uzman profesyoneller tarafından hazırlanmakta ve düzenli olarak güncellenmektedir.</p>
          `
        },
        {
          title: 'Başarı Hikayeleri ve Pazar Trendleri',
          content: `
            <p>iSTOC üzerinden ticaretini büyüten işletmelerin ilham verici hikayelerini okuyun. Küçük bir atölyeden uluslararası ihracatçıya dönüşen firmalardan, yenilikçi ürünleriyle pazar payını artıran tedarikçilere kadar pek çok başarı öyküsü bu kategoride yer almaktadır.</p>
            <p>Pazar trend analizlerimiz, hangi sektörlerin yükselişte olduğunu, hangi ürün kategorilerinde talep artışı yaşandığını ve gelecek dönem projeksiyonlarını veriye dayalı olarak ortaya koyar. Stratejik iş kararlarınızı destekleyecek bu analizler, her çeyrek sonunda kapsamlı raporlar halinde yayınlanır.</p>
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
