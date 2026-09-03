import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

/* Тестовые контакты и цены имеют свойство доезжать до продакшена
   незамеченными. Этот плагин делает так, чтобы это было слышно. */
function warnOnPlaceholders() {
  return {
    name: 'esscale-placeholder-guard',
    apply: 'build',
    buildStart() {
      const src = readFileSync('src/data/site.js', 'utf8')
      const left = [...src.matchAll(/^\s*(?:\/\/|.*\/\/)\s*ЗАГЛУШКА/gm)]
      if (!left.length) return
      const bar = '─'.repeat(58)
      console.warn(`\n\x1b[33m${bar}\n  ВНИМАНИЕ: в сборку уходят временные значения (${left.length})\n  Проверьте src/data/site.js — telegram и цена за EP\n${bar}\x1b[0m\n`)
    },
  }
}

/* Секции собираются из данных в HTML на этапе сборки, а не в
   браузере: клиентский рендер оставил бы поисковику и превью
   в мессенджерах пустую страницу. */
function renderSections() {
  return {
    name: 'esscale-sections',
    async transformIndexHtml(html) {
      const [r, { expertise }, { services }, { projects }, pricing, { site }] =
        await Promise.all([
          import('./src/build/render.js'),
          import('./src/data/expertise.js'),
          import('./src/data/services.js'),
          import('./src/data/projects.js'),
          import('./src/data/pricing.js'),
          import('./src/data/site.js'),
        ])
      return html.replace('<!--SECTIONS-->', [
        r.renderExpertise(expertise),
        r.renderServices(services),
        r.renderProjects(projects),
        r.renderEstimate({ tracks: pricing.tracks, multipliers: pricing.multipliers, site }),
        r.renderContact(site),
      ].join('\n'))
    },
  }
}

export default defineConfig({
  plugins: [warnOnPlaceholders(), renderSections()],
  base: '/',
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // WebGL-слой отдельным чанком: он грузится лениво и только там,
        // где устройство его потянет.
        manualChunks(id) {
          if (id.includes('node_modules/ogl')) return 'gl'
          if (id.includes('node_modules/gsap')) return 'motion'
        },
      },
    },
  },
  server: { port: 5173, open: false },
})
