import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import fg from 'fast-glob'
import { getStaticPageHtmlMap } from './src/utils/staticPageUrl'
import pkg from './package.json' with { type: 'json' }
import { visualizer } from 'rollup-plugin-visualizer'

/**
 * Head enjeksiyonlarını <meta charset> SONRASINA koyar (charset yoksa <head>
 * açılışına). Charset ilk 1024 bayt içinde ve diğer tag'lerden önce olmalı —
 * öne eklenen font/tema blokları onu aşağı itince tarayıcı/SEO araçları
 * "charset has to be placed above" uyarısı veriyor.
 */
function injectAfterCharset(html: string, snippet: string): string {
    const charsetRe = /<meta\s+charset[^>]*>/i;
    if (charsetRe.test(html)) {
        return html.replace(charsetRe, (m) => `${m}\n    ${snippet}`);
    }
    return html.replace(/<head([^>]*)>/i, `<head$1>\n    ${snippet}`);
}

/**
 * Her HTML giriş dosyasının <head>'ine FOUC önleme scripti enjekte eder.
 * Script, localStorage'daki remote-theme cache'ini okuyup CSS vars'ı ilk
 * paint'ten önce :root'a uygular. Boş cache varsa no-op.
 */
function themeBootstrapPlugin(): Plugin {
    // 1) Cache'ten CSS vars'ı ilk paint öncesi uygula (FOUC önleme)
    // 2) Arka planda taze veriyi fetch et, cache'i güncelle (bir sonraki sayfa taze olsun)
    // Değişen değerleri hemen de uygula (aynı oturumda admin paneli güncellemesi görünsün)
    const inlineScript = `<script>(function(){try{var k='tradehub-theme-remote';var o=JSON.parse(localStorage.getItem(k)||'{}');var r=document.documentElement;function apply(m){for(var n in m){if(typeof n==='string'&&n.indexOf('--')===0&&typeof m[n]==='string'){r.style.setProperty(n,m[n]);}}}apply(o);if(typeof fetch==='function'){fetch('/api/method/tradehub_core.api.theme.get_public_theme',{credentials:'same-origin'}).then(function(x){return x.ok?x.json():null;}).then(function(d){if(!d||!d.message)return;var ov=d.message.overrides||{};var clean={};for(var q in ov){if(typeof q==='string'&&q.indexOf('--')===0&&typeof ov[q]==='string')clean[q]=ov[q];}try{localStorage.setItem(k,JSON.stringify(clean));}catch(e){}apply(clean);}).catch(function(){});}}catch(e){}})();</script>`;
    return {
        name: 'theme-bootstrap-inject',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                // charset'in hemen ardına — stylesheet'ten önce, charset'ten sonra
                if (html.includes('tradehub-theme-remote')) return html; // idempotent
                return injectAfterCharset(html, inlineScript);
            },
        },
    };
}

function fontHeadPlugin(): Plugin {
    // FE-2 (CWV): Inter SELF-HOST edildi (public/fonts/*.woff2, wght 300..800
    // variable, 4 subset: latin/latin-ext/cyrillic/cyrillic-ext — TR latin-ext'te).
    // Google Fonts stylesheet'i 3. parti DNS+TLS+CSS zinciriyle LCP'yi
    // geciktiriyordu; artık inline @font-face + en kritik subset'lere preload.
    // display=swap FOIT'i önler. Arapça Inter'de yok — sistem fontuna düşer.
    const fontCss = "@font-face{font-family:'Inter';font-style:normal;font-weight:300 800;font-display:swap;src:url(/fonts/inter-cyrillic-ext.woff2) format('woff2');unicode-range:U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F}@font-face{font-family:'Inter';font-style:normal;font-weight:300 800;font-display:swap;src:url(/fonts/inter-cyrillic.woff2) format('woff2');unicode-range:U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116}@font-face{font-family:'Inter';font-style:normal;font-weight:300 800;font-display:swap;src:url(/fonts/inter-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF}@font-face{font-family:'Inter';font-style:normal;font-weight:300 800;font-display:swap;src:url(/fonts/inter-latin.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD}";
    const fontLinks = [
        '<link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />',
        '<link rel="preload" href="/fonts/inter-latin-ext.woff2" as="font" type="font/woff2" crossorigin />',
        `<style>${fontCss}</style>`,
    ].join('\n    ');
    return {
        name: 'font-head-inject',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                if (html.includes('/fonts/inter-latin.woff2')) return html; // idempotent
                // Eski Google Fonts satırları varsa temizle (kaynak HTML kalıntıları)
                let out = html
                    .replace(/[ \t]*<link[^>]*fonts\.googleapis\.com[^>]*>\s*\n?/gi, '')
                    .replace(/[ \t]*<link[^>]*fonts\.gstatic\.com[^>]*>\s*\n?/gi, '');
                return injectAfterCharset(out, fontLinks);
            },
        },
    };
}


