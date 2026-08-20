import { expect, test } from "@playwright/test";
import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fg from "fast-glob";
import { STOREFRONT_ROUTE_MATRIX, STOREFRONT_VIEWPORTS } from "./fixtures/route-matrix";

let fixtureServer: Server;
let fixtureBaseUrl = "";

function runMeasurementCli(
  reportDir: string,
  options: {
    route: string;
    routeId: string;
    routeVariant: "pretty" | "legacy";
    viewport: string;
    authFixture?: string;
    args?: string[];
    budgetMode?: "strict";
    baselineOutput?: string;
  }
): Promise<{ status: number | null; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["scripts/measure-home-perf.mjs", ...(options.args ?? [])],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PERF_BASE_URL: fixtureBaseUrl,
          PERF_ROUTE: options.route,
          PERF_ROUTE_ID: options.routeId,
          PERF_ROUTE_VARIANT: options.routeVariant,
          PERF_VIEWPORT: options.viewport,
          PERF_RUNS: "1",
          PERF_REPORT_DIR: reportDir,
          PERF_READY_SELECTOR: "[data-perf-ready='true']",
          PERF_SETTLE_MS: "50",
          ...(options.authFixture ? { PERF_AUTH_FIXTURE: options.authFixture } : {}),
          ...(options.budgetMode ? { PERF_BUDGET_MODE: options.budgetMode } : {}),
          ...(options.baselineOutput ? { PERF_BASELINE_OUTPUT: options.baselineOutput } : {}),
        },
        stdio: ["ignore", "ignore", "pipe"],
      }
    );
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stderr }));
  });
}

