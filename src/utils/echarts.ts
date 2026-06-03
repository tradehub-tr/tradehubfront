/**
 * ECharts — tree-shaken kurulum.
 * Sadece kullanılan grafik/komponent/renderer kaydedilir; final bundle'a
 * gereksiz modüller girmez. Dashboard analitiği bunu dynamic import eder.
 */
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

export { echarts };
