import { POINTS } from '../build/city-map.js'

/* ============================================================
   Схема города: выбор точки.

   Точка выбирается мышью или с клавиатуры, панель показывает её
   показатели. Данные берутся из того же модуля, что и разметка
   схемы, — иначе подписи на карте и цифры в панели однажды
   разъехались бы.

   Денежных сумм здесь нет: только доли и количества.
   ============================================================ */

export function initMap() {
  const root = document.querySelector('[data-map]')
  if (!root) return

  const pins = [...root.querySelectorAll('[data-pin]')]
  const panel = root.querySelector('[data-map-panel]')
  const title = root.querySelector('[data-panel-title]')
  const stats = root.querySelector('[data-panel-stats]')
  if (!pins.length || !panel || !title || !stats) return

  let current = -1

  function select(i) {
    const point = POINTS[i]
    if (!point || i === current) return
    current = i

    pins.forEach((pin, k) => {
      const on = k === i
      pin.classList.toggle('pin--active', on)
      pin.setAttribute('aria-pressed', String(on))
    })

    title.textContent = point.label
    /* Перерисовываем содержимое панели целиком: показателей
       четыре, и собрать их заново дешевле, чем держать ссылки
       на каждую ячейку и сверять, что изменилось. */
    stats.innerHTML = point.stats.map((s, k) => `
      <div class="s-map__stat" style="--k: ${k}">
        <dt class="s-map__stat-label t-mono">${s.label}</dt>
        <dd class="s-map__stat-value">${s.value}</dd>
      </div>`).join('')

    // Перезапуск подсветки: анимация играет заново на каждой смене.
    panel.classList.remove('is-updated')
    void panel.offsetWidth
    panel.classList.add('is-updated')
  }

  pins.forEach((pin, i) => {
    pin.addEventListener('click', () => select(i))
    pin.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i) }
      // Стрелками — по точкам подряд: так схему можно обойти,
      // не выходя из неё табом.
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const n = (i + 1) % pins.length
        pins[n].focus(); select(n)
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const n = (i - 1 + pins.length) % pins.length
        pins[n].focus(); select(n)
      }
    })
  })

  select(POINTS.findIndex(p => p.active) >= 0 ? POINTS.findIndex(p => p.active) : 0)
}
