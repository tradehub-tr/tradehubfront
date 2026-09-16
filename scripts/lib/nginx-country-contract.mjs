/**
 * ÜLKE BAŞLIĞI SÖZLEŞMESİ — MOGEM-642 Faz 1.4
 *
 * Backend `_detect_country()` (tradehub_core/api/currency.py) ülkeyi sırayla
 * `CF-IPCountry` → `X-Country` → `Accept-Language` başlıklarından okuyor.
 * İlk ikisi İSTEMCİDEN gelirse ziyaretçi kendi ülkesini uydurabilir: para
 * birimi önerisi ve (Faz 2 sonrası) açılış dili istemcinin dediğine göre
 * belirlenir.
 *
 * Ölçüldü (16 Eyl 2026, gerçek nginx + curl):
 *   iki satır VARKEN   → backend `X-Country=[] CF-IPCountry=[]` görüyor
 *   iki satır YOKKEN   → backend `X-Country=[US] CF-IPCountry=[US]` görüyor
 *
 * Bu yüzden backend'e proxy geçen HER blok iki başlığı da boş değerle ezmek
 * zorunda. Tek bir bloğun unutulması açığın tamamını geri getirir — yeni
 * `location` eklendiğinde bu denetim kırmızıya döner.
 *
 * NOT: Bu denetim yalnız TEMİZLİĞİ kilitler. Ülke kodunun nereden geleceği
 * (Cloudflare / nginx geo / başka) henüz kararlaştırılmadı; başlığı dolduran
 * kaynak eklendiğinde bu sözleşme de o kaynağa göre genişletilecek.
 */

/** Backend'e proxy geçen blokların imzası: Host başlığı backend domain'ine ayarlanır. */
const BACKEND_PROXY_IMZASI = "proxy_set_header Host ${BACKEND_DOMAIN};";

/** Her backend bloğunda bulunması gereken iki satır. */
const X_COUNTRY_SATIRI = 'proxy_set_header X-Country "";';
const CF_IPCOUNTRY_SATIRI = 'proxy_set_header CF-IPCountry "";';

/**
 * Template'i satır satır gezip backend proxy bloklarını çıkarır.
 * Blok sınırı: `location ... {` satırından eşleşen kapanış parantezine kadar.
 */
function backendProxyBloklari(template) {
  const satirlar = template.split("\n");
  const bloklar = [];
  let aktif = null;
  let derinlik = 0;

  for (let i = 0; i < satirlar.length; i++) {
    const satir = satirlar[i];
    const locationBasligi = satir.match(/^\s*location\s+(.+?)\s*\{\s*$/);

    if (locationBasligi && aktif === null) {
      aktif = { ad: locationBasligi[1], satir: i + 1, govde: [] };
      derinlik = 1;
      continue;
    }

    if (aktif === null) continue;

    derinlik += (satir.match(/\{/g) || []).length;
    derinlik -= (satir.match(/\}/g) || []).length;
    aktif.govde.push(satir);

    if (derinlik <= 0) {
      const govde = aktif.govde.join("\n");
      if (govde.includes(BACKEND_PROXY_IMZASI)) {
        bloklar.push({ ...aktif, govde });
      }
      aktif = null;
    }
  }

  return bloklar;
}

/**
 * @param {string} template — ham `nginx.conf.template` içeriği
 * @returns {string[]} ihlal listesi; boş dizi = sözleşme sağlanıyor
 */
export function validateNginxCountryTemplate(template) {
  const ihlaller = [];

  const bloklar = backendProxyBloklari(template);
  if (bloklar.length === 0) {
    return [...ihlaller, "backend'e proxy geçen hiçbir location bloğu bulunamadı (parser bozuk?)"];
  }

  for (const blok of bloklar) {
    if (!blok.govde.includes(X_COUNTRY_SATIRI)) {
      ihlaller.push(`${blok.ad} (satır ${blok.satir}): ${X_COUNTRY_SATIRI} eksik`);
    }
    if (!blok.govde.includes(CF_IPCOUNTRY_SATIRI)) {
      ihlaller.push(`${blok.ad} (satır ${blok.satir}): ${CF_IPCOUNTRY_SATIRI} eksik`);
    }
  }

  return ihlaller;
}

/** Denetimin gerçekten blok taradığını doğrulamak için testlerin kullandığı sayaç. */
export function backendProxyBlokSayisi(template) {
  return backendProxyBloklari(template).length;
}
