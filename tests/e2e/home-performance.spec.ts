import { devices, expect, test, type Page, type Route } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const pixel5Viewport = devices["Pixel 5"];
const pixel5DeviceProfile = {
  userAgent: pixel5Viewport.userAgent,
  viewport: pixel5Viewport.viewport,
  screen: pixel5Viewport.screen,
  deviceScaleFactor: pixel5Viewport.deviceScaleFactor,
  isMobile: pixel5Viewport.isMobile,
  hasTouch: pixel5Viewport.hasTouch,
};

let fixtureServer: Server;
let fixtureBaseUrl = "";

function runMeasurementCli(
  reportDir: string,
  options: {
    baseUrl?: string;
    budgetMode?: "strict";
    ci?: boolean;
    readySelector?: string;
    baselineReport?: string;
    baselineOutput?: string;
    promoteBaseline?: boolean;
  } = {}
): Promise<{ status: number | null; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/measure-home-perf.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PERF_BASE_URL: options.baseUrl ?? fixtureBaseUrl,
        PERF_RUNS: "1",
        PERF_REPORT_DIR: reportDir,
        PERF_SETTLE_MS: "50",
        CI: options.ci ? "1" : "0",
        ...(options.budgetMode ? { PERF_BUDGET_MODE: options.budgetMode } : {}),
        ...(options.readySelector ? { PERF_READY_SELECTOR: options.readySelector } : {}),
        ...(options.baselineReport ? { PERF_BASELINE_REPORT: options.baselineReport } : {}),
        ...(options.baselineOutput ? { PERF_BASELINE_OUTPUT: options.baselineOutput } : {}),
        ...(options.promoteBaseline ? { PERF_PROMOTE_BASELINE: "1" } : {}),
      },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stderr }));
  });
}

const fixtureHtml = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8">
    <script src="/assets/home.js"></script>
  </head>
  <body>
    <header><a href="/">iStoc</a></header>
    <main>
      <h1 data-perf-ready="true">Fixture ana sayfa</h1>
      <img src="/images/hero.png" alt="Fixture hero">
      <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M0 0h16v16H0z"></path></svg>
    </main>
    <aside data-home-overlay data-home-overlay-state="closed" aria-hidden="true">
      <button type="button">Kapat</button>
      <div><span>Kapalı overlay fixture içeriği</span></div>
    </aside>
  </body>
</html>`;

const budgetBreachFixtureHtml = `<!doctype html>
<html lang="tr">
  <head><meta charset="utf-8"></head>
  <body><main data-perf-ready="true">${"<span></span>".repeat(5_300)}</main></body>
</html>`;

const delayedBudgetBreachFixtureHtml = `<!doctype html>
<html lang="tr">
  <head><meta charset="utf-8"></head>
  <body>
    <main><p>Uygulama hazırlanıyor…</p></main>
    <script>
      window.setTimeout(() => {
        document.querySelector("main").innerHTML =
          '<h1 data-perf-ready="true">Hazır</h1>${"<span></span>".repeat(5_300)}';
      }, 150);
    </script>
  </body>
</html>`;

const taskFourApiTargetBreachFixtureHtml = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8">
    <script src="/assets/task-four-api-target-breach.js"></script>
  </head>
  <body><main data-perf-ready="true"><h1>Task 4 API hedefi fixture</h1></main></body>
</html>`;

const TASK_TWO_CATEGORIES = [
  {
    id: "cat-kitchen",
    name: "Mutfak",
    slug: "mutfak",
    icon_class: "",
    children: [
      { id: "cat-pan", name: "Tencere", slug: "tencere", image: "" },
      { id: "cat-glass", name: "Bardak", slug: "bardak", image: "" },
    ],
  },
  {
    id: "cat-textile",
    name: "Tekstil",
    slug: "tekstil",
    icon_class: "",
    children: [{ id: "cat-fabric", name: "Kumaş", slug: "kumas", image: "" }],
  },
  {
    id: "cat-electronics",
    name: "Elektronik",
    slug: "elektronik",
    icon_class: "",
    children: [{ id: "cat-cable", name: "Kablo", slug: "kablo", image: "" }],
  },
];

function taskFourProduct(index: number) {
  return {
    id: `LST-T4-${index}`,
    slug: `task-four-product-${index}`,
    name: `Task 4 Ürünü ${index}`,
    price: "₺100,00",
    sellingPrice: 100,
    baseCurrency: "TRY",
    moq: "1 adet",
    imageSrc: "",
    verified: true,
    supplierYears: 3,
    supplierCountry: "TR",
  };
}

async function mockHomeBackend(page: Page): Promise<void> {
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: [] }),
    })
  );
  await page.route(
    "**/api/method/tradehub_core.api.category.get_category_version*",
    (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "task-2" }),
      })
  );
  await page.route("**/api/method/tradehub_core.api.category.get_mega_menu*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: TASK_TWO_CATEGORIES }),
    })
  );
}

function loadLighthouseConfig(
  collectUrl: string
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["-e", "process.stdout.write(JSON.stringify(require('./lighthouserc.cjs').ci.collect))"],
      {
        cwd: process.cwd(),
        env: { ...process.env, LHCI_COLLECT_URL: collectUrl },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stdout, stderr }));
  });
}

test.beforeAll(async () => {
  fixtureServer = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://fixture.test");

    if (url.pathname === "/assets/home.js") {
      response.writeHead(200, { "content-type": "text/javascript" });
      response.end("fetch('/api/method/home').catch(() => undefined);");
      return;
    }

    if (url.pathname === "/assets/task-four-api-target-breach.js") {
      response.writeHead(200, { "content-type": "text/javascript" });
      response.end(`
        Promise.all(
          Array.from({ length: 13 }, (_, index) =>
            fetch("/api/method/task-four-target?request=" + index)
          )
        );
      `);
      return;
    }

    if (url.pathname === "/api/method/home" || url.pathname === "/api/method/task-four-target") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ message: { featured: [] } }));
      return;
    }

    if (url.pathname === "/images/hero.png") {
      response.writeHead(200, { "content-type": "image/png" });
      response.end(Buffer.from("fixture-image"));
      return;
    }

    if (url.pathname === "/budget-breach") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(budgetBreachFixtureHtml);
      return;
    }

    if (url.pathname === "/delayed-budget-breach") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(delayedBudgetBreachFixtureHtml);
      return;
    }

    if (url.pathname === "/task-four-api-target-breach") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(taskFourApiTargetBreachFixtureHtml);
      return;
    }

    response.writeHead(200, { "content-type": "text/html" });
    response.end(fixtureHtml);
  });

  await new Promise<void>((resolve) => fixtureServer.listen(0, "127.0.0.1", resolve));
  const address = fixtureServer.address();
  if (!address || typeof address === "string") throw new Error("Fixture sunucusu port açamadı");
  fixtureBaseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    fixtureServer.close((error) => (error ? reject(error) : resolve()))
  );
});

