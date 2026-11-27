import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { realpathSync } from 'node:fs'
import path from 'node:path'
import { PLAY_SCRIPT } from './src/lib/hero-intro.ts'
import { APPEARANCE_SCRIPT } from './src/lib/appearance.ts'
import { seoPages } from './vite-plugins/seo-pages.ts'

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

/**
 * The project folder, spelled the way the file system spells it. On Windows a
 * shell can say f: where Node resolves F:; with both spellings in play the
 * build saw some files twice (React among them: the built site then failed
 * to start, "Cannot read properties of null (reading 'useState')").
 */
const root = realpathSync.native(fileURLToPath(new URL('.', import.meta.url)))

export default defineConfig({
  root,
  plugins: [react(), tailwindcss(), headScripts(), seoPages()],
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
  server: {
    // 5173 falls in a Windows-reserved port range (Hyper-V/WinNAT) on this machine.
    port: 3000,
  },
})
