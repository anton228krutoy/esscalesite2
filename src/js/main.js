import '../styles/tokens.css'
import '../styles/fonts.css'
import '../styles/base.css'
import '../styles/layout.css'
import '../styles/sections.css'
import '../styles/case.css'
import '../styles/case-words.css'
import '../styles/case-photo.css'
import '../styles/works.css'
import '../styles/dirs.css'
import '../styles/calc.css'

/* ============================================================
   Точка входа.

   Тяжёлое — WebGL-сцена — грузится лениво и только там, где
   устройство это потянет. На всём остальном сайт работает как
   обычная быстрая страница: фон вырождается в статичный градиент,
   и ничего не ломается. Прокрутка везде родная, браузерная.
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* data-anim выставляет синхронный скрипт в <head> — до первой
   отрисовки. Здесь дублировать не нужно. */

/* Решение принимается до загрузки чанка, а не после: незачем
   тянуть ~50 КБ, чтобы потом выяснить, что рисовать некому.

   failIfMajorPerformanceCaveat: на заблокированной видеокарте,
   в виртуальной машине и через удалённый рабочий стол WebGL2 всё
   равно «есть» — программный, на процессоре, и поле шло бы там
   рывками, забирая процессор у всей страницы. Пробный контекст
   отпускаем сразу: иначе он висел бы до сборки мусора рядом
   с настоящим. */
function canRunScene() {
  if (reduceMotion) return false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
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
      followScroll(field)
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

  const { initCase } = await import('./case.js')
  initCase()

  const { initDirections } = await import('./dirs.js')
  initDirections(field)

  const year = document.querySelector('[data-year]')
  if (year) year.textContent = new Date().getFullYear()

  if (!reduceMotion) initMotion()
  else {
    document.querySelectorAll('[data-reveal]').forEach(el => (el.dataset.reveal = 'shown'))
    document.querySelectorAll('[data-lines]').forEach(el => (el.dataset.lines = 'shown'))
  }
}

/* Положение на странице ведёт состояние поля. Прокрутка родная —
   её ведёт сам браузер, вне основного потока, а сюда приходит только
   число. Раньше этим занимался Lenis: он перехватывал колесо, крутил
   страницу из скрипта с полуторасекундным сглаживанием поверх инерции
   трекпада и держал цикл отрисовки до конца жизни страницы.
   Плавность перехода даёт само поле — оно подтягивает uProgress
   к цели на каждом кадре. Высоту страницы перечитываем только при
   изменении размеров, а не на каждой прокрутке. */
function followScroll(field) {
  let limit = 0
  const update = () => field.setProgress(limit > 0 ? Math.min(scrollY / limit, 1) : 0)
  const measure = () => {
    limit = document.documentElement.scrollHeight - innerHeight
    update()
  }
  new ResizeObserver(measure).observe(document.body)
  addEventListener('resize', measure, { passive: true })
  addEventListener('scroll', update, { passive: true })
  measure()
}

async function initMotion() {
  const { gsap } = await import('gsap')

  /* Вход первого экрана — одна поставленная сцена.

     Заголовок идёт первым и отдельно: его строки выезжают
     из-под масок, а не проявляются. Остальное подтягивается
     следом — и подзаголовок с ответом на него («Пока.») читается
     как реплика после паузы, а заголовок остаётся главным
     событием, а не одним из. */
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

  const title = document.querySelector('[data-lines]')
  const lines = document.querySelectorAll('.hero__title .line__in')
  if (lines.length) {
    /* Анимируем y, а не yPercent: начальный сдвиг задан в CSS
       процентами, а GSAP хранит y и yPercent раздельно и сумирует.
       При yPercent: 0 пиксельный сдвиг остался бы на месте — строки
       так и не выехали бы из-под маски. */
    tl.to(lines, {
      y: 0,
      duration: 1.15,
      stagger: 0.14,
      ease: 'expo.out',
      // Помечаем вход завершённым — по этому признаку снимается
      // will-change: держать композитный слой после одноразовой
      // анимации незачем.
      onComplete: () => title?.setAttribute('data-lines', 'shown'),
    })
  }

  tl.to('[data-reveal]', {
    opacity: 1,
    y: 0,
    duration: 1.1,
    stagger: 0.08,
  }, lines.length ? '-=0.75' : 0)
}

boot()
