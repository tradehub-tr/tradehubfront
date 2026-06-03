/**
 * AnalyticsOverview — Buyer dashboard analitik bölümü.
 * 4 KPI kartı + Harcama Trendi (bar+line combo) + Kategori Dağılımı (donut).
 * Veri `fetchBuyerAnalytics()` ile backend'den gelir; render edilirken iskelet
 * gösterilir, init() fetch sonrası doldurur. Grafikler ECharts (dynamic import),
 * ResizeObserver ile responsive. Renkler proje token'larından.
 */

import { getLucideIcon } from "../icons/lucideIcons";
import { type KpiCard, type CategorySlice } from "../../data/buyerAnalytics";
import {
  fetchBuyerAnalytics,
  getZeroAnalytics,
  type BuyerAnalytics,
} from "../../services/buyerAnalyticsService";

const TONE: Record<KpiCard["tone"], string> = {
  primary: "bg-primary-50 text-primary-600",
  info: "bg-info-50 text-info-700",
  accent: "bg-accent-50 text-accent-700",
  success: "bg-success-50 text-success-700",
};

/** DB string'ini innerHTML'e basmadan önce escape et (XSS — rules/typescript.md). */
const esc = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );

/** Grafik verisi boşken halka/eksen yerine gösterilen nazik placeholder. */
const chartEmptyState = (message: string): string =>
  `<div class="h-full flex items-center justify-center text-center text-sm text-gray-400">${message}</div>`;

function kpiCard(c: KpiCard): string {
  const trendColor = c.trend === "down" ? "text-error-700" : "text-success-700";
  const trendIcon = c.trend
    ? getLucideIcon(c.trend === "down" ? "trending-down" : "trending-up", "w-3.5 h-3.5")
    : "";
  const sub = c.trend
    ? `<span class="${trendColor} inline-flex items-center gap-1 font-semibold">${trendIcon}${c.trendText ?? ""}</span><span class="text-gray-400">${c.hint}</span>`
    : `<span class="text-gray-500">${c.hint}</span>`;

  return `
    <div class="relative bg-(--color-surface,#ffffff) rounded-lg border border-gray-100 p-4 max-sm:p-3 overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_12px_0_rgba(0,0,0,0.12)]">
      <p class="text-[12.5px] text-gray-500">${c.label}</p>
      <p class="text-[26px] max-sm:text-xl font-extrabold text-gray-900 mt-2 tracking-tight leading-none">${c.value}</p>
      <p class="text-xs mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">${sub}</p>
      <span class="absolute top-3.5 right-3.5 w-9 h-9 max-sm:w-8 max-sm:h-8 rounded-[10px] flex items-center justify-center ${TONE[c.tone]}">${getLucideIcon(c.icon, "w-[18px] h-[18px]")}</span>
    </div>`;
}

/** Yükleme sırasında gösterilen iskelet KPI kartı. */
function kpiSkeleton(): string {
  return `
    <div class="bg-(--color-surface,#ffffff) rounded-lg border border-gray-100 p-4 max-sm:p-3 animate-pulse">
      <div class="h-3 w-20 bg-gray-100 rounded"></div>
      <div class="h-6 w-28 bg-gray-100 rounded mt-3"></div>
      <div class="h-3 w-24 bg-gray-100 rounded mt-3"></div>
    </div>`;
}

function categoryLegend(slices: CategorySlice[]): string {
  return slices
    .map(
      (c) => `
      <li class="flex items-center justify-between text-sm">
        <span class="flex items-center gap-2 text-gray-600"><span class="w-2 h-2 rounded-full shrink-0" style="background:${c.color}"></span>${esc(c.name)}</span>
        <span class="font-semibold text-gray-900">%${c.value}</span>
      </li>`
    )
    .join("");
}

