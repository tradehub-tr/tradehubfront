/**
 * Lucide icon helper — kategori ve UI ikonlarını same-origin SVG sprite'a
 * bağlar. İkon listesi hem bu runtime helper'ın hem de sprite üreticisinin
 * tek doğruluk kaynağıdır.
 */
import iconNames from "./lucideIconNames.json";

const ICON_NAMES = new Set<string>(iconNames);
const SPRITE_URL = "/icons/ui.svg";

/**
 * Lucide SVG'sini projenin sizing/styling sınıflarıyla render eder.
 * Lucide default `class="lucide lucide-..."` ve sabit width/height atılır,
 * yerine `w-5 h-5` (Tailwind, 20×20) gelir; `currentColor` korunur.
 */
export function styleSvg(raw: string, className: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sclass="[^"]*"/, "")
    .replace(/\swidth="[^"]*"/, "")
    .replace(/\sheight="[^"]*"/, "")
    .replace("<svg", `<svg class="${className}"`);
}

/** Kanonik isimle ikon getir; yoksa yıldız. */
export function getLucideIcon(name: string, className = "w-5 h-5"): string {
  const iconName = ICON_NAMES.has(name) ? name : "star";
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${SPRITE_URL}#icon-${iconName}"></use></svg>`;
}

/**
 * Kategori adından (TR/EN) tanımlayıcı Lucide ikonunu seç.
 * Sırayla: spesifik anahtar kelimeler → genel anahtar kelimeler → fallback star.
 */
