/**
 * Legal Pages Content Data
 * Internationalized content for Terms, Privacy, Cookies, Returns pages
 */

import type { LegalSection } from "../components/legal/LegalPageLayout";
import { t } from "../i18n";

export interface LegalPageData {
  pageTitle: string;
  lastUpdated: string;
  breadcrumbLabel: string;
  sections: LegalSection[];
}

export function termsContent(): LegalPageData {
  return {
    pageTitle: t("legal.terms.pageTitle"),
    lastUpdated: t("legal.terms.lastUpdated"),
    breadcrumbLabel: t("legal.terms.breadcrumbLabel"),
    sections: [
      {
        id: "tanimlar",
        title: t("legal.terms.section1Title"),
        content: t("legal.terms.section1Content"),
      },
      {
        id: "kapsam",
        title: t("legal.terms.section2Title"),
        content: t("legal.terms.section2Content"),
      },
      {
        id: "uyelik",
        title: t("legal.terms.section3Title"),
        content: t("legal.terms.section3Content"),
      },
      {
        id: "siparis",
        title: t("legal.terms.section4Title"),
        content: t("legal.terms.section4Content"),
      },
      {
        id: "odeme",
        title: t("legal.terms.section5Title"),
        content: t("legal.terms.section5Content"),
      },
      {
        id: "kargo",
        title: t("legal.terms.section6Title"),
        content: t("legal.terms.section6Content"),
      },
      {
        id: "iade",
        title: t("legal.terms.section7Title"),
        content: t("legal.terms.section7Content"),
      },
      {
        id: "fikri-mulkiyet",
        title: t("legal.terms.section8Title"),
        content: t("legal.terms.section8Content"),
      },
      {
        id: "sorumluluk",
        title: t("legal.terms.section9Title"),
        content: t("legal.terms.section9Content"),
      },
      {
        id: "uygulanacak-hukuk",
        title: t("legal.terms.section10Title"),
        content: t("legal.terms.section10Content"),
      },
    ],
  };
}

export function privacyContent(): LegalPageData {
  return {
    pageTitle: t("legal.privacy.pageTitle"),
    lastUpdated: t("legal.privacy.lastUpdated"),
    breadcrumbLabel: t("legal.privacy.breadcrumbLabel"),
    sections: [
      {
        id: "veri-sorumlusu",
        title: t("legal.privacy.section1Title"),
        content: t("legal.privacy.section1Content"),
      },
      {
        id: "toplanan-veriler",
        title: t("legal.privacy.section2Title"),
        content: t("legal.privacy.section2Content"),
      },
      {
        id: "isleme-amaclari",
        title: t("legal.privacy.section3Title"),
        content: t("legal.privacy.section3Content"),
      },
      {
        id: "hukuki-dayanak",
        title: t("legal.privacy.section4Title"),
        content: t("legal.privacy.section4Content"),
      },
      {
        id: "veri-paylasimi",
        title: t("legal.privacy.section5Title"),
        content: t("legal.privacy.section5Content"),
      },
      {
        id: "uluslararasi-transfer",
        title: t("legal.privacy.section6Title"),
        content: t("legal.privacy.section6Content"),
      },
      {
        id: "veri-hakklari",
        title: t("legal.privacy.section7Title"),
        content: t("legal.privacy.section7Content"),
      },
      {
        id: "iletisim",
        title: t("legal.privacy.section8Title"),
        content: t("legal.privacy.section8Content"),
      },
    ],
  };
}

export function cookiesContent(): LegalPageData {
  return {
    pageTitle: t("legal.cookies.pageTitle"),
    lastUpdated: t("legal.cookies.lastUpdated"),
    breadcrumbLabel: t("legal.cookies.breadcrumbLabel"),
    sections: [
      {
        id: "cerez-nedir",
        title: t("legal.cookies.section1Title"),
        content: t("legal.cookies.section1Content"),
      },
      {
        id: "zorunlu",
        title: t("legal.cookies.section2Title"),
        content: t("legal.cookies.section2Content"),
      },
      {
        id: "fonksiyonel",
        title: t("legal.cookies.section3Title"),
        content: t("legal.cookies.section3Content"),
      },
      {
        id: "analitik",
        title: t("legal.cookies.section4Title"),
        content: t("legal.cookies.section4Content"),
      },
      {
        id: "pazarlama",
        title: t("legal.cookies.section5Title"),
        content: t("legal.cookies.section5Content"),
      },
      {
        id: "yonetim",
        title: t("legal.cookies.section6Title"),
        content: t("legal.cookies.section6Content"),
      },
    ],
  };
}

