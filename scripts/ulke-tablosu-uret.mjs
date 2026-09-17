#!/usr/bin/env node
/**
 * ÜLKE TABLOSU ÜRETECİ — IP aralığı → ülke kodu (MOGEM-642 · Faz 5).
 *
 * NE YAPAR: DB-IP Country Lite verisinden, YALNIZ bizim ilgilendiğimiz
 * ülkeler için bir nginx `geo` tablosu üretip `nginx.conf.template` içindeki
 * işaretli bloğa yazar. nginx her istekte ziyaretçinin IP'sini bu tabloda
 * arayıp ülkesini bulur.
 *
 * NE ZAMAN KOŞAR: Yalnız bir insan çalıştırdığında. Hiçbir ortam (sunucu,
 * deploy, CI, tarayıcı) bu script'i ya da veri indirmeyi tetiklemez. Tablo
 * repoda durur, imaja kopyalanır, nginx başlarken belleğe alınır.
 *
 * NEDEN TABLO REPODA: Derleme sırasında indirilseydi (a) DB-IP çöktüğünde
 * deploy düşerdi, (b) aynı commit iki kez derlendiğinde farklı sonuç çıkardı,
 * (c) PROD'da hangi verinin çalıştığı git'ten görülemezdi.
 *
 * NEDEN BU KAYNAK: DB-IP Country Lite ücretsiz ve **hesap/anahtar
 * istemiyor** (ölçüldü 17 Eyl 2026: MaxMind ve IPinfo anahtarsız 401 veriyor).
 * Kapsama da daha geniş: RIR tahsis dosyalarıyla karşılaştırıldığında
 * ülkelerimizin 7,5 milyon adresini fazladan tanıyor (%5,1).
 *
 * TAZELEME: Zorunlu değil. Ölçüldü (2026-08 → 2026-09): ayda yalnız %0,43
 * adres değişiyor. Tazelenmezse o bloklardaki ziyaretçiler tarayıcı diline
 * düşer — site bozulmaz. Yılda 1-2 kez yeter.
 *
 * KULLANIM:
 *   node scripts/ulke-tablosu-uret.mjs           # üret ve yaz
 *   node scripts/ulke-tablosu-uret.mjs --check   # bayat mı? (yazmaz)
 *
 * Lisans: üretilen tabloya CC BY 4.0 atıf satırı eklenir (DB-IP şartı).
 */
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

/**
 * Yollar TEMBEL hesaplanıyor: bu modül birim testlerinden de import ediliyor
 * ve test koşucusu (vitest) modülü dönüştürdüğü için `import.meta.url` orada
 * `file:` şemasında olmuyor. Modül yüklenirken hesaplansaydı testler daha
 * ilk satırda çökerdi — ölçüldü 17 Eyl 2026.
 */
function yollar() {
  const kok = fileURLToPath(new URL("..", import.meta.url));
  return {
    sablon: `${kok}nginx.conf.template`,
    dilSecimi: `${kok}src/i18n/languageChoice.ts`,
  };
}

export const BLOK_BASI = "# === ÜLKE TABLOSU · ÜRETİLMİŞTİR, ELLE DÜZENLEME ===";
export const BLOK_SONU = "# === ÜLKE TABLOSU SONU ===";

/* ──────────────────────────────────────────────────────────────────────────
 * 1) Ülke listesi — TEK KAYNAK: languageChoice.ts
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * `COUNTRY_LANG_MAP`'teki ülke kodlarını kaynak dosyadan okur.
 *
 * Neden ayrıştırarak: burada ikinci bir ülke listesi TUTULMAMALI. Haritaya
 * yarın bir ülke eklendiğinde tablo da onu kapsamalı; iki liste tutulsaydı
 * biri güncellenip diğeri unutulurdu ve kusur ancak o ülkeden bir ziyaretçi
 * geldiğinde fark edilirdi. Denetim testi ayrıca ikisinin eşliğini kilitler.
 */
