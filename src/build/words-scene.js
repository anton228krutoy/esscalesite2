/* ============================================================
   Сцена WearningLords в окне кейса на главной.

   Та же идея, что у Scandere: не скриншот, а интерфейс
   приложения, пересобранный вёрсткой в языке сайта. Вместо
   схемы города — колода карточек: на верхней проверяется
   набранный ответ, за ней видны слова из того же топика.

   Подписи — настоящие строки русской локализации приложения
   («Термин», «Значение», «Верно, есть и другие значения»,
   «Карточка 3 из 6»), а не пересказ: витрина не должна обещать
   экран, которого нет. Слова — из демонстрационного набора
   приложения (топик Everyday Verbs): тот же hablar и та же
   «карточка 3 из 6», что на снимке на странице проекта. Числа
   в плитках — пример, а не чья-то статистика.

   Вся сцена декоративная: окно помечено aria-hidden, смысл кейса
   несёт подпись ссылки. Поэтому здесь только span'ы и SVG —
   никаких заголовков и списков, которые скринридер всё равно
   не увидит.
   ============================================================ */

/* Значок частично верного ответа — полукруг, как в самом
   приложении. Нарисован, а не взят символом шрифта: ◐ в разных
   системах выглядит по-разному, а местами не выглядит никак. */
const HALF =
  '<svg class="words__half" viewBox="0 0 16 16" aria-hidden="true">' +
  '<circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
  '<path d="M8 1.75 A6.25 6.25 0 0 0 8 14.25 Z" fill="currentColor"/></svg>'

const CHECK =
  '<svg class="words__check" viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M3.5 8.4 L6.6 11.4 L12.5 4.8" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

/* Верхняя карточка. У слова два значения, набрано одно — поэтому
   ответ засчитан частично: это правило приложения, и оно же
   объясняет полукруг в поле ответа. */
const FRONT = { term: 'hablar', meaning: 'to speak, to talk', typed: 'to speak' }

/* Слова за верхней карточкой: видна только их верхняя строка,
   как у карточек в картотеке. У дальней — отметка «Выучено»,
   та самая, ради которой считаются три дня. */
const BEHIND = [
  { term: 'vivir', meaning: 'to live', learned: true },
  { term: 'leer', meaning: 'to read' },
]

/* Рост словаря — растущая ступенчатая линия, как график
   «Количество слов» в статистике приложения. Форма без чисел:
   характер, не отчёт. */
const GROWTH = 'M1 18 L8 17 L13 15 L20 15 L25 12 L32 11 L37 9 L44 9 L49 6 L56 5 L63 2'

/* «Выучено» — это верные ответы в три разных дня без ошибок
   между ними. Два дня уже засчитаны, третий впереди: так правило
   видно без единого слова пояснения. */
const DAYS = [
  { label: 'Пн', done: true },
  { label: 'Ср', done: true },
  { label: 'Пт', done: false },
]

export function wordsScene() {
  // --k — глубина: чем дальше карточка, тем выше, уже и темнее.
  const behind = BEHIND.map((w, i) => `
                <span class="words__card words__card--back" style="--k: ${BEHIND.length - i}">
                  <span class="words__peek">
                    <span class="words__peek-term">${w.term}</span>
                    <span class="words__peek-meaning">${w.meaning}</span>
                    ${w.learned ? `<span class="words__badge t-mono">${CHECK}Выучено</span>` : ''}
                  </span>
                </span>`).join('')

  const days = DAYS.map(d => `
                <span class="words__day${d.done ? ' is-done' : ''}">${d.done ? CHECK : ''}${d.label}</span>`).join('')

  return `<div class="words">
            <div class="words__stack">
              <div class="words__deck">${behind}
                <span class="words__card words__card--front">
                  <span class="words__label words__label--term t-mono">Термин</span>
                  <span class="words__term">${FRONT.term}</span>
                  <span class="words__verdict">${HALF}Верно, есть и другие значения</span>
                  <span class="words__label t-mono">Значение</span>
                  <span class="words__meaning">${FRONT.meaning}</span>
                </span>
              </div>

              <span class="words__answer">
                <span class="words__typed">${FRONT.typed}<span class="words__caret"></span></span>
                ${HALF}
              </span>
            </div>
          </div>

          <div class="case__hud">
            <span class="case__hud-title t-mono">Everyday Verbs</span>
            <span class="case__hud-sub t-mono">Карточка 3 из 6</span>
          </div>

          <div class="case__tiles">
            <div class="tile" style="--tile-i: 0">
              <span class="tile__label t-mono">Словарь</span>
              <svg class="tile__spark" viewBox="0 0 64 20" aria-hidden="true" preserveAspectRatio="none">
                <path d="${GROWTH}" fill="none" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="tile" style="--tile-i: 1">
              <span class="tile__label t-mono">Выучено</span>
              <span class="words__days">${days}
              </span>
            </div>
            <div class="tile" style="--tile-i: 2">
              <span class="tile__label t-mono">Точность</span>
              <span class="words__bar" style="--v: 0.83"></span>
            </div>
          </div>`
}
