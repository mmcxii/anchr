import { createConfig } from "@november-sierra/eslint-config";
import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
  ...createConfig({ tsconfigRootDir: import.meta.dirname }),

  // Anchr-specific: enforce license boundaries
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
    rules: {
      "november-sierra/no-cross-license-import": "error",
    },
  },

  // Anchr-specific: enforce i18n and prevent direct DB in components
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "november-sierra/no-raw-string-jsx": "error",
    },
  },

  {
    files: ["src/components/**/*.tsx", "src/hooks/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "november-sierra/no-direct-db-in-components": "error",
    },
  },

  // Anchr-specific: Playwright heading assertions
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "november-sierra/playwright-exact-heading": "error",
    },
  },
]);

export default eslintConfig;
