/**
 * Kariyer — Entry Point
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
      ${Breadcrumb([{ label: 'Kariyer' }])}
    </div>
    ${InfoPageLayout({
      title: 'Kariyer',
      subtitle: 'iSTOC ailesine katılın',
      icon: '<svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"/></svg>',
      sections: [
        {
          title: 'Neden iSTOC?',
          content: `
            <p>iSTOC, Türkiye'nin en hızlı büyüyen B2B ticaret platformlarından biri olarak, yenilikçi teknolojiler ve tutkulu bir ekiple geleceğin ticaretini şekillendiriyor. Burada sadece bir iş değil, gerçek bir etki yaratma fırsatı bulacaksınız. Geliştirdiğiniz her özellik, binlerce işletmenin ticaretini kolaylaştıracak.</p>
            <p>Düz bir organizasyon yapısı, açık iletişim kültürü ve hızlı karar alma süreçleri ile çevik bir çalışma ortamı sunuyoruz. Fikirleriniz duyulur, katkılarınız görülür ve başarılarınız takdir edilir. Startup enerjisi ile kurumsal güvenceyi bir arada yaşamak istiyorsanız, iSTOC tam size göre.</p>
          `
        },
        {
          title: 'Açık Pozisyonlar',
          content: `
            <p>iSTOC ekibi sürekli büyüyor ve farklı uzmanlık alanlarından yetenekli profesyoneller arıyoruz. Yazılım geliştirme, ürün yönetimi, veri bilimi, tasarım, pazarlama, satış, müşteri başarısı ve operasyon departmanlarımızda çeşitli kariyer fırsatları bulunmaktadır.</p>
            <p>Güncel açık pozisyonlarımız yakında bu sayfada listelenecektir. Şu anda aktif bir ilana rastlamasanız bile, özgeçmişinizi kariyer@istoc.com adresine göndererek yetenek havuzumuza kayıt olabilirsiniz. Profilinize uygun bir pozisyon açıldığında sizinle öncelikli olarak iletişime geçeceğiz.</p>
            <p>Staj programlarımız hakkında bilgi almak isteyen üniversite öğrencileri de aynı adres üzerinden başvurularını iletebilir.</p>
          `
        },
        {
          title: 'Şirket Kültürü',
          content: `
            <p>iSTOC'ta çeşitlilik, kapsayıcılık ve sürekli öğrenme kültürümüzün temel taşlarıdır. Farklı geçmişlerden, farklı bakış açılarından gelen ekip arkadaşlarımız, birbirini tamamlayan güçlü bir sinerji oluşturur. Çeşitliliğin inovasyonu beslediğine ve daha iyi kararlar alınmasını sağladığına inanıyoruz.</p>
            <p>Hibrit çalışma modelimiz, esneklik ve iş birliğini dengeler. Haftanın belirli günleri ofiste bir arada olurken, diğer günlerde uzaktan çalışma imkanından yararlanabilirsiniz. Düzenli ekip etkinlikleri, hackathon'lar, bilgi paylaşım oturumları ve sosyal aktivitelerle ekip ruhunu güçlü tutuyoruz.</p>
          `
        },
        {
          title: 'Yan Haklar ve Başvuru Süreci',
          content: `
            <p><strong>Yan Haklar:</strong> Rekabetçi maaş paketi, performans bazlı prim, özel sağlık sigortası, yemek kartı, ulaşım desteği, eğitim ve gelişim bütçesi, spor salonu üyeliği, esnek çalışma saatleri ve yılda 2 kez uzaktan çalışma haftası (workation) sunuyoruz.</p>
            <p><strong>Başvuru Süreci:</strong> Online başvurunuzu aldıktan sonra, İK ekibimiz özgeçmişinizi 5 iş günü içinde değerlendirir. Uygun adaylarla önce kısa bir telefon görüşmesi, ardından teknik/yetkinlik mülakatı ve son olarak ekip mülakatı gerçekleştirilir. Tüm süreç genellikle 2-3 hafta içinde tamamlanır. Başvurunuzun her aşamasında sizinle şeffaf bir şekilde iletişim kurarız.</p>
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
