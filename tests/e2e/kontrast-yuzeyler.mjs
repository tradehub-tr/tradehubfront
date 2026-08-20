/**
 * Kontrast denetiminin TARADIĞI YÜZEYLER — tek kaynak.
 *
 * NEDEN AYRI DOSYA:
 *   İki tüketici var ve listeyi kopyalarsak sessizce ayrışırlar:
 *     · `panel-lojistik-kontrast.spec.ts` — KAPI (kırılır, CI'ı durdurur)
 *     · `kontrast-tarama.mjs`             — RÖNTGEN (rapor üretir, kırılmaz)
 *   Ölçüm kodu spec'te, yüzey listesi burada; her biri tek yerde yaşıyor.
 *
 * YENİ EKRAN AÇILDIĞINDA:
 *   `logisticsScreens.js`'te bir kayıt `ready: true` olduğunda buraya da bir
 *   satır eklenir. Eklenmezse ekran ölçülmez ve korumasız kalır — 14-FE'nin
 *   beş ekranı tam olarak böyle beş ay boyunca hiç ölçülmedi.
 */

export const SHP = "SHP-2026-00042";      // paketleme mock'u (fixture kodu)
export const POD_SHP = "SHP-2026-00033";  // POD kaydı + istasyon verisi olan tek sevkiyat

// Sevkiyat detayı/durumu (Bora) mock KULLANMIYOR, canlı uca gidiyor — ve
// yerel veritabanında tek kayıt var. Fixture kodu verilirse ekran
// "Shipment … not found / INTERNAL_ERROR" basar, 4 öğe taranır ve
// SEKMELER HİÇ AÇILMAZ (detay yüklenmeden sekme çubuğu render edilmiyor).
export const SHP_CANLI = "SHP-2026-00001";

/** Manifestteki 21 hazır ekran (`logisticsScreens.js` · `ready: true`). */
export const EKRANLAR = [
  { key:"M1", ad:"kataloglar",          url:"/panel/lojistik/kataloglar",                sahip:"bora" },
  { key:"M3", ad:"lojistik ayarları",   url:"/panel/lojistik/ayarlar",                   sahip:"bora" },
  { key:"F1", ad:"taşıyıcı hesapları",  url:"/panel/lojistik/tasiyici-hesaplari",        sahip:"bora" },
  { key:"F4", ad:"durum eşlemesi",      url:"/panel/lojistik/durum-eslemesi",            sahip:"bora" },
  { key:"A1", ad:"pano",                url:"/panel/lojistik/pano",                      sahip:"bora" },
  { key:"A2", ad:"bekleyen işler",      url:"/panel/lojistik/bekleyen-isler",            sahip:"bora" },
  { key:"A3", ad:"istisnalar",          url:"/panel/lojistik/istisnalar",                sahip:"bora" },
  { key:"B1", ad:"sevkiyat listesi",    url:"/panel/lojistik/sevkiyatlar",               sahip:"bora" },
  { key:"B2", ad:"sevkiyat detayı",     url:`/panel/lojistik/sevkiyatlar/${SHP_CANLI}`,  sahip:"bora" },
  { key:"C1", ad:"sevkiyat oluştur",    url:"/panel/lojistik/sevkiyatlar/yeni",          sahip:"bora" },
  { key:"C2", ad:"durum güncelle",      url:`/panel/lojistik/sevkiyatlar/${SHP_CANLI}/durum`, sahip:"bora" },
  { key:"G0", ad:"paketleme kuyruğu",   url:"/panel/lojistik/paketleme",                 sahip:"ali"  },
  { key:"G1", ad:"paketleme alanı",     url:`/panel/lojistik/paketleme/${SHP}`,          sahip:"ali"  },
  { key:"G3", ad:"palet planı",         url:`/panel/lojistik/paketleme/${SHP}/palet`,    sahip:"ali"  },
  { key:"G2", ad:"etiket",              url:`/panel/lojistik/etiketler/${SHP}`,          sahip:"ali"  },
  { key:"H0", ad:"kanıt kuyruğu",       url:"/panel/lojistik/teslim-kaniti",             sahip:"ali"  },
  { key:"H2", ad:"kanıt detayı",        url:`/panel/lojistik/sevkiyatlar/${POD_SHP}/teslim-kaniti`, sahip:"ali" },
  { key:"H1", ad:"istasyonlar",         url:`/panel/lojistik/sevkiyatlar/${POD_SHP}/istasyonlar`,   sahip:"ali" },
  { key:"D1", ad:"satıcı teslimatı",    url:"/panel/lojistik/satici-teslimati",          sahip:"ali"  },
  { key:"D2", ad:"alıcı teslim alma",   url:"/panel/lojistik/alici-teslim-alma",         sahip:"ali"  },
];