test("ölçüm CLI'ı varsayılan data-perf-ready işaretini bekler ve bütçeli rapor yazar", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-"));

  try {
    const result = await runMeasurementCli(reportDir);

    expect(result.status, result.stderr).toBe(0);

    const report = JSON.parse(await readFile(join(reportDir, "home-performance.json"), "utf8"));
    const markdown = await readFile(join(reportDir, "home-performance.md"), "utf8");

    expect(report.runs).toHaveLength(1);
    expect(report.runs[0].readinessSelector).toBe("[data-perf-ready='true']");
    expect(report.runs[0]).toMatchObject({
      domNodes: expect.any(Number),
      svg: 1,
      images: 1,
      api: 1,
      js: 1,
      closedOverlayNodes: expect.any(Number),
      cls: expect.any(Number),
      longTaskCount: expect.any(Number),
      consoleErrors: [],
    });
    expect(report.runs[0].domNodes).toBeLessThanOrEqual(report.budgets.initial.nodes);
    expect(report.budgetChecks.nodes).toMatchObject({
      value: report.runs[0].domNodes,
      limit: report.budgets.initial.nodes,
      passed: true,
    });
    expect(report.runs[0].closedOverlayNodes).toBeLessThanOrEqual(
      report.budgets.closedOverlay.nodes
    );
    expect(markdown).toContain("Ana Sayfa Performans Ölçümü");
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});

test("bütçe aşımı varsayılan modda uyarır, strict modda deterministik olarak başarısız olur", async () => {
  const warnReportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-warn-"));
  const strictReportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-strict-"));
  const breachUrl = `${fixtureBaseUrl}/budget-breach`;

  try {
    const warnResult = await runMeasurementCli(warnReportDir, { baseUrl: breachUrl });
    const strictResult = await runMeasurementCli(strictReportDir, {
      baseUrl: breachUrl,
      budgetMode: "strict",
    });

    expect(warnResult.status, warnResult.stderr).toBe(0);
    expect(strictResult.status).toBe(1);
    expect(warnResult.stderr).toContain("başlangıç bütçesi aşıldı");
    expect(strictResult.stderr).toContain("strict modda başarısız");

    const warnReport = JSON.parse(
      await readFile(join(warnReportDir, "home-performance.json"), "utf8")
    );
    const strictReport = JSON.parse(
      await readFile(join(strictReportDir, "home-performance.json"), "utf8")
    );
    expect(warnReport.budgetChecks.nodes.passed).toBe(false);
    expect(strictReport.budgetChecks.nodes.passed).toBe(false);
  } finally {
    await Promise.all([
      rm(warnReportDir, { recursive: true, force: true }),
      rm(strictReportDir, { recursive: true, force: true }),
    ]);
  }
});

