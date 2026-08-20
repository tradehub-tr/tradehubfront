/**
 * WCAG kontrast ÖLÇÜMÜ — tarayıcı içinde çalışan saf fonksiyon.
 *
 * NEDEN ARTIK TEMPLATE LITERAL DEĞİL — ölçülmüş bir kusur:
 *   Bu kod spec içinde `const OLCUM = \`…\`` olarak duruyordu. Template
 *   literal içinde `\(` bir kaçış dizisi sayılıp `(`'e çözülüyor; yani
 *   `/^rgba?\(([^)]+)\)$/` tarayıcıya `/^rgba?(([^)]+))$/` olarak gidiyordu
 *   ve `rgb(255, 0, 0)` ile HİÇ eşleşmiyordu. Aynı şey `[,\s\/]+` için de
 *   geçerliydi: `\s` → `s`, yani boşluk yerine "s" harfi.
 *
 *   Sonuç yanlış ÇIKMIYORDU çünkü `ayristir()` başarısız olunca canvas'a
 *   çizip piksel okuyan yedek yol devreye giriyordu — ama hızlı yol ölüydü
 *   ve kimse fark etmemişti. ESLint `no-useless-escape` ile bunu 4 kez
 *   söylüyordu; uyarı doğruydu.
 *
 *   Daha kötüsü: `kontrast-tarama.mjs` bu bloğu dosyadan METİN olarak
 *   okuyordu, orada `\(` korunuyordu. Yani KAPI ile RÖNTGEN aynı kodu
 *   farklı yorumluyordu — tek kaynak olması gereken şey ikiye ayrılmıştı.
 *
 * Fonksiyon olarak ikisi de `page.evaluate(olcumYap)` ile aynı kodu geçirir;
 * kaçışlar normal JS kuralıyla yaşar ve ESLint kodu gerçekten denetler.
 */
export function olcumYap() {
  /**
   * CSS rengini {r,g,b,a}'ya çevirir.
   *
   * DÜZ REGEX YETMİYOR: Tailwind v4 palet renklerini oklch() olarak
   * derliyor. İlk sürüm yalnız rgb() okuyordu ve oklch dönen her öğeyi
   * atlıyordu — AÇIK TEMA neredeyse hiç ölçülmüyordu (kuyruk ekranında 29
   * yerine 9 öğe tarandı). Tarayıcıya çizdirip pikseli okumak her CSS renk
   * söz dizimini kapsıyor.
   */
  const tuval = document.createElement("canvas");
  tuval.width = 1;
  tuval.height = 1;
  const ctx = tuval.getContext("2d", { willReadFrequently: true });

  const ayristir = (renk) => {
    if (!renk || renk === "transparent" || renk === "none") return { r: 0, g: 0, b: 0, a: 0 };
    const m = renk.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[,\s/]+/).filter(Boolean).map((x) => parseFloat(x));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    ctx.fillStyle = "#000000";
    ctx.fillStyle = renk;
    ctx.clearRect(0, 0, 1, 1);
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };

  const uzerineKoy = (ust, alt) => ({
    r: ust.r * ust.a + alt.r * (1 - ust.a),
    g: ust.g * ust.a + alt.g * (1 - ust.a),
    b: ust.b * ust.a + alt.b * (1 - ust.a),
    a: 1,
  });

  const parlaklik = ({ r, g, b }) => {
    const k = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  };

  const oran = (a, b) => {
    const [x, y] = [parlaklik(a), parlaklik(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  /** Şeffaf zeminleri ata katmanlarla harmanlayarak efektif zemini bulur. */
  const efektifZemin = (el) => {
    let katman = { r: 255, g: 255, b: 255, a: 1 };
    const yigin = [];
    for (let n = el; n && n !== document.documentElement.parentNode; n = n.parentElement) {
      const bg = ayristir(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0) yigin.push(bg);
    }
    for (const bg of yigin.reverse()) katman = uzerineKoy(bg, katman);
    return katman;
  };

  const gorunur = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.15;
  };

  const bulgular = [];
  let sayac = 0;
  for (const el of document.querySelectorAll("main *")) {
    // Yalnız DOĞRUDAN metin taşıyan öğeler — kapsayıcılar iki kez sayılmasın.
    const metin = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!metin || metin.length < 2) continue;
    if (!gorunur(el)) continue;
    // Devre dışı öğeler WCAG 1.4.3 kapsamı dışında.
    if (el.closest("[disabled], [aria-disabled='true']")) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;

    const cs = getComputedStyle(el);
    const on = ayristir(cs.color);
    if (!on) continue;
    const zemin = efektifZemin(el);
    const gercekOn = on.a < 1 ? uzerineKoy(on, zemin) : on;

    sayac++;
    const px = parseFloat(cs.fontSize);
    const kalin = parseInt(cs.fontWeight, 10) >= 700;
    const buyuk = px >= 24 || (px >= 18.66 && kalin);
    const esik = buyuk ? 3 : 4.5;
    const o = oran(gercekOn, zemin);

    if (o < esik) {
      bulgular.push({
        metin: metin.slice(0, 44),
        oran: Math.round(o * 100) / 100,
        esik,
        px,
        renk: cs.color,
        zemin: `rgb(${Math.round(zemin.r)}, ${Math.round(zemin.g)}, ${Math.round(zemin.b)})`,
        yol: el.tagName.toLowerCase() + "." + (el.className?.toString?.() ?? "").slice(0, 60),
      });
    }
  }
  return { bulgular, taranan: sayac };
}
