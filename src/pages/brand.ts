/**
 * Brand Detail Page — Entry Point
 * /pages/brand.html?slug={slug}
 *
 * Hero banner + logo/meta + about + video + featured products + all products + socials.
 */

import '../style.css'
import { t } from '../i18n'

import {
  TopBar,
  initMobileDrawer,
  SubHeader,
  initStickyHeaderSearch,
  MegaMenu,
  initMegaMenu,
  initHeaderCart,
} from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'
import { FloatingPanel } from '../components/floating'
import { startAlpine } from '../alpine'
import { Breadcrumb } from '../components/shared/Breadcrumb'
import { ProductListingGrid } from '../components/products/ProductListingGrid'
import { callMethod } from '../utils/api'
import type { ProductListingCard } from '../types/productListing'

interface BrandOwnerInfo {
  code: string
  name: string
  country?: string
  logo?: string
}

interface BrandDetail {
  code: string
  name: string
  slug: string
  logo: string
  description: string
  foundedYear: number | null
  website: string
  country: string
  isOfficial: boolean
  officialStatus: string
  owner: BrandOwnerInfo | null
  listingCount: number
  // Customization fields
  tagline: string
  heroBanner: string
  themeColor: string
  videoUrl: string
  aboutTitle: string
  aboutContent: string
  socials: Record<string, string>
}