test("strict ana sayfa ölçümü Task 4 API hedefi olan 12 isteği uygular", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-task4-api-strict-"));

  try {
    const result = await runMeasurementCli(reportDir, {
      baseUrl: `${fixtureBaseUrl}/task-four-api-target-breach`,
      budgetMode: "strict",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("api=13 (limit 12)");
    const report = JSON.parse(await readFile(join(reportDir, "home-performance.json"), "utf8"));
    expect(report.budgetChecks.api).toEqual({
      limit: 12,
      value: 13,
      passed: false,
    });
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});

test("CI ana sayfa ölçümü Task 4 API hedefini strict kapı olarak uygular", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-task4-api-ci-"));

  try {
    const result = await runMeasurementCli(reportDir, {
      baseUrl: `${fixtureBaseUrl}/task-four-api-target-breach`,
      ci: true,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("api=13 (limit 12)");
    expect(result.stderr).toContain("strict modda başarısız");
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});

test("varsayılan ready işareti görünene kadar bekler; geç yüklenen bütçe ihlalini strict modda yakalar", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-ready-"));

  try {
    const result = await runMeasurementCli(reportDir, {
      baseUrl: `${fixtureBaseUrl}/delayed-budget-breach`,
      budgetMode: "strict",
    });

    expect(result.status).toBe(1);
    const report = JSON.parse(await readFile(join(reportDir, "home-performance.json"), "utf8"));
    expect(report.runs[0].domNodes).toBeGreaterThan(report.budgets.initial.nodes);
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});

test("uyarı modundaki regresyon kabul edilmiş baseline'ı sessizce değiştirmez", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-baseline-"));
  const baselinePath = join(reportDir, "prior-baseline.json");
  const baselineOutput = join(reportDir, "next-baseline.json");
  const regressionUrl = fixtureBaseUrl;

  await writeFile(
    baselinePath,
    `${JSON.stringify({
      summary: {
        domNodes: 1,
        svg: 1,
        images: 0,
        api: 0,
        js: 0,
        closedOverlayNodes: 0,
        transferBytes: 0,
        cls: 0.01,
        lcpMs: 100,
        longTaskCount: 0,
        longTaskDurationMs: 0,
      },
      baseline: { acceptedRuns: 2 },
    })}\n`
  );

  try {
    const warmup = await runMeasurementCli(reportDir, {
      baseUrl: regressionUrl,
      baselineReport: baselinePath,
      baselineOutput,
    });

    expect(warmup.status).toBe(0);
    expect(warmup.stderr).toContain("baseline regresyonu uyarı modunda");
    await expect(readFile(baselineOutput, "utf8")).rejects.toThrow();

    const mature = await runMeasurementCli(reportDir, {
      baseUrl: regressionUrl,
      budgetMode: "strict",
      baselineReport: baselinePath,
    });

    expect(mature.status).toBe(1);
    expect(mature.stderr).toContain("baseline regresyonu strict modda başarısız");
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});

test("baseline yalnız açıkça istendiğinde ve regresyon yoksa terfi ettirilir", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-promote-"));
  const baselinePath = join(reportDir, "accepted-baseline.json");
  const baselineOutput = join(reportDir, "promoted-baseline.json");

  await writeFile(
    baselinePath,
    `${JSON.stringify({
      summary: {
        domNodes: 10_000,
        svg: 1_000,
        images: 1_000,
        api: 100,
        js: 100,
        closedOverlayNodes: 1_000,
        transferBytes: 10_000_000,
        cls: 1,
        lcpMs: 100_000,
        longTaskCount: 1_000,
        longTaskDurationMs: 100_000,
      },
      baseline: { acceptedRuns: 1 },
    })}\n`
  );

  try {
    const result = await runMeasurementCli(reportDir, {
      baselineReport: baselinePath,
      baselineOutput,
      promoteBaseline: true,
    });

    expect(result.status, result.stderr).toBe(0);
    const promoted = JSON.parse(await readFile(baselineOutput, "utf8"));
    expect(promoted.baseline.acceptedRuns).toBe(2);
    expect(promoted.baseline.promotedAt).toEqual(expect.any(String));
    expect(promoted.regression.promoted).toBe(true);
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});

test("baseline raporu kendi üzerine terfi ettirilemez", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-home-perf-baseline-self-"));
  const baselinePath = join(reportDir, "accepted-baseline.json");
  const originalBaseline = `${JSON.stringify({
    summary: {
      domNodes: 10_000,
      svg: 1_000,
      images: 1_000,
      api: 100,
      js: 100,
      closedOverlayNodes: 1_000,
      transferBytes: 10_000_000,
      cls: 1,
      lcpMs: 100_000,
      longTaskCount: 1_000,
      longTaskDurationMs: 100_000,
    },
    baseline: { acceptedRuns: 1 },
  })}\n`;

  await writeFile(baselinePath, originalBaseline);

  try {
    const result = await runMeasurementCli(reportDir, {
      baselineReport: baselinePath,
      baselineOutput: baselinePath,
      promoteBaseline: true,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("aynı dosya");
    await expect(readFile(baselinePath, "utf8")).resolves.toBe(originalBaseline);
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});

test("Lighthouse CI staging URL'ini static dist yerine kullanır", async () => {
  const collectUrl = "https://preview.example.test";
  const result = await loadLighthouseConfig(collectUrl);

  expect(result.status, result.stderr).toBe(0);
  const collect = JSON.parse(result.stdout) as { staticDistDir?: string; url: string[] };
  expect(collect.staticDistDir).toBeUndefined();
  expect(collect.url).toContain(`${collectUrl}/`);
  expect(collect.url).toContain(`${collectUrl}/pages/products.html`);
});

test.describe("Task 2: kapalı ana sayfa menüleri talep üzerine mount edilir", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    process.env.PERF_FIXTURE_TEST === "1",
    "Ölçüm CLI fixture koşusu Vite uygulamasını başlatmaz"
  );

  test.beforeEach(async ({ page }) => {
    await mockHomeBackend(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#category-browse-list .category-browse-item").first()).toBeVisible();
  });

  test("mega menü yalnız 100 ms masaüstü niyetinden sonra görünümü mount eder", async ({
    page,
  }) => {
    const trigger = page.locator('[data-mega-target="featured"]');
    const panel = page.locator("#istoc-mega-panel");

    await expect(panel.locator("[data-mega-view]")).toHaveCount(0);
    await expect(panel).toHaveAttribute("inert", "");
    // Dispatch both events in the same browser task so this asserts a real
    // cancelled hover intent rather than CDP round-trip timing under load.
    await trigger.evaluate((element) => {
      element.dispatchEvent(new MouseEvent("mouseenter"));
      element.dispatchEvent(new MouseEvent("mouseleave"));
    });
    await page.waitForTimeout(130);
    await expect(panel.locator("[data-mega-view]")).toHaveCount(0);

    await trigger.dispatchEvent("mouseenter");
    await page.waitForTimeout(50);
    await expect(panel.locator("[data-mega-view]")).toHaveCount(0);
    await page.waitForTimeout(70);

    await expect(panel.locator('[data-mega-view="featured"]')).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(panel).not.toHaveAttribute("inert", "");
  });

  test("mega menü mouse click ve touch kaynaklı click ile niyet gecikmesi olmadan açılır", async ({
    page,
  }) => {
    const featured = page.locator('[data-mega-target="featured"]');
    const protections = page.locator('[data-mega-target="protections"]');
    const panel = page.locator("#istoc-mega-panel");

    await featured.click();
    await expect(panel.locator('[data-mega-view="featured"]')).toBeVisible();
    await page.keyboard.press("Escape");

    await protections.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true });
    await protections.dispatchEvent("pointerup", { pointerType: "touch", isPrimary: true });
    await protections.dispatchEvent("click", { detail: 1 });
    await expect(panel.locator('[data-mega-view="protections"]')).toBeVisible();
  });

  test("mega menü klavyede anında açılır, görünümü bellekte tutar ve Escape odağı döndürür", async ({
    page,
  }) => {
    const trigger = page.locator('[data-mega-target="protections"]');
    const panel = page.locator("#istoc-mega-panel");

    await trigger.focus();
    await trigger.press("Enter");
    await expect(panel.locator('[data-mega-view="protections"]')).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toHaveAttribute("role", "dialog");
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.querySelector("#istoc-mega-panel")?.contains(document.activeElement)
        )
      )
      .toBe(true);

    const mountedView = panel.locator('[data-mega-view="protections"]');
    await mountedView.evaluate((element) => element.setAttribute("data-retained", "true"));
    const focusWrap = await page.evaluate(() => {
      const menu = document.getElementById("istoc-mega-panel");
      const items = Array.from(
        menu?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.offsetParent !== null);
      items.at(-1)?.focus();
      return items.length;
    });
    expect(focusWrap).toBeGreaterThan(1);
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.activeElement ===
            document
              .getElementById("istoc-mega-panel")
              ?.querySelector<HTMLElement>(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
              )
        )
      )
      .toBe(true);

    await mountedView.locator("a").first().focus();
    await page.keyboard.press("Escape");

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await expect(panel).toHaveAttribute("inert", "");
    await trigger.press("Enter");
    await expect(
      panel.locator('[data-mega-view="protections"][data-retained="true"]')
    ).toBeVisible();
  });

  test("kategori popup'ı başlangıçta yalnız aktif ve komşu içeriği tutar; seçileni mount eder", async ({
    page,
  }) => {
    const popupSections = page.locator("#cat-popup-content [data-popup-section]");
    const trigger = page.locator(
      '#category-browse-list .category-browse-item[data-category-id="cat-electronics"]'
    );

    await expect(popupSections).toHaveCount(2);
    await expect(page.locator("#cat-popup-panel")).toHaveAttribute("inert", "");
    await expect(page.locator('[data-popup-section="for-you"]')).toHaveCount(1);
    await expect(page.locator('[data-popup-section="cat-kitchen"]')).toHaveCount(1);
    await expect(page.locator('[data-popup-section="cat-electronics"]')).toHaveCount(0);

    await trigger.click();
    await expect(page.locator('[data-popup-section="cat-electronics"]')).toBeVisible();
    await expect(popupSections).toHaveCount(3);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#cat-popup-close")).toBeFocused();
    await expect(page.locator("#cat-popup-panel")).not.toHaveAttribute("inert", "");

    const focusableCount = await page.evaluate(() => {
      const panel = document.getElementById("cat-popup-panel");
      const items = Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.offsetParent !== null);
      items[0]?.focus();
      return items.length;
    });
    expect(focusableCount).toBeGreaterThan(1);
    await page.keyboard.press("Shift+Tab");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const panel = document.getElementById("cat-popup-panel");
          const items = Array.from(
            panel?.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ) ?? []
          ).filter((element) => element.offsetParent !== null);
          return document.activeElement === items.at(-1);
        })
      )
      .toBe(true);

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await expect(page.locator("#cat-popup-panel")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("#cat-popup-panel")).toHaveAttribute("inert", "");
  });
});

