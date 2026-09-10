/* ============================================================
   Разметка страницы проекта — генерируется на сборке.
   ============================================================ */

import { cityMap } from './city-map.js'
import { esc, nbsp } from './escape.js'
import { scandereMark } from './scandere-mark.js'



export function renderScandere({ data, site }) {
  const dl = site.downloads
  return `
<header class="s-top">
  <a class="s-top__back" href="/">
    <span class="s-top__arrow" aria-hidden="true">←</span>
    <span class="t-mono">Esscale</span>
  </a>
  <span class="s-top__here t-mono">Проект</span>
</header>

<main class="s-main">

  <section class="s-hero">
    <div class="s-wrap">
      <div class="s-hero__mark">${scandereMark({ id: 'hero', size: 104 })}</div>
      <h1 class="s-hero__title">${esc(data.title)}</h1>
      <p class="s-hero__kind t-mono">${esc(data.kind)}</p>
      <p class="s-hero__lede">${esc(data.lede)}</p>

      <div class="s-get">
        ${[
          { d: dl.rustore,  primary: true,  blank: true },
          { d: dl.appstore, primary: false, blank: true },
          { d: dl.windows,  primary: false, blank: false, external: true },
        ].map(({ d, primary, blank, external }, i) => `
        <a class="s-btn${primary ? ' s-btn--primary' : ''}" style="--i: ${i}"
           href="${esc(d.href)}"
           ${d.ready
             ? (blank ? 'target="_blank" rel="noopener"'
                      : (external ? 'rel="noopener"' : 'download'))
             : 'aria-disabled="true" data-soon'}>
          <span class="s-btn__label">${esc(d.label)}</span>
          <span class="s-btn__note t-mono">${esc(d.note)}</span>
        </a>`).join('')}
      </div>
    </div>
  </section>

  <section class="s-section">
    <div class="s-wrap">
      <h2 class="s-h2">Что считает</h2>
      <ul class="s-chips" role="list">
        ${data.metrics.map((m, i) => `<li class="s-chip" style="--i: ${i}">${esc(m)}</li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="s-section s-section--map">
    <div class="s-wrap">
      <h2 class="s-h2">Точки на карте</h2>
      <p class="s-sub">Площадки компании, их склады и показатели — в одном экране.</p>
      <div class="s-map" data-map>
        ${cityMap({ id: 'page', showLabels: true })}

        <!-- Панель заполняется по выбору точки; разметка та же,
             меняются только значения — поэтому её не собирают
             заново, а обновляют. -->
        <div class="s-map__panel" data-map-panel role="status" aria-live="polite">
          <span class="s-map__panel-title" data-panel-title>Заречная</span>
          <dl class="s-map__stats" data-panel-stats></dl>
        </div>

        <p class="s-map__hint t-mono">Выберите точку на схеме</p>
      </div>
    </div>
  </section>

  <section class="s-section">
    <div class="s-wrap">
      <h2 class="s-h2">Чем управляет</h2>
      <ul class="s-grid" role="list">
        ${data.modules.map((m, i) => `
        <li class="s-card" style="--i: ${i}">
          <h3 class="s-card__title">${esc(m.title)}</h3>
          <p class="s-card__note">${esc(m.note)}</p>
        </li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="s-section">
    <div class="s-wrap">
      <h2 class="s-h2">Связи с внешним миром</h2>
      <ul class="s-grid s-grid--wide" role="list">
        ${data.integrations.map((m, i) => `
        <li class="s-card" style="--i: ${i}">
          <h3 class="s-card__title">${esc(m.title)}</h3>
          <p class="s-card__note">${esc(m.note)}</p>
        </li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="s-section s-facts">
    <div class="s-wrap">
      <dl class="s-facts__list">
        ${data.facts.map(f => `
        <div class="s-fact">
          <dt class="s-fact__label t-mono">${esc(f.label)}</dt>
          <dd class="s-fact__value">${nbsp(esc(f.value))}</dd>
        </div>`).join('')}
      </dl>
      <p class="s-facts__note">
        Объём посчитан по методике Esscale Points — той же, что доступна
        <a href="/#estimate">в калькуляторе на сайте</a>.
      </p>
    </div>
  </section>

  <section class="s-cta">
    <div class="s-wrap">
      <h2 class="s-cta__title">Нужен такой же продукт?</h2>
      <p class="s-cta__text">Опишите задачу — вернёмся с декомпозицией и оценкой.</p>
      <a class="s-btn s-btn--primary" href="${esc(site.telegram)}" target="_blank" rel="noopener">
        <span class="s-btn__label">${esc(site.telegramLabel)}</span>
        <span class="s-btn__note t-mono">Telegram</span>
      </a>
    </div>
  </section>
</main>

<footer class="s-foot">
  <div class="s-wrap s-foot__inner">
    <a class="t-mono" href="/">esscale.ru</a>
    <a class="t-mono" href="/scandere/privacy/">Конфиденциальность</a>
    <span class="t-mono">© <span data-year>2026</span> ${esc(site.name)}</span>
  </div>
</footer>`
}
