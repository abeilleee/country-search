/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/country-search/' : './',
  server: {
    open: true,
  },
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
});