/**
 * Dev-only: impeccable "live" mode picker script'ini serve anında enjekte eder.
 * Kaynak HTML'lere YAZMAZ (git temiz kalır) — helper çalışırken oluşturulan
 * `.impeccable/live/server.json`'daki port'tan <script src=".../live.js"> üretir.
 * Dosya yoksa (live kapalı) no-op. `apply:'serve'` → prod build'e asla girmez.
 */
function impeccableLivePlugin(): Plugin {
    const serverInfoPath = resolve(__dirname, '.impeccable/live/server.json');
    return {
        name: 'impeccable-live-inject',
        apply: 'serve',
        transformIndexHtml: {
            order: 'post',
            handler(html) {
                if (html.includes('/live.js')) return html; // idempotent
                try {
                    const { port } = JSON.parse(readFileSync(serverInfoPath, 'utf-8')) as { port?: number };
                    if (!port) return html;
                    const tag = `<script src="http://localhost:${port}/live.js"></script>`;
                    return html.replace(/<\/body>/i, `    ${tag}\n</body>`);
                } catch {
                    return html; // server.json yok → live kapalı
                }
            },
        },
    };
}

/**
 * Dev-only plugin: Türkçe statik path'leri (örn. /ureticiler) dist içindeki
 * HTML dosyasına (pages/manufacturers.html) rewrite eder.
 *
 * Mapping kaynağı: src/utils/staticPageUrl.ts (STATIC_PAGE_HTML_MAP).
 * Production'da aynı işlev nginx.conf.template `map $uri $static_page_html`
 * bloğu ile sağlanır. Backend page_resolver (tradehub_core/seo) SEO meta
 * inject etmek için varlığını korur.
 */
function staticPageRewritePlugin(): Plugin {
    const htmlMap = getStaticPageHtmlMap();
    return {
        name: 'static-page-rewrite',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                if (!req.url) return next();
                const [pathOnly, queryString] = req.url.split('?');
                const htmlPath = htmlMap[pathOnly];
                if (!htmlPath) return next();
                req.url = queryString ? `${htmlPath}?${queryString}` : htmlPath;
                next();
            });
        },
    };
}

/**
 * Dev-only: dinamik pretty URL'leri ilgili HTML entry'sine internal-rewrite eder.
 * Production'da bunu Nginx yapıyor; dev server'da Nginx olmadığı için ürün kartı
 * linkleri (/urun/<slug>) ana sayfaya düşüyordu. URL değişmez — product-detail.ts
 * slug'ı window.location.pathname'den okur, getListingDetail(slug) ile çözer.
 */
function prettyUrlRewritePlugin(): Plugin {
    // nginx.conf.template'teki rewrite kurallarıyla birebir. Sıra önemli:
    // /magaza/<code>/dukkan, genel /magaza/<code>'dan ÖNCE eşleşmeli.
    const PRETTY: Array<{ re: RegExp; html: string }> = [
        { re: /^\/(?:en\/)?urun\/[^/]+/, html: '/pages/product-detail.html' },
        { re: /^\/(?:en\/)?kategori\/.+/, html: '/pages/categories.html' },
        { re: /^\/(?:en\/)?marka\/.+/, html: '/pages/brand.html' },
        { re: /^\/(?:en\/)?magaza\/[^/]+\/dukkan$/, html: '/pages/seller/seller-shop.html' },
        { re: /^\/(?:en\/)?magaza\/.+/, html: '/pages/seller/seller-storefront.html' },
    ];
    return {
        name: 'pretty-url-rewrite',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                if (!req.url) return next();
                const [pathOnly, queryString] = req.url.split('?');
                const match = PRETTY.find((p) => p.re.test(pathOnly));
                if (!match) return next();
                req.url = queryString ? `${match.html}?${queryString}` : match.html;
                next();
            });
        },
    };
}