test.describe("Task 3: mobil overlay'ler ilk etkileşimde bir kez mount edilir", () => {
  test.describe.configure({ mode: "serial" });
  test.use(pixel5DeviceProfile);
  test.skip(
    process.env.PERF_FIXTURE_TEST === "1",
    "Ölçüm CLI fixture koşusu Vite uygulamasını başlatmaz"
  );

  test.beforeEach(async ({ page }) => {
    await mockHomeBackend(page);
  });

  test("kategori ve hesap dialogları başlangıçta yoktur; Escape, odak ve Tab çevrimi korunur", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const initialDeferredOverlayNodes = await page
      .locator("#cat-fullscreen-overlay, #account-fullscreen-overlay, #mobile-search-overlay")
      .count();

    const categoryTrigger = page.locator("#bottom-nav-categories");
    const accountTrigger = page.locator("#bottom-nav-account");
    await expect(page.locator("#cat-fullscreen-overlay")).toHaveCount(0);
    await expect(page.locator("#account-fullscreen-overlay")).toHaveCount(0);
    await expect(categoryTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(accountTrigger).toHaveAttribute("aria-expanded", "false");

    await categoryTrigger.focus();
    await categoryTrigger.press("Enter");
    const categoryDialog = page.locator("#cat-fullscreen-overlay");
    await expect(categoryDialog).toHaveCount(1);
    await expect(categoryDialog).toHaveAttribute("role", "dialog");
    await expect(categoryDialog).toHaveAttribute("aria-hidden", "false");
    await expect(categoryTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#cat-fullscreen-back")).toBeFocused();
    const categoryMountedNodes = await categoryDialog.evaluate(
      (element) => element.querySelectorAll("*").length + 1
    );

    const categoryFocusable = categoryDialog.locator(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    await categoryFocusable.last().focus();
    await page.keyboard.press("Tab");
    await expect(categoryFocusable.first()).toBeFocused();

    await categoryDialog.evaluate((element) => element.setAttribute("data-retained", "true"));
    await page.keyboard.press("Escape");
    await expect(categoryTrigger).toBeFocused();
    await expect(categoryTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(categoryDialog).toHaveAttribute("aria-hidden", "true");
    await expect(categoryDialog).toHaveAttribute("inert", "");
    await categoryTrigger.press("Enter");
    await expect(page.locator('#cat-fullscreen-overlay[data-retained="true"]')).toHaveCount(1);

    await page.locator("#cat-fullscreen-back").click();
    await accountTrigger.press("Enter");
    const accountDialog = page.locator("#account-fullscreen-overlay");
    await expect(accountDialog).toHaveCount(1);
    await expect(accountDialog).toHaveAttribute("aria-hidden", "false");
    await expect(page.locator("#account-fullscreen-back")).toBeFocused();
    await expect(page.locator("[data-account-picker-content='country']")).toBeEmpty();
    await expect(page.locator("[data-account-picker-content='language']")).toBeEmpty();
    await expect(page.locator("[data-account-picker-content='currency']")).toBeEmpty();
    await page.locator("#account-country-btn").click();
    await expect(page.locator("[data-account-picker-content='country'] button")).toHaveCount(5);
    await page.locator("#account-lang-btn").click();
    await expect(page.locator("[data-account-picker-content='language'] button")).toHaveCount(2);
    await page.locator("#account-currency-btn").click();
    await expect(page.locator("[data-account-picker-content='currency']")).not.toBeEmpty();
    const accountMountedNodes = await accountDialog.evaluate(
      (element) => element.querySelectorAll("*").length + 1
    );
    test.info().annotations.push({
      type: "task3-node-count",
      description: JSON.stringify({
        initialDeferredOverlayNodes,
        categoryMountedNodes,
        accountMountedNodes,
      }),
    });
    expect(initialDeferredOverlayNodes).toBe(0);
    expect(categoryMountedNodes).toBeGreaterThan(0);
    expect(accountMountedNodes).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await expect(accountTrigger).toBeFocused();
    await expect(accountDialog).toHaveAttribute("inert", "");
  });

  test("mobil arama API'si ilk açılışa kadar çağrılmaz; dialog yeniden açılışta korunur", async ({
    page,
  }) => {
    let suggestionRequests = 0;
    await page.route("**/api/method/tradehub_core.api.search.unified_suggest*", (route) => {
      suggestionRequests += 1;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: { products: [], categories: [], brands: [], sellers: [] },
        }),
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#mobile-search-overlay")).toHaveCount(0);
    await expect.poll(() => suggestionRequests).toBe(0);

    const trigger = page.locator("#mobile-search-trigger");
    await trigger.focus();
    await trigger.press("Enter");
    const dialog = page.locator("#mobile-search-overlay");
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toHaveAttribute("aria-hidden", "false");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#mobile-search-input")).toBeFocused();
    await expect.poll(() => suggestionRequests).toBe(1);

    await dialog.evaluate((element) => element.setAttribute("data-retained", "true"));
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(dialog).toHaveAttribute("aria-hidden", "true");
    await trigger.press("Enter");
    await expect(page.locator('#mobile-search-overlay[data-retained="true"]')).toHaveCount(1);
    await expect.poll(() => suggestionRequests).toBe(1);
  });

  test("mobil yüklemeden masaüstüne geçince compact arama ilk odakta idempotent başlar", async ({
    page,
  }) => {
    let suggestionRequests = 0;
    await page.route("**/api/method/tradehub_core.api.search.unified_suggest*", (route) => {
      suggestionRequests += 1;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: { products: [], categories: [], brands: [], sellers: [] },
        }),
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect.poll(() => suggestionRequests).toBe(0);
    await page.waitForTimeout(350);
    await expect.poll(() => suggestionRequests).toBe(0);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator("#topbar-compact-search-input").focus();
    await expect.poll(() => suggestionRequests).toBe(1);
    await page.locator("#topbar-compact-search-input").blur();
    await page.locator("#topbar-compact-search-input").focus();
    await expect.poll(() => suggestionRequests).toBe(1);
  });

  test("Flowbite popover kabukları korunur ve ağır içerik ilk tetikte doldurulur", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const countryContent = page.locator("[data-lazy-popover-content='country']");
    const localeContent = page.locator("[data-lazy-popover-content='locale']");
    await expect(countryContent).toBeEmpty();
    await expect(localeContent).toBeEmpty();
    await page.locator('[data-popover-target="popover-deliver-to"]').hover();
    await expect(countryContent.locator("a")).toHaveCount(1);
    await expect(page.locator("#popover-deliver-to")).toBeVisible();
    await page.locator('[data-popover-target="popover-language-currency"]').hover();
    await expect(localeContent.locator("#lang-select")).toHaveCount(1);
    await expect(localeContent.locator("#currency-select")).toHaveCount(1);
    await expect(page.locator("#popover-language-currency")).toBeVisible();
  });

  test("açık mobil dialoglar masaüstü breakpoint'inde kapanır ve klavyeyi bırakır", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const assertResponsiveClose = async (
      triggerSelector: string,
      overlaySelector: string
    ): Promise<void> => {
      const trigger = page.locator(triggerSelector);
      await trigger.focus();
      await trigger.press("Enter");
      await expect(page.locator(overlaySelector)).toHaveAttribute("aria-hidden", "false");
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");

      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator(overlaySelector)).toHaveAttribute("aria-hidden", "true");
      await expect(page.locator(overlaySelector)).toHaveAttribute("inert", "");
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
      const tabConsumed = await page.evaluate(() => {
        const event = new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
        return event.defaultPrevented;
      });
      expect(tabConsumed).toBe(false);
      await page.setViewportSize(pixel5Viewport.viewport);
    };

    await assertResponsiveClose("#bottom-nav-categories", "#cat-fullscreen-overlay");
    await assertResponsiveClose("#bottom-nav-account", "#account-fullscreen-overlay");
    await assertResponsiveClose("#mobile-search-trigger", "#mobile-search-overlay");
  });
});

