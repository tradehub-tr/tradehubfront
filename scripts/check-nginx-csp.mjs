#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { validateNginxCspTemplate } from "./lib/nginx-csp-contract.mjs";

const templateUrl = new URL("../nginx.conf.template", import.meta.url);
const template = await readFile(templateUrl, "utf8");
const violations = validateNginxCspTemplate(template);

if (violations.length > 0) {
  console.error("CSP check failed. Contract violations:");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exitCode = 1;
} else {
  console.log("CSP check passed (tracking and anti-framing contract verified).");
}
