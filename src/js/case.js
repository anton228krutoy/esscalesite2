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
   ============================================================ */

/* Два порога у одного наблюдателя, потому что вопроса два.
   «Окно в кадре?» — да, как только виден хоть край: курсор может
   стоять над полоской окна у края экрана, и наведение там должно
   работать. «Пора раскрывать?» — когда видна четверть: раскрытие
   и пульс на краешке, который едва видно, никто не заметит. */
const SEEN = 0
const REVEAL = 0.25

export function initCase() {
  const cases = [...document.querySelectorAll('[data-case]')]
    .map(card => ({
      card,
      win: card.querySelector('[data-case-window]'),
      rect: null,         // геометрия окна; измеряется только у окон в кадре
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
        if (shown) c.win.style.setProperty('--case-scale', '1')
        // Пульс точки на схеме и курсор в поле ответа живут,
        // только пока окно заметно в кадре.
        e.target.toggleAttribute('data-visible', shown)
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
    for (const c of cases) {
      const { rect, win } = c

      /* Проверяем попадание сами, а не полагаемся на :hover.
         При скролле указатель не двигается, поэтому браузер не
         пересчитывает :hover — окно уезжает, а состояние остаётся. */
      const inside = over && c.inView && rect !== null &&
        cx >= rect.left && cx <= rect.right &&
        cy >= rect.top  && cy <= rect.bottom
      setHover(c, inside)
      if (!inside) continue

      const mx = cx - rect.left
      const my = cy - rect.top
      const px = (mx / rect.width - 0.5) * 18      // сцена ходит мягче курсора
      const py = (my / rect.height - 0.5) * 18
      win.style.setProperty('--mx', `${mx.toFixed(1)}px`)
      win.style.setProperty('--my', `${my.toFixed(1)}px`)
      win.style.setProperty('--px', `${(-px).toFixed(2)}px`)
      win.style.setProperty('--py', `${(-py).toFixed(2)}px`)
    }
  }

  const schedule = () => {
    if (!queued) { queued = true; requestAnimationFrame(flush) }
  }

  // Окна вне кадра не измеряются: их геометрия никому не нужна,
  // а каждое чтение — это пересчёт раскладки.
  const measure = () => {
    for (const c of cases) if (c.inView) c.rect = c.win.getBoundingClientRect()
  }

  // Слушаем на документе: указатель может покинуть окно и без
  // события leave — например когда окно само уехало под скроллом.
  document.addEventListener('pointermove', e => {
    cx = e.clientX; cy = e.clientY
    over = true
    // Геометрию здесь НЕ перечитываем: она меняется от скролла и
    // ресайза, а не от движения мыши. Чтение на каждое движение
    // давало пересчёт раскладки после записи стилей в том же кадре.
    for (const c of cases) if (c.inView && !c.rect) c.rect = c.win.getBoundingClientRect()
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
    const prevTop = probe?.rect ? probe.rect.top : null
    measure()
    flush()
    // Останавливаемся, когда окно перестало двигаться: иначе
    // цикл с чтением геометрии крутился бы до конца жизни
    // страницы, хотя прокрутка давно кончилась.
    const still = prevTop !== null && probe.rect !== null && Math.abs(probe.rect.top - prevTop) < 0.5
    idle = still ? idle + 1 : 0
    if (hovered() && idle < 3) requestAnimationFrame(track)
    else tracking = false
  }
  const onScroll = () => {
    measure()
    schedule()
    if (hovered() && !tracking) { tracking = true; idle = 0; requestAnimationFrame(track) }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })

  /* Окно раскрывается из масштаба 0.96, и всё, что измерено до
     конца раскрытия, меньше настоящего окна — подсказка ехала бы
     в стороне от курсора, пока не случится следующий скролл.
     Поэтому по окончании раскрытия окно измеряется ещё раз.
     Событие всплывает и от сцены внутри окна — его отсекаем. */
  for (const c of cases) {
    c.win.addEventListener('transitionend', e => {
      if (e.target !== c.win || e.propertyName !== 'transform' || !c.inView) return
      c.rect = c.win.getBoundingClientRect()
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
    c.rect = c.inView ? c.win.getBoundingClientRect() : null
    schedule()
  }
}
