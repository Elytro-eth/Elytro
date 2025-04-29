import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

export default [
  { files: ['**/*.{mjs,cjs,ts,jsx,tsx}'] },
  {
    ignores: [
      '**.config.js',
      '**/dist/',
      '**/node_modules/',
      '.git/',
      '.vscode/',
      '**/src/components/ui/',
      '**/src/hooks/use-toast.ts',
      '**/src/services/walletClient.ts', // TODO: WIP. remove this ignore later.
      '**/tailwind.config.js',
    ],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {  
    files: ['**/*.cjs.js', '**/*.cjs.ts', '**/*.cjs', '**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
];
