import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import fg from 'fast-glob'

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

export default defineConfig({
    base: process.env.GITHUB_PAGES === 'true' ? '/tradehubfront/' : '/',
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
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/files': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/private/files': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    plugins: [
        tailwindcss(),
        themeBootstrapPlugin(),
        cssEditorPlugin(),
        notFoundFallbackPlugin(),
    ],
    build: {
        copyPublicDir: true,
        rollupOptions: {
            input: Object.fromEntries(
                fg.sync('**/*.html', {
                    ignore: ['node_modules/**', 'dist/**', '**/style-test.html', '**/test-*.html'],
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
                    // App: i18n locale files (large)
                    if (id.includes('src/i18n/locales/')) return 'locales';
                    // App: Alpine data modules
                    if (id.includes('src/alpine/')) return 'alpine';
                },
            },
        },
    },
})
