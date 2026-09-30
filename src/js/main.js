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

const root = document.documentElement

/* Метка для сторожа в <head> (index.html): модуль дошёл и выполняется.
   Без неё к DOMContentLoaded сторож решит, что главный файл не пришёл,
   и откроет страницу сам. data-anim тоже ставит он — до первой
   отрисовки, здесь дублировать не нужно. */
root.dataset.boot = ''

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const RELOAD_KEY = 'esscale:reload'
const wait = ms => new Promise(r => setTimeout(r, ms))

/* Файл, запрошенный через import(), не пришёл. Чаще всего это выкладка:
   страница из кеша ссылается на файлы, которых на сервере уже нет,
   и лечит это одна перезагрузка. Флаг общий со сторожем: больше одной
   перезагрузки за 30 с не будет, даже если сломано что-то другое, —
   тогда сбой просто гасится там, где файл запрашивали. */
addEventListener('vite:preloadError', () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
    if (Date.now() - last < 30000) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
    location.reload()
  } catch {}
})

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

/* Всё, что нужно странице, запрашивается сразу и параллельно. Раньше
   файлы шли цепочкой — шрифты, сцена, заставка, калькулятор, кейсы,
   направления, GSAP, — и заголовок стоял пустым, пока догружался хвост.

   Сцену ждём не дольше 4 с: зависший файл не должен держать заставку.
   Не пришла вовремя — страница открывается с градиентом вместо поля. */
const sceneModule = canRunScene()
  ? Promise.race([
      import('../gl/field.js'),
      wait(4000).then(() => { throw new Error('файл сцены не пришёл за 4 с') }),
    ]).catch(err => {
      console.warn('[field] сцена не запущена:', err)
      return null
    })
  : Promise.resolve(null)

/* Секции тоже запрашиваем сразу, а запускаем, когда решится судьба
   сцены: калькулятору и направлениям нужно поле. Пустой catch — только
   чтобы браузер не счёл сбой необработанным раньше, чем до него дойдёт
   startSections. */
const sections = {
  calculator: import('./calculator.js'),
  case: import('./case.js'),
  dirs: import('./dirs.js'),
}
for (const loading of Object.values(sections)) loading.catch(() => {})

async function boot() {
  // Шрифты — часть первого впечатления: показывать текст
  // до их готовности значит показать подмену начертания.
  if (document.fonts?.ready) {
    await Promise.race([document.fonts.ready, wait(2500)])
  }

  const field = startField(await sceneModule)
  startSections(field)

  finishCounter()
  await wait(420)
  reveal()
}

function startField(mod) {
  if (mod) {
    try {
      const canvas = document.querySelector('[data-field]')
      const field = mod.createField(canvas)
      canvas.dataset.ready = 'true'
      followScroll(field)
      return field
    } catch (err) {
      // Сцена — украшение поверх работающей страницы. Если она
      // не поднялась, это не повод ломать сайт.
      console.warn('[field] сцена не запущена:', err)
    }
  }
  root.dataset.fieldFallback = 'true'
  return null
}

/* Каждая секция поднимается сама по себе: не пришёл или упал один
   файл — остальные работают. Обычно к этому моменту все три уже
   загружены и поднимаются тут же, под заставкой, пока она ещё
   закрывает экран. */
function startSections(field) {
  const start = (name, run) => sections[name]
    .then(run)
    .catch(err => console.warn(`[${name}] секция не запущена:`, err))
  start('calculator', m => m.initCalculator(field))
  start('case', m => m.initCase())
  start('dirs', m => m.initDirections(field))
}

/* Заставка уходит, и одновременно стартует вход первого экрана —
   переходами CSS (layout.css). Без data-anim заставка не показана
   вовсе («меньше движения» или сторож в <head> уже открыл страницу),
   её просто убираем. */
function reveal() {
  if (root.dataset.ready) return
  root.dataset.ready = 'true'
  document.querySelectorAll('[data-lines]').forEach(el => (el.dataset.lines = 'shown'))
  document.querySelectorAll('[data-reveal]').forEach(el => (el.dataset.reveal = 'shown'))

  if (!loader) return
  if (!root.hasAttribute('data-anim')) return loader.remove()
  loader.setAttribute('data-hidden', 'true')
  loader.addEventListener('transitionend', () => loader.remove(), { once: true })
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

const year = document.querySelector('[data-year]')
if (year) year.textContent = new Date().getFullYear()

// Что бы ни случилось по дороге, страница открывается.
boot().catch(err => {
  console.error('[boot]', err)
  reveal()
})
