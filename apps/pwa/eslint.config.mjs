import js from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ...js.configs.recommended,
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
