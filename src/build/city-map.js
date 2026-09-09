/* ============================================================
   Схема города с торговыми точками.

   Не настоящая картография и не скриншот из приложения —
   узнаваемая абстракция Москвы: кольца, радиальные магистрали
   и излучина реки. Ровно та геометрия, по которой город
   опознаётся с одного взгляда.

   Используется и в окне кейса на главной, и на странице
   проекта, поэтому генерируется, а не рисуется руками.
   ============================================================ */

const CX = 200
const CY = 200

/* Кольца Москвы, приведённые к масштабу картинки. */
const RINGS = [
  { r: 36,  w: 1.0, o: 0.62, sx: 1.06, sy: 0.94, dx:  2, dy: -1 },  // Бульварное
  { r: 66,  w: 0.9, o: 0.50, sx: 1.10, sy: 0.92, dx: -3, dy:  2 },  // Садовое
  { r: 110, w: 0.8, o: 0.34, sx: 1.04, sy: 0.97, dx:  4, dy: -2 },  // ТТК
  { r: 172, w: 0.7, o: 0.20, sx: 1.02, sy: 1.00, dx: -2, dy:  3 },  // МКАД
]

/* Радиальные магистрали: слегка неравномерно по углу, иначе
   схема читается как мишень, а не как город. */
const RADIALS = [8, 42, 74, 118, 150, 196, 228, 262, 292, 330]

/* Точки сети. Названия и показатели вымышленные: это витрина
   возможностей, а не чужие данные. Денежных сумм здесь нет
   намеренно — только доли и количества, они ничего не выдают
   и одинаково читаются в любой стране.
   Активная — та, что выбрана по умолчанию. */
const POINTS = [
  {
    x: 156, y: 232, label: 'Заречная', active: true,
    stats: [
      { label: 'Маржинальность', value: '42%' },
      { label: 'Конверсия',      value: '18%' },
      { label: 'Продаж за день', value: '124' },
      { label: 'Проходимость',   value: '690' },
    ],
  },
  {
    x: 246, y: 148, label: 'Северная',
    stats: [
      { label: 'Маржинальность', value: '37%' },
      { label: 'Конверсия',      value: '23%' },
      { label: 'Продаж за день', value: '212' },
      { label: 'Проходимость',   value: '920' },
    ],
  },
  {
    x: 132, y: 138, label: 'Парковая',
    stats: [
      { label: 'Маржинальность', value: '45%' },
      { label: 'Конверсия',      value: '14%' },
      { label: 'Продаж за день', value: '86' },
      { label: 'Проходимость',   value: '610' },
    ],
  },
  {
    x: 262, y: 246, label: 'Лесная',
    stats: [
      { label: 'Маржинальность', value: '31%' },
      { label: 'Конверсия',      value: '27%' },
      { label: 'Продаж за день', value: '178' },
      { label: 'Проходимость',   value: '655' },
    ],
  },
]

const polar = (deg, r) => {
  const a = (deg - 90) * Math.PI / 180
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r]
}

const n = v => Number(v.toFixed(1))

export function cityMap({ id = 'map', points = POINTS, showLabels = false } = {}) {
  /* role="img" отсекает содержимое от скринридера, поэтому вся
     смысловая нагрузка должна быть в подписи. Перечисляем точки
     и отмечаем активную — иначе для незрячего пользователя схема
     превращается в «схема города» без единой детали. */
  const names = points.map(p => p.active ? `${p.label} (активная)` : p.label).join(', ')
  const label = `Схема города: ${points.length} ${points.length === 1 ? 'точка' : 'точки'} сети — ${names}`
  const rings = RINGS.map(
    ({ r, w, o, sx, sy, dx, dy }) =>
      `<ellipse cx="${CX + dx}" cy="${CY + dy}" rx="${n(r * sx)}" ry="${n(r * sy)}"
         fill="none" stroke="var(--map-line)" stroke-width="${w}" opacity="${o}"/>`
  ).join('')

  const radials = RADIALS.map(deg => {
    const [x1, y1] = polar(deg, 26)
    const [x2, y2] = polar(deg, 178)
    return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="var(--map-line)" stroke-width="0.7" opacity="0.22"/>`
  }).join('')

  /* Короткие связки между соседними радиалями на случайных, но
     фиксированных высотах — из них читается уличная сеть. */
  const LINKS = [
    [8, 42, 88], [42, 74, 132], [74, 118, 74], [118, 150, 118],
    [150, 196, 150], [196, 228, 96], [228, 262, 140], [292, 330, 110],
  ]
  const links = LINKS.map(([a, b, r]) => {
    const [x1, y1] = polar(a, r)
    const [x2, y2] = polar(b, r)
    return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="var(--map-line)" stroke-width="0.6" opacity="0.16"/>`
  }).join('')

  // Излучина реки — то, что окончательно опознаёт город.
  const river =
    `<path d="M 24 158 C 78 150, 96 196, 140 206 S 196 246, 232 214 S 268 152, 316 168 S 358 196, 380 186"
       fill="none" stroke="var(--map-river)" stroke-width="2.2" opacity="0.34" stroke-linecap="round"/>`

  const markers = points.map((p, i) => {
    const cls = p.active ? 'pin pin--active' : 'pin'
    const label = showLabels && p.label
      ? `<text class="pin__label" x="${p.x + 12}" y="${p.y + 4}">${p.label}</text>`
      : ''
    /* Интерактивные точки — настоящие кнопки: доступны с клавиатуры
       и объявляют выбранное состояние. Декоративная схема на главной
       остаётся немой группой. */
    const interactive = showLabels
    const tag = interactive ? 'g' : 'g'
    const attrs = interactive
      ? ` role="button" tabindex="0" aria-pressed="${p.active ? 'true' : 'false'}"` +
        ` data-pin="${i}" aria-label="Точка ${p.label}"`
      : ''
    return `
    <${tag} class="${cls}"${attrs} style="--pin-delay: ${i * 700}ms">
      <circle class="pin__pulse" cx="${p.x}" cy="${p.y}" r="6"/>
      <circle class="pin__halo" cx="${p.x}" cy="${p.y}" r="9"/>
      <circle class="pin__dot"  cx="${p.x}" cy="${p.y}" r="3.4"/>
      ${interactive ? `<circle class="pin__hit" cx="${p.x}" cy="${p.y}" r="16"/>` : ''}
      ${label}
    </${tag}>`
  }).join('')

  return `
<svg class="citymap" viewBox="0 0 400 400" role="img"
     aria-label="${label}" focusable="false">
  <defs>
    <radialGradient id="${id}-fade" cx="50%" cy="50%" r="52%">
      <stop offset="68%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="${id}-mask">
      <rect width="400" height="400" fill="url(#${id}-fade)"/>
    </mask>
  </defs>
  <g mask="url(#${id}-mask)">
    ${radials}
    ${links}
    ${rings}
    ${river}
  </g>
  ${markers}
</svg>`
}

export { POINTS }
