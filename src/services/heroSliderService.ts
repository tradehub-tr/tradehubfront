/**
 * Hero Slider Service
 * - localStorage cache ile FOUC'suz başlangıç
 * - Stale-while-revalidate: cache döner, arka planda yeni veri çekilir
 * Backend: tradehub_core.api.hero_slider.get_active_slides (guest)
 */

const CACHE_KEY = "tradehub-hero-slides-v1";

export interface HeroSlideItem {
  name: string;
  label_tr: string;
  label_en: string;
  title_tr: string;
  title_en: string;
  description_tr: string;
  description_en: string;
  button_text_tr: string;
  button_text_en: string;
  button_href: string;
  background_type: string;
  background_css: string;
  text_color: string;
  content_align: "center" | "left" | "right";
  overlay: number;
  sort_order: number;
}

interface CacheShape {
  ts: number;
  slides: HeroSlideItem[];
}

export function getCachedSlides(): HeroSlideItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CacheShape;
    return Array.isArray(parsed?.slides) ? parsed.slides : [];
  } catch {
    return [];
  }
}

export async function fetchActiveSlides(): Promise<HeroSlideItem[]> {
  try {
    const res = await fetch("/api/method/tradehub_core.api.hero_slider.get_active_slides", {
      credentials: "include",
    });
    if (!res.ok) return getCachedSlides();
    const json = (await res.json()) as { message?: { slides?: HeroSlideItem[] } };
    const slides = json?.message?.slides ?? [];
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), slides }));
    return slides;
  } catch (err) {
    console.warn("[HeroSlider] fetch failed", err);
    return getCachedSlides();
  }
}
