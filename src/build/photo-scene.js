/* ============================================================
   Сцена GoPhoto в окне кейса на главной.

   GoPhoto — сервис для фотостудий, которые снимают мероприятия.
   Сцена — контактный лист съёмки: кадры приглушены, уголки
   видоискателя выделяют на нём несколько, а их копии лежат веером
   сбоку, как отобранные отпечатки. Справа — три этапа работы.

   Сюжеты кадров — то, что бывает на любом празднике: шары, торт,
   арка, конфетти, закат. Людей на кадрах нет: нарисованный человек
   читался бы как кадр из чьей-то настоящей съёмки. Число кадров
   в подписи — пример, а не чья-то статистика.

   Вся сцена декоративная: окно помечено aria-hidden, смысл кейса
   несёт подпись под ним. Поэтому здесь только span'ы и SVG —
   никаких заголовков, списков и картинок.
   ============================================================ */

/* Сюжеты кадров. Каждый нарисован градиентами в CSS, а не
   картинкой: кадров на листе шесть десятков, и файл на каждый
   стоил бы запросов больше, чем вся остальная главная. */
const MOTIFS = {
  s: 'sun',        // закат над водой
  b: 'bokeh',      // огни не в фокусе
  l: 'balloon',    // шары
  c: 'cake',       // торт со свечой
  f: 'confetti',   // конфетти
  w: 'window',     // окно зала
  m: 'hills',      // горы
  a: 'arch',       // арка с цветами
}

/* Контактный лист — как он выглядит в окне, строка к строке.
   Заглавная буква — подсвеченный кадр. Лист нарочно шире и выше
   окна: его края уходят за рамку и гаснут, и съёмка читается
   как «очень много», а не как пересчитанная сетка.

   Подсвеченные кадры стоят левее и выше середины: справа сверху
   плитки, слева снизу подпись, справа снизу — веер копий. Соседи
   по строке и столбцу не повторяются, иначе лист распадался бы
   на полосы одного цвета. */
const SHEET = [
  'msbwlcafs',
  'bwmfcalsw',
  'afCbLmwbc',
  'scmabwfcm',
  'lbwSfsbaf',
  'wmacblmwb',
  'clfmwbsca',
]

/* Знак GoPhoto: скруглённая рамка с наклоном и три точки.
   Стоит в подписи, а не отдельно в углу окна: одинокий знак
   поверх кадров читался бы как водяной знак на снимках. */
const MARK =
  '<svg class="photo__mark" viewBox="0 0 32 32" aria-hidden="true">' +
  '<g transform="rotate(-5 16 16)">' +
  '<rect x="4.5" y="4.5" width="23" height="23" rx="6" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
  '<circle cx="11.4" cy="11.4" r="2.9" class="photo__mark-dot"/>' +
  '<circle cx="20.6" cy="20.6" r="2.9" class="photo__mark-dot"/>' +
  '<circle cx="20.9" cy="11.1" r="1.8" class="photo__mark-dot"/>' +
  '</g></svg>'

/* Отметка на верхней копии — галочка, а не число: число читалось
   бы как чья-то статистика, галочка — как результат. */
const CHECK =
  '<svg class="photo__check" viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M4 8.4 L6.9 11.2 L12.2 5.2" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

/* Плитки — этапы работы со съёмкой. Полоса вместо спарклайна:
   у этапа есть степень готовности, а не история. Доли — пример.

   minor — плитка, которая уходит первой, когда окно в ленте
   становится ниже: без середины начало и конец пути понятны,
   без края — нет. */
const STEPS = [
  { label: 'Загрузка',  v: 1 },
  { label: 'Обработка', v: 0.86, minor: true },
  { label: 'Галерея',   v: 0.64 },
]

const isLit = ch => ch !== ch.toLowerCase()

/* Опечатка в листе роняет сборку, а не выпускает на главную
   кадр с классом photo__pic--undefined — пустой тёмный прямоугольник,
   который никто не заметит до первого внимательного взгляда. */
function motifOf(ch) {
  const motif = MOTIFS[ch.toLowerCase()]
  if (!motif) throw new Error(`[photo-scene] на листе неизвестный сюжет «${ch}»`)
  return motif
}

export function photoScene() {
  const cells = SHEET.flatMap(row => [...row])

  // Копии в веере — те же кадры, что подсвечены на листе. Берутся
  // из самого листа, а не перечисляются второй раз: иначе, поменяв
  // лист, легко получить веер из снимков, которых на нём нет.
  const lit = cells.filter(isLit).map(motifOf)

  let n = 0
  const sheet = cells.map(ch => isLit(ch)
    ? `<span class="photo__pic photo__pic--${motifOf(ch)} is-lit" style="--lit: ${n++}"></span>`
    : `<span class="photo__pic photo__pic--${motifOf(ch)}"></span>`
  ).join('')

  // --k — место в веере: 0 — верхняя копия. В разметке копии идут
  // от нижней к верхней, чтобы верхняя и рисовалась последней.
  const prints = lit.map((motif, k) => `
              <span class="photo__print photo__pic photo__pic--${motif}" style="--k: ${k}">${k === 0 ? `
                <span class="photo__badge">${CHECK}</span>` : ''}
              </span>`).reverse().join('')

  const steps = STEPS.map((s, i) => `
              <div class="tile${s.minor ? ' photo__minor' : ''}" style="--tile-i: ${i}">
                <span class="tile__label t-mono">${s.label}</span>
                <span class="photo__bar" style="--v: ${s.v}"></span>
              </div>`).join('')

  return `<div class="photo">
            <div class="photo__field">
              <div class="photo__sheet">${sheet}</div>
            </div>

            <div class="photo__stack">${prints}
            </div>

            <div class="case__hud">
              ${MARK}
              <span class="case__hud-title t-mono">Выпускной</span>
              <span class="case__hud-sub t-mono">1&nbsp;240 кадров</span>
            </div>

            <div class="case__tiles">${steps}
            </div>
          </div>`
}
