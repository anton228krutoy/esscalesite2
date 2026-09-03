/* ============================================================
   Генерация разметки секций из данных — на этапе сборки.

   Клиентский рендер здесь не годится: поисковик и превью в
   мессенджерах увидели бы пустую страницу. Поэтому данные
   остаются единственным источником правды, но в HTML они
   попадают заранее, а не в браузере.
   ============================================================ */

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

/* Неразрывный пробел перед единицей: «297 EP» не должно
   переноситься по строке. */
const nbsp = s => String(s).replace(/(\d)\s(EP|₽|недел)/g, '$1 $2')

export function renderExpertise(items) {
  return `
<section class="section expertise" id="expertise">
  <div class="container">
    <header class="sec-head">
      <p class="sec-head__label t-mono">Экспертиза</p>
      <h2 class="sec-head__title t-display">Чем мы занимаемся</h2>
    </header>
    <ul class="grid-list" role="list">
      ${items.map(it => `
      <li class="cell">
        <span class="cell__index t-mono">${esc(it.index)}</span>
        <h3 class="cell__title">${esc(it.title)}</h3>
        <p class="cell__text">${esc(it.summary)}</p>
        <ul class="tags" role="list">
          ${it.scope.map(s => `<li class="tag">${esc(s)}</li>`).join('')}
        </ul>
      </li>`).join('')}
    </ul>
  </div>
</section>`
}

export function renderServices(items) {
  return `
<section class="section services" id="services">
  <div class="container">
    <header class="sec-head">
      <p class="sec-head__label t-mono">Услуги</p>
      <h2 class="sec-head__title t-display">Что мы делаем</h2>
    </header>
    <ul class="rows" role="list">
      ${items.map(it => `
      <li class="row">
        <span class="row__index t-mono">${esc(it.index)}</span>
        <div class="row__main">
          <h3 class="row__title">${esc(it.title)}</h3>
          <p class="row__text">${esc(it.summary)}</p>
        </div>
        <ul class="tags tags--right" role="list">
          ${it.scope.map(s => `<li class="tag">${esc(s)}</li>`).join('')}
        </ul>
      </li>`).join('')}
    </ul>
  </div>
</section>`
}

export function renderProjects(items) {
  return `
<section class="section work" id="work">
  <div class="container">
    <header class="sec-head">
      <p class="sec-head__label t-mono">Работы</p>
      <h2 class="sec-head__title t-display">Избранные проекты</h2>
    </header>
    <ul class="work-list" role="list">
      ${items.map(p => `
      <li class="work-item${p.status === 'in-progress' ? ' work-item--wip' : ''}">
        <figure class="work-item__media">
          <img src="${esc(p.media.src)}" width="${p.media.width}" height="${p.media.height}"
               alt="${esc(p.title)} — ${esc(p.kind)}" loading="lazy" decoding="async">
        </figure>
        <div class="work-item__foot">
          <div class="work-item__id">
            <h3 class="work-item__title">${esc(p.title)}</h3>
            <p class="work-item__kind t-mono">${esc(p.kind)}</p>
          </div>
          ${p.metrics.length ? `
          <dl class="work-item__metrics">
            ${p.metrics.map(m => `
            <div class="metric">
              <dt class="metric__label t-mono">${esc(m.label)}</dt>
              <dd class="metric__value">${nbsp(esc(m.value))}</dd>
            </div>`).join('')}
          </dl>` : `<p class="work-item__status t-mono">В разработке</p>`}
        </div>
        <p class="work-item__text">${esc(p.summary)}</p>
      </li>`).join('')}
    </ul>
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
        Мы оцениваем задачи в Esscale Points по шкале Фибоначчи — 1, 2, 3, 5, 8, 13.
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
        <div class="result" data-result>
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

<footer class="footer">
  <div class="container footer__inner">
    <span class="t-mono">© <span data-year>2026</span> ${esc(site.name)}</span>
    <span class="t-mono">${esc(site.domain)}</span>
  </div>
</footer>`
}
