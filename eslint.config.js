import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["dist", "node_modules", "public", "pages", "**/*.html"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        Alpine: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // ── E2E araçları: Node ortamı ────────────────────────────────────────
  // Playwright spec'leri ve yanlarındaki araçlar Node'da koşuyor; `process`
  // ve `console` orada yasal. Bu blok olmadan her `process.env` okuması
  // `no-undef` hatası veriyordu (kontrast tarama aracında 8 tane).
  {
    files: ["tests/e2e/**/*.{ts,mjs,js}", "*.config.{js,ts,mjs}", "scripts/**"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      // Bir CLI aracının çıktısı console'dur; uyarı gürültü olur.
      "no-console": "off",
    },
  },

  // ── Tarayıcı içinde çalıştırılan ölçüm ───────────────────────────────
  // `page.evaluate()` ile sayfaya geçirilen fonksiyon; Node'da değil
  // TARAYICIDA koşuyor, bu yüzden DOM globalleri yasal.
  {
    files: ["tests/e2e/kontrast-olcum.mjs"],
    languageOptions: {
      globals: {
        document: "readonly",
        getComputedStyle: "readonly",
        innerHeight: "readonly",
        innerWidth: "readonly",
      },
    },
  },
];
