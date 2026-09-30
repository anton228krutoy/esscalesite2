/* ============================================================
   Поведение окон кейсов.

   Три эффекта, все на CSS-переменных: блик и подсказка идут
   за курсором, сцена внутри окна отстаёт от него (параллакс),
   окно раскрывается по мере появления в кадре.

   Второй WebGL-контекст ради этого не заводится: он стоил бы
   дороже, чем весь остальной сайт, а разница на глаз нулевая.

   Кейсов на странице несколько, но слушатели общие: один
   pointermove и один scroll на все окна, а не по комплекту
   на каждое. Работу делают только окна в кадре — какие они,
   сообщает тот же IntersectionObserver, что раскрывает окно.

   Кейсы стоят в ленте, которая листается вбок (works.js). Лента —
   часть той же витрины, поэтому грузится этим же модулем, а не
   отдельным import(): лишний динамический импорт уже однажды
   перетасовал чанки и порядок CSS на главной.
   ============================================================ */

import { initWorks } from './works.js'

/* Два порога у одного наблюдателя, потому что вопроса два.
   «Окно в кадре?» — да, как только виден хоть край: курсор может
   стоять над полоской окна у края экрана, и наведение там должно
   работать. «Пора раскрывать?» — когда видна четверть: раскрытие
   и пульс на краешке, который едва видно, никто не заметит. */
const SEEN = 0
const REVEAL = 0.25

export function initCase() {
  // До проверки на «меньше движения»: листать ленту кнопками
  // нужно и тем, у кого анимации выключены.
  initWorks()

  const cases = [...document.querySelectorAll('[data-case]')]
    .map(card => ({
      card,
      win: card.querySelector('[data-case-window]'),
      slide: card.closest('[data-slide]'),   // место в ленте работ, если кейс в ней
      // Номер работы в ленте: у копий одной работы (works.js) он общий,
      // и состояние — видно ли окно, наведён ли курсор — тоже общее.
      group: card.closest('[data-slide]')?.dataset.copy ?? null,
      shown: false,
      rect: null,         // геометрия окна; измеряется только у окон в кадре
      scale: 1,           // во сколько раз окно на экране меньше своей раскладки
      inView: false,
      hovering: false,
    }))
    .filter(c => c.win)
  if (!cases.length) return

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches

  if (reduce) {
    for (const c of cases) c.win.style.setProperty('--case-scale', '1')
    return
  }

  const pointer = fine ? followPointer(cases) : null

  /* --- Раскрытие при появлении ----------------------------------------
     IntersectionObserver вместо обработчика скролла: браузер сам
     считает пересечение, не заставляя нас читать геометрию каждый кадр. */
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        const c = cases.find(x => x.win === e.target)
        const shown = e.intersectionRatio >= REVEAL
        c.inView = e.isIntersecting
        // До записи стилей ниже: так замер не заставляет браузер
        // пересчитывать раскладку посреди обработчика.
        pointer?.(c)
        // В ленте работ окна раскрываются все разом. Поодиночке
        // лента после переезда с копии на оригинал ставила бы
        // в центр ещё поджатое окно, и оно заметно «вздрагивало».
        if (shown) for (const x of c.slide ? cases.filter(y => y.slide) : [c]) {
          x.win.style.setProperty('--case-scale', '1')
        }
        // Пульс точки на схеме и курсор в поле ответа живут,
        // только пока окно заметно в кадре. У копий одной работы —
        // пока заметна хоть одна: иначе после переезда с копии на
        // оригинал анимации сцены начинались бы заново, с рывком.
        c.shown = shown
        const members = c.group === null ? [c] : cases.filter(x => x.group === c.group)
        const visible = members.some(m => m.shown)
        for (const m of members) m.win.toggleAttribute('data-visible', visible)
      }
    },
    { threshold: [SEEN, REVEAL] }
  )
  for (const c of cases) io.observe(c.win)
}

/* --- Курсор -------------------------------------------------------------
   Позиция копится в переменных, а запись в стили происходит один раз
   за кадр: pointermove срабатывает чаще, чем браузер успевает
   отрисовать, и писать на каждое событие — впустую жечь кадры.

   Возвращает функцию, которую зовут, когда окно вошло в кадр или
   вышло из него: оно могло въехать под неподвижный курсор или
   уехать из-под него, и наведение надо пересчитать без движения мыши. */
