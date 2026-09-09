/* ============================================================
   Поведение окна кейса.

   Три эффекта, все на CSS-переменных: блик и подсказка идут
   за курсором, сцена внутри окна отстаёт от него (параллакс),
   окно раскрывается по мере появления в кадре.

   Второй WebGL-контекст ради этого не заводится: он стоил бы
   дороже, чем весь остальной сайт, а разница на глаз нулевая.
   ============================================================ */

export function initCase() {
  const card = document.querySelector('[data-case]')
  if (!card) return

  const win = card.querySelector('[data-case-window]')
  if (!win) return

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches

  /* --- Курсор ---------------------------------------------------------
     Позиция копится в переменных, а запись в стили происходит один раз
     за кадр: pointermove срабатывает чаще, чем браузер успевает
     отрисовать, и писать на каждое событие — впустую жечь кадры. */
  if (fine && !reduce) {
    let cx = 0, cy = 0          // курсор в координатах окна браузера
    let hovering = false
    let queued = false
    let rect = null

    const setHover = on => {
      if (hovering === on) return
      hovering = on
      card.classList.toggle('is-hover', on)
      if (!on) {
        win.style.setProperty('--px', '0px')
        win.style.setProperty('--py', '0px')
      }
    }

    const flush = () => {
      queued = false
      if (!rect) return

      /* Проверяем попадание сами, а не полагаемся на :hover.
         При скролле указатель не двигается, поэтому браузер не
         пересчитывает :hover — окно уезжает, а состояние остаётся. */
      const inside =
        cx >= rect.left && cx <= rect.right &&
        cy >= rect.top  && cy <= rect.bottom
      setHover(inside)
      if (!inside) return

      const mx = cx - rect.left
      const my = cy - rect.top
      const px = (mx / rect.width - 0.5) * 18      // сцена ходит мягче курсора
      const py = (my / rect.height - 0.5) * 18
      win.style.setProperty('--mx', `${mx.toFixed(1)}px`)
      win.style.setProperty('--my', `${my.toFixed(1)}px`)
      win.style.setProperty('--px', `${(-px).toFixed(2)}px`)
      win.style.setProperty('--py', `${(-py).toFixed(2)}px`)
    }

    const schedule = () => {
      if (!queued) { queued = true; requestAnimationFrame(flush) }
    }

    // Слушаем на документе: указатель может покинуть окно и без
    // события leave — например когда окно само уехало под скроллом.
    document.addEventListener('pointermove', e => {
      cx = e.clientX; cy = e.clientY
      // Геометрию здесь НЕ читаем: она меняется от скролла и
      // ресайза, а не от движения мыши. Чтение на каждое движение
      // давало пересчёт раскладки после записи стилей в том же кадре.
      if (!rect) rect = win.getBoundingClientRect()
      schedule()
    }, { passive: true })

    /* Скролл двигает окно, а не курсор. Пока указатель внутри,
       крутим собственный кадровый цикл: инерционная прокрутка идёт
       непрерывно, и обновления по событию scroll отстают от неё
       на кадр — этого хватает, чтобы кнопка «плыла» за курсором. */
    let tracking = false
    let idle = 0
    const track = () => {
      const prevTop = rect ? rect.top : null
      rect = win.getBoundingClientRect()
      flush()
      // Останавливаемся, когда окно перестало двигаться: иначе
      // цикл с чтением геометрии крутился бы до конца жизни
      // страницы, хотя прокрутка давно кончилась.
      idle = (prevTop !== null && Math.abs(rect.top - prevTop) < 0.5) ? idle + 1 : 0
      if (hovering && idle < 3) requestAnimationFrame(track)
      else tracking = false
    }
    const onScroll = () => {
      rect = win.getBoundingClientRect()
      schedule()
      if (hovering && !tracking) { tracking = true; idle = 0; requestAnimationFrame(track) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    // Указатель ушёл со страницы целиком — состояние снимаем сразу.
    document.addEventListener('pointerleave', () => setHover(false))
    window.addEventListener('blur', () => setHover(false))
  }

  /* --- Раскрытие при появлении ----------------------------------------
     IntersectionObserver вместо обработчика скролла: браузер сам
     считает пересечение, не заставляя нас читать геометрию каждый кадр. */
  if (reduce) {
    win.style.setProperty('--case-scale', '1')
    return
  }

  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting) win.style.setProperty('--case-scale', '1')
        // Пульс точки на схеме живёт только пока окно в кадре.
        e.target.toggleAttribute('data-visible', e.isIntersecting)
      }
    },
    { threshold: 0.25 }
  )
  io.observe(win)
}
