/**
 * HAMA™ ESLint Configuration (Flat Config)
 *
 * ESLint v9+ flat config for Expo / React Native / TypeScript.
 *
 * Run:  npm run lint
 * Fix:  npm run lint:fix
 */

// @ts-check
import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // ── Ignore patterns ─────────────────────────────────
  {
    ignores: [
      'node_modules/',
      'dist/',
      'web-build/',
      'app-build/',
      'ios/',
      'android/',
      'coverage/',
      '.expo/',
      '*.config.js',
      'babel.config.js',
      'server/node_modules/',
    ],
  },

  // ── ESLint recommended base ─────────────────────────
  js.configs.recommended,

  // ── Main: TypeScript + React + React Native ─────────
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],

    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
    },

    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        FormData: 'readonly',
        XMLHttpRequest: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
      },
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      // ── TypeScript ──────────────────────────────────
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],

      // ── React ───────────────────────────────────────
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/display-name': 'off',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/self-closing-comp': ['warn', { component: true, html: true }],

      // ── React Hooks ─────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── React Native ────────────────────────────────
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
      'react-native/no-raw-text': 'off',

      // ── General ─────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['warn', 'multi-line'],
      'no-trailing-spaces': 'warn',
      'eol-last': ['warn', 'always'],
    },
  },

  // ── Test files: relaxed rules ──────────────────────
  {
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // ── Server (plain JS, Node) ────────────────────────
  {
    files: ['server/src/**/*.js', 'server/__tests__/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },

  // ── Script/config JS files ─────────────────────────
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        exports: 'writable',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
];