interface BrandDetailResponse {
  brand: BrandDetail
  featured: any[]
  listings: any[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

function getSlugFromUrl(): string {
  const params = new URLSearchParams(window.location.search)
  return (params.get('slug') || params.get('code') || '').trim()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(url: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed
  return `https://${trimmed}`
}

// ── Hero (banner + logo + meta) ──────────────────────────────────────────────
function renderHero(brand: BrandDetail): string {
  const theme = brand.themeColor || '#cc9900'
  const banner = brand.heroBanner || ''

  const logoHtml = brand.logo
    ? `<img src="${brand.logo}" alt="${escapeHtml(brand.name)}" class="w-24 h-24 md:w-32 md:h-32 object-contain bg-white rounded-xl border border-gray-200 p-3 flex-shrink-0 shadow-sm" />`
    : `<div class="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-white rounded-xl border border-gray-200 flex-shrink-0 text-3xl font-bold shadow-sm" style="color:${theme}">${escapeHtml(brand.name.charAt(0).toUpperCase())}</div>`

  const officialBadge = brand.isOfficial
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
         <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
           <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
         </svg>
         Resmi Marka
       </span>`
    : ''

  const metaItems: string[] = []
  if (brand.foundedYear) metaItems.push(`<span><strong>${brand.foundedYear}</strong> kuruldu</span>`)
  if (brand.country) metaItems.push(`<span>${escapeHtml(brand.country)}</span>`)
  if (brand.website) {
    const url = sanitizeUrl(brand.website)
    metaItems.push(`<a href="${url}" target="_blank" rel="noopener" class="hover:underline" style="color:${theme}">Website</a>`)
  }
  metaItems.push(`<span><strong>${brand.listingCount}</strong> ürün</span>`)

  const metaHtml = metaItems.length > 0
    ? `<div class="flex items-center gap-3 flex-wrap text-sm mt-2" style="color:rgba(255,255,255,0.88)">${metaItems.join('<span style="color:rgba(255,255,255,0.4)">·</span>')}</div>`
    : ''

  const taglineHtml = brand.tagline
    ? `<p class="text-base md:text-lg font-medium mt-1" style="color:rgba(255,255,255,0.92)">${escapeHtml(brand.tagline)}</p>`
    : ''

  const descHtml = brand.description
    ? `<p class="text-sm mt-3 leading-relaxed max-w-3xl" style="color:rgba(255,255,255,0.78)">${brand.description}</p>`
    : ''

  const ownerHtml = brand.owner
    ? `<a href="/pages/seller/seller-storefront.html?id=${encodeURIComponent(brand.owner.code)}"
           class="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-xs no-underline"
           style="color:#fff">
         ${brand.owner.logo ? `<img src="${brand.owner.logo}" alt="${escapeHtml(brand.owner.name)}" class="w-4 h-4 object-contain rounded" />` : ''}
         <span>Satıcı: <strong>${escapeHtml(brand.owner.name)}</strong></span>
       </a>`
    : ''

  // Background: hero banner image if set, else theme color gradient
  const bgStyle = banner
    ? `background: linear-gradient(rgba(17,24,39,0.55), rgba(17,24,39,0.75)), url('${banner}') center/cover no-repeat;`
    : `background: linear-gradient(135deg, ${theme} 0%, #111827 100%);`

  return `
    <section class="relative border-b border-gray-200" style="${bgStyle}">
      <div class="container-boxed py-8 md:py-14">
        <div class="flex flex-col md:flex-row items-start gap-5 md:gap-8">
          ${logoHtml}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h1 class="text-2xl md:text-4xl font-bold truncate" style="color:#fff">${escapeHtml(brand.name)}</h1>
              ${officialBadge}
            </div>
            ${taglineHtml}
            ${metaHtml}
            ${descHtml}
            ${ownerHtml}
          </div>
        </div>
      </div>
    </section>
  `
}

// ── About ────────────────────────────────────────────────────────────────────
function renderAbout(brand: BrandDetail): string {
  if (!brand.aboutContent || !brand.aboutContent.trim()) return ''
  const title = brand.aboutTitle || 'Hakkımızda'
  const theme = brand.themeColor || '#cc9900'
  return `
    <section class="py-8 md:py-12 bg-white border-b border-gray-200">
      <div class="container-boxed">
        <h2 class="text-xl md:text-2xl font-bold mb-4 pb-2 border-b-2 inline-block" style="border-color:${theme}; color:#111827">${escapeHtml(title)}</h2>
        <div class="prose prose-sm max-w-3xl text-gray-700 leading-relaxed">
          ${brand.aboutContent}
        </div>
      </div>
    </section>
  `
}

// ── Video (YouTube / Vimeo embed) ────────────────────────────────────────────
function renderVideo(brand: BrandDetail): string {
  if (!brand.videoUrl) return ''
  const embedUrl = toEmbedUrl(brand.videoUrl)
  if (!embedUrl) return ''
  return `
    <section class="py-6 bg-gray-50 border-b border-gray-200">
      <div class="container-boxed">
        <h2 class="text-lg font-bold text-gray-900 mb-3">Tanıtım Videosu</h2>
        <div class="relative rounded-lg overflow-hidden shadow-sm" style="padding-top:56.25%">
          <iframe src="${embedUrl}"
            class="absolute inset-0 w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>
      </div>
    </section>
  `
}

function toEmbedUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return ''
  // YouTube watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
  // Already embed URL
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url
  return ''
}

// ── Featured products (pinned by brand owner) ────────────────────────────────
function renderFeatured(featured: ProductListingCard[], brand: BrandDetail): string {
  if (!featured || featured.length === 0) return ''
  const theme = brand.themeColor || '#cc9900'
  return `
    <section class="py-8 bg-white border-b border-gray-200">
      <div class="container-boxed">
        <div class="flex items-end justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Öne Çıkan Ürünler</h2>
          <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded" style="background:${theme}20; color:${theme}">
            Editör Seçimi
          </span>
        </div>
        <div id="brand-featured-grid"></div>
      </div>
    </section>
  `
}

// ── All products ─────────────────────────────────────────────────────────────
function renderGridSection(total: number): string {
  if (total === 0) {
    return `
      <section class="py-10">
        <div class="container-boxed">
          <div class="text-center py-16 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7m8 4v10"/>
            </svg>
            <p class="text-lg font-medium">Bu markanın henüz ürünü yok</p>
            <p class="text-sm mt-1">Yakında ürünler eklenecek.</p>
          </div>
        </div>
      </section>
    `
  }
  return `
    <section class="py-8">
      <div class="container-boxed">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Tüm Ürünler (${total})</h2>
        <div id="brand-product-grid"></div>
      </div>
    </section>
  `
}

// ── Social media footer strip ────────────────────────────────────────────────
function renderSocials(brand: BrandDetail): string {
  const socials = brand.socials || {}
  const entries = Object.entries(socials).filter(([, v]) => v)
  if (entries.length === 0) return ''
  const theme = brand.themeColor || '#cc9900'

  const iconMap: Record<string, string> = {
    instagram: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
    facebook: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    twitter: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    linkedin: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    youtube: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  }

  const buttonsHtml = entries.map(([platform, url]) => {
    const icon = iconMap[platform] || ''
    return `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener"
              class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white hover:text-white transition-colors no-underline text-gray-600 hover:border-transparent"
              style="--hover-bg:${theme}"
              onmouseover="this.style.background='${theme}';this.style.color='#fff'"
              onmouseout="this.style.background='';this.style.color=''"
              title="${platform.charAt(0).toUpperCase() + platform.slice(1)}">
        ${icon}
      </a>`
  }).join('')

  return `
    <section class="py-8 bg-gray-50 border-t border-gray-200">
      <div class="container-boxed text-center">
        <p class="text-sm font-semibold text-gray-700 mb-3">${escapeHtml(brand.name)} Sosyal Medya</p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          ${buttonsHtml}
        </div>
      </div>
    </section>
  `
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const slug = getSlugFromUrl()
  if (!slug) {
    document.querySelector('#app')!.innerHTML = `
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center text-gray-500">
          <p class="text-lg">Marka bulunamadı</p>
          <a href="/pages/products.html" class="text-primary-600 hover:underline mt-2 inline-block">Tüm ürünlere dön</a>
        </div>
      </div>
    `
    return
  }

  let payload: BrandDetailResponse
  try {
    payload = await callMethod<BrandDetailResponse>(
      'tradehub_core.api.brand.get_brand_detail',
      { slug }
    )
  } catch (err) {
    console.error('[Brand Page] load failed:', err)
    document.querySelector('#app')!.innerHTML = `
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center text-gray-500">
          <p class="text-lg">Marka bulunamadı veya onaylanmamış</p>
          <a href="/pages/products.html" class="text-primary-600 hover:underline mt-2 inline-block">Tüm ürünlere dön</a>
        </div>
      </div>
    `
    return
  }

  const { brand, featured: featuredRaw, listings: listingsRaw, total } = payload
  const featured = (featuredRaw || []) as ProductListingCard[]
  const listings = (listingsRaw || []) as ProductListingCard[]

  document.title = `${brand.name} - iSTOC TradeHub`

  const appEl = document.querySelector<HTMLDivElement>('#app')!
  appEl.innerHTML = `
    <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
      ${TopBar()}
      ${SubHeader()}
    </div>

    ${MegaMenu()}

    <main>
      <div class="container-boxed py-3">
        ${Breadcrumb([
          { label: t('drawer.home', { defaultValue: 'Ana Sayfa' }), href: '/' },
          { label: t('drawer.brands', { defaultValue: 'Markalar' }) },
          { label: brand.name },
        ])}
      </div>

      ${renderHero(brand)}
      ${renderAbout(brand)}
      ${renderVideo(brand)}
      ${renderFeatured(featured, brand)}
      ${renderGridSection(total)}
      ${renderSocials(brand)}
    </main>

    ${FooterLinks()}
    ${FloatingPanel()}
  `

  // Render featured grid (if any)
  if (featured.length > 0) {
    const featEl = document.getElementById('brand-featured-grid')
    if (featEl) featEl.innerHTML = ProductListingGrid(featured)
  }

  // Render main product grid
  if (total > 0) {
    const gridEl = document.getElementById('brand-product-grid')
    if (gridEl) gridEl.innerHTML = ProductListingGrid(listings)
  }

  initMobileDrawer()
  initStickyHeaderSearch()
  initMegaMenu()
  initHeaderCart()
  initLanguageSelector()
  mountChatPopup();
  initChatTriggers();
  startAlpine()
}

main().catch(err => {
  console.error('[Brand Page] fatal error:', err)
})
