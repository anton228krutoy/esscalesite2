/* ============================================================
   Лента работ.

   Листается только кнопками «←» «→», стрелками клавиатуры и кликом
   по боковой карточке. Свайпы, жест трекпада и перетаскивание мышью
   отключены намеренно: на трекпаде Mac лента с ними спотыкалась,
   а с петлёй и прилипанием поведение зависело от силы жеста
   и было непредсказуемым.

   Живая лента не прокручивается вовсе: ul стоит на месте и только
   обрезает края (overflow: clip в works.css), а каждая карточка
   сдвинута на общий сдвиг ленты --works-x и на своё отдаление от
   центра. Поездка — анимация translate, scale и opacity у каждой
   карточки (Web Animations), и ведёт её композитор: Core Animation
   в Safari, отдельный поток в Chrome. Раньше лента ехала плавной
   прокруткой, а ul с overflow: hidden оба браузера прокручивают из
   основного потока, Safari — не чаще 60 раз в секунду. Любая заминка
   там — смена выбранной работы, отрисовка въезжающей карточки —
   останавливала ленту посреди пути.

   Без скрипта лента остаётся обычной прокручиваемой полосой: все
   карточки в полный размер, без петли.
   ============================================================ */

/* Копия карточки для петли. Для читалки экрана и клавиатуры её
   нет: aria-hidden и tabindex="-1", иначе каждая работа звучала бы
   трижды, а Tab ходил бы по копиям. inert не годится — он гасит
   и клики, а по боковой копии кликают, чтобы поставить её в центр.

   id внутри копии переименовываются вместе со ссылками на них:
   маска схемы города ищется по url(#…), и с двумя одинаковыми id
   копия брала бы маску оригинала. */
function cloneSlide(slide, tag) {
  const copy = slide.cloneNode(true)
  copy.setAttribute('aria-hidden', 'true')
  copy.setAttribute('data-clone', '')
  copy.removeAttribute('data-active')
  for (const el of copy.querySelectorAll('a, button, [tabindex]')) el.setAttribute('tabindex', '-1')

  const nodes = [copy, ...copy.querySelectorAll('*')]
  for (const el of copy.querySelectorAll('[id]')) {
    const from = el.id
    const to = `${from}--${tag}`
    const ref = new RegExp(`#${from}(?![\\w-])`, 'g')
    el.id = to
    for (const node of nodes) {
      for (const { name, value } of [...node.attributes]) {
        if (value.includes(`#${from}`)) node.setAttribute(name, value.replace(ref, `#${to}`))
      }
    }
  }
  return copy
}

/* Темп поездки — как у плавной прокрутки Safari, которой лента ехала
   раньше (WebCore, ScrollAnimationSmooth): 1000 px/с, но не дольше
   200 мс, по ease-in-out; новая цель посреди пути — ease-out от того
   места, где лента сейчас. Chrome крутил ту же ленту дольше, 0,3–0,45 с;
   теперь она едет одинаково везде. */
const PX_PER_MS = 1
const MAX_MS = 200
const EASE = 'ease-in-out'
const EASE_RETARGET = 'ease-out'