export function ulkeleriOku(tsKaynak) {
  const blok = /COUNTRY_LANG_MAP[^=]*=\s*\{([\s\S]*?)\n\};/.exec(tsKaynak);
  if (!blok) throw new Error("COUNTRY_LANG_MAP bulunamadı — languageChoice.ts değişmiş olabilir");
  const kodlar = [...blok[1].matchAll(/^\s*([A-Z]{2})\s*:\s*["'][a-z]{2}["']/gm)].map((m) => m[1]);
  if (kodlar.length === 0) throw new Error("COUNTRY_LANG_MAP boş ayrıştırıldı");
  return kodlar;
}

/* ──────────────────────────────────────────────────────────────────────────
 * 2) IP aritmetiği — aralık → CIDR
 * ────────────────────────────────────────────────────────────────────────── */

/** "1.2.3.4" ya da "2a01:1b0::" → BigInt. Sürüm de döner. */
export function ipAyristir(metin) {
  if (metin.includes(":")) return { deger: ipv6ToBigInt(metin), surum: 6 };
  const parcalar = metin.split(".");
  if (parcalar.length !== 4) throw new Error(`geçersiz IPv4: ${metin}`);
  let d = 0n;
  for (const p of parcalar) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error(`geçersiz IPv4: ${metin}`);
    d = (d << 8n) | BigInt(n);
  }
  return { deger: d, surum: 4 };
}

function ipv6ToBigInt(metin) {
  const [sol, sag] = metin.split("::");
  const solGruplar = sol ? sol.split(":").filter(Boolean) : [];
  const sagGruplar = sag !== undefined && sag ? sag.split(":").filter(Boolean) : [];
  const eksik = 8 - solGruplar.length - sagGruplar.length;
  if (metin.includes("::") ? eksik < 0 : eksik !== 0) throw new Error(`geçersiz IPv6: ${metin}`);
  const gruplar = [
    ...solGruplar,
    ...Array(metin.includes("::") ? eksik : 0).fill("0"),
    ...sagGruplar,
  ];
  let d = 0n;
  for (const g of gruplar) d = (d << 16n) | BigInt(parseInt(g, 16));
  return d;
}

/** BigInt → metin. IPv6'da en uzun sıfır dizisi `::` ile kısaltılır. */
export function ipYaz(deger, surum) {
  if (surum === 4) {
    return [24n, 16n, 8n, 0n].map((k) => Number((deger >> k) & 255n)).join(".");
  }
  const gruplar = [];
  for (let i = 7n; i >= 0n; i--) gruplar.push(Number((deger >> (i * 16n)) & 0xffffn));
  // En uzun (>=2) sıfır dizisini bul — RFC 5952 kısaltması.
  let enIyiBas = -1;
  let enIyiUzun = 0;
  let bas = -1;
  for (let i = 0; i <= gruplar.length; i++) {
    if (i < gruplar.length && gruplar[i] === 0) {
      if (bas < 0) bas = i;
    } else if (bas >= 0) {
      const uzun = i - bas;
      if (uzun > enIyiUzun) {
        enIyiUzun = uzun;
        enIyiBas = bas;
      }
      bas = -1;
    }
  }
  const onaltilik = gruplar.map((g) => g.toString(16));
  if (enIyiUzun < 2) return onaltilik.join(":");
  return `${onaltilik.slice(0, enIyiBas).join(":")}::${onaltilik.slice(enIyiBas + enIyiUzun).join(":")}`;
}

/**
 * [bas, son] kapalı aralığını en az sayıda CIDR bloğuna böler.
 *
 * DB-IP verisi CIDR değil ARALIK veriyor ("5.1.2.0 – 5.1.5.255"); nginx `geo`
 * ise IPv6'da CIDR istiyor. Klasik özetleme: her adımda, başlangıca hizalı
 * en büyük bloğu al, aralığı aşmasın.
 */
export function araligiCidrlereBol(bas, son, surum) {
  const bitSayisi = surum === 4 ? 32n : 128n;
  const cidrler = [];
  let mevcut = bas;
  while (mevcut <= son) {
    // Başlangıcın hizalanabildiği en büyük blok
    let adim = 0n;
    while (adim < bitSayisi && (mevcut & (1n << adim)) === 0n) adim++;
    // Aralığı aşmayan en büyük blok
    while (adim > 0n && mevcut + (1n << adim) - 1n > son) adim--;
    cidrler.push(`${ipYaz(mevcut, surum)}/${bitSayisi - adim}`);
    mevcut += 1n << adim;
  }
  return cidrler;
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3) Tablo üretimi
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * DB-IP CSV metninden `geo` satırlarını üretir.
 *
 * Bozuk satır ATLANIR, üretimi durdurmaz: 717 bin satırlık bir veri
 * kümesinde tek bir bozuk kayıt yüzünden tabloyu hiç üretememek, o kaydı
 * kaybetmekten daha kötü olurdu. Atlananların sayısı çağırana döner.
 */
export function tabloUret(csvMetni, ulkeler) {
  const istenen = new Set(ulkeler);
  const satirlar = [];
  let atlanan = 0;
  for (const ham of csvMetni.split("\n")) {
    if (!ham) continue;
    const p = ham.trim().split(",");
    if (p.length !== 3 || !istenen.has(p[2])) continue;
    try {
      const bas = ipAyristir(p[0]);
      const son = ipAyristir(p[1]);
      if (bas.surum !== son.surum || son.deger < bas.deger) {
        atlanan++;
        continue;
      }
      for (const cidr of araligiCidrlereBol(bas.deger, son.deger, bas.surum)) {
        satirlar.push(`    ${cidr} ${p[2]};`);
      }
    } catch {
      atlanan++;
    }
  }
  return { satirlar, atlanan };
}

/** `geo` bloğunu başlık ve atıf satırıyla birlikte kurar. */
export function bloguKur(satirlar, veriAyi) {
  return [
    BLOK_BASI,
    `# Üreteç : scripts/ulke-tablosu-uret.mjs`,
    `# Kaynak : DB-IP Country Lite (https://db-ip.com) — CC BY 4.0`,
    `# Veri   : ${veriAyi} · ${satirlar.length} kayıt`,
    `# Ülkeler: src/i18n/languageChoice.ts → COUNTRY_LANG_MAP (TEK KAYNAK)`,
    `#`,
    `# Eşleşmeyen her IP boş dizeye düşer; boş = "bilmiyorum" ve akış tarayıcı`,
    `# diline, oradan İngilizceye gider. Tablo bayatlarsa site BOZULMAZ.`,
    `geo $ulke_kodu {`,
    `    default "";`,
    ...satirlar,
    `}`,
    BLOK_SONU,
  ].join("\n");
}

/**
 * Bloğu şablona yerleştirir. Blok varsa TÜMÜYLE değiştirilir (satır satır
 * yamalanmaz — kısmi/karışık durum oluşamasın); yoksa `server {` bloğundan
 * hemen önce, `http` bağlamında açılır.
 */
export function sablonaYerlestir(sablon, blok) {
  const bas = sablon.indexOf(BLOK_BASI);
  if (bas >= 0) {
    const son = sablon.indexOf(BLOK_SONU, bas);
    if (son < 0) throw new Error("blok başı var ama sonu yok — şablon elle bozulmuş olabilir");
    return sablon.slice(0, bas) + blok + sablon.slice(son + BLOK_SONU.length);
  }
  const sunucu = /^server\s*\{/m.exec(sablon);
  if (!sunucu) throw new Error("şablonda server bloğu bulunamadı");
  return sablon.slice(0, sunucu.index) + blok + "\n\n" + sablon.slice(sunucu.index);
}

/** Şablondaki mevcut bloğu döndürür (yoksa null) — `--check` için. */
export function bloguOku(sablon) {
  const bas = sablon.indexOf(BLOK_BASI);
  if (bas < 0) return null;
  const son = sablon.indexOf(BLOK_SONU, bas);
  return son < 0 ? null : sablon.slice(bas, son + BLOK_SONU.length);
}

/* ──────────────────────────────────────────────────────────────────────────
 * 4) İndirme
 * ────────────────────────────────────────────────────────────────────────── */

/** `YYYY-MM` — bu ay, ve bir önceki ay. */
export function aydanAy(tarih = new Date(), geri = 0) {
  const d = new Date(Date.UTC(tarih.getUTCFullYear(), tarih.getUTCMonth() - geri, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Veriyi indirir. Ayın ilk günlerinde o ayın dosyası henüz yayınlanmamış
 * olabiliyor; o yüzden bir önceki aya düşülür. İkisi de yoksa HATA verilir ve
 * mevcut tabloya DOKUNULMAZ — bayat tablo, bozuk tablodan iyidir.
 */
async function veriIndir() {
  for (const geri of [0, 1]) {
    const ay = aydanAy(new Date(), geri);
    const adres = `https://download.db-ip.com/free/dbip-country-lite-${ay}.csv.gz`;
    process.stdout.write(`  ${ay} deneniyor… `);
    const yanit = await fetch(adres);
    if (!yanit.ok) {
      console.log(`yok (HTTP ${yanit.status})`);
      continue;
    }
    const gz = Buffer.from(await yanit.arrayBuffer());
    console.log(`indirildi (${(gz.length / 1024 / 1024).toFixed(1)} MB)`);
    return { ay, csv: gunzipSync(gz).toString("utf8") };
  }
  throw new Error("DB-IP verisi indirilemedi (bu ay ve önceki ay denendi)");
}

/* ──────────────────────────────────────────────────────────────────────────
 * 5) Giriş noktası
 * ────────────────────────────────────────────────────────────────────────── */

async function main() {
  const kontrol = process.argv.includes("--check");
  const { sablon: SABLON, dilSecimi: DIL_SECIMI } = yollar();
  const ulkeler = ulkeleriOku(await readFile(DIL_SECIMI, "utf8"));
  console.log(`Ülkeler (COUNTRY_LANG_MAP): ${ulkeler.length} — ${ulkeler.join(", ")}`);

  const { ay, csv } = await veriIndir();
  const { satirlar, atlanan } = tabloUret(csv, ulkeler);
  console.log(
    `Üretilen geo satırı: ${satirlar.length}${atlanan ? ` (atlanan bozuk kayıt: ${atlanan})` : ""}`
  );
  if (satirlar.length === 0) throw new Error("tablo boş üretildi — veri biçimi değişmiş olabilir");

  const yeniBlok = bloguKur(satirlar, ay);
  const sablon = await readFile(SABLON, "utf8");

  if (kontrol) {
    const mevcut = bloguOku(sablon);
    if (mevcut === null) {
      console.error(
        "✗ Şablonda ülke tablosu YOK. Üretmek için: node scripts/ulke-tablosu-uret.mjs"
      );
      process.exit(1);
    }
    if (mevcut !== yeniBlok) {
      console.error(
        `✗ Tablo BAYAT (${ay} verisiyle farklı). Tazelemek için: node scripts/ulke-tablosu-uret.mjs`
      );
      process.exit(1);
    }
    console.log("✓ Tablo güncel.");
    return;
  }

  await writeFile(SABLON, sablonaYerlestir(sablon, yeniBlok), "utf8");
  console.log(`✓ ${SABLON} güncellendi.`);
  console.log("  Sonraki adım: nginx -t ile doğrula, sonra commit.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  });
}
