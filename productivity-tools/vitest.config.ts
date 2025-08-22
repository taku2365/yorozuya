import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./test/setup.ts",
    testTimeout: 10000, // Increase timeout to 10 seconds
    hookTimeout: 10000, // Increase hook timeout to 10 seconds
    exclude: [
      ...configDefaults.exclude,
      '**/e2e/**',
      '**/*.e2e.{test,spec}.{js,ts,jsx,tsx}',
      '**/playwright/**'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});