import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "coverage/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-undef": "error",
      "no-unreachable": "error",
      "no-dupe-args": "error",
      "no-duplicate-case": "error",
      "valid-typeof": "error",
      "no-const-assign": "error",
    },
  },
];
