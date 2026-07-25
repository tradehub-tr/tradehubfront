import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(
  projectRoot,
  "src/components/icons/lucideIconNames.json"
);
const outputPath = resolve(projectRoot, "public/icons/ui.svg");
const iconDirectory = resolve(projectRoot, "node_modules/lucide-static/icons");
const checkOnly = process.argv.includes("--check");

const iconNames = JSON.parse(await readFile(manifestPath, "utf8"));
if (!Array.isArray(iconNames) || iconNames.some((name) => typeof name !== "string")) {
  throw new TypeError("lucideIconNames.json must contain an array of icon names");
}

const uniqueNames = [...new Set(iconNames)];
if (uniqueNames.length !== iconNames.length) {
  throw new Error("lucideIconNames.json contains duplicate icon names");
}

function readAttribute(attributes, name) {
  return attributes.match(new RegExp(`\\b${name}="([^"]+)"`, "i"))?.[1] ?? null;
}

async function createSymbol(name) {
  const raw = await readFile(resolve(iconDirectory, `${name}.svg`), "utf8");
  const svgMatch = raw.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  if (!svgMatch) throw new Error(`Invalid Lucide SVG: ${name}`);
  if (/<(?:defs|linearGradient|radialGradient|mask|pattern|image|text)\b/i.test(svgMatch[2])) {
    throw new Error(`Complex SVG is not allowed in the monochrome UI sprite: ${name}`);
  }

  const attributes = svgMatch[1];
  const symbolAttributes = [
    `id="icon-${name}"`,
    `viewBox="${readAttribute(attributes, "viewBox") ?? "0 0 24 24"}"`,
    `fill="${readAttribute(attributes, "fill") ?? "none"}"`,
    `stroke="${readAttribute(attributes, "stroke") ?? "currentColor"}"`,
    `stroke-width="${readAttribute(attributes, "stroke-width") ?? "2"}"`,
    `stroke-linecap="${readAttribute(attributes, "stroke-linecap") ?? "round"}"`,
    `stroke-linejoin="${readAttribute(attributes, "stroke-linejoin") ?? "round"}"`,
  ];
  const body = svgMatch[2]
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim()
    .split("\n")
    .map((line) => `    ${line.trim()}`)
    .join("\n");

  return `  <symbol ${symbolAttributes.join(" ")}>\n${body}\n  </symbol>`;
}

const symbols = [];
for (const name of iconNames) symbols.push(await createSymbol(name));

const sprite = [
  '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
  ...symbols,
  "</svg>",
  "",
].join("\n");

if (checkOnly) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== sprite) {
    throw new Error("public/icons/ui.svg is out of date; run npm run icons:generate");
  }
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, sprite, "utf8");
}
