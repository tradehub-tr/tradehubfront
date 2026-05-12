/**
 * Lucide icon helper — kategori isimlerini tanımlayıcı SVG ikonlara eşler.
 * Lucide-static'tan ham SVG dosyalarını import eder, projeye uyacak şekilde
 * sınıf/boyut ekler. Yeni kategori için: SVG'yi import et, ICONS'a ekle,
 * KEYWORDS regex'lerini güncelle.
 */

// Tüm import'lar tree-shake edilir (gerçekte kullanılmayan ikon final bundle'a girmez).
import shirt from "lucide-static/icons/shirt.svg?raw";
import scissors from "lucide-static/icons/scissors.svg?raw";
import footprints from "lucide-static/icons/footprints.svg?raw";
import backpack from "lucide-static/icons/backpack.svg?raw";
import cpu from "lucide-static/icons/cpu.svg?raw";
import smartphone from "lucide-static/icons/smartphone.svg?raw";
import laptop from "lucide-static/icons/laptop.svg?raw";
import tv from "lucide-static/icons/tv.svg?raw";
import camera from "lucide-static/icons/camera.svg?raw";
import monitor from "lucide-static/icons/monitor.svg?raw";
import wrench from "lucide-static/icons/wrench.svg?raw";
import hammer from "lucide-static/icons/hammer.svg?raw";
import drill from "lucide-static/icons/drill.svg?raw";
import paintbrush from "lucide-static/icons/paintbrush.svg?raw";
import utensilsCrossed from "lucide-static/icons/utensils-crossed.svg?raw";
import coffee from "lucide-static/icons/coffee.svg?raw";
import apple from "lucide-static/icons/apple.svg?raw";
import wheat from "lucide-static/icons/wheat.svg?raw";
import sparkles from "lucide-static/icons/sparkles.svg?raw";
import sprayCan from "lucide-static/icons/spray-can.svg?raw";
import home from "lucide-static/icons/home.svg?raw";
import sofa from "lucide-static/icons/sofa.svg?raw";
import car from "lucide-static/icons/car.svg?raw";
import truck from "lucide-static/icons/truck.svg?raw";
import bike from "lucide-static/icons/bike.svg?raw";
import baby from "lucide-static/icons/baby.svg?raw";
import gamepad2 from "lucide-static/icons/gamepad-2.svg?raw";
import dumbbell from "lucide-static/icons/dumbbell.svg?raw";
import gem from "lucide-static/icons/gem.svg?raw";
import watch from "lucide-static/icons/watch.svg?raw";
import glasses from "lucide-static/icons/glasses.svg?raw";
import pill from "lucide-static/icons/pill.svg?raw";
import stethoscope from "lucide-static/icons/stethoscope.svg?raw";
import heartPulse from "lucide-static/icons/heart-pulse.svg?raw";
import flaskConical from "lucide-static/icons/flask-conical.svg?raw";
import microscope from "lucide-static/icons/microscope.svg?raw";
import factory from "lucide-static/icons/factory.svg?raw";
import cog from "lucide-static/icons/cog.svg?raw";
import building from "lucide-static/icons/building.svg?raw";
import hardHat from "lucide-static/icons/hard-hat.svg?raw";
import construction from "lucide-static/icons/construction.svg?raw";
import layers from "lucide-static/icons/layers.svg?raw";
import packageIcon from "lucide-static/icons/package.svg?raw";
import boxes from "lucide-static/icons/boxes.svg?raw";
import leaf from "lucide-static/icons/leaf.svg?raw";
import sprout from "lucide-static/icons/sprout.svg?raw";
import store from "lucide-static/icons/store.svg?raw";
import briefcase from "lucide-static/icons/briefcase.svg?raw";
import printer from "lucide-static/icons/printer.svg?raw";
import pawPrint from "lucide-static/icons/paw-print.svg?raw";
import star from "lucide-static/icons/star.svg?raw";
import trophy from "lucide-static/icons/trophy.svg?raw";
import diamond from "lucide-static/icons/diamond.svg?raw";
import shoppingBag from "lucide-static/icons/shopping-bag.svg?raw";
import chefHat from "lucide-static/icons/chef-hat.svg?raw";
import smile from "lucide-static/icons/smile.svg?raw";
import image from "lucide-static/icons/image.svg?raw";
import paperclip from "lucide-static/icons/paperclip.svg?raw";
import phone from "lucide-static/icons/phone.svg?raw";
import contact from "lucide-static/icons/contact.svg?raw";
import mapPin from "lucide-static/icons/map-pin.svg?raw";
import languages from "lucide-static/icons/languages.svg?raw";
import send from "lucide-static/icons/send.svg?raw";
import x from "lucide-static/icons/x.svg?raw";
import moreHorizontal from "lucide-static/icons/more-horizontal.svg?raw";
import maximize2 from "lucide-static/icons/maximize-2.svg?raw";
import minimize2 from "lucide-static/icons/minimize-2.svg?raw";
import search from "lucide-static/icons/search.svg?raw";
import ban from "lucide-static/icons/ban.svg?raw";
import pin from "lucide-static/icons/pin.svg?raw";
import trash2 from "lucide-static/icons/trash-2.svg?raw";
import bellOff from "lucide-static/icons/bell-off.svg?raw";
import messageCircle from "lucide-static/icons/message-circle.svg?raw";
import shield from "lucide-static/icons/shield.svg?raw";
import chevronLeft from "lucide-static/icons/chevron-left.svg?raw";
import chevronDown from "lucide-static/icons/chevron-down.svg?raw";
import fileText from "lucide-static/icons/file-text.svg?raw";
import video from "lucide-static/icons/video.svg?raw";
import calendar from "lucide-static/icons/calendar.svg?raw";
import cloud from "lucide-static/icons/cloud.svg?raw";

