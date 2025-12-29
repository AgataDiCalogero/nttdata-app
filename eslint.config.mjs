import path from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import angular from 'angular-eslint';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const lintProjects = [
  path.resolve(__dirname, 'tsconfig.app.json'),
  path.resolve(__dirname, 'tsconfig.spec.json'),
];

const globalRestrictedSyntax = [
  {
    selector: "CallExpression[callee.object.name='console'][callee.property.name='log']",
    message:
      'Avoid console.log in source files; prefer structured logging helpers to keep sensitive data contained.',
  },
];

const domRestrictedSyntax = [
  {
    selector: "MemberExpression[property.name='body'][object.name='document']",
    message: 'Only ThemeService/UiOverlayService may manipulate document.body.',
  },
  {
    selector:
      "MemberExpression[property.name='body'][object.type='MemberExpression'][object.property.name='document']",
    message: 'Only ThemeService/UiOverlayService may manipulate document.body.',
  },
  {
    selector: "MemberExpression[property.name='documentElement'][object.name='document']",
    message:
      'Only ThemeService/UiOverlayService (and I18nService when updating lang) may touch document.documentElement.',
  },
  {
    selector:
      "MemberExpression[property.name='documentElement'][object.type='MemberExpression'][object.property.name='document']",
    message:
      'Only ThemeService/UiOverlayService (and I18nService when updating lang) may touch document.documentElement.',
  },
  {
    selector: "CallExpression[callee.property.name='matchMedia'][callee.object.name='globalThis']",
    message:
      'Use ThemeService to coordinate matchMedia listeners instead of calling globalThis.matchMedia directly.',
  },
  {
    selector: "CallExpression[callee.property.name='matchMedia'][callee.object.name='window']",
    message:
      'Use ThemeService to coordinate matchMedia listeners instead of calling window.matchMedia directly.',
  },
];

const combinedRestrictedSyntax = [...globalRestrictedSyntax, ...domRestrictedSyntax];

const typeAwareRules = {
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-floating-promises': 'warn',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/no-unnecessary-condition': 'warn',
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/no-unsafe-argument': 'warn',
  '@typescript-eslint/restrict-template-expressions': 'error',
  '@typescript-eslint/strict-boolean-expressions': 'warn',
};

const matDialogRestriction = [
  {
    name: '@angular/material/dialog',
    importNames: ['MatDialog'],
    message:
      'Inject ResponsiveDialogService (or another approved facade) instead of consuming MatDialog directly in components.',
  },
];

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.angular/**',
      'audit-logs/**',
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
        project: lintProjects,
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@angular-eslint': angular.tsPlugin,
      import: importPlugin,
      prettier,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: [path.resolve(__dirname, 'tsconfig.json')],
        },
        node: true,
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...typeAwareRules,
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
      '@angular-eslint/prefer-standalone': 'warn',
      'no-restricted-imports': ['error', { paths: matDialogRestriction }],
      'no-restricted-syntax': ['error', ...combinedRestrictedSyntax],
      'import/no-duplicates': 'error',
      'import/order': [
        'warn',
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
    files: [
      'src/app/shared/services/theme/theme.service.ts',
      'src/app/shared/services/ui-overlay/ui-overlay.service.ts',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...globalRestrictedSyntax],
    },
  },

  {
    files: ['src/app/shared/i18n/i18n.service.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...globalRestrictedSyntax],
    },
  },

  {
    files: ['src/app/shared/services/dialog/responsive-dialog.service.ts'],
    rules: {
      'no-restricted-imports': 'off',
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
      '@angular-eslint/template/no-call-expression': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: "Element[name='mat-select']",
          message: 'Use the <app-select> wrapper instead of <mat-select> directly.',
        },
      ],
    },
  },

  {
    files: ['src/app/shared/ui/select/**/*.html'],
    rules: {
      'no-restricted-syntax': 'off',
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
      'no-restricted-syntax': ['error', ...globalRestrictedSyntax],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
];
