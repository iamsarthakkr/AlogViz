/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.{ts,tsx}'],
        setupFiles: ['./tests/setup.ts'],
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            include: ['src/**'],
            // main.tsx only mounts <App /> into #root; App itself is covered
            exclude: ['src/main.tsx', 'src/**/*.d.ts'],
            reporter: ['text', 'html', 'lcov'],
            // Set just under current coverage so regressions fail CI rather than slipping in quietly
            thresholds: {
                statements: 95,
                branches: 90,
                functions: 95,
                lines: 95,
            },
        },
    },
});