export function initWorks() {
  const root = document.querySelector('[data-works]')
  const track = root?.querySelector('[data-works-track]')
  const originals = track ? [...track.querySelectorAll('[data-slide]')] : []
  const n = originals.length
  if (!n) return

  const nav = root.querySelector('[data-works-nav]')
  const prev = root.querySelector('[data-works-prev]')
  const next = root.querySelector('[data-works-next]')
  const counter = root.querySelector('[data-works-index]')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  // Без Web Animations лента переставляется сразу, как при «меньше движения».
  const smooth = !reduce && typeof track.animate === 'function'

  /* --- Петля ----------------------------------------------------------------
     По полной копии ленты слева и справа от настоящей. Доехав до
     копии, лента молча переезжает на ту же карточку в настоящем ряду:
     копии неотличимы, а масштаб и яркость считаются от положения,
     поэтому прыжок не виден. */
  const loop = n > 1
  if (loop) {
    track.prepend(...originals.map((s, i) => cloneSlide(s, `a${i}`)))
    track.append(...originals.map((s, i) => cloneSlide(s, `b${i}`)))
  }
  const slides = [...track.querySelectorAll('[data-slide]')]
  // Номер работы у каждой карточки, включая копии: по нему case.js
  // держит у всех копий одной работы общее состояние (см. setActive).
  slides.forEach((s, i) => { s.dataset.copy = String(i % n) })
  // Сдвиг, масштаб и яркость пишутся на саму карточку, а не на элемент
  // ленты: переменные не наследуются (works.css), и на li карточка их
  // не увидела бы.
  const cards = slides.map(s => s.querySelector('.case') ?? s)
  const base = loop ? n : 0          // первая карточка настоящего ряда
  const last = slides.length - 1
  const clamp = i => Math.max(0, Math.min(last, i))
  // Та же работа в настоящем ряду — туда лента молча переезжает с копии.
  const real = i => (loop ? base + ((i - base) % n + n) % n : i)

  /* Выбранной считается работа, а не одна карточка: data-active стоит
     на всех её копиях. Иначе переезд с копии на оригинал был виден —
     у оригинала подпись была погашена и проявлялась заново, мигая
     на каждом круге. Копии стоят в n шагах от центра, за краем экрана. */
  let active = -1
  const same = (a, b) => ((a - b) % n + n) % n === 0
  const setActive = i => {
    if (i === active) return
    active = i
    slides.forEach((s, j) => s.toggleAttribute('data-active', loop ? same(j, i) : j === i))
    // Номер — место в настоящем ряду: копия третьей работы тоже «03».
    const k = ((i - base) % n + n) % n
    if (counter) counter.textContent = String(k + 1).padStart(2, '0')
    // В петле краёв нет. Кнопки гаснут, только если работа одна.
    if (prev) prev.disabled = !loop && i === 0
    if (next) next.disabled = !loop && i === last
  }

  /* --- Геометрия --------------------------------------------------------------
     Читается только при изменении размеров. Элементы ленты (li) не
     трансформируются — двигаются карточки внутри них, — поэтому их
     прямоугольники — чистая раскладка. Координаты дробные, из
     getBoundingClientRect, а не offsetLeft: тот округляет до целого
     пикселя, а ширина карточки считается в cqw и почти всегда дробная.

     at[i] — сдвиг ленты, при котором карточка i стоит ровно в центре,
     округлённый до пикселя экрана. Карточка в покое сдвинута translate,
     и при дробном сдвиге Safari рисовал бы её слой между пикселями —
     текст в центральной карточке чуть расплывался бы. */
  let at = []
  let step = 1       // расстояние между центрами соседних карточек
  let slideW = 0     // ширина карточки: от неё подтяжка к центру (см. look)
  let shape = ''     // отпечаток геометрии — изменилась ли она на самом деле
  const measure = () => {
    const box = track.getBoundingClientRect()
    // scrollLeft не ноль только в Safari до 16: там ul ещё прокрутка (works.css).
    const origin = box.left + track.clientLeft - track.scrollLeft
    const half = track.clientWidth / 2
    const dpr = window.devicePixelRatio || 1
    const centers = slides.map(s => {
      const r = s.getBoundingClientRect()
      return r.left - origin + r.width / 2
    })
    at = centers.map(c => Math.round((c - half) * dpr) / dpr)
    slideW = slides[0].getBoundingClientRect().width
    step = last > 0 ? centers[1] - centers[0] : slideW
    const was = shape
    shape = `${at[0]}|${step}|${slideW}`
    return shape !== was
  }
  // Отдаление карточки j от центра, в шагах ленты. Дальше полутора
  // шагов карточка всё равно за краем, и считать её мельче незачем.
  const dAt = (j, x) => Math.max(-1.5, Math.min(1.5, (at[j] - x) / step))
  const nearestTo = x => clamp(Math.round((x - at[0]) / step))

  /* Вид карточки при сдвиге ленты x — те же формулы, что в works.css
     (.works__slide > .case), только числами: в ключевых кадрах,
     которые отдаются композитору, var() быть не может. */
  const look = (j, x, lift) => {
    const d = dAt(j, x)
    const k = Math.abs(d)
    return {
      translate: `${-x - 0.05 * d * slideW}px 0px`,
      scale: String(1 - 0.14 * k),
      opacity: String(Math.min(1, 1 - 0.55 * k + lift)),
    }
  }

  /* Ключевые кадры поездки карточки j из from в to. Сдвиг ленты меняется
     линейно по прогрессу анимации, а вид карточки — ломаная от её
     отдаления d: изломы там, где d проходит 0 и ±1.5, и там, где яркость
     с подсветкой упирается в 1. Кадр на каждом изломе и одна кривая на
     всю анимацию дают ровно те значения, что лента раньше считала на
     каждом кадре прокрутки, — и на ходу, и при поездке через несколько
     карточек. */
  const keyframes = (j, from, to, lift) => {
    const d0 = (at[j] - from) / step
    const d1 = (at[j] - to) / step
    const bends = [0, 1.5, -1.5]
    if (lift > 0) bends.push(lift / 0.55, -lift / 0.55)
    const offsets = [0, 1]
    if (d0 !== d1) {
      for (const b of bends) {
        const o = (b - d0) / (d1 - d0)
        if (o > 0 && o < 1) offsets.push(o)
      }
    }
    return offsets
      .sort((a, b) => a - b)
      .map(o => ({ offset: o, ...look(j, from + (to - from) * o, lift) }))
  }

  /* --- Поездка ----------------------------------------------------------------
     Состояния два: лента стоит (run = null) или едет (run — поездка).
     x — где лента стоит, а в пути — куда едет; aim — номер карточки,
     к которой она едет. */
  let x = 0
  let aim = null
  let run = null      // { from, to, anims, lifts }
  let following = false
  let ahead = 0       // шаги, отложенные до ближайшего кадра (см. request)
  let queued = false

  /* Покой — в переменные карточек: по ним считает CSS, вместе
     с подсветкой --lift под курсором. В начале поездки сюда сразу пишется
     состояние цели: пока анимация идёт, она перекрывает эти значения,
     а когда кончилась, карточки уже стоят где надо. */
  const rest = () => {
    const sx = String(x)
    cards.forEach((c, j) => {
      const d = dAt(j, x)
      c.style.setProperty('--works-x', sx)
      c.style.setProperty('--works-d', d.toFixed(4))
      c.style.setProperty('--works-k', Math.abs(d).toFixed(4))
    })
  }

  // Где лента сейчас — по прогрессу анимации, без чтения стилей.
  // progress у getComputedTiming() — уже после кривой.
  const current = () => {
    if (!run) return x
    const p = run.anims[0].effect.getComputedTiming().progress
    return p == null ? run.to : run.from + (run.to - run.from) * p
  }

  const halt = () => {
    if (!run) return
    const { anims } = run
    run = null
    for (const a of anims) a.cancel()
  }

  /* Доехали. Если на копию — молча переезжаем на ту же карточку
     в настоящем ряду: анимаций в этот момент нет, копии неотличимы,
     а вид считается от положения, поэтому прыжок не виден. */
  const settle = () => {
    if (aim === null) return
    const r = real(aim)
    if (r !== aim) { aim = r; x = at[r]; rest() }
    setActive(aim)
    aim = null
    root.dispatchEvent(new Event('works:settle', { bubbles: true }))
  }

  /* Выбранная работа меняется, когда лента проходит середину между
     карточками, — как раньше при прокрутке: при поездке через несколько
     карточек мелькают и промежуточные. Это единственная работа основного
     потока в пути, и движение от неё не зависит: опоздай кадр — опоздает
     подпись, а не лента. */
  const follow = () => {
    if (!run) { following = false; return }
    setActive(nearestTo(current()))
    requestAnimationFrame(follow)
  }

  const goTo = (i, from = current(), move = smooth) => {
    const retarget = run !== null
    /* Подсветку под курсором (--lift) держим в ключевых кадрах всю
       поездку: иначе боковая карточка, по которой кликнули, в первый же
       кадр теряла бы яркость. Читается один раз, в начале пути. */
    const lifts = run?.lifts ?? cards.map(c => (move && c.matches(':hover')
      ? Number.parseFloat(getComputedStyle(c).getPropertyValue('--lift')) || 0
      : 0))
    halt()
    aim = clamp(i)
    x = at[aim]
    rest()
    root.dispatchEvent(new Event('works:move', { bubbles: true }))

    const dist = Math.abs(x - from)
    if (!move || !(step > 0) || dist < 0.5) { settle(); return }

    const duration = Math.min(dist / PX_PER_MS, MAX_MS)
    const easing = retarget ? EASE_RETARGET : EASE
    const anims = cards.map((c, j) => c.animate(keyframes(j, from, x, lifts[j]), { duration, easing }))
    /* Новая цель посреди пути ставится в кадре (request), и отсчёт новой
       поездки — от времени этого кадра. Иначе она стартовала бы, только
       когда её получит композитор, с места, где лента была кадр назад, —
       и лента дёргалась бы назад. */
    if (retarget) {
      const now = document.timeline.currentTime
      if (now != null) for (const a of anims) a.startTime = now
    }
    const mine = run = { from, to: x, anims, lifts }
    anims[0].finished.then(() => { if (run === mine) { run = null; settle() } }, () => {})
    if (!following) { following = true; requestAnimationFrame(follow) }
  }

  /* Шаг на s карточек от цели — или от выбранной, если лента стоит.
     Если цель — копия, отсчёт сначала переносится в настоящий ряд:
     копии неотличимы, перенос на ходу не виден, и у петли нет края —
     частые нажатия не упираются в конец ленты. */
  const moveBy = s => {
    let ref = aim ?? active
    let from = current()
    const r = real(ref)
    if (r !== ref) { from += at[r] - at[ref]; ref = r }
    // Дальше чем на круг без одной карточки от того, что видно, не
    // забегаем: иначе частые нажатия уводили цель за копии.
    const seen = nearestTo(from)
    const to = clamp(Math.max(seen - (n - 1), Math.min(seen + (n - 1), ref + s)))
    if (to === ref) return
    goTo(to, from)
  }

  /* Нажатия копятся в шаги. Пока лента стоит — едем сразу. В пути новая
     цель ставится на ближайшем кадре, а не в обработчике: место ленты
     берётся из анимации, а её время в обработчике — время прошлого кадра,
     и новая поездка начиналась бы с места, которое лента уже проехала.
     На пике скорости это десятки пикселей рывка назад. */
  const request = s => {
    if (!run && !queued) return moveBy(s)
    ahead += s
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      const steps = ahead
      ahead = 0
      if (steps) moveBy(steps)
    })
  }
  // Карточку i — в центр: столько шагов от цели, сколько до неё сейчас.
  const requestIndex = i => request(i - (aim ?? active) - ahead)

  /* Размер ленты меняется от поворота телефона и ресайза окна, высота
     карточки — ещё и от высоты окна (svh). Карточка, что была в центре
     или куда лента ехала, встаёт в центр без поездки: иначе после
     поворота в середине оказывалась бы щель между двумя. Если геометрия
     та же (догрузка шрифта меняет только высоту подписи) — не трогаем. */
  new ResizeObserver(() => {
    if (!measure()) return
    const i = aim ?? active
    ahead = 0
    halt()
    if (i >= 0) goTo(i, x, false)
  }).observe(track)

  /* --- Кнопки и клавиатура ------------------------------------------------ */

  prev?.addEventListener('click', () => request(-1))
  next?.addEventListener('click', () => request(1))

  track.addEventListener('keydown', e => {
    // Alt/Cmd + стрелка — «назад»/«вперёд» браузера, их не отнимаем.
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    request(e.key === 'ArrowRight' ? 1 : -1)
  })

  // Tab по ссылкам: лента не прокручивается, и браузер сам не покажет
  // карточку в фокусе — ставим её в центр. Только фокус с клавиатуры:
  // ссылку фокусирует и нажатие мыши, а с мышью разбирается клик ниже.
  track.addEventListener('focusin', e => {
    if (!e.target.matches(':focus-visible')) return
    const i = slides.findIndex(s => s.contains(e.target))
    if (i >= 0 && i !== active) requestIndex(i)
  })

  /* --- Клик ---------------------------------------------------------------
     Боковая карточка по клику встаёт в центр, а не открывается:
     открыть можно то, что уже видно целиком. Слушаем на погружении,
     чтобы успеть раньше самой ссылки. */
  track.addEventListener('click', e => {
    // Клик с клавиатуры или от читалки экрана (detail = 0) не трогаем:
    // карточку в фокусе focusin уже ставит в центр, а Enter по ссылке
    // должен её открыть, а не требовать второго нажатия.
    if (e.detail === 0) return
    // Cmd/Ctrl/Shift-клик — «открыть в новой вкладке/окне», это решение
    // человека, а не повод двигать ленту.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const i = slides.findIndex(s => s.contains(e.target))
    if (i >= 0 && !slides[i].hasAttribute('data-active')) {
      e.preventDefault()
      requestIndex(i)
    }
  }, true)

  /* --- Старт ----------------------------------------------------------------
     С середины настоящего ряда: так с первого кадра видны соседи
     с обеих сторон. Секция в этот момент ниже первого экрана и под
     заставкой, так что прыжок не виден. */
  measure()
  goTo(base + Math.floor(n / 2), x, false)
  if (nav) nav.hidden = false
  // Счётчик объявляется читалке экрана при смене карточки — иначе по
  // нажатию «вперёд» она не сообщала бы ничего. Только после старта:
  // первое значение при загрузке страницы объявлять незачем.
  counter?.parentElement.setAttribute('aria-live', 'polite')
  // Подписи боковых карточек прячутся, а лента перестаёт прокручиваться,
  // только при живой ленте: без скрипта центральной карточки нет,
  // и текст пропал бы у всех, а до остальных работ было бы не добраться.
  root.setAttribute('data-ready', '')
  // Где нет overflow: clip (Safari до 16), ul остаётся прокруткой
  // (works.css), и браузер мог бы сам прокрутить его к ссылке в фокусе,
  // сбив все сдвиги. Возвращаем на место: двигаются только карточки.
  if (!CSS.supports('overflow', 'clip')) {
    const home = () => { if (track.scrollLeft) track.scrollLeft = 0 }
    track.addEventListener('scroll', home, { passive: true })
    home()
  }
}
