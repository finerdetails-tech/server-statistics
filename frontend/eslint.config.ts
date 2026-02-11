import js from "@eslint/js"
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from "eslint/config"
import reactPlugin from "eslint-plugin-react"
import sortPlugin from "eslint-plugin-sort"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  {
    extends: [ "js/recommended" ],
    files: [ "**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}" ],
    languageOptions: { globals: globals.browser },
    plugins: { js }
  },
  tseslint.configs.recommended,
  sortPlugin.configs["flat/recommended"],
  {
    ...reactPlugin.configs.flat.recommended,
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      // Not needed with modern JSX transform
      "react/no-unknown-property": [ "error", { ignore: [ "class" ] } ],
      "react/react-in-jsx-scope": "off" // Preact uses 'class' not 'className'
    },
    settings: {react: {
      // Preact 10 is compatible with React 18
      pragma: "h",
      version: "18.0" // Preact uses 'h' instead of 'React.createElement'
    }}
  },
  {
    plugins: {'@stylistic': stylistic},
    rules: {
      '@stylistic/array-bracket-spacing': [ 'error', 'always' ],
      '@stylistic/arrow-spacing': "error",
      '@stylistic/block-spacing': "error",
      '@stylistic/comma-dangle': [ "error", "never" ],
      '@stylistic/comma-spacing': [ "error", {
        after: true,
        before: false
      } ],
      '@stylistic/comma-style': [ "error", "last" ],
      '@stylistic/computed-property-spacing': [ "error", "never" ],
      '@stylistic/curly-newline': [ "error", "always" ],
      '@stylistic/function-call-spacing': [ "error", "never" ],
      '@stylistic/implicit-arrow-linebreak': [ "error", "beside" ],
      '@stylistic/indent': [ 'error', 2 ],
      '@stylistic/jsx-closing-tag-location': "error",
      '@stylistic/jsx-curly-newline': "error",
      '@stylistic/jsx-curly-spacing': [ "error", { when: "never" } ],
      '@stylistic/jsx-equals-spacing': [ "error", "never" ],
      '@stylistic/jsx-first-prop-new-line': [ "error", "always" ],
      '@stylistic/jsx-function-call-newline': [ "error", "always" ],
      '@stylistic/jsx-indent': [ "error", 2 ],
      '@stylistic/jsx-indent-props': [ "error", 2 ],
      '@stylistic/jsx-pascal-case': "error",
      '@stylistic/jsx-props-no-multi-spaces': "error",
      '@stylistic/jsx-quotes': [ "error", "prefer-double" ],
      '@stylistic/jsx-wrap-multilines': "error",
      '@stylistic/key-spacing': [ "error", { beforeColon: false } ],
      '@stylistic/keyword-spacing': [ "error", { before: true } ],
      '@stylistic/lines-around-comment': [ "error", { beforeBlockComment: true } ],
      '@stylistic/lines-between-class-members': [ "error", "always" ],
      '@stylistic/multiline-comment-style': [ "error", "starred-block" ],
      '@stylistic/multiline-ternary': [ "error", "always" ],
      '@stylistic/newline-per-chained-call': [ "error", { ignoreChainWithDepth: 2 } ],
      '@stylistic/no-mixed-spaces-and-tabs': [ "error", "smart-tabs" ],
      '@stylistic/no-multi-spaces': "error",
      '@stylistic/no-multiple-empty-lines': "error",
      '@stylistic/no-trailing-spaces': "error",
      '@stylistic/no-whitespace-before-property': "error",
      '@stylistic/object-curly-newline': [ "error", { minProperties: 2 } ],
      '@stylistic/object-property-newline': "error",
      '@stylistic/quote-props': [ "error", "as-needed" ],
      '@stylistic/semi': [ "error", "never" ],
      '@stylistic/semi-spacing': "error",
      '@stylistic/space-before-blocks': "error",
      '@stylistic/space-before-function-paren': "error",
      '@stylistic/space-in-parens': [ "error", "never" ],
      '@stylistic/space-infix-ops': "error",
      '@stylistic/space-unary-ops': "error",
      '@stylistic/spaced-comment': [ "error", "always" ],
      '@stylistic/switch-colon-spacing': "error",
      '@stylistic/template-curly-spacing': "error",
      '@stylistic/type-annotation-spacing': "error",
      '@stylistic/type-generic-spacing': [ "error" ],
      '@stylistic/type-named-tuple-spacing': [ "error" ]
    }
  }
])
