import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";

export default defineConfig([
  ...nextVitals,
  prettier,
  {
    files: ["server/**/*.js", "packages/**/*.js", "*.config.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
      },
    },
  },
  {
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["error", { allow: ["error", "info", "warn"] }],
    },
  },
  globalIgnores([
    "node_modules/**",
    "client/.next/**",
    "client/out/**",
    "docs/**",
    "project-plan.md",
    "next-env.d.ts",
  ]),
]);
