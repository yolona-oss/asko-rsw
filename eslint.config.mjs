import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** @type {import('typescript-eslint').ConfigArray} */
export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────────────
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/coverage/**',
      'apps/web/src/lib/api/api.gen.d.ts',
    ],
  },

  // ── Base: all TS/JS files ───────────────────────────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── Shared rules ────────────────────────────────────────────────────────
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Moderate strictness
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-const': 'warn',
    },
  },

  // ── NestJS backend services ─────────────────────────────────────────────
  {
    files: [
      'apps/api/src/**/*.ts',
      'apps/user-service/src/**/*.ts',
      'apps/payment-service/src/**/*.ts',
      'apps/file-service/src/**/*.ts',
      'apps/repair-service/src/**/*.ts',
      'apps/notification-service/src/**/*.ts',
      'apps/chat-service/src/**/*.ts',
    ],
    rules: {
      // NestJS uses empty constructors with DI, decorators produce "unused" imports
      '@typescript-eslint/no-empty-function': 'off',
      // Common in NestJS controllers/services
      '@typescript-eslint/no-inferrable-types': 'off',
    },
  },

  // ── Frontend (Next.js + React) ──────────────────────────────────────────
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'packages/ui/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        React: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // ── Packages ────────────────────────────────────────────────────────────
  {
    files: ['packages/shared/src/**/*.ts', 'packages/proto/**/*.ts'],
    rules: {
      // Shared packages may export broad types
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
