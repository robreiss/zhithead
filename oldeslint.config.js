// eslint.config.js

import js from "@eslint/js";
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Base JavaScript rules
  {
    files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // TypeScript configuration
  {
    files: ['*.ts', '*.tsx'],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // React configuration
  {
    files: ['*.jsx', '*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },

  // Prettier configuration
  {
    files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
    plugins: {
      prettier,
    },
    rules: {
      ...prettier.configs.recommended.rules,
    },
  },
];