export function noticeContent(): LegalPageData {
  return {
    pageTitle: t("legal.notice.pageTitle"),
    lastUpdated: t("legal.notice.lastUpdated"),
    breadcrumbLabel: t("legal.notice.breadcrumbLabel"),
    sections: [
      {
        id: "sirket-bilgileri",
        title: t("legal.notice.section1Title"),
        content: t("legal.notice.section1Content"),
      },
      {
        id: "platform-hakkinda",
        title: t("legal.notice.section2Title"),
        content: t("legal.notice.section2Content"),
      },
      {
        id: "sorumluluk-siniri",
        title: t("legal.notice.section3Title"),
        content: t("legal.notice.section3Content"),
      },
      {
        id: "denetim-sikayet",
        title: t("legal.notice.section4Title"),
        content: t("legal.notice.section4Content"),
      },
      {
        id: "uygulanacak-hukuk",
        title: t("legal.notice.section5Title"),
        content: t("legal.notice.section5Content"),
      },
    ],
  };
}

export function productListingContent(): LegalPageData {
  return {
    pageTitle: t("legal.productListing.pageTitle"),
    lastUpdated: t("legal.productListing.lastUpdated"),
    breadcrumbLabel: t("legal.productListing.breadcrumbLabel"),
    sections: [
      {
        id: "genel-ilkeler",
        title: t("legal.productListing.section1Title"),
        content: t("legal.productListing.section1Content"),
      },
      {
        id: "urun-bilgileri",
        title: t("legal.productListing.section2Title"),
        content: t("legal.productListing.section2Content"),
      },
      {
        id: "yasakli-urunler",
        title: t("legal.productListing.section3Title"),
        content: t("legal.productListing.section3Content"),
      },
      {
        id: "gorsel-standartlari",
        title: t("legal.productListing.section4Title"),
        content: t("legal.productListing.section4Content"),
      },
      {
        id: "fiyatlandirma",
        title: t("legal.productListing.section5Title"),
        content: t("legal.productListing.section5Content"),
      },
      {
        id: "ihlal-yaptirimlar",
        title: t("legal.productListing.section6Title"),
        content: t("legal.productListing.section6Content"),
      },
    ],
  };
}

export function ipContent(): LegalPageData {
  return {
    pageTitle: t("legal.ip.pageTitle"),
    lastUpdated: t("legal.ip.lastUpdated"),
    breadcrumbLabel: t("legal.ip.breadcrumbLabel"),
    sections: [
      {
        id: "koruma-taahhudu",
        title: t("legal.ip.section1Title"),
        content: t("legal.ip.section1Content"),
      },
      {
        id: "istoc-haklari",
        title: t("legal.ip.section2Title"),
        content: t("legal.ip.section2Content"),
      },
      {
        id: "ihlal-bildirimi",
        title: t("legal.ip.section3Title"),
        content: t("legal.ip.section3Content"),
      },
      {
        id: "inceleme-sureci",
        title: t("legal.ip.section4Title"),
        content: t("legal.ip.section4Content"),
      },
      {
        id: "karsi-bildirim",
        title: t("legal.ip.section5Title"),
        content: t("legal.ip.section5Content"),
      },
      {
        id: "tekrarlayan-ihlaller",
        title: t("legal.ip.section6Title"),
        content: t("legal.ip.section6Content"),
      },
    ],
  };
}

