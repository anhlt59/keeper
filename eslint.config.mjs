import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Global ignores
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    "prisma/**",
    "scripts/**",
  ]),

  // TypeScript & React rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // -- TypeScript --
      // Allow unused vars when prefixed with _ (common pattern for destructuring)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Allow explicit `any` but warn — helps gradual typing
      "@typescript-eslint/no-explicit-any": "warn",
      // Disallow non-null assertions (risky, prefer optional chaining)
      "@typescript-eslint/no-non-null-assertion": "warn",

      // -- React --
      // Prevent missing key in iterators
      "react/jsx-key": ["warn", { checkFragmentShorthand: true }],
      // Hooks rules are already enforced by next/core-web-vitals

      // -- General --
      // No console.log in production code (allow warn/error)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Prefer const over let when variable is never reassigned
      "prefer-const": "warn",
      // No var — use let/const
      "no-var": "error",
      // Require === instead of ==
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
]);

export default eslintConfig;