export function getLucideIconByCategoryName(name: string, className = "w-5 h-5"): string {
  const n = name.toLowerCase();

  // ── Tekstil & giyim ──
  if (/tekstil|kumaş|iplik|elyaf|bez|doku|terzi|dikim/.test(n))
    return getLucideIcon("scissors", className);
  if (/giyim|moda|kıyafet|elbise|konfeksiyon|tişört|gömlek|fashion|apparel/.test(n))
    return getLucideIcon("shirt", className);
  if (/ayakkabı|deri|bot|terlik|sandalet|shoe|leather/.test(n))
    return getLucideIcon("footprints", className);
  if (/çanta|bavul|valiz|sırt çantası|bag|luggage|backpack/.test(n))
    return getLucideIcon("backpack", className);

  // ── Elektronik ──
  if (/telefon|cep|smartphone|mobile|gsm/.test(n)) return getLucideIcon("smartphone", className);
  if (/laptop|notebook|dizüstü/.test(n)) return getLucideIcon("laptop", className);
  if (/televizyon|tv|ekran|display/.test(n)) return getLucideIcon("tv", className);
  if (/kamera|fotoğraf|camera|video kayıt/.test(n)) return getLucideIcon("camera", className);
  if (/monitör|monitor/.test(n)) return getLucideIcon("monitor", className);
  if (/elektron|elektrik|kablo|devre|çip|işlemci|electronic|chip|circuit/.test(n))
    return getLucideIcon("cpu", className);

  // ── Hırdavat / alet / inşaat ──
  if (/matkap|drill/.test(n)) return getLucideIcon("drill", className);
  if (/çekiç|hammer/.test(n)) return getLucideIcon("hammer", className);
  if (/boya|fırça|paint|brush/.test(n)) return getLucideIcon("paintbrush", className);
  if (/anahtar|tornavida|alet|el aleti|donanım|hırdavat|nalburiye|tools|hardware/.test(n))
    return getLucideIcon("wrench", className);
  if (/inşaat|yapı|çimento|demir|beton|construction/.test(n))
    return getLucideIcon("hard-hat", className);
  if (/iskele|şantiye|kepçe|ekskavatör/.test(n)) return getLucideIcon("construction", className);

  // ── Gıda & içecek ──
  if (/kahve|coffee|çay/.test(n)) return getLucideIcon("coffee", className);
  if (/meyve|sebze|elma|fruit|vegetable/.test(n)) return getLucideIcon("apple", className);
  if (/tahıl|buğday|tarım ürün|hububat|grain|wheat/.test(n))
    return getLucideIcon("wheat", className);
  if (/gıda|yiyecek|içecek|food|drink|baharat|restoran|mutfak|züccaciye|kitchen/.test(n))
    return getLucideIcon("utensils-crossed", className);

  // ── Kozmetik & güzellik ──
  if (/parfüm|sprey|deodorant|perfume|spray/.test(n)) return getLucideIcon("spray-can", className);
  if (/güzellik|kozmetik|kişisel bakım|makyaj|beauty|cosmetic|makeup/.test(n))
    return getLucideIcon("sparkles", className);

  // ── Ev & yaşam ──
  if (/mobilya|koltuk|kanepe|sofa|furniture/.test(n)) return getLucideIcon("sofa", className);
  if (/ev|yaşam|dekor|home|decor|housing|household/.test(n))
    return getLucideIcon("home", className);

  // ── Otomotiv & ulaşım ──
  if (/kamyon|tır|truck|lojistik|nakliye|logistic/.test(n))
    return getLucideIcon("truck", className);
  if (/bisiklet|motosiklet|bike|bicycle|scooter/.test(n)) return getLucideIcon("bike", className);
  if (/otomotiv|araç|oto|taşıt|yedek parça|automotive|vehicle/.test(n))
    return getLucideIcon("car", className);

  // ── Bebek / çocuk / oyuncak ──
  if (/oyun|oyuncak|toy/.test(n)) return getLucideIcon("gamepad-2", className);
  if (/bebek|çocuk|baby|kids|infant/.test(n)) return getLucideIcon("baby", className);

  // ── Spor & hobi ──
  if (/spor|fitness|egzersiz|sport|exercise/.test(n)) return getLucideIcon("dumbbell", className);

  // ── Takı / aksesuar ──
  if (/saat|kol saati|watch|clock/.test(n)) return getLucideIcon("watch", className);
  if (/gözlük|optik|glasses|eyewear|sunglass/.test(n)) return getLucideIcon("glasses", className);
  if (/takı|mücevher|bijuteri|elmas|altın|jewelry|gem/.test(n))
    return getLucideIcon("gem", className);

  // ── Sağlık & medikal ──
  if (/ilaç|hap|pill|drug|pharmacy/.test(n)) return getLucideIcon("pill", className);
  if (/doktor|tıp|hastane|stethoscope/.test(n)) return getLucideIcon("stethoscope", className);
  if (/sağlık|medikal|medical|health/.test(n)) return getLucideIcon("heart-pulse", className);

  // ── Kimya & bilim ──
  if (/laboratuvar|mikroskop|microscope|biology/.test(n))
    return getLucideIcon("microscope", className);
  if (/kimya|kimyasal|boya|solvent|reçine|plastik|chemical/.test(n))
    return getLucideIcon("flask-conical", className);

  // ── Endüstri & makine ──
  if (/fabrika|imalat|üretim|factory|manufacturing/.test(n))
    return getLucideIcon("factory", className);
  if (/makine|endüstri|ekipman|dişli|machinery|industrial|gear/.test(n))
    return getLucideIcon("cog", className);

  // ── Tarım & doğa ──
  if (/fide|fidan|tohum|sprout|seed/.test(n)) return getLucideIcon("sprout", className);
  if (/yaprak|bitki|leaf|plant|herbal/.test(n)) return getLucideIcon("leaf", className);
  if (/tarım|hayvancılık|ziraat|agriculture|farming/.test(n))
    return getLucideIcon("sprout", className);

  // ── Ofis & ambalaj ──
  if (/yazıcı|baskı|printer|print/.test(n)) return getLucideIcon("printer", className);
  if (/kağıt|ofis|kırtasiye|paper|office/.test(n)) return getLucideIcon("briefcase", className);
  if (/ambalaj|paket|karton|kutu|packaging|package/.test(n))
    return getLucideIcon("boxes", className);
  if (/hammadde|raw|material/.test(n)) return getLucideIcon("layers", className);

  // ── Diğer ──
  if (/bina|işyeri|magaza|building|store/.test(n)) return getLucideIcon("building", className);
  if (/perakende|toptan|mağaza|retail|wholesale|shop/.test(n))
    return getLucideIcon("store", className);
  if (/evcil|hayvan|pet|animal/.test(n)) return getLucideIcon("paw-print", className);

  // Fallback
  return getLucideIcon("star", className);
}
