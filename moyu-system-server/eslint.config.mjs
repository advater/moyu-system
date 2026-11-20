// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'prettier/prettier': 'off',
      // recommendedTypeChecked treats the no-unsafe-* family as errors.
      // This Nest codebase is loosely typed (no-explicit-any is already off)
      // and has never passed those rules. Keep them visible as warnings,
      // consistent with the existing no-unsafe-argument policy, instead of
      // adding hundreds of `as` casts. Tighten back to "error" incrementally
      // as modules are typed.
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
    },
  },
  {
    files: ['test/http-contract/fakes.ts'],
    rules: {
      // Service stubs match async interfaces but have no I/O to await.
      '@typescript-eslint/require-await': 'off',
    },
  },
);
