/* ============================================================
   Лента работ.

   Прокручивает её сам браузер: свайп, жест трекпада, Tab по
   ссылкам, прилипание к центру. Скрипт добавляет остальное:
   петлю, отдаление карточек к краям, кнопки со счётчиком,
   перетаскивание мышью и клик по боковой карточке, который
   ставит её в центр.

   Без скрипта лента остаётся обычной прокручиваемой полосой:
   все карточки в полный размер, без петли и без кнопок.
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
     По полной копии ленты слева и справа от настоящей. Когда
     прокрутка останавливается на копии, лента молча переезжает
     на ту же карточку в настоящем ряду: копии неотличимы, а масштаб
     и яркость считаются от положения, поэтому прыжок не виден.

     Одной копии с каждой стороны хватает: чтобы упереться в край,
     надо пролистать больше трёх карточек подряд, не останавливаясь, —
     а переезд случается на каждой остановке. */
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
     набегало больше пикселя, и точка прилипания браузера расходилась
     с посчитанным центром: лента, стоявшая ровно на карточке, для
     скрипта «не стояла», и переезд с копии не случался. Сами элементы
     ленты не трансформируются (масштаб — на карточке внутри), так что
     их прямоугольники — чистая раскладка. */
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
    if (settleTo !== null && Math.abs(track.scrollLeft - settleTo) < 1) settle()
  }
  const schedule = () => {
    if (!queued) { queued = true; requestAnimationFrame(paint) }
  }

  /* Куда лента едет по кнопке или клику. Пока она в пути, ближайшая
     к центру карточка — ещё прежняя, и два быстрых нажатия «вперёд»
     листали бы на одну: второе считалось бы от неё же. */
  let aim = null

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
    if (settleTo !== null) settleTo += shift * step
    paint()
  }

  /* --- Поездка -------------------------------------------------------------
     Пока лента едет сама — по кнопке, клику или после перетаскивания, —
     прилипание выключено и включается, когда она доехала. Включённое
     на ходу, оно спорило с плавной прокруткой: второе нажатие, пока
     лента ещё едет, то упиралось в промежуточную карточку и теряло
     шаг, то оставляло ленту в паре пикселей от центра. Таймер — на
     случай, если поездку оборвали и до цели она так и не доедет. */
  let settleTo = null
  let settleTimer = 0
  const settle = () => {
    clearTimeout(settleTimer)
    settleTo = null
    root.classList.remove('is-gliding', 'is-dragging')
    waitIdle()
  }
  const glide = left => {
    settleTo = left
    root.classList.add('is-gliding')
    clearTimeout(settleTimer)
    settleTimer = setTimeout(settle, 1200)
  }

  /* Центр ставим по точной позиции карточки, а не прокруткой
     «на одну ширину»: иначе браузер после прокрутки ещё раз
     доводил бы ленту до ближайшей точки прилипания. */
  const goTo = (i, smooth = true) => {
    aim = clamp(i)
    const left = centers[aim] - half
    if (smooth && !reduce) glide(left)
    track.scrollTo({ left, behavior: smooth && !reduce ? 'smooth' : 'auto' })
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

  /* Остановку ленты ловим паузой в событиях scroll, а не событием
     scrollend: его на window перехватывает Lenis и дальше не пускает,
     а в Safari его долго не было вовсе.

     Одной паузы мало: стоит браузеру подтормозить посреди плавной
     прокрутки, и пауза случалась на ходу — цель сбрасывалась, и
     следующее нажатие «вперёд» считалось от прежней карточки, а не
     от той, куда лента ехала. Поэтому «стоит» — это стоит ровно на
     точке прилипания; где-то между карточками лента не бывает
     в покое — прилипание всё равно её доведёт, и будет новый scroll.

     Пока палец на экране, не переезжаем: сдвиг под пальцем сорвал
     бы жест. */
  let idle = 0
  let touching = false
  const onIdle = () => {
    if (touching || drag || settleTo !== null) return
    const i = nearest()
    if (Math.abs(track.scrollLeft - (centers[i] - half)) >= 1) return
    aim = null
    normalize()
  }
  const waitIdle = () => {
    clearTimeout(idle)
    idle = setTimeout(onIdle, 140)
  }
  track.addEventListener('scroll', () => { schedule(); waitIdle() }, { passive: true })

  /* Свой жест отменяет поездку по кнопке: лента поедет туда,
     куда её ведёт палец или трекпад, прилипание нужно сразу, а прежняя
     цель больше не точка отсчёта для следующего нажатия. */
  const interrupt = () => {
    aim = null
    if (settleTo !== null) settle()
  }
  track.addEventListener('touchstart', () => { touching = true; interrupt() }, { passive: true })
  const untouch = () => { touching = false; waitIdle() }
  track.addEventListener('touchend', untouch, { passive: true })
  track.addEventListener('touchcancel', untouch, { passive: true })
  track.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) interrupt()
  }, { passive: true })

  /* Размер ленты меняется от поворота телефона и ресайза окна.
     Карточка, что была в центре, в нём и остаётся: иначе после
     поворота в середине оказывалась бы щель между двумя.
     Возвращаем её только при смене ширины: высота ленты меняется
     и от догрузки шрифта, и такой возврат посреди свайпа
     выдёргивал бы ленту из-под пальца. */
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
  // с клавиатуры: ссылку фокусирует и нажатие мыши, и лента поехала бы
  // ещё до того, как стало понятно, клик это или протяжка.
  track.addEventListener('focusin', e => {
    if (!e.target.matches(':focus-visible')) return
    const i = slides.findIndex(s => s.contains(e.target))
    if (i >= 0 && i !== active) goTo(i)
  })

  /* --- Клик ---------------------------------------------------------------
     Боковая карточка по клику встаёт в центр, а не открывается.
     После перетаскивания клик гасим совсем: отпущенная над
     карточкой мышь иначе открывала бы её страницу.
     Слушаем на погружении, чтобы успеть раньше самой ссылки. */
  let dragged = false
  track.addEventListener('click', e => {
    if (dragged) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    // Клик с клавиатуры или от читалки экрана (detail = 0) не трогаем:
    // карточку в фокусе focusin уже ставит в центр, а Enter по ссылке
    // должен её открыть, а не требовать второго нажатия.
    if (e.detail === 0) return
    // Cmd/Ctrl/Shift-клик — «открыть в новой вкладке/окне», это решение
    // человека, а не повод двигать ленту.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const i = slides.findIndex(s => s.contains(e.target))
    if (i >= 0 && i !== active) {
      e.preventDefault()
      goTo(i)
    }
  }, true)

  /* --- Перетаскивание мышью -----------------------------------------------
     Только для мыши: палец и трекпад прокручивают ленту сами,
     а мышиное колесо крутит страницу — ему и нужно тянуть.

     Отпустив, листаем на одну карточку в сторону протяжки, если
     её протянули хотя бы на шестую часть шага, иначе возвращаем
     прежнюю. Ближайшая к центру не годится: короткий рывок
     обычно не доводит ленту до середины между карточками, и она
     возвращалась бы назад, хотя тянули явно вперёд. */
  let drag = null

  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag = { id: e.pointerId, x: e.clientX, left: track.scrollLeft, from: active, moved: false }
  })

  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return
    // Кнопка уже не нажата, а отпускания не было: его съело контекстное
    // меню (Ctrl-клик на Mac). Без проверки лента поехала бы за курсором.
    if (!(e.buttons & 1)) return release(e)
    const dx = e.clientX - drag.x
    if (!drag.moved) {
      // Порог — чтобы обычный клик с дрожанием руки не считался протяжкой.
      if (Math.abs(dx) < 6) return
      drag.moved = true
      interrupt()
      root.classList.add('is-dragging')
      // Нажатие могло начать выделение подписи — снимаем его.
      getSelection()?.removeAllRanges()
    }
    track.scrollLeft = drag.left - dx
  }, { passive: true })

  const release = e => {
    if (!drag || e.pointerId !== drag.id) return
    const { moved, from, x } = drag
    drag = null
    if (!moved) return
    const dx = e.clientX - x
    const shift = Math.abs(dx) > step / 6 ? (dx < 0 ? 1 : -1) : 0
    goTo(from + shift)
    // Без плавной поездки (меньше движения) снимать протяжку некому:
    // settle() зовёт только поездка, и прилипание осталось бы выключенным.
    if (settleTo === null) root.classList.remove('is-dragging')
    // Лента могла уже стоять на месте — тогда события прокрутки
    // не будет, и прилипание вернёт только этот вызов.
    schedule()
    // Клик приходит сразу за отпусканием кнопки — в той же задаче.
    dragged = true
    setTimeout(() => { dragged = false })
  }
  addEventListener('pointerup', release)
  addEventListener('pointercancel', release)
  track.addEventListener('contextmenu', () => { drag = null })

  /* --- Старт ----------------------------------------------------------------
     С середины настоящего ряда: так с первого кадра видны соседи
     с обеих сторон. Секция в этот момент ниже первого экрана,
     так что прыжок не виден. */
  measure()
  goTo(base + Math.floor(n / 2), false)
  aim = null
  paint()
  if (nav) nav.hidden = false
  // Счётчик объявляется читалке экрана при смене карточки — иначе по
  // нажатию «вперёд» она не сообщала бы ничего. Только после старта:
  // первое значение при загрузке страницы объявлять незачем.
  counter?.parentElement.setAttribute('aria-live', 'polite')
  // Подписи боковых карточек прячутся только при живой ленте:
  // без скрипта центральной карточки нет, и текст пропал бы у всех.
  root.setAttribute('data-ready', '')
}
