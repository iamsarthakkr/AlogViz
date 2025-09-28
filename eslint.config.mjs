import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import parser from '@typescript-eslint/parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1) Supply the real eslint:recommended config object
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

const linterConfig = [
    // 2) Translate your “extends” list into flat-config blocks
    ...compat.extends(
        'eslint:recommended', // now works
        'plugin:@typescript-eslint/recommended',
        'next/core-web-vitals',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ),
    // 3) Any overrides or per-file settings go here
    {
        ignores: ['node_modules/', '.next/', 'dist/'],
        languageOptions: {
            parser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
                tsconfigRootDir: __dirname,
                project: ['./tsconfig.json'],
            },
        },
        rules: {
            // add your custom rule overrides here
        },
    },
];
export default linterConfig;
