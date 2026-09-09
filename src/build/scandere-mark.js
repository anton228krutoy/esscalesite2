/* ============================================================
   Знак Scandere.

   Пересобран вектором по фирменному знаку приложения: круг
   с мятным градиентом, внутри — ветвящееся дерево, прорезанное
   в круге насквозь (ветви показывают фон, а не нарисованы
   поверх). Растровую иконку сюда не кладём: она бы мылилась
   на крупных экранах и не тянула бы цвет из темы.
   ============================================================ */

export function scandereMark({ id = 'mark', size = 96 } = {}) {
  return `
<svg class="mark" width="${size}" height="${size}" viewBox="0 0 120 120"
     role="img" aria-label="Знак приложения Scandere" focusable="false">
  <defs>
    <linearGradient id="${id}-fill" x1="30%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%"   stop-color="var(--mark-top)"/>
      <stop offset="100%" stop-color="var(--mark-bottom)"/>
    </linearGradient>

    <mask id="${id}-cut">
      <rect width="120" height="120" fill="black"/>
      <circle cx="60" cy="60" r="46" fill="white"/>
      <!-- Ветви вырезаны из круга: чёрное в маске = прозрачное -->
      <g fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round">
        <path d="M60 106 L60 66" stroke-width="7"/>
        <path d="M60 74 C60 62, 52 56, 40 50 C31 45, 26 40, 22 33" stroke-width="6"/>
        <path d="M60 68 C60 56, 68 50, 80 45 C89 41, 95 37, 100 31" stroke-width="6"/>
        <path d="M60 58 C60 46, 57 38, 50 26" stroke-width="5.5"/>
        <path d="M61 52 C64 42, 70 34, 79 26" stroke-width="5"/>
        <path d="M59 88 C52 84, 45 82, 34 81" stroke-width="5"/>
        <path d="M61 94 C68 90, 76 88, 86 87" stroke-width="4.5"/>
      </g>
    </mask>
  </defs>

  <circle cx="60" cy="60" r="46" fill="url(#${id}-fill)" mask="url(#${id}-cut)"/>
</svg>`
}
