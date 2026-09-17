/**
 * İLK BOYAMA DİLİ — `<head>`'de bloklayan açılış script'i (MOGEM-642 · Faz 2).
 *
 * ── Neden gerekli (ölçümle) ────────────────────────────────────────────────
 * Statik HTML'lerin hepsi `<html lang="tr">` ve `dir` niteliği HİÇ yok.
 * Doğru değerleri yazan kod (`i18n/index.ts`) bir `type="module"` script'in
 * içinde; modül zinciri i18next'i ve o dilin 400–600 KB'lik sözlüğünü
 * bekliyor. Ölçüldü (17 Eyl 2026, dist + nginx, 400 kbps / 4x CPU kısıtı,
 * `/?hl=ar`):
 *
 *   447 ms   sekme başlığı  → "iStoc | Global B2B Toptan Satış ve Ticaret…"
 *   12.307 ms lang: tr → ar · dir: (yok) → rtl · başlık Arapçaya döndü
 *
 * Yani Arapça bağlantıyla gelen ziyaretçi 11,9 saniye boyunca Türkçe bir
 * sekme başlığı ve `lang="tr"` görüyordu. Bu script kararı ~10 ms'de verir.
 *
 * ── Neden görünen metin titremesi ÖLÇÜLMEDİ ────────────────────────────────
 * Aynı turda ölçülen ikinci şey: storefront'un 71 sayfasının gövdesi
 * `<div id="app"></div>` kabuğundan ibaret (tek istisna build dışı bırakılan
 * `style-test.html`). İçerik JS ile çiziliyor, yani ilk boyama zaten JS'ten
 * sonra geliyor ve "önce Türkçe metin, sonra Arapça metin" diye bir titreme
 * OLUŞMUYOR — `first-paint` ile `first-contentful-paint` aynı ms'te ve ikisi
 * de dil kararından sonra. Ziyaretçinin JS'ten önce gördüğü TEK dil parçası
 * sekme başlığıdır; bu yüzden başlık da burada çevriliyor.
 *
 * ── Neden bu dosya, neden vite.config'in içinde değil ──────────────────────
 * Script metni burada üretilir ki TEST EDİLEBİLSİN: `__tests__/ilkBoyamaDili
 * .test.ts` bu fonksiyonun ürettiği metni gerçek bir DOM'da çalıştırıp
 * `resolveLang()` ile AYNI kararı verdiğini senaryo senaryo doğrular. Metin
 * vite.config'e gömülü olsaydı, kopya mantık sessizce ayrışırdı.
 *
 * ── Tek doğruluk kaynağı ───────────────────────────────────────────────────
 * Ülke haritası, desteklenen diller, RTL listesi ve çerez/depo anahtarları
 * `languageChoice.ts`'ten okunup script'e GÖMÜLÜR. Elle kopyalanan tek şey
 * öncelik SIRASI; onu da denetim testi kilitler.
 */
import {
  COUNTRY_LANG_MAP,
  LANG_COOKIE_KEY,
  LANG_SOURCE_COOKIE_KEY,
  LANG_SOURCE_KEY,
  LANG_STORAGE_KEY,
  RTL_LANGS,
  SUPPORTED_LANGS,
  VARSAYILAN_DIL,
} from "./languageChoice";

/**
 * Ülke kodunun ön yüze ulaştığı yer (Faz 1'de `readDetectedCountry()` ile
 * sözleşmesi yazıldı, kaynağı K1 kararına bağlı).
 *
 * `XX` = "sunucu doldurmadı". `readDetectedCountry()` ve buradaki script bu
 * değeri "bilmiyorum" sayar, ülke basamağı atlanır ve davranış Faz 1'dekinin
 * birebir aynısı kalır. Faz 5'te nginx/backend bu satırı gerçek kodla
 * dolduracak.
 *
 * ⚠ Bu meta, açılış script'inden ÖNCE gelmek ZORUNDA: script `<head>`
 * ayrıştırılırken çalışıyor, o an DOM'da yalnız kendinden önceki etiketler
 * var. Backend'in bot yolunda `<!-- {{__SEO_HEAD__}} -->` yerine yazdığı blok
 * `</head>`'in hemen öncesinde — oraya konan bir `th-country` meta'sını bu
 * script GÖREMEZ. (İkisi birden bulunursa `querySelector` ilkini, yani
 * buradakini alır.)
 */
export const ULKE_META = '<meta name="th-country" content="XX" />';

/** Kararın script tarafından bırakıldığı yer — testler ve E2E buradan okur. */
export const KARAR_GLOBALI = "__thDil";