/** Kanonik ikon isim → ham SVG eşlemesi. */
const ICONS: Record<string, string> = {
  shirt,
  scissors,
  footprints,
  backpack,
  cpu,
  smartphone,
  laptop,
  tv,
  camera,
  monitor,
  wrench,
  hammer,
  drill,
  paintbrush,
  "utensils-crossed": utensilsCrossed,
  coffee,
  apple,
  wheat,
  sparkles,
  "spray-can": sprayCan,
  home,
  sofa,
  car,
  truck,
  bike,
  baby,
  "gamepad-2": gamepad2,
  dumbbell,
  gem,
  watch,
  glasses,
  pill,
  stethoscope,
  "heart-pulse": heartPulse,
  "flask-conical": flaskConical,
  microscope,
  factory,
  cog,
  building,
  "hard-hat": hardHat,
  construction,
  layers,
  package: packageIcon,
  boxes,
  leaf,
  sprout,
  store,
  briefcase,
  printer,
  "paw-print": pawPrint,
  star,
  trophy,
  diamond,
  "shopping-bag": shoppingBag,
  "chef-hat": chefHat,
  smile,
  image,
  paperclip,
  phone,
  contact,
  "map-pin": mapPin,
  languages,
  send,
  x,
  "more-horizontal": moreHorizontal,
  "maximize-2": maximize2,
  "minimize-2": minimize2,
  search,
  ban,
  pin,
  "trash-2": trash2,
  "bell-off": bellOff,
  "message-circle": messageCircle,
  shield,
  "chevron-left": chevronLeft,
  "chevron-down": chevronDown,
  "file-text": fileText,
  video,
  calendar,
  cloud,
};

/**
 * Lucide SVG'sini projenin sizing/styling sınıflarıyla render eder.
 * Lucide default `class="lucide lucide-..."` ve sabit width/height atılır,
 * yerine `w-5 h-5` (Tailwind, 20×20) gelir; `currentColor` korunur.
 */
function styleSvg(raw: string, className: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sclass="[^"]*"/, "")
    .replace(/\swidth="[^"]*"/, "")
    .replace(/\sheight="[^"]*"/, "")
    .replace("<svg", `<svg class="${className}"`);
}

/** Kanonik isimle ikon getir; yoksa yıldız. */
export function getLucideIcon(name: string, className = "w-5 h-5"): string {
  const raw = ICONS[name] ?? ICONS.star;
  return styleSvg(raw, className);
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
