import js from "@eslint/js";
import sortPlugin from "eslint-plugin-sort"

import globals from "globals";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  sortPlugin.configs["flat/recommended"],
  {
    ...reactPlugin.configs.flat.recommended,
    settings: {
      react: {
        version: "18.0", // Preact 10 is compatible with React 18
        pragma: "h", // Preact uses 'h' instead of 'React.createElement'
      },
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off", // Not needed with modern JSX transform
      "react/no-unknown-property": ["error", { ignore: ["class"] }], // Preact uses 'class' not 'className'
    },
  },
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/array-bracket-spacing': ['error', 'always'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/jsx-indent': ["error", 2],
      '@stylistic/arrow-spacing': "error",
      '@stylistic/block-spacing': "error",
      '@stylistic/comma-spacing': ["error", { "before": false, "after": true }],
      '@stylistic/computed-property-spacing': ["error", "never"],
      '@stylistic/function-call-spacing': ["error", "never"],
      '@stylistic/jsx-curly-spacing': ["error", { "when": "never" }],
      '@stylistic/jsx-equals-spacing': ["error", "never"],
      '@stylistic/jsx-props-no-multi-spaces': "error",
      '@stylistic/no-trailing-spaces': "error",
      '@stylistic/no-whitespace-before-property': "error",
      '@stylistic/key-spacing': ["error", { "beforeColon": false }],
      '@stylistic/keyword-spacing': ["error", { "before": true }],
      '@stylistic/no-mixed-spaces-and-tabs': ["error", "smart-tabs"],
      '@stylistic/no-multi-spaces': "error",
      '@stylistic/semi-spacing': "error",
      '@stylistic/space-before-blocks': "error",
      '@stylistic/space-before-function-paren': "error",
      '@stylistic/space-in-parens': ["error", "never"],
      '@stylistic/space-infix-ops': "error",
      '@stylistic/space-unary-ops': "error",
      '@stylistic/spaced-comment': ["error", "always"],
      '@stylistic/switch-colon-spacing': "error",
      '@stylistic/template-curly-spacing': "error",
      '@stylistic/type-annotation-spacing': "error",
      '@stylistic/type-generic-spacing': ["error"],
      '@stylistic/type-named-tuple-spacing': ["error"],
      '@stylistic/curly-newline': ["error", "always"],
      '@stylistic/implicit-arrow-linebreak': ["error", "beside"],
      '@stylistic/jsx-curly-newline': "error",
      '@stylistic/jsx-first-prop-new-line': ["error", "always"],
      '@stylistic/jsx-function-call-newline': ["error", "always"],
      '@stylistic/jsx-wrap-multilines': "error",
      '@stylistic/lines-around-comment': ["error", { "beforeBlockComment": true }],
      '@stylistic/lines-between-class-members': ["error", "always"],
      '@stylistic/multiline-comment-style': ["error", "starred-block"],
      '@stylistic/multiline-ternary': ["error", "always"],
      '@stylistic/newline-per-chained-call': ["error", { "ignoreChainWithDepth": 2 }],
      '@stylistic/object-curly-newline': ["error", { "minProperties": 2 }],
      '@stylistic/object-property-newline': "error",
      '@stylistic/jsx-indent-props': ["error", 2],
      '@stylistic/jsx-quotes': ["error", "prefer-double"],
      '@stylistic/quote-props': ["error", "as-needed"],
      '@stylistic/comma-dangle': ["error", "never"],
      '@stylistic/comma-style': ["error", "last"],
      '@stylistic/semi': ["error", "never"],
      '@stylistic/jsx-pascal-case': "error",
      '@stylistic/jsx-closing-tag-location': "error",
      '@stylistic/no-multiple-empty-lines': "error",
    },
  },
]);