/**
 * `<head>`'e gömülecek açılış script'ini üretir.
 *
 * ES5: `<head>` script'i modül desteği olmayan tarayıcıda da çalışmalı ve
 * sayfadaki diğer iki açılış script'i (depolama shim'i, tema) de ES5.
 *
 * SALT OKUR — çerez/localStorage YAZMAZ. Yazma işi `i18n/index.ts`'te
 * (`setLanguageManually` / `writeLangCookie`) kalıyor: iki yerden yazılan bir
 * tercih, iki farklı "kaynak" değeri üretme riskidir. Buradaki tek yan etki
 * `<html>` niteliklerini ve karar globalini yazmaktır.
 */
export function ilkBoyamaScripti(): string {
  const govde = `(function(){try{
var DILLER=${JSON.stringify([...SUPPORTED_LANGS])};
var ULKE=${JSON.stringify(COUNTRY_LANG_MAP)};
var RTL=${JSON.stringify([...RTL_LANGS])};
function nrm(v){if(!v)return null;var k=String(v).trim().slice(0,2).toLowerCase();for(var i=0;i<DILLER.length;i++){if(DILLER[i]===k)return k;}return null;}
function cerez(ad){try{var h=document.cookie;if(!h)return null;var p=h.split(";");for(var i=0;i<p.length;i++){var e=p[i].indexOf("=");if(e<0)continue;if(p[i].slice(0,e).trim()!==ad)continue;var d=p[i].slice(e+1).trim();try{return decodeURIComponent(d);}catch(x){return d;}}}catch(x){}return null;}
function depo(ad){try{return localStorage.getItem(ad);}catch(x){return null;}}
var lang=null,kaynak="default";
try{var s=location.search;if(s){var q=new URLSearchParams(s);lang=nrm(q.get("hl"))||nrm(q.get("lang"));if(lang)kaynak="hl";}}catch(x){}
if(!lang&&cerez(${JSON.stringify(LANG_SOURCE_COOKIE_KEY)})==="manual"){lang=nrm(cerez(${JSON.stringify(LANG_COOKIE_KEY)}));if(lang)kaynak="manual";}
if(!lang&&depo(${JSON.stringify(LANG_SOURCE_KEY)})==="manual"){lang=nrm(depo(${JSON.stringify(LANG_STORAGE_KEY)}));if(lang)kaynak="manual";}
if(!lang){var m=document.querySelector('meta[name="th-country"]');var u=m?String(m.getAttribute("content")||"").trim():"";if(u&&u.toUpperCase()!=="XX"&&/^[A-Za-z]{2}(-|$)/.test(u)){var d=ULKE[u.slice(0,2).toUpperCase()];if(d){lang=d;kaynak="country";}}}
if(!lang){var nv=null;try{nv=navigator.language;}catch(x){}lang=nrm(nv);if(lang)kaynak="browser";}
if(!lang){lang=${JSON.stringify(VARSAYILAN_DIL)};kaynak="default";}
var r=document.documentElement;r.lang=lang;r.dir=RTL.indexOf(lang)>=0?"rtl":"ltr";
window.${KARAR_GLOBALI}={lang:lang,kaynak:kaynak};
}catch(x){}})();`.replace(/\n/g, "");
  return `<script>${govde}</script>`;
}

/**
 * `<title data-i18n="...">` etiketinin ARDINA konacak başlık çeviri script'i.
 *
 * Neden ayrı ve neden başlıktan SONRA: bu script başlıktan ÖNCE konsaydı
 * ayrıştırıcı `<title>` etiketine geldiğinde `document.title`ı statik Türkçe
 * değerine geri yazardı. Bu yüzden enjeksiyon noktası `</title>`ın hemen
 * ardıdır.
 *
 * `title[data-i18n]` YOKSA hiçbir şey yapmaz. Bu, bot yolunun korumasıdır:
 * `seo_html_injector._strip_hardcoded_seo_tags` statik `<title>`ı SÖKÜP
 * yerine veritabanındaki SEO başlığını koyuyor. Etiket bulunamadığında
 * script sessizce çekilir, sunucunun yazdığı başlığa dokunmaz.
 *
 * @param baslikHaritasi dil kodu → o dildeki başlık (derleme anında gömülür)
 */
export function baslikScripti(baslikHaritasi: Record<string, string>): string {
  const govde =
    `(function(){try{var B=${JSON.stringify(baslikHaritasi)};` +
    `var e=document.querySelector('title[data-i18n]');if(!e)return;` +
    `var k=window.${KARAR_GLOBALI};var d=k&&k.lang;` +
    `if(d&&B[d]&&e.textContent!==B[d])e.textContent=B[d];}catch(x){}})();`;
  return `<script>${govde}</script>`;
}
