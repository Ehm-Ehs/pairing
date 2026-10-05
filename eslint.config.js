import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

/**
 * ESLint for the Next.js app.
 *
 * Unused imports and variables and `any` are errors in application code.
 * Run `npm run lint -- --fix` to remove unused imports automatically.
 */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "public/sw.js", "next-env.d.ts"],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      // Unused imports are errors and are removed by `eslint --fix`.
      "unused-imports/no-unused-imports": "error",
      // A long file is a hint, not an error: it often means the file does more than one job.
      // Split by responsibility, not to hit a number.
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
      // Apostrophes and quotes in JSX text render correctly; escaping them is cosmetic.
      "react/no-unescaped-entities": "off",
      // The landing page uses plain anchors for in-page section links (/#features).
      "@next/next/no-html-link-for-pages": "warn",
      // Reported in a few older components; warn until they are refactored.
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Test doubles stand in for loosely typed SDK objects.
    files: ["tests/**"],
    rules: { "@typescript-eslint/no-explicit-any": "off", "max-lines": "off" },
  },
  {
    // Pure data: an icon set and email templates are long by nature.
    files: ["src/components/ui/icons.tsx", "src/services/emailTemplates.ts"],
    rules: { "max-lines": "off" },
  },
];

export default config;