/** Dev-only plugin: serve 404.html for unknown routes */
function notFoundFallbackPlugin(): Plugin {
    return {
        name: 'not-found-fallback',
        apply: 'serve',
        configureServer(server) {
            // Return handler runs AFTER Vite's built-in middleware
            return () => {
                server.middlewares.use((req, _res, next) => {
                    const url = req.url?.split('?')[0] ?? '/';
                    // Skip internal Vite paths, assets, and node_modules
                    if (url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/') || url.includes('.')) {
                        return next();
                    }
                    // Check if an .html file exists for this path
                    const htmlPath = resolve(__dirname, url.endsWith('/') ? `${url.slice(1)}index.html` : `${url.slice(1)}.html`);
                    const directPath = resolve(__dirname, url.slice(1));
                    if (existsSync(htmlPath) || existsSync(directPath)) {
                        return next();
                    }
                    // Serve 404.html
                    req.url = '/404.html';
                    next();
                });
            };
        },
    };
}

/**
 * SEO meta tag placeholder injection.
 *
 * Multi-page Vite build'i her HTML entry'sinin <head>'ine
 * `<!-- {{__SEO_HEAD__}} -->` placeholder yerleştirir. Bu placeholder daha
 * sonra Nginx → Frappe page_resolver pipeline'ında doctype-spesifik meta
 * tag'lerle değiştirilir (örn. /urun/<slug>).
 *
 * Statik sayfalarda (legal, info, vb.) placeholder kalır — production
 * Nginx rewrite kuralı yoksa storefront default'larıyla servis edilir.
 *
 * SPA-style sayfalarda (dashboard, cart, search) `src/seo/setPageMeta.ts`
 * client-side fallback ile çalışır.
 */
/**
 * FE-3: statik sayfa SEO meta enjeksiyonu (src/seo/staticMeta.ts verisi).
 * - NOINDEX_FILES (34): robots noindex,nofollow (404 istisnası: noindex,follow);
 *   mevcut robots meta satırları sökülür (seller-shop/storefront'taki elle
 *   yazılmış "index, follow" dahil — dinamiklerde robots'un sahibi backend).
 * - INDEXABLE_META: description (yoksa) + self-canonical (apex) + OG/Twitter.
 *   prettyPath=null dinamik şablonlarda canonical/og:url EKLENMEZ.
 * seoPlaceholderPlugin'den ('post') ÖNCE koşar; backend __SEO_HEAD__ dolumu
 * bot isteklerinde bu statikleri zaten ezer — bunlar fallback katmanı.
 */
