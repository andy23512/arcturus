import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/arcturus/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globalSetup: ['test/global-setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