/**
 * Sevkiyat detayının 8 SEKMESİ. Ayrı rotaları YOK — detay ekranının içinde
 * render ediliyorlar (`logisticsScreens.js` B2 kaydındaki not), bu yüzden
 * `[role="tab"]` düğmesine sırayla tıklanarak açılıyorlar.
 */
export const SEKMELER = [
  { key:"B3", ad:"kalemler",       sahip:"bora" },
  { key:"B4", ad:"koliler",        sahip:"bora" },
  { key:"B5", ad:"belgeler",       sahip:"bora" },
  { key:"B6", ad:"takip",          sahip:"bora" },
  { key:"B7", ad:"bacaklar",       sahip:"bora" },
  { key:"B8", ad:"maliyet",        sahip:"bora" },
  { key:"H3", ad:"teslim kanıtı",  sahip:"ali"  },
  { key:"H4", ad:"istasyonlar",    sahip:"ali"  },
];

/**
 * GÖRÜNÜM MODU varyantları.
 *
 * NEDEN AYRI LİSTE — ölçülmüş kör nokta:
 *   Tarama her ekranı yalnız VARSAYILAN modunda (tablo) açıyordu. Kart, pano
 *   ve liste dalları hiç ölçülmemişti; A6'da POD kuyruğuna pano eklenince
 *   `kanban-card-meta` sınıfının 2.74:1 (koyu temada 3.11:1) verdiği ortaya
 *   çıktı — ve o sınıf paketleme panosunda AYLARDIR duruyordu.
 *
 * Mod `lv-mode:<anahtar>` altında saklanıyor; tarama onu önceden yazıp
 * ekranı o modda açıyor. `table` burada yok — ekranlar zaten onunla açılıyor.
 */
export const MOD_YUZEYLERI = [
  { key:"H0", ad:"kanıt kuyruğu",     url:"/panel/lojistik/teslim-kaniti",
    anahtar:"logistics-pod-queue",     modlar:["grid","kanban","list"], sahip:"ali" },
  { key:"G0", ad:"paketleme kuyruğu", url:"/panel/lojistik/paketleme",
    anahtar:"logistics-packing-queue", modlar:["grid","kanban","list"], sahip:"ali" },
  { key:"G2", ad:"etiket",            url:`/panel/lojistik/etiketler/${SHP}`,
    anahtar:"logistics-labels",        modlar:["grid","list"],          sahip:"ali" },
  { key:"D1", ad:"satıcı teslimatı",  url:"/panel/lojistik/satici-teslimati",
    anahtar:"logistics-satici-teslimati",  modlar:["table","list"],     sahip:"ali" },
  { key:"D2", ad:"alıcı teslim alma", url:"/panel/lojistik/alici-teslim-alma",
    anahtar:"logistics-alici-teslim-alma", modlar:["table","list"],     sahip:"ali" },
  { key:"A3", ad:"istisna kuyruğu",   url:"/panel/lojistik/istisnalar",
    anahtar:"logistics-exceptions",    modlar:["kanban","list"],        sahip:"bora" },
  { key:"A2", ad:"bekleyen işler",    url:"/panel/lojistik/bekleyen-isler",
    anahtar:"logistics-pending-work",  modlar:["grid","list"],          sahip:"bora" },
];

/** Yerelde verisi olmayıp az öğe tarayan yüzeyler — alt sınır bunlar için gevşetilir. */
export const AZ_VERILI = new Set(["F1", "B4", "B5"]);