export function accessibilityContent(): LegalPageData {
  return {
    pageTitle: t("legal.accessibility.pageTitle"),
    lastUpdated: t("legal.accessibility.lastUpdated"),
    breadcrumbLabel: t("legal.accessibility.breadcrumbLabel"),
    sections: [
      {
        id: "taahhudumuz",
        title: t("legal.accessibility.section1Title"),
        content: t("legal.accessibility.section1Content"),
      },
      {
        id: "ozellikler",
        title: t("legal.accessibility.section2Title"),
        content: t("legal.accessibility.section2Content"),
      },
      {
        id: "yardimci-teknolojiler",
        title: t("legal.accessibility.section3Title"),
        content: t("legal.accessibility.section3Content"),
      },
      {
        id: "sinirlamalar",
        title: t("legal.accessibility.section4Title"),
        content: t("legal.accessibility.section4Content"),
      },
      {
        id: "geri-bildirim",
        title: t("legal.accessibility.section5Title"),
        content: t("legal.accessibility.section5Content"),
      },
      {
        id: "surekli-iyilestirme",
        title: t("legal.accessibility.section6Title"),
        content: t("legal.accessibility.section6Content"),
      },
    ],
  };
}

export function returnsContent(): LegalPageData {
  return {
    pageTitle: t("legal.returns.pageTitle"),
    lastUpdated: t("legal.returns.lastUpdated"),
    breadcrumbLabel: t("legal.returns.breadcrumbLabel"),
    sections: [
      {
        id: "genel-kosullar",
        title: t("legal.returns.section1Title"),
        content: t("legal.returns.section1Content"),
      },
      {
        id: "iade-suresi",
        title: t("legal.returns.section2Title"),
        content: t("legal.returns.section2Content"),
      },
      {
        id: "iade-sureci",
        title: t("legal.returns.section3Title"),
        content: t("legal.returns.section3Content"),
      },
      {
        id: "kargo",
        title: t("legal.returns.section4Title"),
        content: t("legal.returns.section4Content"),
      },
      {
        id: "inceleme",
        title: t("legal.returns.section5Title"),
        content: t("legal.returns.section5Content"),
      },
      {
        id: "para-iadesi",
        title: t("legal.returns.section6Title"),
        content: t("legal.returns.section6Content"),
      },
      {
        id: "istisnalar",
        title: t("legal.returns.section7Title"),
        content: t("legal.returns.section7Content"),
      },
    ],
  };
}

/**
 * Mesafeli Satış Sözleşmesi — MVP statik içerik (TR).
 * Yasal dayanak: 6502 s.K. + Mesafeli Sözleşmeler Yönetmeliği (RG 27.11.2014,
 * son değ. 10.08.2024 ve 24.05.2025 — iade kargo 01.01.2026 itibariyle satıcıya).
 * UYARI: Platform MERSİS, ETBİS ve KEP bilgileri firmaca doldurulmalı; metin
 * avukat incelemesinden geçirilmelidir.
 */
