import '../styles/tokens.css'
import '../styles/fonts.css'
import '../styles/base.css'
import '../styles/layout.css'
import '../styles/sections.css'
import '../styles/calc.css'

/* ============================================================
   Точка входа.

   Тяжёлое — WebGL-сцена и плавный скролл — грузится лениво и
   только там, где устройство это потянет. На всём остальном
   сайт работает как обычная быстрая страница: фон вырождается
   в статичный градиент, и ничего не ломается.
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* Решение принимается до загрузки чанка, а не после: незачем
   тянуть 30 КБ, чтобы потом выяснить, что рисовать некому. */
function canRunScene() {
  if (reduceMotion) return false
  try {
    const c = document.createElement('canvas')
    if (!c.getContext('webgl2')) return false
  } catch { return false }

  const mem = navigator.deviceMemory
  if (typeof mem === 'number' && mem < 4) return false
  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores <= 2) return false
  return true
}

const loader = document.querySelector('[data-loader]')
const counter = document.querySelector('[data-loader-count]')

/* Счётчик показывает загрузку, которая и так происходит,
   а не выдуманную паузу: он завершается тогда, когда реально
   готовы шрифты и сцена. */
function runCounter() {
  let shown = 0
  let done = false
  const tick = () => {
    if (done && shown >= 100) return
    const ceiling = done ? 100 : 92
    shown = Math.min(ceiling, shown + Math.max(0.6, (ceiling - shown) * 0.06))
    if (counter) counter.textContent = String(Math.round(shown)).padStart(3, '0')
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  return () => { done = true }
}

const finishCounter = runCounter()

async function boot() {
  // Шрифты — часть первого впечатления: показывать текст
  // до их готовности значит показать подмену начертания.
  if (document.fonts?.ready) {
    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))])
  }

  let field = null
  if (canRunScene()) {
    try {
      const canvas = document.querySelector('[data-field]')
      const { createField } = await import('../gl/field.js')
      field = createField(canvas)
      canvas.dataset.ready = 'true'
    } catch (err) {
      // Сцена — украшение поверх работающей страницы. Если она
      // не поднялась, это не повод ломать сайт.
      console.warn('[field] сцена не запущена:', err)
      document.documentElement.dataset.fieldFallback = 'true'
    }
  } else {
    document.documentElement.dataset.fieldFallback = 'true'
  }

  finishCounter()
  await new Promise(r => setTimeout(r, 420))

  document.documentElement.dataset.ready = 'true'
  loader?.setAttribute('data-hidden', 'true')
  loader?.addEventListener('transitionend', () => loader.remove(), { once: true })

  const { initCalculator } = await import('./calculator.js')
  initCalculator(field)

  const year = document.querySelector('[data-year]')
  if (year) year.textContent = new Date().getFullYear()

  if (!reduceMotion) initMotion(field)
  else document.querySelectorAll('[data-reveal]').forEach(el => (el.dataset.reveal = 'shown'))
}

async function initMotion(field) {
  const [{ default: Lenis }, { gsap }] = await Promise.all([
    import('lenis'),
    import('gsap'),
  ])

  const lenis = new Lenis({ duration: 1.1, smoothWheel: true })

  // Один rAF на страницу: Lenis и GSAP делят его, а не заводят свой.
  const loop = time => {
    lenis.raf(time)
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  // Скролл ведёт состояние поля. Обработчик не пишет стилей и
  // ничего не читает из layout — только передаёт число в шейдер.
  lenis.on('scroll', ({ scroll, limit }) => {
    const p = limit > 0 ? Math.min(scroll / limit, 1) : 0
    field?.setProgress(p)
    document.documentElement.style.setProperty('--scroll-progress', p.toFixed(4))
  })

  // Вход первого экрана: одна поставленная сцена со сдвигом по
  // очереди — она делает больше, чем россыпь мелких эффектов.
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
  tl.to('[data-reveal]', {
    opacity: 1,
    y: 0,
    duration: 1.3,
    stagger: 0.09,
  })
}

boot()
