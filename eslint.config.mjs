import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import angular from 'angular-eslint';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
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

  js.configs.recommended,

  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      prettier,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'],
        },
        node: true,
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name='log']",
          message:
            'Avoid console.log to prevent leaking sensitive data (tokens, PII). Use structured logging instead.',
        },
      ],
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: '@app/**', group: 'internal', position: 'before' },
            { pattern: '@/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  {
    files: ['src/**/*.server.ts', 'src/server.ts', 'src/main.server.ts', 'src/app/**/*.server.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
  },

  ...angular.configs.templateRecommended.map((cfg) => ({
    ...cfg,
    files: ['src/**/*.html'],
  })),

  ...angular.configs.templateAccessibility.map((cfg) => ({
    ...cfg,
    files: ['src/**/*.html'],
  })),

  {
    files: ['src/**/*.html'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
    },
  },

  {
    files: ['src/**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.jasmine,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
];
