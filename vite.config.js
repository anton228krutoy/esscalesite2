import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/* Тестовые контакты и цены имеют свойство доезжать до продакшена
   незамеченными. Этот плагин делает так, чтобы это было слышно. */
function warnOnPlaceholders() {
  return {
    name: 'esscale-placeholder-guard',
    apply: 'build',
    async buildStart() {
      /* Список читаем из самого модуля, а не считаем комментарии:
         раньше предупреждение печатало свой текст и разошлось с
         реальностью — называло telegram, который уже был настоящим. */
      const { PLACEHOLDERS } = await import('./src/data/site.js')
      if (!PLACEHOLDERS?.length) return
      const bar = '─'.repeat(58)
      console.warn(
        `\n\x1b[33m${bar}\n  ВНИМАНИЕ: в сборку уходят временные значения\n` +
        PLACEHOLDERS.map(k => `    · ${k}`).join('\n') +
        `\n  Они помечены в src/data/site.js\n${bar}\x1b[0m\n`
      )
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
      const [r, { directions }, { projects }, pricing, { site }] =
        await Promise.all([
          import('./src/build/render.js'),
          import('./src/data/directions.js'),
          import('./src/data/projects.js'),
          import('./src/data/pricing.js'),
          import('./src/data/site.js'),
        ])
      // Единственный источник правды по контактам — src/data/site.js.
      // Раньше адрес в шапке был зашит в разметку и при замене
      // заглушки остался бы вести на старый аккаунт.
      html = html.replaceAll('{{TELEGRAM}}', site.telegram)

      if (html.includes('<!--SECTIONS-->')) {
        return html.replace('<!--SECTIONS-->', [
          r.renderProjects(projects),
          r.renderDirections(directions),
          r.renderEstimate({ tracks: pricing.tracks, multipliers: pricing.multipliers, site }),
          r.renderContact(site),
        ].join('\n'))
      }

      if (html.includes('<!--SCANDERE-->')) {
        const [rs, { scandere }] = await Promise.all([
          import('./src/build/render-scandere.js'),
          import('./src/data/scandere.js'),
        ])
        return html.replace('<!--SCANDERE-->', rs.renderScandere({ data: scandere, site }))
      }

      return html
    },
  }
}

export default defineConfig({
  plugins: [warnOnPlaceholders(), renderSections()],
  base: '/',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        scandere: resolve(__dirname, 'scandere/index.html'),
        privacy: resolve(__dirname, 'scandere/privacy/index.html'),
      },
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