export function distanceSalesContent(): LegalPageData {
  return {
    pageTitle: "Mesafeli Satış Sözleşmesi",
    lastUpdated: "Son güncelleme: 24 Nisan 2026",
    breadcrumbLabel: "Mesafeli Satış Sözleşmesi",
    sections: [
      {
        id: "taraflar",
        title: "1. Taraflar",
        content: `
          <p>İşbu Mesafeli Satış Sözleşmesi ("Sözleşme"), aşağıdaki taraflar arasında elektronik ortamda kurulur:</p>
          <p><strong>ALICI:</strong> iSTOC TradeHub üyelik bilgileriyle ürün/hizmet satın alan gerçek veya tüzel kişi.</p>
          <p><strong>SATICI:</strong> iSTOC TradeHub üzerinde mağazası bulunan ve siparişe konu ürünü Alıcı'ya satan işletme; ticari unvanı, MERSİS/vergi bilgileri ve iletişim bilgileri sipariş özetinde ve faturada belirtilir.</p>
          <p><strong>ARACI HİZMET SAĞLAYICI (PLATFORM):</strong> iSTOC Ticaret Merkezi A.Ş. ("iSTOC"). İletişim bilgileri, MERSİS ve ETBİS kayıt numarası Kullanım Koşulları sayfasında yer alır. Platform, 6563 sayılı E-Ticaret Kanunu kapsamında aracı hizmet sağlayıcıdır ve Mesafeli Sözleşmeler Yönetmeliği md. 4/1-k uyarınca belirli yükümlülüklerden Satıcı ile birlikte müteselsilen sorumludur.</p>
        `,
      },
      {
        id: "konu",
        title: "2. Sözleşmenin Konusu",
        content: `
          <p>Sözleşme'nin konusu, Alıcı'nın Platform üzerinden sipariş ettiği ve Ön Bilgilendirme Formunda nitelikleri, adedi ve satış bedeli belirtilen mal/hizmetin Satıcı tarafından Alıcı'ya satışı ve teslimi ile tarafların 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile Mesafeli Sözleşmeler Yönetmeliği'nden kaynaklanan hak ve yükümlülüklerinin düzenlenmesidir.</p>
        `,
      },
      {
        id: "on-bilgilendirme",
        title: "3. Ön Bilgilendirme ve Elektronik Onay",
        content: `
          <p>Alıcı, siparişi tamamlamadan önce sipariş konusu mal/hizmetin temel nitelikleri, tüm vergiler dahil toplam fiyatı, ödeme ve teslimat bilgileri, cayma hakkının kullanım koşulları ile Yönetmelik md. 5'te sayılan diğer hususlar hakkında "Ön Bilgilendirme Formu" ile bilgilendirilmiş; söz konusu formu ve işbu Sözleşme'yi kalıcı veri saklayıcısı ile teyit ederek elektronik onay vermiştir.</p>
        `,
      },
      {
        id: "genel-hukumler",
        title: "4. Genel Hükümler",
        content: `
          <ul>
            <li>Satıcı; siparişi, sipariş konusu ürünün tüm vergi ve kargo bedeli dahil toplam fiyatı tahsil edildikten sonra taahhüt edilen sürede hazırlar ve kargoya teslim eder.</li>
            <li>Sipariş, stok durumu ve mücbir sebepler saklı kalmak üzere sipariş teyidinden itibaren en geç 30 gün içinde Alıcı'ya ulaştırılır.</li>
            <li>Teslimat bilgilerinin eksik/yanlış verilmesi, Alıcı'nın teslim alma yükümlülüğünü aksatması hallerinde Satıcı, oluşan ek masrafları Alıcı'dan talep edebilir.</li>
            <li>Ürün, Alıcı'ya tesliminde Alıcı veya vekili tarafından görünür ayıp bakımından muayene edilir; görünür ayıplar için itiraz tutanağa bağlanır.</li>
          </ul>
        `,
      },
      {
        id: "cayma-hakki",
        title: "5. Cayma Hakkı (14 Gün)",
        content: `
          <p>Alıcı, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malın kendisine veya gösterdiği adresteki kişiye tesliminden itibaren <strong>14 (on dört) gün</strong> içinde sözleşmeden cayabilir (MSY md. 9).</p>
          <p><strong>Kullanım şekli:</strong> Cayma hakkı; açık bir beyanla (yazılı, e-posta, kalıcı veri saklayıcısı) Satıcıya iletilir. Alıcı bildirim tarihinden itibaren 10 gün içinde ürünü Satıcıya veya Satıcının yetkilendirdiği kişiye iade etmelidir.</p>
          <p><strong>İade kargo ücreti:</strong> 24.05.2025 tarihli değişiklik uyarınca 01.01.2026 itibariyle iade taşıma gideri sözleşmeyle tüketiciye yüklenemez. Platform üzerinden kurulan tüm mesafeli sözleşmelerde iade kargo ücreti Satıcıya aittir (Ön Bilgilendirme Formunda ilan edilen iade taşıyıcısı kullanıldığı sürece).</p>
          <p><strong>Bedel iadesi:</strong> Satıcı, cayma bildiriminin kendisine ulaşmasından itibaren 14 gün içinde Alıcının ödediği toplam bedeli ve varsa Alıcıyı borç altına sokan belgeleri iade etmekle yükümlüdür. İade, Alıcının satın alırken kullandığı ödeme aracına uygun bir şekilde ve herhangi bir masraf veya yükümlülük getirmeden tek seferde yapılır.</p>
        `,
      },
      {
        id: "cayma-istisnalar",
        title: "6. Cayma Hakkının İstisnaları",
        content: `
          <p>Yönetmelik md. 15 uyarınca aşağıdaki hallerde cayma hakkı kullanılamaz:</p>
          <ul>
            <li>Alıcının istekleri veya açıkça onun kişisel ihtiyaçları doğrultusunda hazırlanan, niteliği itibariyle geri gönderilmeye elverişli olmayan ve çabuk bozulma tehlikesi olan veya son kullanma tarihi geçebilecek mallar.</li>
            <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış; iadesi sağlık ve hijyen açısından uygun olmayan mallar (iç giyim, kozmetik açılmış, tıbbi cihaz vb.).</li>
            <li>Tesliminden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılması mümkün olmayan mallar.</li>
            <li>Ambalajı Alıcı tarafından açılmış ses/görüntü kaydı, kitap, dijital içerik ile bilgisayar sarf malzemeleri.</li>
            <li>Abonelik sözleşmesi kapsamında sağlananlar dışındaki gazete ve dergi gibi süreli yayınlar.</li>
            <li>Belirli bir tarihte veya dönemde ifa edilmesi gereken konaklama, eşya taşıma, araba kiralama, yiyecek-içecek ve eğlence/dinlenme hizmetleri.</li>
            <li>Elektronik ortamda anında ifa edilen hizmetler ile Alıcıya anında teslim edilen gayri maddi mallar (dijital yazılım, online içerik vb.).</li>
            <li>Cayma hakkı süresi dolmadan onayıyla ifasına başlanan hizmetler.</li>
            <li>Canlı müzayede yoluyla akdedilen sözleşmeler.</li>
          </ul>
        `,
      },
      {
        id: "ayipli-mal",
        title: "7. Ayıplı Mal ve Garanti",
        content: `
          <p>Alıcı, teslim aldığı malın ayıplı olduğunu tespit ederse 6502 sayılı Kanun md. 11 uyarınca seçimlik haklarını (bedel iadesi, ücretsiz onarım, ayıpsız misli ile değiştirme, bedel indirimi) kullanabilir. Ayıp bildirimi, ayıbın fark edildiği tarihten itibaren makul süre içinde Satıcıya yapılmalıdır.</p>
          <p>Sipariş konusu mal için Satıcı tarafından ayrıca belirtilen garanti süresi, Ön Bilgilendirme Formu ve satış belgelerinde yer alır.</p>
        `,
      },
      {
        id: "uyusmazlik",
        title: "8. Uyuşmazlık Çözüm Yolları",
        content: `
          <p>Alıcı, işbu Sözleşme'den kaynaklanan uyuşmazlıkların çözümünde Ticaret Bakanlığı'nca her yıl belirlenen parasal sınırlar dahilinde <strong>İlçe/İl Tüketici Hakem Heyeti</strong>'ne, parasal sınırları aşan durumlarda ise <strong>Tüketici Mahkemeleri</strong>'ne başvurabilir. Şikayet ve başvurular ayrıca Ticaret Bakanlığı <a href="https://tuketicisikayeti.ticaret.gov.tr" target="_blank" rel="noopener">Tüketici Şikayet Sistemi</a> üzerinden yapılabilir.</p>
          <p>Platform üzerindeki uyuşmazlıklar için öncelikle iSTOC müşteri hizmetleri aracılığı ile çözüm aranması tavsiye edilir; bu başvuru yasal yollara başvuru hakkını ortadan kaldırmaz.</p>
        `,
      },
      {
        id: "yururluk",
        title: "9. Yürürlük",
        content: `
          <p>İşbu Sözleşme, Alıcı'nın sipariş tamamlama sayfasında elektronik onayını vermesi ile kurulur; onay tarihi itibarıyla yürürlüğe girer. Sözleşme, Alıcı'nın hesabı altında kayıt altına alınır ve kalıcı veri saklayıcısı olarak Alıcıya elektronik posta ile iletilir.</p>
        `,
      },
      {
        id: "hukuki-dayanak",
        title: "10. Hukuki Dayanak ve Uyarı",
        content: `
          <p>Bu sözleşme 6502 sayılı Tüketicinin Korunması Hakkında Kanun, Mesafeli Sözleşmeler Yönetmeliği (RG 27.11.2014 — son değ. 10.08.2024 ve 24.05.2025), 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ile ilgili diğer mevzuata dayanılarak hazırlanmıştır.</p>
          <p style="color:#b45309;"><strong>Uyarı:</strong> Bu metin, genel bilgilendirme amaçlı bir iskelet olup tacir (B2B) işlemler için uygulanmaz; tacir alıcılar için ayrı ticari satış sözleşmesi hükümleri uygulanır. Firmaya özgü bilgilerin ve mevzuat güncelliğinin bir avukat tarafından kontrol edilmesi tavsiye edilir.</p>
        `,
      },
    ],
  };
}

