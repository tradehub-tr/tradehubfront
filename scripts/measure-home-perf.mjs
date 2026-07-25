import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const DEFAULT_BASE_URL = "http://traderup.localhost";
const DEFAULT_RUNS = 3;
const DEFAULT_SETTLE_MS = 1500;
const DEFAULT_READY_TIMEOUT_MS = 8000;
const MAX_READY_TIMEOUT_MS = 30_000;
const DEFAULT_READY_SELECTOR = "[data-perf-ready='true']";
const DEFAULT_REGRESSION_MAX_PERCENT = 10;
const DEFAULT_REGRESSION_MATURITY_RUNS = 2;
const REPORT_JSON = "home-performance.json";
const REPORT_MARKDOWN = "home-performance.md";
const ROUTE_REPORT_JSON = "route-performance.json";
const ROUTE_REPORT_MARKDOWN = "route-performance.md";
const REGRESSION_METRICS = [
  "domNodes",
  "mainDomNodes",
  "hiddenDomNodes",
  "svg",
  "images",
  "imageBytes",
  "api",
  "apiPayloadBytes",
  "duplicateApiEndpointCount",
  "duplicateIdCount",
  "js",
  "jsBytes",
  "css",
  "cssBytes",
  "closedOverlayNodes",
  "transferBytes",
  "cls",
  "lcpMs",
  "longTaskCount",
  "longTaskDurationMs",
];

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function boundedPositiveInteger(value, fallback, maximum) {
  return Math.min(positiveInteger(value, fallback), maximum);
}

function nonNegativeInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function readBudgetMode(value) {
  const mode = (value ?? "warn").trim().toLowerCase();
  if (mode === "warn" || mode === "strict") return mode;
  throw new Error("PERF_BUDGET_MODE yalnızca 'warn' veya 'strict' olabilir.");
}

function readViewport(value) {
  const raw = value?.trim() || "1280x800";
  const match = raw.match(/^(\d{2,5})x(\d{2,5})$/);
  if (!match) {
    throw new Error("PERF_VIEWPORT '<genişlik>x<yükseklik>' biçiminde olmalı.");
  }

  return {
    width: positiveInteger(match[1], 1280),
    height: positiveInteger(match[2], 800),
  };
}

function readRouteVariant(value) {
  const variant = value?.trim() || "pretty";
  if (variant === "pretty" || variant === "legacy") return variant;
  throw new Error("PERF_ROUTE_VARIANT yalnızca 'pretty' veya 'legacy' olabilir.");
}

