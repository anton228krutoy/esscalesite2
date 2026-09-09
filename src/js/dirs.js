/* ============================================================
   Направления: аккордеон и перекраска секции.

   Открыта всегда ровно одна строка — иначе список превращается
   в простыню и смысл переключения пропадает. Цвет секции берётся
   у открытой строки, поэтому переход между направлениями читается
   как смена режима, а не как раскрытие пункта.
   ============================================================ */

export function initDirections(field) {
  const section = document.querySelector('[data-dirs]')
  if (!section) return

  const items = [...section.querySelectorAll('[data-dir]')]
  if (!items.length) return

  let current = null

  function paint(item) {
    const rgb = item.style.getPropertyValue('--dir-rgb').trim()
    const parts = rgb.split(/\s+/)
    if (parts.length < 3) return
    const [r, g, b] = parts
    // Три числа, а не строка цвета: только так переход между
    // оттенками анимируется, а не переключается скачком.
    section.style.setProperty('--sec-r', r)
    section.style.setProperty('--sec-g', g)
    section.style.setProperty('--sec-b', b)
    current = parts

    // Сцена на фоне перекрашивается вместе с секцией — тогда цвет
    // направления охватывает весь экран, а не только список.
    if (inView) field?.setAccent(parts)
  }

  /* За пределами секции поле возвращается к цвету темы: иначе
     фиолетовый от «Данных» тянулся бы за посетителем до самого
     подвала. */
  let inView = false
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        inView = e.isIntersecting
        field?.setAccent(inView ? current : null)
      }
    },
    { threshold: 0.15 }
  )
  io.observe(section)

  function collapse() {
    for (const el of items) {
      el.classList.remove('is-active')
      el.querySelector('.dir__head')?.setAttribute('aria-expanded', 'false')
      el.querySelector('.dir__body')?.setAttribute('inert', '')
    }
    current = null
    field?.setAccent(null)
  }

  function open(item) {
    for (const el of items) {
      const on = el === item
      el.classList.toggle('is-active', on)
      el.querySelector('.dir__head')?.setAttribute('aria-expanded', String(on))
      // inert убирает свёрнутую панель и из фокуса, и из дерева
      // доступности — иначе скринридер читал содержимое, которое
      // объявлено свёрнутым, а Tab заходил в невидимое.
      const body = el.querySelector('.dir__body')
      if (body) body.toggleAttribute('inert', !on)
    }
    paint(item)
  }

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches

  for (const item of items) {
    const head = item.querySelector('.dir__head')
    if (!head) continue

    /* Клик по открытой строке сворачивает её: кнопка с
       aria-expanded="true" именно это и обещает. Раньше нажатие
       не делало ничего, и объявленное состояние расходилось
       с поведением. */
    head.addEventListener('click', () => {
      if (item.classList.contains('is-active')) collapse()
      else open(item)
    })

    /* На мышином вводе строка открывается наведением: так список
       перелистывается без единого клика. С клавиатуры и на тач-
       устройствах остаётся клик — там наведения просто нет. */
    if (fine) head.addEventListener('pointerenter', () => open(item))
    head.addEventListener('focus', () => open(item))
  }

  /* Прокрутка двигает список, а не курсор, поэтому pointerenter
     при листании не срабатывает: строка под указателем меняется,
     а открытой остаётся прежняя — и цвет замирает на ней.
     Поэтому при скролле сами ищем строку под курсором. */
  if (fine) {
    let cx = -1, cy = -1
    let queued = false

    document.addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY },
      { passive: true })

    const sync = () => {
      queued = false
      if (cx < 0) return
      // За пределами секции искать нечего: без этой проверки пять
      // чтений геометрии выполнялись на каждом кадре прокрутки
      // по всей странице.
      if (!inView) return
      for (const item of items) {
        const head = item.querySelector('.dir__head')
        if (!head) continue
        const r = head.getBoundingClientRect()
        if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
          if (!item.classList.contains('is-active')) open(item)
          return
        }
      }
    }

    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(sync) }
    }, { passive: true })
  }

  paint(items.find(i => i.classList.contains('is-active')) || items[0])
}