test.describe("Task 4: fold-altı ana sayfa bölümleri kademeli yüklenir", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    process.env.PERF_FIXTURE_TEST === "1",
    "Ölçüm CLI fixture koşusu Vite uygulamasını başlatmaz"
  );

  test.beforeEach(async ({ page }) => {
    await mockHomeBackend(page);
    await page.setViewportSize({ width: 1280, height: 200 });
    await page.addInitScript(() => {
      type ObserverRecord = {
        callback: IntersectionObserverCallback;
        observer: IntersectionObserver;
        targets: Set<Element>;
        rootMargin: string;
      };

      const records: ObserverRecord[] = [];
      const OriginalIntersectionObserver = window.IntersectionObserver;

      class ControlledIntersectionObserver implements IntersectionObserver {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string;
        readonly thresholds: readonly number[] = [0];
        private readonly record: ObserverRecord;

        constructor(
          callback: IntersectionObserverCallback,
          options: IntersectionObserverInit = {}
        ) {
          this.rootMargin = options.rootMargin ?? "0px";
          this.record = {
            callback,
            observer: this,
            targets: new Set<Element>(),
            rootMargin: this.rootMargin,
          };
          records.push(this.record);
        }

        observe = (target: Element): void => {
          this.record.targets.add(target);
        };

        unobserve = (target: Element): void => {
          this.record.targets.delete(target);
        };

        disconnect = (): void => {
          this.record.targets.clear();
        };

        takeRecords = (): IntersectionObserverEntry[] => [];
      }

      Object.defineProperty(window, "IntersectionObserver", {
        configurable: true,
        value: ControlledIntersectionObserver,
      });

      Object.assign(window, {
        __task4OriginalIntersectionObserver: OriginalIntersectionObserver,
        __task4ObserverMargins: () => records.map((record) => record.rootMargin),
        __task4TriggerSection: (name: string) => {
          for (const record of records) {
            const target = Array.from(record.targets).find(
              (candidate) =>
                candidate instanceof HTMLElement && candidate.dataset.homeSection === name
            );
            if (!target) continue;
            const rect = target.getBoundingClientRect();
            record.callback(
              [
                {
                  boundingClientRect: rect,
                  intersectionRatio: 1,
                  intersectionRect: rect,
                  isIntersecting: true,
                  rootBounds: null,
                  target,
                  time: performance.now(),
                },
              ],
              record.observer
            );
          }
        },
        __task4TriggerSelector: (selector: string) => {
          for (const record of records) {
            const target = Array.from(record.targets).find((candidate) =>
              candidate.matches(selector)
            );
            if (!target) continue;
            const rect = target.getBoundingClientRect();
            record.callback(
              [
                {
                  boundingClientRect: rect,
                  intersectionRatio: 1,
                  intersectionRect: rect,
                  isIntersecting: true,
                  rootBounds: null,
                  target,
                  time: performance.now(),
                },
              ],
              record.observer
            );
          }
        },
      });
    });
  });

  test("dört bölüm ilk açılışta sabit skeleton tutar ve 600px observer dışında API çağırmaz", async ({
    page,
  }) => {
    let initialApiRequests = 0;
    const initialApiUrls: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname.includes("/api/method/")) {
        initialApiRequests += 1;
        initialApiUrls.push(`${url.pathname}${url.search}`);
      }
    });
    const requests = {
      topDeals: 0,
      topRanking: 0,
      tailored: 0,
      productGrid: 0,
    };

    await page.route("**/api/method/tradehub_core.api.listing.get_listings*", (route) => {
      const url = new URL(route.request().url());
      const pageSize = url.searchParams.get("page_size");
      if (url.searchParams.get("is_deal") === "1" && pageSize === "6") {
        requests.topDeals += 1;
      } else if (url.searchParams.get("is_deal") !== "1" && pageSize === "14") {
        requests.productGrid += 1;
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: {
            data: [],
            total: 0,
            page: 1,
            page_size: 14,
            total_pages: 1,
            has_next: false,
            has_prev: false,
          },
        }),
      });
    });
    await page.route(
      "**/api/method/tradehub_core.api.listing.get_top_ranking_categories*",
      (route) => {
        requests.topRanking += 1;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: { data: [] } }),
        });
      }
    );
    await page.route(
      "**/api/method/tradehub_core.api.tailored.get_tailored_selections*",
      (route) => {
        requests.tailored += 1;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: {
              limit: 9,
              personalized: false,
              isGuest: true,
              groups: [],
              total: 0,
            },
          }),
        });
      }
    );

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#app")).toHaveAttribute("data-perf-ready", "true");
    await expect(page.locator("[data-home-section]")).toHaveCount(4);
    await expect(page.locator("[data-home-section-skeleton]")).toHaveCount(4);
    await expect
      .poll(() =>
        page
          .locator("#top-ranking-cards > [role='listitem']")
          .evaluateAll((items) =>
            items.every((item) => item.getAttribute("aria-hidden") === "true")
          )
      )
      .toBe(true);
    await expect
      .poll(() =>
        page
          .locator("[data-home-section-skeleton]")
          .evaluateAll((elements) =>
            elements.every((element) => element.getBoundingClientRect().height > 0)
          )
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as typeof window & {
              __task4ObserverMargins: () => string[];
            }
          ).__task4ObserverMargins()
        )
      )
      .toContain("600px");
    expect(requests).toEqual({
      topDeals: 0,
      topRanking: 0,
      tailored: 0,
      productGrid: 0,
    });
    const initialDomNodes = await page
      .locator("html")
      .evaluate((root) => root.querySelectorAll("*").length + 1);
    test.info().annotations.push({
      type: "task4-initial-budget",
      description: JSON.stringify({ initialDomNodes, initialApiRequests }),
    });
    expect(
      initialApiRequests,
      `İlk açılış API bütçesi aşıldı:\n${initialApiUrls.join("\n")}`
    ).toBeLessThanOrEqual(12);
    expect(initialDomNodes).toBeLessThanOrEqual(4_000);
    expect(initialApiUrls).not.toContain(
      expect.stringMatching(
        /get_top_ranking_categories|get_tailored_selections|get_listings.*(?:page_size=14|page_size=6)/
      )
    );
    await expect(page.locator("#sticky-header")).toBeVisible();
    await expect(page.locator("main section").first()).toBeVisible();
  });

  test("eşik aşılan bölüm bir kez fetch/init olur; boş yanıt skeleton yerine empty-state gösterir", async ({
    page,
  }) => {
    const requests = new Map<string, number>([
      ["top-deals", 0],
      ["top-ranking", 0],
      ["tailored-selections", 0],
      ["product-grid", 0],
    ]);

    await page.route("**/api/method/tradehub_core.api.listing.get_listings*", (route) => {
      const url = new URL(route.request().url());
      const pageSize = url.searchParams.get("page_size");
      const name =
        url.searchParams.get("is_deal") === "1" && pageSize === "6"
          ? "top-deals"
          : url.searchParams.get("is_deal") !== "1" && pageSize === "14"
            ? "product-grid"
            : null;
      if (name) requests.set(name, (requests.get(name) ?? 0) + 1);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: {
            data: [],
            total: 0,
            page: 1,
            page_size: 14,
            total_pages: 1,
            has_next: false,
            has_prev: false,
          },
        }),
      });
    });
    await page.route(
      "**/api/method/tradehub_core.api.listing.get_top_ranking_categories*",
      (route) => {
        requests.set("top-ranking", (requests.get("top-ranking") ?? 0) + 1);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: { data: [] } }),
        });
      }
    );
    await page.route(
      "**/api/method/tradehub_core.api.tailored.get_tailored_selections*",
      (route) => {
        requests.set("tailored-selections", (requests.get("tailored-selections") ?? 0) + 1);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: {
              limit: 9,
              personalized: false,
              isGuest: true,
              groups: [],
              total: 0,
            },
          }),
        });
      }
    );

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#app")).toHaveAttribute("data-perf-ready", "true");
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as typeof window & {
              __task4ObserverMargins: () => string[];
            }
          ).__task4ObserverMargins()
        )
      )
      .toContain("600px");

    for (const name of ["tailored-selections", "product-grid", "top-deals", "top-ranking"]) {
      await page.evaluate((sectionName) => {
        (
          window as typeof window & {
            __task4TriggerSection: (name: string) => void;
          }
        ).__task4TriggerSection(sectionName);
      }, name);
      await expect(page.locator(`[data-home-section="${name}"]`)).toHaveAttribute(
        "data-home-section-state",
        "mounted"
      );
      await expect.poll(() => requests.get(name) ?? 0).toBe(1);
      await expect(
        page.locator(`[data-home-section="${name}"] [data-home-section-empty]`)
      ).toBeVisible();
      await expect(
        page.locator(`[data-home-section="${name}"] [data-home-section-skeleton]`)
      ).toHaveCount(0);
    }

    for (const name of requests.keys()) {
      await page.evaluate((sectionName) => {
        (
          window as typeof window & {
            __task4TriggerSection: (name: string) => void;
          }
        ).__task4TriggerSection(sectionName);
      }, name);
    }
    await page.waitForTimeout(100);
    expect(Object.fromEntries(requests)).toEqual({
      "top-deals": 1,
      "top-ranking": 1,
      "tailored-selections": 1,
      "product-grid": 1,
    });
  });

  test("skeleton gerçek içeriğe geçerken bölüm yüksekliğini ve CLS bütçesini korur", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            cls += (entry as PerformanceEntry & { value?: number }).value ?? 0;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
      Object.assign(window, { __task4Cls: () => cls });
    });
    await page.route("**/api/method/tradehub_core.api.listing.get_listings*", (route) => {
      const url = new URL(route.request().url());
      const count = url.searchParams.get("page_size") === "6" ? 6 : 14;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: {
            data: Array.from({ length: count }, (_, index) => taskFourProduct(index + 1)),
            total: count,
            page: 1,
            page_size: count,
            total_pages: 1,
            has_next: false,
            has_prev: false,
          },
        }),
      });
    });
    await page.route(
      "**/api/method/tradehub_core.api.listing.get_top_ranking_categories*",
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: {
              data: Array.from({ length: 6 }, (_, index) => ({
                id: `CAT-T4-${index + 1}`,
                name: `Task 4 Kategorisi ${index + 1}`,
                slug: `task-four-category-${index + 1}`,
                image: "",
                icon: "",
                totalOrders: 10,
                totalListings: 20,
              })),
            },
          }),
        })
    );
    await page.route("**/api/method/tradehub_core.api.tailored.get_tailored_selections*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: {
            limit: 9,
            personalized: false,
            isGuest: true,
            total: 3,
            groups: Array.from({ length: 3 }, (_, index) => ({
              slug: `task-four-tailored-${index + 1}`,
              categoryId: `CAT-T4-${index + 1}`,
              name: `Task 4 Seçkisi ${index + 1}`,
              image: "",
              parent: null,
              viewsCount: 10,
              editorialText: "Ölçüm seçkisi",
              badge: "trend",
              products: [taskFourProduct(index * 2 + 1), taskFourProduct(index * 2 + 2)],
            })),
          },
        }),
      })
    );

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#app")).toHaveAttribute("data-perf-ready", "true");

    let visibleShiftProbeDelta = 0;
    let clsBudgetBaseline = 0;
    const transitions: Record<
      string,
      {
        beforeHeight: number;
        afterHeight: number;
        heightDelta: number;
        visiblePixelsBeforeMount: number;
        clsDelta: number;
      }
    > = {};
    for (const name of ["tailored-selections", "product-grid", "top-deals", "top-ranking"]) {
      const section = page.locator(`[data-home-section="${name}"]`);
      await section.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const desiredTop = Math.min(120, window.innerHeight * 0.15);
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top - desiredTop),
          behavior: "instant",
        });
      });
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      );
      const before = await section.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          height: rect.height,
          visiblePixels: Math.max(
            0,
            Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
          ),
        };
      });
      expect(
        before.visiblePixels,
        `${name} içeriği mount edilmeden önce gerçek viewport içinde olmalı`
      ).toBeGreaterThan(0);
      let clsBefore = await page.evaluate(() =>
        (
          window as typeof window & {
            __task4Cls: () => number;
          }
        ).__task4Cls()
      );
      if (name === "tailored-selections") {
        await section.evaluate((element) => {
          const probe = document.createElement("div");
          probe.dataset.task4VisibleShiftProbe = "true";
          probe.setAttribute("aria-hidden", "true");
          probe.style.height = "48px";
          element.prepend(probe);
        });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
            )
        );
        await section.locator("[data-task4-visible-shift-probe]").evaluate((probe) => {
          (probe as HTMLElement).style.height = "1px";
        });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
            )
        );
        await section.locator("[data-task4-visible-shift-probe]").evaluate((probe) => {
          probe.remove();
        });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
            )
        );
        const clsAfterProbe = await page.evaluate(() =>
          (
            window as typeof window & {
              __task4Cls: () => number;
            }
          ).__task4Cls()
        );
        visibleShiftProbeDelta = clsAfterProbe - clsBefore;
        clsBefore = clsAfterProbe;
        clsBudgetBaseline = clsAfterProbe;
      }
      await page.evaluate((sectionName) => {
        (
          window as typeof window & {
            __task4TriggerSection: (name: string) => void;
          }
        ).__task4TriggerSection(sectionName);
      }, name);
      await expect(section).toHaveAttribute("data-home-section-state", "mounted");
      await expect(section.locator("a[href]").first()).toBeAttached();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );
      const afterHeight = await section.evaluate(
        (element) => element.getBoundingClientRect().height
      );
      const clsAfter = await page.evaluate(() =>
        (
          window as typeof window & {
            __task4Cls: () => number;
          }
        ).__task4Cls()
      );
      transitions[name] = {
        beforeHeight: before.height,
        afterHeight,
        heightDelta: Math.abs(afterHeight - before.height),
        visiblePixelsBeforeMount: before.visiblePixels,
        clsDelta: clsAfter - clsBefore,
      };
    }

    expect(transitions).toEqual({
      "tailored-selections": expect.objectContaining({
        heightDelta: expect.any(Number),
        clsDelta: expect.any(Number),
      }),
      "product-grid": expect.objectContaining({
        heightDelta: expect.any(Number),
        clsDelta: expect.any(Number),
      }),
      "top-deals": expect.objectContaining({
        heightDelta: expect.any(Number),
        clsDelta: expect.any(Number),
      }),
      "top-ranking": expect.objectContaining({
        heightDelta: expect.any(Number),
        clsDelta: expect.any(Number),
      }),
    });
    expect(
      Math.max(...Object.values(transitions).map((transition) => transition.heightDelta)),
      `Görünür skeleton → içerik yükseklik farkları: ${JSON.stringify(transitions)}`
    ).toBeLessThanOrEqual(8);
    expect(
      Math.max(...Object.values(transitions).map((transition) => transition.clsDelta)),
      `Görünür skeleton → içerik CLS farkları: ${JSON.stringify(transitions)}`
    ).toBeLessThanOrEqual(0.01);
    expect(
      visibleShiftProbeDelta,
      "Görünür bölümdeki ölçüm düzeneği gerçek bir layout shift'i algılamalı"
    ).toBeGreaterThan(0);
    const cls = await page.evaluate(() =>
      (
        window as typeof window & {
          __task4Cls: () => number;
        }
      ).__task4Cls()
    );
    const taskFourTransitionCls = cls - clsBudgetBaseline;
    expect(taskFourTransitionCls).toBeLessThanOrEqual(0.01);
    test.info().annotations.push({
      type: "task4-skeleton-content-budget",
      description: JSON.stringify({
        transitions,
        visibleShiftProbeDelta,
        taskFourTransitionCls,
        rawCls: cls,
      }),
    });
  });

  test("ürün vitrini 8 kompakt karttan 14 karta sabit yükseklikte progressive geçer", async ({
    page,
  }) => {
    await page.route("**/api/method/tradehub_core.api.listing.get_listings*", (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("page_size") !== "14") return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: {
            data: Array.from({ length: 14 }, (_, index) => ({
              ...taskFourProduct(index + 1),
              imageSrc: `/images/task-five-${index + 1}.png`,
            })),
            total: 14,
            page: 1,
            page_size: 14,
            total_pages: 1,
            has_next: false,
            has_prev: false,
          },
        }),
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#app")).toHaveAttribute("data-perf-ready", "true");
    await page.evaluate(() => {
      (
        window as typeof window & {
          __task4TriggerSection: (name: string) => void;
        }
      ).__task4TriggerSection("product-grid");
    });

    const section = page.locator('[data-home-section="product-grid"]');
    const grid = page.locator("#home-product-grid");
    await expect(section).toHaveAttribute("data-home-section-state", "mounted");
    await expect(grid.locator("[data-home-card]")).toHaveCount(8);
    await expect(grid.locator("[data-home-card-placeholder]")).toHaveCount(6);
    await expect(grid.locator('[data-card-variant="home-compact"]')).toHaveCount(8);
    await expect(grid.locator(".action-area-layout")).toHaveCount(0);
    await expect(grid.locator("[data-sp-slot]")).toHaveCount(0);

    const initialDomNodes = await grid.evaluate((element) => element.querySelectorAll("*").length);
    const initialImages = await grid.locator("img").count();
    const beforeHeight = await section.evaluate((element) => element.getBoundingClientRect().height);
    await page.evaluate(() => {
      (
        window as typeof window & {
          __task4TriggerSelector: (selector: string) => void;
        }
      ).__task4TriggerSelector("[data-home-card-placeholder]");
    });
    await expect(grid.locator("[data-home-card]")).toHaveCount(14);
    await expect(grid.locator("[data-home-card-placeholder]")).toHaveCount(0);
    await expect(grid.locator("[data-fav-btn]")).toHaveCount(14);
    await expect(grid.locator(".fy26-price")).toHaveCount(14);
    const completeDomNodes = await grid.evaluate((element) => element.querySelectorAll("*").length);
    const completeImages = await grid.locator("img").count();
    const afterHeight = await section.evaluate((element) => element.getBoundingClientRect().height);
    expect(Math.abs(afterHeight - beforeHeight)).toBeLessThanOrEqual(8);
    expect(initialDomNodes).toBeLessThanOrEqual(Math.floor(completeDomNodes * 0.65));
    expect(initialImages).toBeLessThanOrEqual(Math.floor(completeImages * 0.6));
    test.info().annotations.push({
      type: "task5-progressive-budget",
      description: JSON.stringify({
        initialDomNodes,
        completeDomNodes,
        initialImages,
        completeImages,
        domReductionPercent: Number(
          (((completeDomNodes - initialDomNodes) / completeDomNodes) * 100).toFixed(1)
        ),
        imageReductionPercent: Number(
          (((completeImages - initialImages) / completeImages) * 100).toFixed(1)
        ),
      }),
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(grid.locator("[data-home-card]")).toHaveCount(14);
    await expect(grid.locator("[data-fav-btn]").first()).toBeVisible();
    await expect(grid.locator(".fy26-price").first()).toBeVisible();
  });
});