function median(values) {
  const sorted = values.filter((value) => value !== null).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

function collectBudgetChecks(metrics, initialBudgets) {
  const metricKeys = {
    nodes: "domNodes",
    duplicateIds: "duplicateIdCount",
    consoleErrors: "consoleErrorCount",
  };
  return Object.fromEntries(
    Object.entries(initialBudgets).map(([metric, limit]) => {
      const metricKey = metricKeys[metric] ?? metric;
      const value = metrics[metricKey];
      return [metric, { limit, value, passed: value <= limit }];
    })
  );
}

function budgetFailures(budgetChecks) {
  return Object.entries(budgetChecks).filter(([, check]) => !check.passed);
}

function isCiMode() {
  return process.env.CI === "true" || process.env.CI === "1";
}

function effectiveInitialBudgets(budgets, routeMode, strictBudgetEnforcement) {
  if (routeMode || !strictBudgetEnforcement || typeof budgets.target?.api !== "number") {
    return budgets.initial;
  }

  return {
    ...budgets.initial,
    api: budgets.target.api,
  };
}

function shouldPromoteBaseline(value) {
  return value === "1" || value === "true";
}

function collectRegressionChecks(summary, baselineSummary, maxPercent) {
  if (!baselineSummary) return {};

  return Object.fromEntries(
    REGRESSION_METRICS.flatMap((metric) => {
      const baseline = baselineSummary[metric];
      const value = summary[metric];
      if (
        typeof baseline !== "number" ||
        typeof value !== "number" ||
        !Number.isFinite(baseline) ||
        !Number.isFinite(value) ||
        baseline <= 0
      ) {
        return [];
      }

      const regressionPercent = ((value - baseline) / baseline) * 100;
      return [
        [
          metric,
          {
            baseline,
            value,
            regressionPercent,
            maxPercent,
            passed: regressionPercent <= maxPercent,
          },
        ],
      ];
    })
  );
}

function regressionFailures(regressionChecks) {
  return Object.entries(regressionChecks).filter(([, check]) => !check.passed);
}

async function loadBaselineReport(path) {
  if (!path) return null;

  let parsed;
  try {
    parsed = JSON.parse(await readFile(resolve(path), "utf8"));
  } catch (error) {
    throw new Error(`Baseline raporu okunamadı: ${path}`, { cause: error });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !parsed.summary ||
    typeof parsed.summary !== "object"
  ) {
    throw new Error(`Baseline raporu geçerli bir summary içermiyor: ${path}`);
  }

  return { path: resolve(path), report: parsed };
}

function markdownReport(report) {
  const rows = report.runs
    .map(
      (run, index) =>
        `| ${index + 1} | ${run.domNodes} | ${run.svg} | ${run.images} | ${run.api} | ${run.js} | ${formatNumber(run.cls)} | ${formatNumber(run.lcpMs)} | ${run.longTaskCount} | ${formatNumber(run.transferBytes)} | ${run.consoleErrors.length} |`
    )
    .join("\n");
  const checks = Object.entries(report.budgetChecks)
    .map(
      ([metric, check]) =>
        `| ${metric} | ${check.value} | ${check.limit} | ${check.passed ? "geçti" : "aştı"} |`
    )
    .join("\n");
  const regressionChecks = Object.entries(report.regression.checks)
    .map(
      ([metric, check]) =>
        `| ${metric} | ${formatNumber(check.baseline)} | ${formatNumber(check.value)} | ${formatNumber(check.regressionPercent)}% | ${check.maxPercent}% | ${check.passed ? "geçti" : "aştı"} |`
    )
    .join("\n");

  const title = report.route ? "Rota Performans Ölçümü" : "Ana Sayfa Performans Ölçümü";
  const routeDetails = report.route
    ? `- Rota ID: ${report.route.id}
- Varyant: ${report.route.variant}
- Path: ${report.route.path}
- Viewport: ${report.viewport.width}×${report.viewport.height}
- Auth fixture: ${report.authFixture.loaded ? report.authFixture.source : "yok"}
`
    : "";

  return `# ${title}

- Hedef: ${report.targetUrl ?? report.baseUrl}
${routeDetails}- Rota DOM: ${formatNumber(report.summary.mainDomNodes)}
- Gizli DOM: ${formatNumber(report.summary.hiddenDomNodes)}
- Görsel byte: ${formatNumber(report.summary.imageBytes)}
- API payload byte: ${formatNumber(report.summary.apiPayloadBytes)}
- Tekrarlı API endpoint: ${formatNumber(report.summary.duplicateApiEndpointCount)}
- Tekrarlı DOM ID: ${formatNumber(report.summary.duplicateIdCount)}
- JS/CSS byte: ${formatNumber(report.summary.jsBytes)} / ${formatNumber(report.summary.cssBytes)}
- Koşu: ${report.runs.length}
- Oluşturulma: ${report.generatedAt}
- Not: LCP, CLS ve long task değerleri laboratuvar trendidir; E2E geçme/kalma kuralı değildir.

## Koşular

| Koşu | DOM | SVG | Görsel | API | JS | CLS | LCP (ms) | Long task | Transfer (B) | Konsol hatası |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Ortanca değerler

| DOM | SVG | Görsel | API | JS | Kapalı overlay DOM | CLS | LCP (ms) | Long task süresi (ms) | Transfer (B) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ${formatNumber(report.summary.domNodes)} | ${formatNumber(report.summary.svg)} | ${formatNumber(report.summary.images)} | ${formatNumber(report.summary.api)} | ${formatNumber(report.summary.js)} | ${formatNumber(report.summary.closedOverlayNodes)} | ${formatNumber(report.summary.cls)} | ${formatNumber(report.summary.lcpMs)} | ${formatNumber(report.summary.longTaskDurationMs)} | ${formatNumber(report.summary.transferBytes)} |

## Başlangıç bütçesi

| Ölçüt | Ölçülen ortanca | Limit | Durum |
| --- | ---: | ---: | --- |
${checks}

## Baseline regresyonu

- Baseline: ${report.regression.source ?? "henüz yok"}
- Kabul edilmiş ölçüm: ${report.regression.acceptedRuns}
- Olgunluk eşiği: ${report.regression.maturityRuns}
- Uygulama modu: ${report.regression.enforcement}

| Ölçüt | Baseline | Güncel | Regresyon | Limit | Durum |
| --- | ---: | ---: | ---: | ---: | --- |
${regressionChecks || "| Karşılaştırılabilir ölçüt yok | — | — | — | — | — |"}
`;
}

async function waitForReadySelector(page, selector, timeoutMs) {
  const readinessSelector = selector?.trim() || DEFAULT_READY_SELECTOR;

  try {
    await page.waitForSelector(readinessSelector, { state: "attached", timeout: timeoutMs });
  } catch (error) {
    throw new Error(`Rota ${timeoutMs} ms içinde hazır olmadı: ${readinessSelector}`, {
      cause: error,
    });
  }

  return readinessSelector;
}

async function measureRun(
  browser,
  targetUrl,
  settleMs,
  readySelector,
  readyTimeoutMs,
  closedOverlaySelectors,
  viewport,
  authFixture
) {
  const context = await browser.newContext({
    viewport,
    ...(authFixture ? { storageState: authFixture } : {}),
  });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.addInitScript(() => {
    const perf = { lcpMs: null, cls: 0, longTaskCount: 0, longTaskDurationMs: 0 };
    Object.defineProperty(window, "__istocHomePerf", { value: perf, configurable: false });

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) perf.lcpMs = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) perf.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          perf.longTaskCount += 1;
          perf.longTaskDurationMs += entry.duration;
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Bazı tarayıcılar belirli PerformanceObserver entry türlerini desteklemeyebilir.
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    const readinessSelector = await waitForReadySelector(page, readySelector, readyTimeoutMs);
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(settleMs);

    const metrics = await page.evaluate((selectors) => {
      const resources = performance.getEntriesByType("resource");
      const overlayNodes = new Set();
      const bodyElements = [...document.body.querySelectorAll("*")];

      if (selectors.length) {
        document.querySelectorAll(selectors.join(",")).forEach((overlay) => {
          overlayNodes.add(overlay);
          overlay.querySelectorAll("*").forEach((node) => overlayNodes.add(node));
        });
      }

      const jsResources = resources.filter((entry) => {
        const url = new URL(entry.name);
        return entry.initiatorType === "script" || /\.(?:m?js)(?:$|\?)/.test(url.pathname);
      });
      const cssResources = resources.filter((entry) => {
        const url = new URL(entry.name);
        return entry.initiatorType === "css" || /\.css(?:$|\?)/.test(url.pathname);
      });
      const imageResources = resources.filter((entry) => {
        const url = new URL(entry.name);
        return (
          entry.initiatorType === "img" ||
          /\.(?:avif|gif|jpe?g|png|svg|webp)(?:$|\?)/.test(url.pathname)
        );
      });
      const apiResources = resources.filter((entry) =>
        new URL(entry.name).pathname.includes("/api/")
      );
      const apiEndpointCounts = apiResources.reduce((counts, entry) => {
        const url = new URL(entry.name);
        const key = `${url.pathname}${url.search}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map());
      const duplicateApiEndpoints = [...apiEndpointCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([endpoint, count]) => ({ endpoint, count }));
      const duplicateIdCounts = [...document.querySelectorAll("[id]")].reduce((counts, element) => {
        counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
        return counts;
      }, new Map());
      const duplicateIds = [...duplicateIdCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([id, count]) => ({ id, count }));
      const resourceBytes = (entries) =>
        entries.reduce((sum, entry) => sum + (entry.encodedBodySize || entry.transferSize || 0), 0);
      const main = document.querySelector("main");
      const hiddenDomNodes = bodyElements.filter((element) => {
        const style = getComputedStyle(element);
        return (
          element.hidden ||
          element.getAttribute("aria-hidden") === "true" ||
          style.display === "none" ||
          style.visibility === "hidden"
        );
      }).length;

      return {
        domNodes: document.querySelectorAll("*").length,
        mainDomNodes: main ? 1 + main.querySelectorAll("*").length : 0,
        hiddenDomNodes,
        svg: document.querySelectorAll("svg").length,
        images: document.images.length,
        imageBytes: resourceBytes(imageResources),
        api: apiResources.length,
        apiPayloadBytes: resourceBytes(apiResources),
        duplicateApiEndpoints,
        duplicateApiEndpointCount: duplicateApiEndpoints.reduce(
          (sum, item) => sum + item.count - 1,
          0
        ),
        duplicateIds,
        duplicateIdCount: duplicateIds.reduce((sum, item) => sum + item.count - 1, 0),
        js: jsResources.length,
        jsBytes: resourceBytes(jsResources),
        css: cssResources.length,
        cssBytes: resourceBytes(cssResources),
        closedOverlayNodes: overlayNodes.size,
        transferBytes: resources.reduce((sum, entry) => sum + entry.transferSize, 0),
        lcpMs: window.__istocHomePerf?.lcpMs ?? null,
        cls: window.__istocHomePerf?.cls ?? 0,
        longTaskCount: window.__istocHomePerf?.longTaskCount ?? 0,
        longTaskDurationMs: window.__istocHomePerf?.longTaskDurationMs ?? 0,
      };
    }, closedOverlaySelectors);
    return { ...metrics, readinessSelector, consoleErrors: [...new Set(consoleErrors)] };
  } finally {
    await context.close();
  }
}

async function main() {
  const baseUrl = process.env.PERF_BASE_URL ?? DEFAULT_BASE_URL;
  const routeMode = Object.hasOwn(process.env, "PERF_ROUTE");
  const routePath = process.env.PERF_ROUTE?.trim() || "/";
  const routeId = process.env.PERF_ROUTE_ID?.trim() || "home";
  const routeVariant = readRouteVariant(process.env.PERF_ROUTE_VARIANT);
  const targetUrl = routeMode ? new URL(routePath, baseUrl).toString() : baseUrl;
  const viewport = readViewport(process.env.PERF_VIEWPORT);
  const authFixture = process.env.PERF_AUTH_FIXTURE ? resolve(process.env.PERF_AUTH_FIXTURE) : null;
  if (authFixture) {
    try {
      JSON.parse(await readFile(authFixture, "utf8"));
    } catch (error) {
      throw new Error(`Auth fixture okunamadı: ${authFixture}`, { cause: error });
    }
  }
  const runsCount = positiveInteger(process.env.PERF_RUNS, DEFAULT_RUNS);
  const settleMs = positiveInteger(process.env.PERF_SETTLE_MS, DEFAULT_SETTLE_MS);
  const readySelector = process.env.PERF_READY_SELECTOR;
  const readyTimeoutMs = boundedPositiveInteger(
    process.env.PERF_READY_TIMEOUT_MS,
    DEFAULT_READY_TIMEOUT_MS,
    MAX_READY_TIMEOUT_MS
  );
  const budgetMode = readBudgetMode(process.env.PERF_BUDGET_MODE);
  const strictBudgetEnforcement = budgetMode === "strict" || isCiMode();
  const reportDir = resolve(process.env.PERF_REPORT_DIR ?? "perf-reports/home");
  const budgetsPath = new URL("../perf-budgets.json", import.meta.url);
  const budgetsFile = JSON.parse(await readFile(budgetsPath, "utf8"));
  const budgets = routeMode
    ? (budgetsFile.routes?.[routeId] ?? budgetsFile.routes?.default)
    : budgetsFile.homepage;
  if (!budgets) {
    throw new Error(`Performans bütçesi bulunamadı: ${routeId}`);
  }
  const initialBudgets = effectiveInitialBudgets(budgets, routeMode, strictBudgetEnforcement);
  const baselineReportPath = process.env.PERF_BASELINE_REPORT;
  const baselinePromotionRequested = routeMode
    ? process.argv.includes("--accept-baseline")
    : shouldPromoteBaseline(process.env.PERF_PROMOTE_BASELINE);
  const baselineOutput = process.env.PERF_BASELINE_OUTPUT
    ? resolve(process.env.PERF_BASELINE_OUTPUT)
    : null;
  if (baselinePromotionRequested && !baselineOutput) {
    throw new Error("Baseline terfisi için PERF_BASELINE_OUTPUT zorunludur.");
  }
  if (routeMode && baselinePromotionRequested && budgetMode !== "strict") {
    throw new Error("--accept-baseline yalnız PERF_BUDGET_MODE=strict ile kullanılabilir.");
  }
  if (
    baselinePromotionRequested &&
    baselineReportPath &&
    baselineOutput &&
    resolve(baselineReportPath) === baselineOutput
  ) {
    throw new Error("Baseline terfisi reddedildi: giriş ve çıkış aynı dosya olamaz.");
  }
  const baseline = await loadBaselineReport(baselineReportPath);
  const maxRegressionPercent = Number.parseFloat(
    process.env.PERF_REGRESSION_MAX_PERCENT ??
      budgets.regression?.maxPercent ??
      DEFAULT_REGRESSION_MAX_PERCENT
  );
  if (!Number.isFinite(maxRegressionPercent) || maxRegressionPercent < 0) {
    throw new Error("PERF_REGRESSION_MAX_PERCENT sıfır veya pozitif bir sayı olmalı.");
  }
  const maturityRuns = positiveInteger(
    process.env.PERF_REGRESSION_MATURITY_RUNS,
    budgets.regression?.matureAfterAcceptedRuns ?? DEFAULT_REGRESSION_MATURITY_RUNS
  );
  const acceptedRuns = nonNegativeInteger(
    process.env.PERF_BASELINE_ACCEPTED_RUNS,
    baseline?.report.baseline?.acceptedRuns ?? 0
  );
  const regressionEnforcement =
    strictBudgetEnforcement && acceptedRuns >= maturityRuns ? "strict" : "warn";
  const browser = await chromium.launch({ headless: true });

  try {
    const runs = [];
    for (let index = 0; index < runsCount; index += 1) {
      runs.push(
        await measureRun(
          browser,
          targetUrl,
          settleMs,
          readySelector,
          readyTimeoutMs,
          budgets.closedOverlay?.selectors ?? [],
          viewport,
          authFixture
        )
      );
    }

    const summary = Object.fromEntries(
      [
        "domNodes",
        "mainDomNodes",
        "hiddenDomNodes",
        "svg",
        "images",
        "imageBytes",
        "api",
        "apiPayloadBytes",
        "duplicateApiEndpointCount",
        "duplicateIdCount",
        "js",
        "jsBytes",
        "css",
        "cssBytes",
        "closedOverlayNodes",
        "transferBytes",
        "cls",
        "lcpMs",
        "longTaskCount",
        "longTaskDurationMs",
      ].map((metric) => [metric, median(runs.map((run) => run[metric]))])
    );
    summary.consoleErrorCount = runs.reduce((sum, run) => sum + run.consoleErrors.length, 0);
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      targetUrl,
      ...(routeMode
        ? {
            route: {
              id: routeId,
              variant: routeVariant,
              path: routePath,
              url: targetUrl,
            },
            viewport,
            authFixture: {
              loaded: Boolean(authFixture),
              source: authFixture,
            },
          }
        : {}),
      runs,
      budgets,
      summary,
      budgetChecks: collectBudgetChecks(summary, initialBudgets),
      regression: {
        source: baseline?.path ?? null,
        acceptedRuns,
        maturityRuns,
        enforcement: regressionEnforcement,
        checks: collectRegressionChecks(summary, baseline?.report.summary, maxRegressionPercent),
        promotionRequested: baselinePromotionRequested,
        promoted: false,
      },
      averages: {
        cls: average(runs.map((run) => run.cls)),
        lcpMs: average(runs.map((run) => run.lcpMs).filter((value) => value !== null)),
        longTaskDurationMs: average(runs.map((run) => run.longTaskDurationMs)),
      },
    };
    const failures = budgetFailures(report.budgetChecks);
    const regressions = regressionFailures(report.regression.checks);
    if (failures.length) {
      const details = failures
        .map(([metric, check]) => `${metric}=${check.value} (limit ${check.limit})`)
        .join(", ");
      const message = `${routeMode ? "Rota" : "Ana sayfa"} başlangıç bütçesi aşıldı: ${details}`;

      if (strictBudgetEnforcement) {
        console.error(`${message}; strict modda başarısız.`);
        process.exitCode = 1;
      } else {
        console.warn(`${message}; rapor yazıldı, warn modunda devam ediliyor.`);
      }
    }

    if (regressions.length) {
      const details = regressions
        .map(
          ([metric, check]) =>
            `${metric}=%${formatNumber(check.regressionPercent)} (limit %${check.maxPercent})`
        )
        .join(", ");
      const message = `${routeMode ? "Rota" : "Ana sayfa"} baseline regresyonu: ${details}`;

      if (report.regression.enforcement === "strict") {
        console.error(`${message}; baseline regresyonu strict modda başarısız.`);
        process.exitCode = 1;
      } else {
        console.warn(`${message}; baseline regresyonu uyarı modunda devam ediliyor.`);
      }
    }

    const canPromoteBaseline = failures.length === 0 && regressions.length === 0;
    if (baselinePromotionRequested && !canPromoteBaseline) {
      console.error(
        "Baseline terfisi reddedildi: bütçe aşımı veya kabul edilmiş baseline regresyonu var."
      );
      process.exitCode = 1;
    }

    if (baselinePromotionRequested && canPromoteBaseline && baselineOutput) {
      report.regression.promoted = true;
      await mkdir(resolve(baselineOutput, ".."), { recursive: true });
      await writeFile(
        baselineOutput,
        `${JSON.stringify(
          {
            ...report,
            baseline: {
              acceptedRuns: acceptedRuns + 1,
              promotedAt: new Date().toISOString(),
            },
          },
          null,
          2
        )}\n`
      );
    }

    await mkdir(reportDir, { recursive: true });
    const reportJson = routeMode ? ROUTE_REPORT_JSON : REPORT_JSON;
    const reportMarkdown = routeMode ? ROUTE_REPORT_MARKDOWN : REPORT_MARKDOWN;
    await writeFile(resolve(reportDir, reportJson), `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(resolve(reportDir, reportMarkdown), markdownReport(report));
    process.stdout.write(
      `${routeMode ? "Rota" : "Ana sayfa"} performans raporu: ${resolve(reportDir, reportMarkdown)}\n`
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
