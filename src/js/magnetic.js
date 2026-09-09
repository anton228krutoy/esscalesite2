/* ============================================================
   Реакция на курсор: магнит и свет.

   Элемент тянется к указателю и подсвечивается под ним.

   Смещение не анимируется CSS-переходом: цель меняется каждый
   кадр, и переход перезапускался бы столько же раз. Вместо этого
   у каждого элемента своё текущее значение, которое каждый кадр
   подтягивается к целевому — то же сглаживание, что у WebGL-поля.
   Отсюда мягкое догоняние и такой же мягкий возврат.

   Состояние живёт на элементах, а не в одной паре переменных:
   когда курсор переходит на соседа, покидаемый продолжает
   доезжать сам. С общим состоянием он прыгал на место.
   ============================================================ */

export function initMagnetic() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const SELECTOR = '.s-chip, .s-card, .s-btn'
  const PULL = 0.26          // доля расстояния до центра
  const MAX = 12             // потолок смещения, px
  const EASE = 0.13          // мягкость: меньше — плавнее
  const EPS = 0.05           // порог остановки, px

  /* Элементы, которые сейчас в движении: и тот, что под курсором,
     и те, что возвращаются на место. */
  const live = new Map()     // el → { x, y, tx, ty }
  let active = null
  let cx = 0, cy = 0
  let raf = null

  const state = el => {
    let st = live.get(el)
    if (!st) { st = { x: 0, y: 0, tx: 0, ty: 0 }; live.set(el, st) }
    return st
  }

  function frame() {
    raf = null
    for (const [el, st] of live) {
      st.x += (st.tx - st.x) * EASE
      st.y += (st.ty - st.y) * EASE

      const done = Math.abs(st.tx - st.x) < EPS && Math.abs(st.ty - st.y) < EPS
      if (done && el !== active) {
        // Доехал до нуля, курсора на нём нет — убираем следы.
        el.style.transform = ''
        el.style.removeProperty('--mx')
        el.style.removeProperty('--my')
        live.delete(el)
        continue
      }
      el.style.transform = `translate(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px)`
    }
    if (live.size) raf = requestAnimationFrame(frame)
  }

  const run = () => { if (raf === null) raf = requestAnimationFrame(frame) }

  /* Цель считается от геометрии; читаем её здесь, а не в цикле,
     чтобы не смешивать чтение и запись в одном проходе. */
  function aim() {
    if (!active) return
    const r = active.getBoundingClientRect()
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) { leave(); return }

    const st = state(active)
    st.tx = Math.max(-MAX, Math.min(MAX, (cx - (r.left + r.width / 2)) * PULL))
    st.ty = Math.max(-MAX, Math.min(MAX, (cy - (r.top + r.height / 2)) * PULL))
    active.style.setProperty('--mx', `${(cx - r.left).toFixed(1)}px`)
    active.style.setProperty('--my', `${(cy - r.top).toFixed(1)}px`)
  }

  /* Уход: цель обнуляется, но элемент остаётся в live и доезжает
     на место сам — параллельно с тем, что уже под курсором. */
  function release(el) {
    if (!el) return
    const st = live.get(el)
    if (st) { st.tx = 0; st.ty = 0 }
  }

  function leave() {
    release(active)
    active = null
    run()
  }

  document.addEventListener('pointermove', e => {
    cx = e.clientX
    cy = e.clientY
    const el = e.target instanceof Element ? e.target.closest(SELECTOR) : null

    if (el !== active) {
      release(active)      // прежний поедет обратно, а не прыгнет
      active = el
    }
    if (active) aim()
    if (live.size) run()
  }, { passive: true })

  // Прокрутка двигает элементы, а не курсор: пересчитываем цель.
  window.addEventListener('scroll', () => { if (active) { aim(); run() } }, { passive: true })

  document.addEventListener('pointerleave', leave)
  window.addEventListener('blur', leave)
}