export function AnalyticsOverview(): string {
  const cardBase =
    "bg-(--color-surface,#ffffff) rounded-lg border border-gray-100 overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_12px_0_rgba(0,0,0,0.12)]";

  return `
    <!-- KPI kartları (init fetch sonrası doldurulur, başta iskelet) -->
    <div id="bd-kpi-grid" class="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(0.5rem,0.4rem+0.4vw,0.875rem)]">
      ${kpiSkeleton().repeat(4)}
    </div>

    <!-- Grafikler -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-[clamp(0.5rem,0.4rem+0.4vw,0.875rem)]">
      <!-- Harcama Trendi -->
      <div class="${cardBase} lg:col-span-2">
        <div class="flex items-center justify-between px-5 py-4 max-sm:px-4 border-b border-gray-100">
          <h3 class="text-[15px] font-bold text-gray-900">Harcama Trendi</h3>
          <div class="flex items-center gap-3 text-xs">
            <span class="inline-flex items-center gap-1.5 text-gray-500"><span class="w-2 h-2 rounded-full bg-primary-500"></span>Harcama</span>
            <span class="inline-flex items-center gap-1.5 text-gray-500"><span class="w-2 h-2 rounded-full bg-gray-400"></span>Sipariş adedi</span>
          </div>
        </div>
        <div class="p-5 max-sm:p-3">
          <div id="bd-spend-chart" class="w-full h-[280px] max-sm:h-[230px]"></div>
        </div>
      </div>

      <!-- Kategori Dağılımı -->
      <div class="${cardBase}">
        <div class="flex items-center justify-between px-5 py-4 max-sm:px-4 border-b border-gray-100">
          <h3 class="text-[15px] font-bold text-gray-900">Kategori Dağılımı</h3>
        </div>
        <div class="p-5 max-sm:p-4">
          <div id="bd-cat-chart" class="w-full h-[200px]"></div>
          <ul id="bd-cat-legend" class="mt-4 flex flex-col gap-2"></ul>
        </div>
      </div>
    </div>`;
}

/**
 * Veriyi fetch eder, KPI/legend'i doldurur, grafikleri çizer.
 * Hata → sıfır değerli analytics. ECharts dynamic import (vendor-echarts chunk),
 * ResizeObserver ile responsive.
 */
export async function initAnalyticsOverview(): Promise<void> {
  const gridEl = document.getElementById("bd-kpi-grid");
  const spendEl = document.getElementById("bd-spend-chart");
  const catEl = document.getElementById("bd-cat-chart");
  const legendEl = document.getElementById("bd-cat-legend");
  if (!gridEl && !spendEl && !catEl) return;

  let data: BuyerAnalytics;
  try {
    data = await fetchBuyerAnalytics();
  } catch {
    data = getZeroAnalytics();
  }

  if (gridEl) gridEl.innerHTML = data.kpis.map(kpiCard).join("");
  if (legendEl) legendEl.innerHTML = categoryLegend(data.categoryBreakdown);

  const { echarts } = await import("../../utils/echarts");

  const observe = (el: HTMLElement, chart: { resize: () => void }): void => {
    new ResizeObserver(() => chart.resize()).observe(el);
  };

  if (spendEl && !data.spendingTrend.labels.length) {
    spendEl.innerHTML = chartEmptyState("Henüz harcama verisi yok");
  } else if (spendEl) {
    const chart = echarts.init(spendEl);
    chart.setOption({
      grid: { left: 8, right: 8, top: 16, bottom: 4, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "category",
        data: data.spendingTrend.labels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e5e5e5" } },
        axisLabel: { color: "#737373", fontSize: 12 },
      },
      yAxis: [
        {
          type: "value",
          splitLine: { lineStyle: { color: "#f0f0f0" } },
          axisLabel: {
            color: "#a3a3a3",
            fontSize: 11,
            formatter: (v: number) => "₺" + v / 1000 + "k",
          },
        },
        {
          type: "value",
          min: 0,
          splitLine: { show: false },
          axisLabel: { color: "#a3a3a3", fontSize: 11 },
        },
      ],
      series: [
        {
          name: "Harcama",
          type: "bar",
          data: data.spendingTrend.spend,
          barWidth: "46%",
          itemStyle: {
            color: "rgba(245,184,0,0.18)",
            borderColor: "#f5b800",
            borderWidth: 1.5,
            borderRadius: [6, 6, 0, 0],
          },
        },
        {
          name: "Sipariş adedi",
          type: "line",
          yAxisIndex: 1,
          data: data.spendingTrend.orders,
          smooth: true,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { color: "#a3a3a3", width: 2 },
          itemStyle: { color: "#a3a3a3" },
        },
      ],
    });
    observe(spendEl, chart);
  }

  if (catEl && !data.categoryBreakdown.length) {
    catEl.innerHTML = chartEmptyState("Henüz kategori verisi yok");
  } else if (catEl) {
    const chart = echarts.init(catEl);
    chart.setOption({
      tooltip: {
        trigger: "item",
        formatter: (p: { name: string; value: number }) => `${esc(p.name)}: %${p.value}`,
      },
      series: [
        {
          type: "pie",
          radius: ["62%", "88%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: { borderColor: "#ffffff", borderWidth: 2 },
          data: data.categoryBreakdown.map((c) => ({
            value: c.value,
            name: c.name,
            itemStyle: { color: c.color },
          })),
        },
      ],
    });
    observe(catEl, chart);
  }
}