test.describe("Task 4: deferred vitrinler indekslenebilir fallback korur", () => {
  test.skip(
    process.env.PERF_FIXTURE_TEST === "1",
    "Ölçüm CLI fixture koşusu Vite uygulamasını başlatmaz"
  );

  test("normal JS istemcisinde canonical korunur ve noscript navigasyonu kopya DOM üretmez", async ({
    page,
  }) => {
    await mockHomeBackend(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://istoc.com/"
    );
    await expect(page.locator("[data-home-seo-fallback]")).toHaveCount(0);
  });

  test("Googlebot JS kapalıyken ürün ve kategori keşif linklerini canonical ile alır", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    });
    const page = await context.newPage();

    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://istoc.com/"
      );
      const fallback = page.locator("[data-home-seo-fallback]");
      await expect(fallback).toBeVisible();
      await expect(fallback.locator('a[href="/urunler"]')).toHaveCount(1);
      await expect(fallback.locator('a[href="/kategoriler"]')).toHaveCount(1);
      await expect(fallback.locator('a[href="/firsatlar"]')).toHaveCount(1);
      await expect(fallback.locator('a[href="/cok-satanlar"]')).toHaveCount(1);
      await expect(fallback.locator('a[href="/size-ozel"]')).toHaveCount(1);
    } finally {
      await context.close();
    }
  });
});
