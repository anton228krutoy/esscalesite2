/* ============================================================
   Разметка страницы WearningLords — генерируется на сборке.

   Каркас и классы те же, что у страницы Scandere: обе страницы —
   витрины продуктов студии и должны читаться как одна серия.
   Своё здесь только содержание и лента снимков экрана вместо
   интерактивной карты.
   ============================================================ */

import { esc, nbsp } from './escape.js'
import { wearninglordsMark } from './wearninglords-mark.js'

const cards = list => list.map((m, i) => `
        <li class="s-card" style="--i: ${i}">
          <h3 class="s-card__title">${esc(m.title)}</h3>
          <p class="s-card__note">${esc(m.note)}</p>
        </li>`).join('')

/* Лента стоит третьей секцией и на первый экран не попадает ни
   на телефоне, ни на широком мониторе — поэтому lazy у всех трёх:
   первый экран не ждёт почти сотню килобайт картинок. */
const shots = ({ width, height, items }) => items.map(s => `
        <li class="w-shot">
          <figure class="w-shot__frame">
            <img src="${esc(s.src)}" width="${width}" height="${height}"
                 alt="${esc(s.alt)}" loading="lazy" decoding="async">
            <figcaption class="w-shot__caption t-mono">${esc(s.caption)}</figcaption>
          </figure>
        </li>`).join('')

/* «русский, английский и корейский» — перечисление по-русски,
   с «и» перед последним. */
const listRu = items => `${items.slice(0, -1).join(', ')} и ${items.at(-1)}`

export function renderWearninglords({ data, site }) {
  const dl = data.download
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
      <div class="s-hero__mark">${wearninglordsMark({ size: 104 })}</div>
      <h1 class="s-hero__title">${esc(data.title)}</h1>
      <p class="s-hero__kind t-mono">${esc(data.kind)}</p>
      <p class="s-hero__lede">${esc(data.lede)}</p>

      <div class="s-get">
        <a class="s-btn s-btn--primary" style="--i: 0"
           href="${esc(dl.href)}"
           ${dl.ready ? 'target="_blank" rel="noopener"' : 'aria-disabled="true" data-soon'}>
          <span class="s-btn__label">${esc(dl.label)}</span>
          <span class="s-btn__note t-mono">${esc(dl.note)}</span>
        </a>
      </div>
    </div>

    <a class="s-hero__next" href="#about" aria-label="Подробнее">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 4v15M6 13l6 6 6-6"/>
      </svg>
    </a>
  </section>

  <section class="s-section" id="about">
    <div class="s-wrap">
      <h2 class="s-h2">Как учит</h2>
      <ul class="s-chips" role="list">
        ${data.practice.map((m, i) => `<li class="s-chip" style="--i: ${i}">${esc(m)}</li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="s-section">
    <div class="s-wrap">
      <h2 class="s-h2">Как выглядит</h2>
      <p class="s-sub">Снимки с английским интерфейсом: главный экран, проверка ответа и статистика папки.</p>
      <!-- На телефоне лента прокручивается вбок, поэтому она
           фокусируемая область с подписью: иначе с клавиатуры
           до второго и третьего снимка не добраться. -->
      <ul class="w-shots" role="list" tabindex="0" aria-label="Снимки экрана WearningLords">
        ${shots(data.screens)}
      </ul>
    </div>
  </section>

  <section class="s-section">
    <div class="s-wrap">
      <h2 class="s-h2">Что внутри</h2>
      <ul class="s-grid" role="list">
        ${cards(data.features)}
      </ul>
    </div>
  </section>

  <section class="s-section">
    <div class="s-wrap">
      <h2 class="s-h2">Где работает</h2>
      <p class="s-sub">
        Одно приложение в App Store — для iPhone, iPad и Mac. Бесплатно, без регистрации,
        рекламы и встроенных покупок. Слова хранятся на самом устройстве, а на другое
        переносятся файлом.
      </p>
      <ul class="s-grid" role="list">
        ${cards(data.platforms)}
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
      <!-- Оценки в Esscale Points, как у Scandere, здесь нет: для этого
           проекта её не считали, а придуманная цифра хуже отсутствующей. -->
      <p class="s-facts__note">
        Интерфейс: ${esc(listRu(data.languages))}.
        Вопросы и предложения по приложению — в Telegram
        <a href="${esc(site.telegram)}" target="_blank" rel="noopener">${esc(site.telegramLabel)}</a>.
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
    <a class="t-mono" href="/wearninglords/privacy/">Конфиденциальность</a>
    <span class="t-mono">© <span data-year>2026</span> ${esc(site.name)}</span>
  </div>
</footer>`
}
