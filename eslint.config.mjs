// eslint.config.mjs
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import angular from 'angular-eslint';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  // Ignora roba di build/cache che non è mio codice
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.angular/**',
      '**/vite/**',
      '**/*.min.js',
    ],
  },

  // Regole base JS
  js.configs.recommended,

  // *** Solo i .ts in src/ ***
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      // qui diciamo a ESLint quali variabili globali esistono nel browser
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },

  // *** File server-side: .server.ts / server.ts → ambiente Node (globals di Node) ***
  {
    files: ['src/**/*.server.ts', 'src/server.ts', 'src/main.server.ts', 'src/app/**/*.server.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
  },

  // *** Template Angular: solo gli .html in src/ ***
  ...angular.configs.templateRecommended.map((cfg) => ({
    ...cfg,
    files: ['src/**/*.html'],
  })),

  // Negli .html spegniamo qualsiasi regola TS
  {
    files: ['src/**/*.html'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },

  // *** Test files: .spec.ts → ambiente Jasmine (describe, it, expect, beforeEach) ***
  {
    files: ['src/**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.jasmine, // describe, it, expect, beforeEach
      },
    },
    rules: {
      // Evita falsi positivi sui global di test
      'no-undef': 'off',
    },
  },
];
