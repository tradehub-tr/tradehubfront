#!/usr/bin/env node
// Convert physical-direction Tailwind classes to logical (RTL-aware) ones.
// Verified against Tailwind v4 docs:
//   ml/mr -> ms/me, pl/pr -> ps/pe, text-left/right -> text-start/end,
//   border-l/r -> border-s/e, rounded-{l,r,tl,tr,bl,br} -> rounded-{s,e,ss,se,es,ee},
//   left-/right- (positions) -> inset-s-/inset-e-, float-left/right -> float-start/end.
// Boundary-aware: a class is matched only when preceded by a class delimiter
// (space, quote, backtick, ':', '{', '>', '(' or line start) so substrings like
// "context-left" or "rounded-lg" are never touched. Value suffix is validated.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = "/home/aliturgut/Workspace/istoc_main/tradehubfront";
const DIRS = ["src", "pages"];
const EXTS = new Set([".ts", ".html"]);
const APPLY = process.argv.includes("--apply");

const VALUE = String.raw`(?:\[[^\]\s]*\]|\([^)\s]*\)|\d+(?:\.\d+)?(?:/\d+)?|px|full|auto)`;
const BOUND = String.raw`(^|[\s"'\`:{>(])`;

const re = new RegExp(
  BOUND +
    String.raw`(-)?(` +
    String.raw`(?:(ml|mr|pl|pr)-(` + VALUE + String.raw`))` +
    String.raw`|(?:text-(left|right))(?=[\s"'\`:{}>)]|$)` +
    String.raw`|(?:border-(l|r))(?=[-\s"'\`:{}>)]|$)` +
    String.raw`|(?:rounded-(tl|tr|bl|br|l|r))(?=[-\s"'\`:{}>)]|$)` +
    String.raw`|(?:float-(left|right))(?=[\s"'\`:{}>)]|$)` +
    String.raw`|(?:(left|right)-(` + VALUE + String.raw`))(?=[\s"'\`:{}>)]|$)` +
    String.raw`)`,
  "g"
);

const MP = { ml: "ms", mr: "me", pl: "ps", pr: "pe" };
const RC = { tl: "ss", tr: "se", bl: "es", br: "ee", l: "s", r: "e" };
const TA = { left: "start", right: "end" };
// Tailwind v4 logical inset utilities are `start-*` / `end-*`
// (inset-inline-start / inset-inline-end). NOT inset-s-/inset-e- (those don't exist).
const INS = { left: "start", right: "end" };

const counts = {};
let total = 0;
const samples = [];

function convert(text) {
  return text.replace(re, (m, b, neg, _cls, mp, mpv, ta, bd, rc, fl, ins, insv) => {
    neg = neg || "";
    let out;
    if (mp) { out = `${b}${neg}${MP[mp]}-${mpv}`; bump("margin/padding"); }
    else if (ta) { out = `${b}${neg}text-${TA[ta]}`; bump("text-align"); }
    else if (bd) { out = `${b}${neg}border-${bd === "l" ? "s" : "e"}`; bump("border-side"); }
    else if (rc) { out = `${b}${neg}rounded-${RC[rc]}`; bump("rounded"); }
    else if (fl) { out = `${b}${neg}float-${TA[fl]}`; bump("float"); }
    else if (ins) {
      // Skip fractional positions (left-1/2 etc.) — these are centering patterns
      // paired with -translate-x; "center is center" in both directions, and
      // logical conversion would break them in RTL since translate-x doesn't flip.
      if (insv.includes("/")) { bump("skipped-center-fraction"); return m; }
      out = `${b}${neg}${INS[ins]}-${insv}`; bump("position(left/right)");
    }
    else return m;
    if (samples.length < 20) samples.push(`${m.trim()}  ->  ${out.trim()}`);
    return out;
  });
}
function bump(k) { counts[k] = (counts[k] || 0) + 1; total++; }

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (EXTS.has(extname(p))) acc.push(p);
  }
}

const files = [];
for (const d of DIRS) walk(join(ROOT, d), files);

let changedFiles = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const before = total;
  const out = convert(src);
  if (out !== src) {
    changedFiles++;
    if (APPLY) writeFileSync(f, out);
  }
  void before;
}

console.log(APPLY ? "=== APPLIED ===" : "=== DRY RUN (no files written) ===");
console.log("Files scanned:", files.length, "| files changed:", changedFiles);
console.log("Total replacements:", total);
console.log("By category:", JSON.stringify(counts, null, 2));
console.log("\nSample replacements:");
for (const s of samples) console.log("  " + s);
