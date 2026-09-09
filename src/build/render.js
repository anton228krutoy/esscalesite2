/* ============================================================
   Генерация разметки секций из данных — на этапе сборки.

   Клиентский рендер здесь не годится: поисковик и превью в
   мессенджерах увидели бы пустую страницу. Поэтому данные
   остаются единственным источником правды, но в HTML они
   попадают заранее, а не в браузере.
   ============================================================ */

import { cityMap } from './city-map.js'
import { esc, nbsp } from './escape.js'

/* Спарклайны — форма без числовых подписей: показывают характер
   метрики, но не выдают чужие финансовые данные. */
const SPARKS = [
  'M1 15 L10 12 L19 14 L28 8 L37 9 L46 4 L55 6 L63 2',
  'M1 11 L10 13 L19 9 L28 10 L37 6 L46 8 L55 5 L63 5',
  'M1 17 L10 14 L19 15 L28 11 L37 13 L46 7 L55 9 L63 4',
]



export function renderDirections(items) {
  return `
<section class="section dirs" id="directions" data-dirs>
  <div class="container">
    <header class="sec-head sec-head--split">
      <h2 class="sec-head__title t-display">Направления</h2>
      <p class="sec-head__aside">
        Наводите на строку — увидите, из чего складывается работа.
      </p>
    </header>

    <ul class="dir-list" role="list">
      ${items.map((d, i) => `
      <li class="dir${i === 0 ? ' is-active' : ''}" data-dir style="--dir-rgb: ${d.accent}">
        <button class="dir__head" type="button" aria-expanded="${i === 0}" aria-controls="dir-${d.id}">
          <span class="dir__index t-mono">${esc(d.index)}</span>
          <span class="dir__title">${esc(d.title)}</span>
          <span class="dir__sign" aria-hidden="true"></span>
        </button>
        <div class="dir__body" id="dir-${d.id}"${i === 0 ? '' : ' inert'}>
          <div class="dir__inner">
            <p class="dir__text">${esc(d.summary)}</p>
            <ul class="dir__scope" role="list">
              ${d.scope.map(x => `<li>${esc(x)}</li>`).join('')}
            </ul>
          </div>
        </div>
      </li>`).join('')}
    </ul>
  </div>
</section>`
}

export function renderProjects(items) {
  const p = items[0]
  if (!p) return ''
  return `
<section class="section showcase" id="work">
  <div class="container">
    <header class="sec-head sec-head--split">
      <h2 class="sec-head__title t-display">Работы</h2>
      <p class="sec-head__aside">Пока один проект — зато разобранный до последней задачи.</p>
    </header>

    <a class="case" href="${esc(p.href || '#')}" data-case
       aria-label="${esc(p.title)} — ${esc(p.kind)}. Открыть страницу проекта">
      <div class="case__window" data-case-window aria-hidden="true">
        <div class="case__scene" data-case-scene>
          ${cityMap({ id: 'case' })}

          <div class="case__hud">
            <span class="case__hud-title t-mono">Заречная</span>
            <span class="case__hud-sub t-mono">4 точки в сети</span>
          </div>

          <div class="case__tiles">
            ${['Выручка', 'Прибыль', 'Маржинальность'].map((label, i) => `
            <div class="tile" style="--tile-i: ${i}">
              <span class="tile__label t-mono">${label}</span>
              <svg class="tile__spark" viewBox="0 0 64 20" aria-hidden="true" preserveAspectRatio="none">
                <path d="${SPARKS[i]}" fill="none" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>`).join('')}
          </div>
        </div>

        <span class="case__sheen" data-case-sheen aria-hidden="true"></span>
        <span class="case__cue t-mono" data-case-cue aria-hidden="true">Открыть<span class="case__cue-arrow">↗</span></span>
      </div>

      <div class="case__meta">
        <div class="case__id">
          <h3 class="case__title">${esc(p.title)}</h3>
          <p class="case__kind t-mono">${esc(p.kind)}</p>
        </div>
        <dl class="case__metrics">
          ${p.metrics.map(m => `
          <div class="metric">
            <dt class="metric__label t-mono">${esc(m.label)}</dt>
            <dd class="metric__value">${nbsp(esc(m.value))}</dd>
          </div>`).join('')}
        </dl>
      </div>

      <p class="case__text">${esc(p.summary)}</p>
    </a>
  </div>
</section>`
}

