/**
 * Toast Notification Utility
 * iSTOC design system uyumlu bildirim toast'ları
 */

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  /** optional link: { text, href } shown after the message */
  link?: { text: string; href: string };
}

const TOAST_CONTAINER_ID = "toast-container";

const ICONS: Record<ToastType, string> = {
  success: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
  error: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
  warning: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>`,
  info: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
};

/** Accent bar + icon renkleri */
const COLORS: Record<ToastType, { bar: string; icon: string; iconBg: string }> = {
  success: { bar: "#16a34a", icon: "#16a34a", iconBg: "rgba(22,163,74,0.1)" },
  error: { bar: "#dc2626", icon: "#dc2626", iconBg: "rgba(220,38,38,0.1)" },
  warning: { bar: "#cc9900", icon: "#cc9900", iconBg: "rgba(204,153,0,0.1)" },
  info: { bar: "#2563eb", icon: "#2563eb", iconBg: "rgba(37,99,235,0.1)" },
};

function getOrCreateContainer(): HTMLElement {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    container.className =
      "fixed top-4 right-4 z-(--z-toast) flex flex-col gap-2.5 pointer-events-none";
    container.style.maxWidth = "360px";
    container.style.width = "100%";
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(options: ToastOptions): void {
  const { message, type = "info", duration = 3500, link } = options;
  const colors = COLORS[type];
  const container = getOrCreateContainer();

  const toast = document.createElement("div");
  toast.className = "pointer-events-auto";
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
    border-left: 3px solid ${colors.bar};
    transform: translateX(110%);
    opacity: 0;
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
    position: relative;
    overflow: hidden;
  `;

  const linkHtml = link
    ? `<a href="${link.href}" style="display:inline-block;margin-top:4px;font-size:12px;font-weight:600;color:${colors.bar};text-decoration:none;">${link.text} &rarr;</a>`
    : "";

  toast.innerHTML = `
    <div style="flex-shrink:0;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${colors.iconBg};color:${colors.icon};margin-top:1px">
      ${ICONS[type]}
    </div>
    <div style="flex:1;min-width:0">
      <p style="margin:0;font-size:13px;font-weight:500;color:#1f2937;line-height:1.4">${message}</p>
      ${linkHtml}
    </div>
    <button type="button" style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:2px;color:#9ca3af;transition:color 0.15s" aria-label="Kapat">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <div style="position:absolute;bottom:0;left:0;height:2px;background:${colors.bar};opacity:0.3;width:100%;transform-origin:left;animation:toast-progress ${duration}ms linear forwards"></div>
  `;

  // Progress bar animasyonu için style ekle (bir kez)
  if (!document.getElementById("toast-progress-style")) {
    const style = document.createElement("style");
    style.id = "toast-progress-style";
    style.textContent = `@keyframes toast-progress{from{transform:scaleX(1)}to{transform:scaleX(0)}}`;
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  // Close button
  const closeBtn = toast.querySelector("button");
  closeBtn?.addEventListener("click", () => dismissToast(toast));
  closeBtn?.addEventListener("mouseenter", () => {
    closeBtn.style.color = "#374151";
  });
  closeBtn?.addEventListener("mouseleave", () => {
    closeBtn.style.color = "#9ca3af";
  });

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  });

  // Auto dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
}

function dismissToast(toast: HTMLElement): void {
  toast.style.transform = "translateX(110%)";
  toast.style.opacity = "0";
  setTimeout(() => toast.remove(), 300);
}

/* ── Toast Queue ─────────────────────────────────── */
const MAX_VISIBLE = 3;
const QUEUE_DELAY = 800; // ms between queued toasts
const toastQueue: ToastOptions[] = [];
let activeCount = 0;
let isProcessing = false;

/**
 * Kuyruğa toast ekler. Aynı anda max 3 toast görünür,
 * fazlası 800ms arayla sıraya alınır.
 */
export function queueToast(options: ToastOptions): void {
  toastQueue.push(options);
  if (!isProcessing) processQueue();
}

function processQueue(): void {
  if (toastQueue.length === 0) {
    isProcessing = false;
    return;
  }
  isProcessing = true;

  if (activeCount >= MAX_VISIBLE) {
    // Slot açılana kadar bekle
    setTimeout(processQueue, QUEUE_DELAY);
    return;
  }

  const next = toastQueue.shift()!;
  const originalDuration = next.duration ?? 3500;

  activeCount++;
  showToast({
    ...next,
    duration: originalDuration,
  });

  // Toast kapandığında activeCount düşür
  setTimeout(() => {
    activeCount = Math.max(0, activeCount - 1);
  }, originalDuration);

  // Sonraki toast'ı QUEUE_DELAY sonra işle
  setTimeout(processQueue, QUEUE_DELAY);
}