/**
 * KVKK Aydınlatma Metni — MVP statik içerik (TR).
 * Yasal dayanak: 6698 sayılı Kişisel Verilerin Korunması Kanunu md. 10,
 * Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar
 * Hakkında Tebliğ (RG 10.03.2018).
 */
export function kvkkContent(): LegalPageData {
  return {
    pageTitle: "KVKK Aydınlatma Metni",
    lastUpdated: "Son güncelleme: 24 Nisan 2026",
    breadcrumbLabel: "KVKK Aydınlatma Metni",
    sections: [
      {
        id: "veri-sorumlusu",
        title: "1. Veri Sorumlusu",
        content: `
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") md. 10 uyarınca aşağıda kimliği verilen veri sorumlusu sıfatıyla iSTOC, kişisel verilerinizin işlenmesine ilişkin sizi aydınlatır.</p>
          <p><strong>Veri Sorumlusu:</strong> iSTOC Ticaret Merkezi A.Ş.<br>
          <strong>Adres:</strong> (İletişim sayfasında belirtilen merkez adresi)<br>
          <strong>VERBİS Kayıt No:</strong> (Firmaca doldurulacak)<br>
          <strong>KEP:</strong> (Firmaca doldurulacak)</p>
        `,
      },
      {
        id: "islenen-veriler",
        title: "2. İşlenen Kişisel Veri Kategorileri",
        content: `
          <ul>
            <li><strong>Kimlik:</strong> ad-soyad, T.C. kimlik no (fatura/vergi için), doğum tarihi</li>
            <li><strong>İletişim:</strong> e-posta, telefon, adres</li>
            <li><strong>Müşteri İşlem:</strong> sipariş, fatura, iade, ödeme bilgisi (kart no doğrudan saklanmaz — tokenize)</li>
            <li><strong>Hukuki İşlem:</strong> sözleşme, yasal yazışma kayıtları</li>
            <li><strong>Pazarlama:</strong> alışveriş geçmişi, çerez tabanlı davranış verileri (ayrı çerez aydınlatma metni)</li>
            <li><strong>İşlem Güvenliği:</strong> IP, cihaz bilgisi, log kayıtları (5651 s.K. gereği)</li>
          </ul>
        `,
      },
      {
        id: "islem-amaci",
        title: "3. İşleme Amaçları",
        content: `
          <ul>
            <li>Üyelik oluşturma ve hesap yönetimi</li>
            <li>Sipariş alma, ödeme tahsili, teslimat ve iade süreçlerinin yürütülmesi</li>
            <li>Müşteri hizmetleri ve şikayet yönetimi</li>
            <li>Yasal yükümlülüklerin (fatura, vergi, tüketici mevzuatı) yerine getirilmesi</li>
            <li>Açık rızanız bulunması halinde pazarlama iletişimi ve kişiselleştirilmiş öneriler</li>
            <li>Bilgi güvenliği, dolandırıcılık önleme, sistem logları</li>
          </ul>
        `,
      },
      {
        id: "hukuki-sebep",
        title: "4. Hukuki Sebep",
        content: `
          <p>Kişisel verileriniz KVKK md. 5/2 kapsamında:</p>
          <ul>
            <li>Sözleşmenin kurulması veya ifası için gerekli olması (sipariş süreci)</li>
            <li>Kanunen açıkça öngörülmesi (fatura, tüketici mevzuatı)</li>
            <li>Hukuki yükümlülüklerin yerine getirilmesi</li>
            <li>Meşru menfaatler (dolandırıcılık önleme, sistem güvenliği)</li>
          </ul>
          <p>hukuki sebeplerine; pazarlama iletişimi ve çerez bazlı profilleme içinse <strong>açık rızanıza</strong> dayanılarak işlenir.</p>
        `,
      },
      {
        id: "toplama-yontemi",
        title: "5. Toplama Yöntemi",
        content: `
          <p>Kişisel verileriniz; Platform üyelik ve sipariş formları, ödeme sayfası, müşteri destek kanalları ve ilgili kişi tarafından gönüllü olarak iletilen kanallar aracılığıyla <strong>elektronik ortamda</strong>; fatura, sözleşme ve yazışmalar ise <strong>fiziki ortamda</strong> toplanabilir.</p>
        `,
      },
      {
        id: "aktarim",
        title: "6. Aktarım",
        content: `
          <p>Kişisel verileriniz, işleme amaçlarının gerektirdiği ölçüde ve KVKK md. 8-9 kapsamında:</p>
          <ul>
            <li><strong>Satıcılara:</strong> sipariş ifası ve teslimat için (ad, teslimat adresi, iletişim)</li>
            <li><strong>Ödeme kuruluşlarına:</strong> ödeme tahsili ve çözümü için (BDDK lisanslı sağlayıcılar)</li>
            <li><strong>Kargo firmalarına:</strong> teslimat için</li>
            <li><strong>E-fatura/e-arşiv entegratörüne:</strong> yasal fatura gönderimi için</li>
            <li><strong>Kamu kurum ve kuruluşlarına:</strong> kanunen yetkili oldukları hallerde</li>
            <li><strong>Yurt dışına (bulut altyapısı):</strong> yalnızca ayrıca alınacak açık rızanız veya KVKK md. 9 uygun güvenceler (taahhütname/BCR) çerçevesinde</li>
          </ul>
        `,
      },
      {
        id: "haklar",
        title: "7. İlgili Kişi Hakları (md. 11)",
        content: `
          <p>Veri sahibi olarak aşağıdaki haklarınızı kullanabilirsiniz:</p>
          <ol>
            <li>Kişisel verinizin işlenip işlenmediğini öğrenme</li>
            <li>İşleniyorsa bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içi / yurt dışı aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>KVKK md. 7'de öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
            <li>Düzeltme, silme, yok etme işlemlerinin aktarım yapılan üçüncü kişilere bildirilmesini isteme</li>
            <li>Otomatik sistemlerle analiz sonucu aleyhinize bir sonuca itiraz etme</li>
            <li>Kanuna aykırı işleme sebebiyle zarara uğradıysanız giderilmesini talep etme</li>
          </ol>
          <p>Başvurular için: KVKK Başvuru Formu ile <strong>kvkk@istoc.com.tr</strong> veya KEP adresi üzerinden. İlgili başvuru en geç 30 gün içinde ücretsiz sonuçlandırılır (olağan ücret durumu hariç).</p>
        `,
      },
      {
        id: "saklama",
        title: "8. Saklama Süreleri",
        content: `
          <p>Kişisel veriler, işleme amacının gerektirdiği süre kadar ve ilgili kanunların öngördüğü minimum sürelerde saklanır:</p>
          <ul>
            <li>Sipariş ve fatura: 10 yıl (VUK)</li>
            <li>Üyelik ve hesap: hesabın aktif olduğu süre + 2 yıl</li>
            <li>İnternet trafik logları: 2 yıl (5651 s.K. md. 5/5)</li>
            <li>Sözleşme ve e-sözleşme snapshot'ları: 10 yıl (TBK ilgili zamanaşımı)</li>
            <li>Pazarlama çerezi/profil: açık rızanız geçerli olduğu sürece</li>
          </ul>
        `,
      },
      {
        id: "hukuki-dayanak-kvkk",
        title: "9. Hukuki Dayanak ve Uyarı",
        content: `
          <p>Bu metin 6698 sayılı KVKK ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ'e dayanılarak hazırlanmıştır.</p>
          <p style="color:#b45309;"><strong>Uyarı:</strong> Bu metin genel bir aydınlatma iskeletidir. Saklama süreleri, aktarım listesi ve yurt dışı bulut transferinize ilişkin özel durumların firmanın VERBİS kaydı ve kişisel veri işleme envanteri ile uyumlu hale getirilmesi; KEP, başvuru formu ve müşteri hizmetleri akışının eklenmesi ve avukat tarafından gözden geçirilmesi tavsiye edilir.</p>
        `,
      },
    ],
  };
}
