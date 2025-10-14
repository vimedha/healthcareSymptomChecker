import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
      parserOptions: {
        project: false,
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
    rules: {},
  },
];
