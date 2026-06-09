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
                // <head> açılış tag'inin hemen ardına ekle — stylesheet'ten önce
                if (html.includes('tradehub-theme-remote')) return html; // idempotent
                return html.replace(/<head([^>]*)>/i, `<head$1>\n    ${inlineScript}`);
            },
        },
    };
}

function fontHeadPlugin(): Plugin {
    // Google Fonts (Inter) artık CSS @import yerine HTML <head>'de paralel yükleniyor.
    // CSS-içi remote @import, style.css indirilip parse edilmeden font keşfedilmediği için
    // LCP/FCP zincirini serileştiriyordu (T10 baseline'da ~861ms blocking). preconnect +
    // async-olmayan ama paralel stylesheet link, font'u kritik zincirden çıkarır;
    // display=swap FOUT yerine FOIT'i önler. Workbox bu host'ları zaten CacheFirst'lüyor.
    const fontLinks = [
        '<link rel="preconnect" href="https://fonts.googleapis.com" />',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&display=swap" />',
    ].join('\n    ');
    return {
        name: 'font-head-inject',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                if (html.includes('family=Inter')) return html; // idempotent
                return html.replace(/<head([^>]*)>/i, `<head$1>\n    ${fontLinks}`);
            },
        },
    };
}

/** Dev-only plugin: POST /__save-css to update @theme variables in style.css */
function cssEditorPlugin(): Plugin {
    return {
        name: 'css-editor',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use('/__save-css', (req, res) => {
                if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
                let body = '';
                req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
                req.on('end', () => {
                    try {
                        const updates: Record<string, string> = JSON.parse(body);
                        const cssPath = resolve(__dirname, 'src/style.css');
                        let css = readFileSync(cssPath, 'utf-8');

                        // Handle Google Fonts import updates
                        const fontImportUrl = updates['__google_font_imports__'];
                        delete updates['__google_font_imports__'];

                        for (const [varName, value] of Object.entries(updates)) {
                            // Match the variable declaration inside @theme { ... }
                            const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const re = new RegExp(`(${escaped}:\\s*)([^;]+)(;)`, 'g');
                            css = css.replace(re, `$1${value}$3`);
                        }

                        // Update Google Fonts @import if font changed
                        if (fontImportUrl) {
                            const importRe = /@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com\/css2\?[^)]+\);\s*/g;
                            css = css.replace(importRe, '');
                            // Insert new import after the comment header, before @import "tailwindcss"
                            const twImport = '@import "tailwindcss"';
                            css = css.replace(twImport, `${fontImportUrl}\n\n${twImport}`);
                        }

                        writeFileSync(cssPath, css, 'utf-8');
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: true, count: Object.keys(updates).length }));
                    } catch (e) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: String(e) }));
                    }
                });
            });
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
    const PRETTY: Array<{ re: RegExp; html: string }> = [
        { re: /^\/(?:en\/)?urun\/[^/]+/, html: '/pages/product-detail.html' },
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


// Frappe backend proxy hedefi. Bu monorepo'nun docker'ı 8088'i expose eder;
// farklı dev kurulumu (örn. bench serve :8000) için VITE_API_PROXY ile override edilebilir.
const API_PROXY_TARGET = process.env.VITE_API_PROXY || 'http://localhost:8088';

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
        cssEditorPlugin(),
        // notFoundFallbackPlugin'den ÖNCE çalışmalı: önce rewrite,
        // eşleşmezse 404.html fallback.
        staticPageRewritePlugin(),
        prettyUrlRewritePlugin(),
        notFoundFallbackPlugin(),
        seoPlaceholderPlugin(),
        // Bundle analizi — yalnızca build'de treemap üretir (perf-reports/bundle-stats.html,
        // gitignore'lu). tailwindcss() ilk kalmalı; visualizer en sonda zararsız.
        visualizer({
            filename: 'perf-reports/bundle-stats.html',
            gzipSize: true,
            template: 'treemap',
        }) as unknown as Plugin,
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
            includeAssets: ['icons/**', 'images/**', '_redirects', 'vite.svg'],
            workbox: {
                globPatterns: ['**/*.{html,js,css,woff,woff2,svg,png,webp,ico}'],
                // Multi-page: her HTML kendi entry. SPA fallback yok.
                navigateFallback: null,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                // Storefront görselleri (DummyJSON CDN, Frappe files vb.) workbox cache limitlerini aşabilir.
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                runtimeCaching: [
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
                    // App: i18n locale files (large)
                    if (id.includes('src/i18n/locales/')) return 'locales';
                    // App: Alpine data modules
                    if (id.includes('src/alpine/')) return 'alpine';
                },
            },
        },
    },
})
