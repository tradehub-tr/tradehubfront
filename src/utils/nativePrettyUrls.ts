/**
 * Native bundle pretty-URL çözücü (FE-3 / AC-15).
 *
 * PROD bundle modunda (capacitor://localhost, dist app içinden yüklenir) nginx
 * rewrite zinciri YOKTUR: `/gizlilik` gibi uzantısız pretty URL'ler Capacitor'ın
 * SPA fallback'iyle index.html'e düşer — kullanıcı ana sayfayı görür, hedef
 * sayfa (Terms/Privacy dahil) açılmaz. Bu modül yalnız native platformda,
 * document-level click delegation ile pretty URL'leri `staticPageUrl.ts`'teki
 * mevcut haritadan dist içi HTML yoluna çevirir.
 *
 * Web'de no-op (nginx rewrite zaten çalışır). Haritada olmayan path'lere
 * dokunulmaz — mevcut davranış neyse o kalır.
 *
 * FooterLinks import'uyla self-init olur (footer'daki region-switcher ile aynı
 * desen) — footer render eden her MPA entry'sinde aktif.
 */
import { Capacitor } from "@capacitor/core";
import { getStaticPageHtmlPath } from "./staticPageUrl";

let _initialized = false;

export function initNativePrettyUrls(): void {
  if (_initialized) return;
  _initialized = true;
  if (!Capacitor.isNativePlatform()) return;

  document.addEventListener(
    "click",
    (e) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/"]');
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("//")) return;

      const [pathAndQuery, hash] = href.split("#");
      const [path, query] = pathAndQuery.split("?");
      const htmlPath = getStaticPageHtmlPath(path.replace(/\/+$/, "") || "/");
      if (!htmlPath || htmlPath === path) return;

      e.preventDefault();
      window.location.href = htmlPath + (query ? `?${query}` : "") + (hash ? `#${hash}` : "");
    },
    true
  );
}

// Multi-entry sayfalar init çağırmadan render eder; import anında bağla.
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initNativePrettyUrls());
  } else {
    initNativePrettyUrls();
  }
}
