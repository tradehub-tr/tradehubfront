/**
 * ProductDescription Component — yalnız zengin HTML açıklama.
 *
 * Teknik özellikler ve paketleme burada BASILMAZ: tüm paneller alt alta
 * durduğundan (anchor-nav) aynı veri Özellikler panelinde zaten var;
 * burada tekrar basmak sayfada mükerrer bölüm üretiyordu.
 */

import { getCurrentProduct } from "../../alpine/product";
import { sanitizeRichHtml } from "../../utils/sanitize";

export function ProductDescription(): string {
  const mockProduct = getCurrentProduct();
  return `
    <div class="py-6">
      <!-- Rich Description Content — eski "prose" sınıfları ölüydü (typography
           plugin'i yok); tipografi admin editörüyle (RichTextEditor.vue) aynı. -->
      <div class="max-w-none text-[14px] leading-[1.7] text-[var(--pd-title-color,#111827)] [&_p]:mb-[8px] [&_h2]:mt-[16px] [&_h2]:mb-[8px] [&_h2]:text-[18px] [&_h2]:font-bold [&_h3]:mt-[12px] [&_h3]:mb-[6px] [&_h3]:text-[15px] [&_h3]:font-semibold [&_ul]:mb-[8px] [&_ul]:list-disc [&_ul]:ps-[20px] [&_ol]:mb-[8px] [&_ol]:list-decimal [&_ol]:ps-[20px] [&_li]:mb-[2px] [&_a]:text-[#2563eb] [&_a]:underline [&_img]:my-[12px] [&_img]:max-w-full [&_img]:rounded-md">
        ${sanitizeRichHtml(mockProduct.description)}
      </div>
    </div>
  `;
}
