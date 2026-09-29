/* ============================================================
   Лента работ.

   Листается только кнопками «←» «→», стрелками клавиатуры и кликом
   по боковой карточке. Свайпы, жест трекпада и перетаскивание мышью
   отключены намеренно: с ними лента на трекпаде Mac спотыкалась —
   Lenis перехватывал часть событий одного жеста, если рука уводила
   его чуть вверх или вниз, — а с петлёй и прилипанием поведение
   зависело от силы жеста и было непредсказуемым.

   Поэтому лента прокручивается только скриптом (overflow-x: hidden
   в works.css, пока лента живая), и каждое движение — это точная
   поездка к точной позиции. Без скрипта лента остаётся обычной
   прокручиваемой полосой: все карточки в полный размер, без петли.
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
  // Масштаб пишется на саму карточку, а не на элемент ленты:
  // переменные не наследуются (works.css), и на li карточка их не увидела бы.
  const cards = slides.map(s => s.querySelector('.case') ?? s)
  const base = loop ? n : 0          // первая карточка настоящего ряда
  const last = slides.length - 1
  const clamp = i => Math.max(0, Math.min(last, i))

  /* Геометрия читается только при изменении размеров, а не на
     каждом кадре прокрутки: это чтение раскладки, и после записи
     переменных в том же кадре оно стоило бы пересчёта всей ленты.

     Координаты — дробные, из getBoundingClientRect, а не offsetLeft:
     тот округляет до целого пикселя, а ширина карточки считается
     в cqw и почти всегда дробная. За девять карточек округление
     набегало больше пикселя, и лента, доехавшая ровно до карточки,
     для скрипта «не доезжала». Сами элементы ленты не трансформируются
     (масштаб — на карточке внутри), так что их прямоугольники — чистая
     раскладка. */
  let centers = []
  let half = 0
  let step = 1
  const measure = () => {
    const origin = track.getBoundingClientRect().left + track.clientLeft - track.scrollLeft
    centers = slides.map(s => {
      const r = s.getBoundingClientRect()
      return r.left - origin + r.width / 2
    })
    half = track.clientWidth / 2
    step = last > 0 ? centers[1] - centers[0] : slides[0].getBoundingClientRect().width
  }
  const nearest = () => {
    const mid = track.scrollLeft + half
    let best = 0
    for (let i = 1; i < centers.length; i++) {
      if (Math.abs(centers[i] - mid) < Math.abs(centers[best] - mid)) best = i
    }
    return best
  }

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

  /* Куда лента едет. Пока она в пути, ближайшая к центру карточка —
     ещё прежняя, и два быстрых нажатия «вперёд» листали бы на одну:
     второе считалось бы от неё же. */
  let aim = null
  let arriveTimer = 0

  /* --- Отдаление к краям ------------------------------------------------
     Расстояние от центра — в шагах ленты, чтобы оно не зависело
     от ширины экрана. Дальше полутора шагов карточка всё равно
     за краем, и считать её мельче незачем. */
  let queued = false
  const paint = () => {
    queued = false
    const mid = track.scrollLeft + half
    cards.forEach((c, i) => {
      const d = Math.max(-1.5, Math.min(1.5, (centers[i] - mid) / step))
      c.style.setProperty('--works-d', d.toFixed(3))
      c.style.setProperty('--works-k', Math.abs(d).toFixed(3))
    })
    setActive(nearest())
    // Доехали — переезжаем с копии, если приехали на неё.
    if (aim !== null && Math.abs(track.scrollLeft - (centers[aim] - half)) < 1) arrive()
  }
  const schedule = () => {
    if (!queued) { queued = true; requestAnimationFrame(paint) }
  }
  track.addEventListener('scroll', schedule, { passive: true })

  /* Переезд с копии на настоящую карточку. Сразу же перерисовываем,
     не дожидаясь кадра: иначе на один кадр в центре оказалась бы
     карточка с масштабом от прежнего места — мелкая и тусклая. */
  const normalize = () => {
    if (!loop) return
    const ref = aim ?? nearest()
    const shift = ref < base ? n : ref >= base + n ? -n : 0
    if (!shift) return
    track.scrollLeft += shift * step
    if (aim !== null) aim += shift
    paint()
  }
  const arrive = () => {
    clearTimeout(arriveTimer)
    normalize()
    aim = null
  }

  /* Центр ставим по точной позиции карточки, а не прокруткой
     «на одну ширину». Таймер — на случай, если плавную прокрутку
     оборвали (браузер свернули посреди поездки) и последнего события
     scroll на месте не будет: тогда ставим ленту на цель сами. */
  const goTo = (i, smooth = true) => {
    aim = clamp(i)
    const left = centers[aim] - half
    track.scrollTo({ left, behavior: smooth && !reduce ? 'smooth' : 'auto' })
    clearTimeout(arriveTimer)
    arriveTimer = setTimeout(() => {
      if (aim === null) return
      track.scrollTo({ left: centers[aim] - half, behavior: 'auto' })
      arrive()
    }, 1200)
    // Лента могла уже стоять на цели — тогда события scroll не будет.
    schedule()
  }

  // Сначала переезд в настоящий ряд, потом шаг: у края копии
  // шагать дальше некуда.
  const shiftBy = dir => {
    normalize()
    const from = aim ?? active
    // Частые нажатия (зажатая стрелка, быстрые клики) опережали ленту:
    // цель уходила за копию, и переезд упирался в край ленты. Дальше
    // чем на круг без одной карточки от того, что видно, не забегаем.
    if (Math.abs(from + dir - nearest()) > n - 1) return
    goTo(from + dir)
  }

  /* Размер ленты меняется от поворота телефона и ресайза окна.
     Карточка, что была в центре, в нём и остаётся: иначе после
     поворота в середине оказывалась бы щель между двумя. По высоте
     не возвращаем — высота меняется и от догрузки шрифта. */
  let width = track.clientWidth
  new ResizeObserver(() => {
    measure()
    if (track.clientWidth !== width && active >= 0) goTo(active, false)
    width = track.clientWidth
    schedule()
  }).observe(track)

  /* --- Кнопки и клавиатура ------------------------------------------------ */

  prev?.addEventListener('click', () => shiftBy(-1))
  next?.addEventListener('click', () => shiftBy(1))

  track.addEventListener('keydown', e => {
    // Alt/Cmd + стрелка — «назад»/«вперёд» браузера, их не отнимаем.
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    shiftBy(e.key === 'ArrowRight' ? 1 : -1)
  })

  // Tab по ссылкам: браузер сам докручивает ленту до карточки
  // в фокусе, но не до центра — ставим её в центр сами. Только фокус
  // с клавиатуры: ссылку фокусирует и нажатие мыши, а с мышью
  // разбирается клик ниже.
  track.addEventListener('focusin', e => {
    if (!e.target.matches(':focus-visible')) return
    const i = slides.findIndex(s => s.contains(e.target))
    if (i >= 0 && i !== active) goTo(i)
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
      goTo(i)
    }
  }, true)

  /* --- Старт ----------------------------------------------------------------
     С середины настоящего ряда: так с первого кадра видны соседи
     с обеих сторон. Секция в этот момент ниже первого экрана,
     так что прыжок не виден. */
  measure()
  goTo(base + Math.floor(n / 2), false)
  paint()
  if (nav) nav.hidden = false
  // Счётчик объявляется читалке экрана при смене карточки — иначе по
  // нажатию «вперёд» она не сообщала бы ничего. Только после старта:
  // первое значение при загрузке страницы объявлять незачем.
  counter?.parentElement.setAttribute('aria-live', 'polite')
  // Подписи боковых карточек прячутся, а лента перестаёт прокручиваться
  // руками, только при живой ленте: без скрипта центральной карточки нет,
  // и текст пропал бы у всех, а до остальных работ было бы не добраться.
  root.setAttribute('data-ready', '')
}
