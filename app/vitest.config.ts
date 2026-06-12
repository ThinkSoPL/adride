import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Konfiguracja testów jednostkowych dla aplikacji web (Next.js).
 *
 * - globals: true → składnia jest (describe/it/expect) bez importów
 * - environment: node → testy czystej logiki (kalkulatory, formatery, geo)
 * - alias '@' → src/ (zgodnie z tsconfig paths)
 *
 * Moduły Expo/React Native (mobile) są wykluczone — to osobny projekt.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