test.beforeAll(async () => {
  fixtureServer = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://fixture.test");

    if (url.pathname === "/assets/route.js") {
      response.writeHead(200, { "content-type": "text/javascript" });
      response.end(`
        document.body.dataset.fixtureRole = localStorage.getItem("fixture-role") || "none";
        fetch("/api/method/fixture.items?limit=20");
        fetch("/api/method/fixture.items?limit=20");
      `);
      return;
    }

    if (url.pathname === "/assets/route.css") {
      response.writeHead(200, { "content-type": "text/css" });
      response.end("main { display: block; }");
      return;
    }

    if (url.pathname === "/images/card.png") {
      response.writeHead(200, { "content-type": "image/png", "content-length": "13" });
      response.end(Buffer.from("fixture-image"));
      return;
    }

    if (url.pathname === "/api/method/fixture.items") {
      const body = JSON.stringify({ message: [{ name: "ITEM-1" }] });
      response.writeHead(200, {
        "content-type": "application/json",
        "content-length": String(Buffer.byteLength(body)),
      });
      response.end(body);
      return;
    }

    const duplicateHeaderId = url.pathname === "/pretty-fixture" ? ' id="duplicate"' : "";
    const mainHeadingId =
      url.pathname === "/pretty-fixture" ? ' id="duplicate"' : ' id="fixture-heading"';
    response.writeHead(200, { "content-type": "text/html" });
    response.end(`<!doctype html>
      <html lang="tr">
        <head>
          <link rel="stylesheet" href="/assets/route.css">
          <script type="module" src="/assets/route.js"></script>
        </head>
        <body>
          <header><span${duplicateHeaderId}>Başlık</span></header>
          <main data-perf-ready="true">
            <h1${mainHeadingId}>Rota fixture</h1>
            <img src="/images/card.png" alt="Ürün">
            <svg aria-hidden="true"><path d="M0 0h1v1H0z"></path></svg>
            <section hidden><p>Gizli içerik</p></section>
          </main>
        </body>
      </html>`);
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

test("üretim storefront matrisi 72 HTML girişini eksiksiz ve benzersiz kapsar", async () => {
  const productionEntries = await fg(["*.html", "pages/**/*.html"], {
    ignore: ["style-test.html"],
  });
  const matrixEntries = STOREFRONT_ROUTE_MATRIX.map((route) => route.entry);

  expect(matrixEntries).toHaveLength(72);
  expect(new Set(matrixEntries).size).toBe(72);
  expect([...matrixEntries].sort()).toEqual([...productionEntries].sort());
  expect(STOREFRONT_VIEWPORTS).toEqual({
    desktop: { width: 1440, height: 1000 },
    mobile: { width: 390, height: 844 },
  });
});

test("dinamik pretty rotalar örnek veri uydurmak yerine açık fixture ortam değişkeni ister", () => {
  const unresolvedPrettyVariants = STOREFRONT_ROUTE_MATRIX.flatMap((route) =>
    route.variants
      .filter((variant) => variant.kind === "pretty" && !variant.path)
      .map((variant) => ({ routeId: route.id, pathEnv: variant.pathEnv }))
  );

  expect(unresolvedPrettyVariants).toEqual([
    { routeId: "brand-detail", pathEnv: "PERF_BRAND_PRETTY_PATH" },
    { routeId: "categories", pathEnv: "PERF_CATEGORY_PRETTY_PATH" },
    { routeId: "product-detail", pathEnv: "PERF_PRODUCT_PRETTY_PATH" },
    { routeId: "seller-shop", pathEnv: "PERF_SELLER_SHOP_PRETTY_PATH" },
    { routeId: "seller-storefront", pathEnv: "PERF_SELLER_PRETTY_PATH" },
  ]);
});

test("route-parametreli CLI viewport, auth ve genişletilmiş DOM/ağ metriklerini raporlar", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-route-perf-"));
  const authFixture = join(reportDir, "buyer-storage-state.json");

  await writeFile(
    authFixture,
    `${JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: fixtureBaseUrl,
          localStorage: [{ name: "fixture-role", value: "buyer" }],
        },
      ],
    })}\n`
  );

  try {
    const result = await runMeasurementCli(reportDir, {
      route: "/pretty-fixture?view=grid",
      routeId: "fixture-products",
      routeVariant: "pretty",
      viewport: "390x844",
      authFixture,
    });

    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(await readFile(join(reportDir, "route-performance.json"), "utf8"));

    expect(report.route).toEqual({
      id: "fixture-products",
      variant: "pretty",
      path: "/pretty-fixture?view=grid",
      url: `${fixtureBaseUrl}/pretty-fixture?view=grid`,
    });
    expect(report.viewport).toEqual({ width: 390, height: 844 });
    expect(report.authFixture).toMatchObject({ loaded: true, source: authFixture });
    expect(report.runs[0]).toMatchObject({
      mainDomNodes: expect.any(Number),
      hiddenDomNodes: expect.any(Number),
      svg: 1,
      imageBytes: expect.any(Number),
      api: 2,
      apiPayloadBytes: expect.any(Number),
      duplicateApiEndpointCount: 1,
      duplicateIds: [{ id: "duplicate", count: 2 }],
      jsBytes: expect.any(Number),
      cssBytes: expect.any(Number),
      consoleErrors: [],
    });
    expect(report.runs[0].mainDomNodes).toBeGreaterThan(0);
    expect(report.runs[0].hiddenDomNodes).toBeGreaterThan(0);
    expect(report.runs[0].imageBytes).toBeGreaterThan(0);
    expect(report.runs[0].apiPayloadBytes).toBeGreaterThan(0);
    expect(report.runs[0].jsBytes).toBeGreaterThan(0);
    expect(report.runs[0].cssBytes).toBeGreaterThan(0);
    expect(report.budgetChecks.api).toEqual({
      limit: 30,
      value: 2,
      passed: true,
    });
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});

test("baseline yalnız --accept-baseline ile ve strict bütçeler geçince yazılır", async () => {
  const reportDir = await mkdtemp(join(tmpdir(), "istoc-route-baseline-"));
  const baselineOutput = join(reportDir, "accepted.json");

  try {
    const withoutFlag = await runMeasurementCli(reportDir, {
      route: "/legacy-fixture",
      routeId: "fixture-products",
      routeVariant: "legacy",
      viewport: "1440x1000",
      budgetMode: "strict",
      baselineOutput,
    });
    expect(withoutFlag.status, withoutFlag.stderr).toBe(0);
    await expect(readFile(baselineOutput, "utf8")).rejects.toThrow();

    const accepted = await runMeasurementCli(reportDir, {
      route: "/legacy-fixture",
      routeId: "fixture-products",
      routeVariant: "legacy",
      viewport: "1440x1000",
      budgetMode: "strict",
      baselineOutput,
      args: ["--accept-baseline"],
    });

    expect(accepted.status, accepted.stderr).toBe(0);
    const baseline = JSON.parse(await readFile(baselineOutput, "utf8"));
    expect(baseline.route).toMatchObject({
      id: "fixture-products",
      variant: "legacy",
      path: "/legacy-fixture",
    });
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
});
