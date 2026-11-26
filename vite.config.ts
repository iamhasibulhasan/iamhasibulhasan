import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { PLAY_SCRIPT } from './src/lib/hero-intro'
import { APPEARANCE_SCRIPT } from './src/lib/appearance'

/**
 * Inlines the saved appearance and the hero-intro decision into <head>, ahead of the module
 * script, so the first paint is already the right theme and the intro's
 * starting frame. (A module script runs after paint.)
 */
function headScripts(): Plugin {
  return {
    name: 'head-scripts',
    transformIndexHtml() {
      return [
        { tag: 'script', attrs: { id: 'appearance-init' }, children: APPEARANCE_SCRIPT, injectTo: 'head-prepend' },
        { tag: 'script', attrs: { id: 'hero-intro' }, children: PLAY_SCRIPT, injectTo: 'head' },
      ]
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), headScripts()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 5173 falls in a Windows-reserved port range (Hyper-V/WinNAT) on this machine.
    port: 3000,
  },
})