export function renderEstimate({ tracks, multipliers, site }) {
  const money = n => new Intl.NumberFormat('ru-RU').format(n)
  return `
<section class="section estimate" id="estimate">
  <div class="container">
    <header class="sec-head">
      <p class="sec-head__label t-mono">Расчёт</p>
      <h2 class="sec-head__title t-display">Сколько это стоит</h2>
      <p class="sec-head__lede">
        Мы оцениваем задачи в Esscale Points — собственных единицах трудоёмкости.
        Отметьте, что нужно в проекте, и увидите объём работ, срок и вилку
        стоимости, посчитанные по той же методике, по которой мы считаем реальные проекты.
      </p>
    </header>

    <form class="calc" data-calc>
      <div class="calc__tracks">
        ${tracks.map(t => `
        <fieldset class="track" data-track="${esc(t.id)}">
          <legend class="track__legend">
            <span class="track__title">${esc(t.title)}</span>
            <span class="track__hint t-mono">${esc(t.hint)}</span>
          </legend>
          ${t.modules.map(m => `
          <label class="opt">
            <input type="checkbox" class="opt__box" name="module" value="${esc(m.id)}"
                   data-ep="${m.ep}" data-track="${esc(t.id)}"
                   ${m.noMultiplier ? 'data-no-multiplier="1"' : ''}
                   ${m.required ? 'checked' : ''}>
            <span class="opt__body">
              <span class="opt__title">${esc(m.title)}</span>
              <span class="opt__hint">${esc(m.hint)}</span>
            </span>
            <span class="opt__ep t-mono">${m.ep} EP</span>
          </label>`).join('')}
        </fieldset>`).join('')}

        <fieldset class="track track--coef">
          <legend class="track__legend">
            <span class="track__title">Коэффициенты сложности</span>
            <span class="track__hint t-mono">умножают оценку серверной части</span>
          </legend>
          ${multipliers.map(m => `
          <label class="opt">
            <input type="checkbox" class="opt__box" name="multiplier" value="${esc(m.id)}"
                   data-factor="${m.factor}">
            <span class="opt__body">
              <span class="opt__title">${esc(m.title)}</span>
              <span class="opt__hint">${esc(m.hint)}</span>
            </span>
            <span class="opt__ep t-mono">×${String(m.factor).replace('.', ',')}</span>
          </label>`).join('')}
        </fieldset>
      </div>

      <aside class="calc__result">
        <div class="result" data-result role="status" aria-live="polite">
          <div class="result__row">
            <span class="result__label t-mono">Объём работ</span>
            <strong class="result__value" data-out-ep>0 EP</strong>
          </div>
          <div class="result__row">
            <span class="result__label t-mono">Стоимость</span>
            <strong class="result__value" data-out-cost>—</strong>
          </div>
          <div class="result__row">
            <span class="result__label t-mono">Срок</span>
            <strong class="result__value" data-out-weeks>—</strong>
          </div>

          <details class="result__how">
            <summary class="t-mono">Как это посчитано</summary>
            <ul class="breakdown" data-breakdown role="list"></ul>
            <p class="result__note">
              Скорость команды — ${site.pricing.velocityPerWeek} EP в неделю.
              Стоимость одного EP зависит от состава команды на проекте,
              поэтому здесь вилка: ${money(site.pricing.rublesPerEP.min)}–${money(site.pricing.rublesPerEP.max)} ₽.
              Точную оценку даём после декомпозиции задачи.
            </p>
          </details>

          <a class="btn" data-tg-link href="${esc(site.telegram)}" target="_blank" rel="noopener">
            <span>Обсудить проект</span>
            <span class="btn__arrow" aria-hidden="true">→</span>
          </a>
          <p class="result__hint">Расчёт подставится в сообщение — не придётся объяснять заново.</p>
        </div>
      </aside>
    </form>
  </div>
</section>`
}

export function renderContact(site) {
  return `
<section class="section contact" id="contact">
  <div class="container container--narrow">
    <p class="contact__label t-mono">Контакт</p>
    <h2 class="contact__title t-display">Расскажите, что нужно построить</h2>
    <p class="contact__text">
      Опишите задачу — вернёмся с декомпозицией и оценкой в Esscale Points.
      Первичная консультация бесплатна.
    </p>
    <a class="btn btn--lg" href="${esc(site.telegram)}" target="_blank" rel="noopener">
      <span>${esc(site.telegramLabel)}</span>
      <span class="btn__arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>

</main>

<footer class="footer">
  <div class="container footer__inner">
    <span class="t-mono">© <span data-year>2026</span> ${esc(site.name)}</span>
    <span class="t-mono">${esc(site.domain)}</span>
  </div>
</footer>`
}