function staticSeoPlugin(): Plugin {
    return {
        name: 'static-seo-inject',
        transformIndexHtml: {
            order: 'pre',
            async handler(html, ctx) {
                const { NOINDEX_FILES, NOINDEX_FOLLOW_FILES, INDEXABLE_META, CANONICAL_ORIGIN } =
                    await import('./src/seo/staticMeta');
                const rel = ctx.filename
                    .replace(/\\/g, '/')
                    .replace(new RegExp('^' + __dirname.replace(/\\/g, '/') + '/'), '');

                // Mevcut elle yazılmış robots meta'ları söküp tek otorite kur
                let out = html.replace(/[ \t]*<meta\s+name="robots"[^>]*>\s*\n?/gi, '');

                const tags: string[] = [];
                // iOS ana ekran ikonu — tüm sayfalara (SEO denetçilerinin
                // "missing apple-touch-icon" uyarısını kapatır; dosya public/icons'ta)
                if (!/rel="apple-touch-icon"/i.test(out)) {
                    tags.push('<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />');
                }
                if (NOINDEX_FILES.has(rel)) {
                    const value = NOINDEX_FOLLOW_FILES.has(rel) ? 'noindex, follow' : 'noindex, nofollow';
                    tags.push(`<meta name="robots" content="${value}" />`);
                } else if (rel in INDEXABLE_META) {
                    const meta = INDEXABLE_META[rel];
                    // İndexlenebilir sayfada staticMeta TEK OTORİTE: kaynaktaki eski
                    // elle yazılmış description/OG kalıntıları onaylı seti ezmesin.
                    out = out
                        .replace(/[ \t]*<meta\s+name="description"[^>]*>\s*\n?/gi, '')
                        .replace(/[ \t]*<meta\s+property="og:(?:title|description|url|image(?::width|:height)?)"[^>]*>\s*\n?/gi, '');
                    tags.push(`<meta name="description" content="${meta.description}" />`);
                    if (meta.prettyPath) {
                        const canonical =
                            meta.prettyPath === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${meta.prettyPath}`;
                        if (!/<link\s+rel="canonical"/i.test(out)) {
                            tags.push(`<link rel="canonical" href="${canonical}" />`);
                        }
                        tags.push(`<meta property="og:url" content="${canonical}" />`);
                    }
                    const titleMatch = out.match(/<title[^>]*>([^<]*)<\/title>/i);
                    const title = titleMatch ? titleMatch[1].trim() : 'iStoc';
                    tags.push(`<meta property="og:title" content="${title}" />`);
                    tags.push(`<meta property="og:description" content="${meta.description}" />`);
                    if (!/property="og:type"/i.test(out)) {
                        tags.push(`<meta property="og:type" content="website" />`);
                    }
                    // Varsayılan OG görseli (1200×630, public/images/og-default.jpg).
                    // Dinamik sayfalarda backend ensure_og_image daha spesifiğini basar;
                    // bu statik fallback "og:image missing" uyarısını kapatır.
                    const ogImage = `${CANONICAL_ORIGIN}/images/og-default.jpg`;
                    if (!/property="og:image"/i.test(out)) {
                        tags.push(`<meta property="og:image" content="${ogImage}" />`);
                        tags.push(`<meta property="og:image:width" content="1200" />`);
                        tags.push(`<meta property="og:image:height" content="630" />`);
                    }
                    if (!/name="twitter:card"/i.test(out)) {
                        tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
                    }
                    if (!/name="twitter:image"/i.test(out)) {
                        tags.push(`<meta name="twitter:image" content="${ogImage}" />`);
                    }
                }

                if (tags.length === 0 || !/<\/head>/i.test(out)) return out;
                return out.replace(/<\/head>/i, `    ${tags.join('\n    ')}\n</head>`);
            },
        },
    };
}


function seoPlaceholderPlugin(): Plugin {
    const PLACEHOLDER = '<!-- {{__SEO_HEAD__}} -->';
    return {
        name: 'seo-placeholder-inject',
        transformIndexHtml: {
            order: 'post',
            handler(html) {
                // Idempotent: placeholder zaten varsa no-op
                if (html.includes(PLACEHOLDER)) return html;
                // </head> öncesine yerleştir
                if (!/<\/head>/i.test(html)) return html;
                return html.replace(/<\/head>/i, `    ${PLACEHOLDER}\n</head>`);
            },
        },
    };
}


// Frappe backend proxy hedefi. Bu kurulumun docker'ı frontend'i 8000'e expose
// eder (docker frontend: container 8080 → host 8000, site: dev.localhost);
// farklı dev kurulumu için VITE_API_PROXY ile override edilebilir.
const API_PROXY_TARGET = process.env.VITE_API_PROXY || 'http://localhost:8000';

export default defineConfig({
    base: process.env.GITHUB_PAGES === 'true' ? '/tradehubfront/' : '/',
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
    server: {
        host: '0.0.0.0',
        // Docker bind mount'larda inotify dosya değişikliklerini kaçırabiliyor.
        // Polling ile tüm değişiklikler garanti şekilde algılanır (HMR).
        watch: {
            usePolling: true,
            interval: 300,
        },
        proxy: {
            '/api': {
                target: API_PROXY_TARGET,
                changeOrigin: true,
            },
            '/files': {
                target: API_PROXY_TARGET,
                changeOrigin: true,
            },
            '/private/files': {
                target: API_PROXY_TARGET,
                changeOrigin: true,
            },
        },
    },
    plugins: [
        tailwindcss(),
        themeBootstrapPlugin(),
        fontHeadPlugin(),
        // notFoundFallbackPlugin'den ÖNCE çalışmalı: önce rewrite,
        // eşleşmezse 404.html fallback.
        staticPageRewritePlugin(),
        prettyUrlRewritePlugin(),
        notFoundFallbackPlugin(),
        staticSeoPlugin(),
        seoPlaceholderPlugin(),
        impeccableLivePlugin(),
        // Bundle analizi — SADECE `ANALYZE=true npm run build` ile çalışır.
        // visualizer v7 raporu rollup asset olarak emit ettiği için filename ne olursa
        // olsun dist/'e düşüyordu → prod image'ına 998 KB shipping. Env-gate ile normal
        // prod build'de hiç üretilmez. Analiz için: `ANALYZE=true npm run build`.
        // tailwindcss() ilk kalmalı; visualizer (varsa) en sonda zararsız.
        ...(process.env.ANALYZE
            ? [visualizer({
                filename: resolve(__dirname, 'perf-reports/bundle-stats.html'),
                gzipSize: true,
                template: 'treemap',
            }) as unknown as Plugin]
            : []),
        VitePWA({
            // Multi-page yapıda kullanıcı navigation = tam reload — autoUpdate güvenli ve UI gerektirmez.
            registerType: 'autoUpdate',
            // Plugin her HTML <head>'ine SW kayıt script'ini otomatik enjekte eder (74 sayfa, manuel iş yok).
            injectRegister: 'auto',
            strategies: 'generateSW',
            // Plugin manifest'i üretir + her HTML <head>'ine <link rel="manifest"> + theme-color enjekte eder.
            manifest: {
                id: '/',
                name: 'istoc — Global B2B Marketplace',
                short_name: 'istoc',
                description: 'Doğrulanmış satıcılar, güvenli ödeme ve şeffaf komisyonla küresel B2B toptan ticaret.',
                lang: 'tr',
                dir: 'ltr',
                start_url: '/?source=pwa',
                scope: '/',
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#ffffff',
                theme_color: '#cc9900',
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
                    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                    { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
                ],
                shortcuts: [
                    { name: 'Sepetim', short_name: 'Sepet', url: '/pages/cart.html', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
                    { name: 'Siparişlerim', short_name: 'Siparişler', url: '/pages/dashboard/orders.html', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
                ],
            },
            includeAssets: ['icons/**', 'images/**', 'vite.svg'],
            workbox: {
                // FE-2 (CWV/SEO): HTML precache'ten ÇIKARILDI — SW'den servis edilen
                // bayat HTML, noindex→index geçişinde eski robots/canonical meta'yı
                // günlerce yaşatabiliyordu (eksiklik denetimi #3). HTML artık aşağıda
                // NetworkFirst runtime cache ile (taze öncelikli, offline yedekli).
                globPatterns: ['**/*.{js,css,woff,woff2,svg,png,webp,ico}'],
                // Multi-page: her HTML kendi entry. SPA fallback yok.
                navigateFallback: null,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                // Storefront görselleri (DummyJSON CDN, Frappe files vb.) workbox cache limitlerini aşabilir.
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                runtimeCaching: [
                    {
                        // HTML navigasyonları — taze öncelikli (SEO meta'ları bayatlamaz),
                        // ağ yoksa son başarılı kopya (offline yedek).
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages',
                            networkTimeoutSeconds: 5,
                            expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        // Frappe API — cookie session ile, network-first + offline fallback YOK (POST cache'lenmez).
                        // CACHE KATMAN SINIRI: Uygulama-veri freshness'ı artık TanStack Query + IndexedDB
                        // persister (src/lib/query) tarafından yönetiliyor (instant render + SWR + dedup).
                        // Bu SW cache'i yalnızca OFFLINE / ağ-yedeği rolünde — 5dk TTL bu amaç için yeterli.
                        // POST istekleri NetworkOnly kalır.
                        urlPattern: ({ url }) => url.pathname.startsWith('/api/method/'),
                        handler: 'NetworkFirst',
                        method: 'GET',
                        options: {
                            cacheName: 'frappe-api',
                            networkTimeoutSeconds: 5,
                            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 5 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/api/method/'),
                        handler: 'NetworkOnly',
                        method: 'POST',
                    },
                    {
                        // Frappe public files (ürün görselleri)
                        urlPattern: ({ url }) => url.pathname.startsWith('/files/'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'frappe-files',
                            expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        // DummyJSON CDN (demo ürün görselleri)
                        urlPattern: /^https:\/\/cdn\.dummyjson\.com\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'dummyjson-images',
                            expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        // ui-avatars.com (satıcı logo placeholder)
                        urlPattern: /^https:\/\/ui-avatars\.com\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'ui-avatars',
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        // HTML sayfaları — NetworkFirst.
                        // ÖNCEDEN StaleWhileRevalidate'di: navigasyonda (link tıklama) SW cache'teki
                        // ESKİ HTML'i anında veriyordu. Hash'li asset isimleri her build'de değiştiği için
                        // eski HTML eski (artık 404 olan) asset'leri referans ediyor → sayfa BOŞ açılıyor,
                        // ancak refresh'te (arkada güncellenen cache) düzeliyordu. MPA + hash'li asset'lerde
                        // bu kalıcı bir tuzak. NetworkFirst: önce ağdan taze HTML (doğru hash'ler), ağ
                        // 3sn'de gelmezse cache'e düş (offline desteği korunur).
                        urlPattern: ({ request }) => request.destination === 'document',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages',
                            networkTimeoutSeconds: 3,
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts',
                            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
            // Dev'de SW kapalı — Vite HMR ile çakışmasın.
            devOptions: { enabled: false },
        }),
    ],
    build: {
        copyPublicDir: true,
        rollupOptions: {
            input: Object.fromEntries(
                fg.sync('**/*.html', {
                    ignore: [
                        'node_modules/**',
                        'dist/**',
                        'ios/**',
                        'android/**',
                        '**/style-test.html',
                        '**/test-*.html',
                        // Geliştirici dokümantasyonu build'e/dist'e girmesin (FE-3)
                        'docs/**',
                        // ANALYZE build'inin ürettiği bundle-stats.html'i build entry
                        // olarak ALMA — yoksa kökte varken glob onu yakalayıp dist'e
                        // (dolayısıyla prod image'ına + SW precache'e) sokuyor.
                        '**/perf-reports/**',
                    ],
                }).map(file => [
                    file.replace(/\.html$/, '').replace(/\//g, '-'),
                    resolve(__dirname, file),
                ])
            ),
            output: {
                manualChunks(id) {
                    // Vendor: Alpine.js
                    if (id.includes('node_modules/alpinejs')) return 'vendor-alpine';
                    // Vendor: Flowbite
                    if (id.includes('node_modules/flowbite')) return 'vendor-flowbite';
                    // Vendor: Swiper
                    if (id.includes('node_modules/swiper')) return 'vendor-swiper';
                    // Vendor: i18next
                    if (id.includes('node_modules/i18next')) return 'vendor-i18next';
                    // Vendor: DOMPurify
                    if (id.includes('node_modules/dompurify')) return 'vendor-dompurify';
                    // Vendor: ECharts (+ zrender bağımlılığı) — buyer dashboard analitiği
                    if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) return 'vendor-echarts';
                    // Vendor: TanStack Query + idb-keyval — client-side cache katmanı (src/lib/query)
                    if (id.includes('node_modules/@tanstack') || id.includes('node_modules/idb-keyval')) return 'vendor-tanstack';
                    // App: i18n locale dosyaları — manualChunk YOK: her dil dinamik
                    // import(`./locales/${lang}`) ile ayrı chunk'a bölünsün, yalnız aktif
                    // dil yüklensin (B-1 lazy-load). Tek 'locales' chunk'ı 4 dili birleştirirdi.
                    // App: Alpine data modules → paylaşımlı 'alpine' chunk. B-2: per-page
                    // yapılan modüller (yalnız kendi sayfa entry'lerinde import edilenler)
                    // HARİÇ — kendi sayfa chunk'larına düşsünler, her sayfada yüklenmesinler.
                    if (id.includes('src/alpine/') && !id.includes('src/alpine/checkout.ts') && !id.includes('src/alpine/kyb.ts') && !id.includes('src/alpine/messages.ts') && !id.includes('src/alpine/remittance.ts') && !id.includes('src/alpine/orderItemsDrawer.ts') && !id.includes('src/alpine/sellerShop.ts') && !id.includes('src/alpine/addresses.ts') && !id.includes('src/alpine/payment.ts') && !id.includes('src/alpine/settings.ts') && !id.includes('src/alpine/orders.ts') && !id.includes('src/alpine/seller.ts') && !id.includes('src/alpine/dashboard.ts') && !id.includes('src/alpine/auth.ts') && !id.includes('src/alpine/products-filter.ts') && !id.includes('src/alpine/cart.ts') && !id.includes('src/alpine/help.ts') && !id.includes('src/alpine/product.ts') && !id.includes('src/alpine/loginModal.ts') && !id.includes('src/alpine/orderProtectionModal.ts') && !id.includes('src/alpine/sidebar.ts'))
                        return 'alpine';
                },
            },
        },
    },
})