function followPointer(cases) {
  let cx = 0, cy = 0          // курсор в координатах окна браузера
  let over = false            // курсор над страницей
  let queued = false

  /* Окно на экране меньше своей раскладки: оно раскрывается из
     0.96, а в ленте боковые карточки ещё и уменьшены. Блик и
     подсказка стоят в координатах раскладки, поэтому смещение
     курсора делим на этот масштаб — иначе на уменьшенном окне
     подсказка отставала бы от курсора тем сильнее, чем он дальше
     от угла. offsetWidth трансформ не учитывает — он и нужен. */
  const read = c => {
    c.rect = c.win.getBoundingClientRect()
    c.scale = c.rect.width / c.win.offsetWidth || 1
  }

  const setHover = (c, on) => {
    if (c.hovering === on) return
    c.hovering = on
    c.card.classList.toggle('is-hover', on)
    if (!on) {
      c.win.style.setProperty('--px', '0px')
      c.win.style.setProperty('--py', '0px')
    }
  }

  const flush = () => {
    queued = false

    /* Проверяем попадание сами, а не полагаемся на :hover.
       При скролле указатель не двигается, поэтому браузер не
       пересчитывает :hover — окно уезжает, а состояние остаётся.

       В ленте отзывается только карточка в центре: боковая по
       клику не открывается, а встаёт в центр, и подсказка
       «Открыть» на ней обещала бы не то. Заодно две карточки
       не могут откликнуться разом там, где они сходятся.

       Сначала решаем, где курсор, и только потом пишем: у копий одной
       работы наведение общее. Лента молча переезжает с копии на
       оригинал, и если бы оригинал «наводился» заново, сцена под
       неподвижным курсором заметно отъезжала и приближалась бы. */
    const hit = new Map()   // работа (или сам кейс вне ленты) → кейс под курсором
    for (const c of cases) {
      const { rect } = c
      const inside = over && (c.inView || c.slide) && rect !== null &&
        (!c.slide || c.slide.hasAttribute('data-active')) &&
        cx >= rect.left && cx <= rect.right &&
        cy >= rect.top  && cy <= rect.bottom
      if (inside) hit.set(c.group ?? c, c)
    }

    for (const c of cases) {
      const src = hit.get(c.group ?? c)
      setHover(c, !!src)
      if (!src) continue

      const { rect } = src
      const mx = (cx - rect.left) / src.scale
      const my = (cy - rect.top) / src.scale
      const px = ((cx - rect.left) / rect.width - 0.5) * 18      // сцена ходит мягче курсора
      const py = ((cy - rect.top) / rect.height - 0.5) * 18
      c.win.style.setProperty('--mx', `${mx.toFixed(1)}px`)
      c.win.style.setProperty('--my', `${my.toFixed(1)}px`)
      c.win.style.setProperty('--px', `${(-px).toFixed(2)}px`)
      c.win.style.setProperty('--py', `${(-py).toFixed(2)}px`)
    }
  }

  const schedule = () => {
    if (!queued) { queued = true; requestAnimationFrame(flush) }
  }

  // Окна вне кадра не измеряются: их геометрия никому не нужна,
  // а каждое чтение — это пересчёт раскладки. Кроме ленты работ:
  // после переезда с копии в центре оказывается оригинал, про который
  // наблюдатель ещё не успел сказать «в кадре», — его окно нужно
  // измерить сразу. Карточек в ленте девять, это недорого.
  const measure = () => {
    for (const c of cases) if (c.inView || c.slide) read(c)
  }

  // Слушаем на документе: указатель может покинуть окно и без
  // события leave — например когда окно само уехало под скроллом.
  document.addEventListener('pointermove', e => {
    cx = e.clientX; cy = e.clientY
    over = true
    // Геометрию здесь НЕ перечитываем: она меняется от скролла и
    // ресайза, а не от движения мыши. Чтение на каждое движение
    // давало пересчёт раскладки после записи стилей в том же кадре.
    for (const c of cases) if ((c.inView || c.slide) && !c.rect) read(c)
    schedule()
  }, { passive: true })

  /* Скролл двигает окно, а не курсор. Пока указатель внутри,
     крутим собственный кадровый цикл: инерционная прокрутка идёт
     непрерывно, и обновления по событию scroll отстают от неё
     на кадр — этого хватает, чтобы кнопка «плыла» за курсором. */
  const hovered = () => cases.find(c => c.hovering)
  let tracking = false
  let idle = 0
  const track = () => {
    const probe = hovered()
    const prev = probe?.rect ?? null
    measure()
    flush()
    // Останавливаемся, когда окно перестало двигаться: иначе
    // цикл с чтением геометрии крутился бы до конца жизни
    // страницы, хотя прокрутка давно кончилась. Смотрим и на
    // левый край: лента работ двигает окно вбок, а не вверх.
    const still = prev !== null && probe.rect !== null &&
      Math.abs(probe.rect.top - prev.top) < 0.5 &&
      Math.abs(probe.rect.left - prev.left) < 0.5
    idle = still ? idle + 1 : 0
    if (hovered() && idle < 3) requestAnimationFrame(track)
    else tracking = false
  }
  const onScroll = () => {
    // Ни одного окна в кадре и ничего не наведено — читать геометрию
    // девяти окон ленты на каждый кадр прокрутки страницы незачем.
    // Старые прямоугольники сбрасываем: вернувшуюся ленту перемерят
    // наблюдатель (pointer(c) в initCase) и первое движение мыши.
    if (!hovered() && !cases.some(c => c.inView)) {
      for (const c of cases) c.rect = null
      return
    }
    measure()
    schedule()
    if (hovered() && !tracking) { tracking = true; idle = 0; requestAnimationFrame(track) }
  }
  /* На документе и на погружении, а не на window: событие scroll
     не всплывает, и прокрутку ленты работ window не слышал бы —
     окна уезжали бы вбок, а блик оставался на старом месте. */
  document.addEventListener('scroll', onScroll, { passive: true, capture: true })
  window.addEventListener('resize', onScroll, { passive: true })

  /* Окно раскрывается из масштаба 0.96, и всё, что измерено до
     конца раскрытия, меньше настоящего окна — подсказка ехала бы
     в стороне от курсора, пока не случится следующий скролл.
     Поэтому по окончании раскрытия окно измеряется ещё раз.
     Событие всплывает и от сцены внутри окна — его отсекаем. */
  for (const c of cases) {
    c.win.addEventListener('transitionend', e => {
      if (e.target !== c.win || e.propertyName !== 'transform' || !(c.inView || c.slide)) return
      read(c)
      schedule()
    })
  }

  /* Указатель ушёл со страницы целиком — состояние снимаем сразу.
     Его последние координаты больше не в счёт: иначе следующий
     скролл «навёл» бы курсор, которого над страницей уже нет. */
  document.addEventListener('pointerleave', () => {
    over = false
    for (const c of cases) setHover(c, false)
  })
  window.addEventListener('blur', () => {
    for (const c of cases) setHover(c, false)
  })

  return c => {
    if (c.inView || c.slide) read(c)
    else c.rect = null
    schedule()
  }
}
