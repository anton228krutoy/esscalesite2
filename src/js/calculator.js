import { site } from '../data/site.js'

/* ============================================================
   Расчёт в Esscale Points.

   Считает по той же методике, что и реальные проекты компании:
   базовые оценки блоков складываются, коэффициенты сложности
   умножают серверную часть (кроме инфраструктуры — её сложность
   от многопоточности не зависит).

   Проверка на эталоне из прайса: полный набор блоков с двумя
   коэффициентами 1,3 даёт ≈298 EP и 20 недель. В разобранном
   кейсе scandere — 297,18 EP и 20 недель.
   ============================================================ */

const fmt = new Intl.NumberFormat('ru-RU')

/* Округление вверх до «переговорного» шага: показывать
   1 233 297 ₽ было бы ложной точностью — это вилка, а не смета. */
const roundMoney = n => Math.round(n / 50_000) * 50_000

const plural = (n, forms) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return forms[0]
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1]
  return forms[2]
}

export function initCalculator(field) {
  const form = document.querySelector('[data-calc]')
  if (!form) return

  const outEP    = form.querySelector('[data-out-ep]')
  const outCost  = form.querySelector('[data-out-cost]')
  const outWeeks = form.querySelector('[data-out-weeks]')
  const breakdown = form.querySelector('[data-breakdown]')
  const tgLink   = form.querySelector('[data-tg-link]')

  function compute() {
    const modules = [...form.querySelectorAll('input[name="module"]:checked')]
    const coefs   = [...form.querySelectorAll('input[name="multiplier"]:checked')]

    let multipliable = 0   // серверные блоки — на них действуют коэффициенты
    let flat = 0           // инфраструктура и мобильный клиент
    const picked = []

    for (const el of modules) {
      const ep = Number(el.dataset.ep)
      const isServer = el.dataset.track === 'backend' && !el.dataset.noMultiplier
      if (isServer) multipliable += ep
      else flat += ep
      picked.push({
        title: el.closest('.opt').querySelector('.opt__title').textContent,
        ep,
      })
    }

    const factor = coefs.reduce((a, el) => a * Number(el.dataset.factor), 1)
    const total = multipliable * factor + flat

    return { total, factor, picked, coefs: coefs.map(el =>
      el.closest('.opt').querySelector('.opt__title').textContent) }
  }

  function render() {
    const { total, factor, picked, coefs } = compute()
    const ep = Math.round(total)

    outEP.textContent = ep ? `${fmt.format(ep)} EP` : '0 EP'

    if (!ep) {
      outCost.textContent = '—'
      outWeeks.textContent = '—'
      breakdown.innerHTML = '<li class="breakdown__empty">Отметьте, что нужно в проекте.</li>'
      field?.setDensity(9)
      field?.setSignalMix(0)
      updateLink(0, 0, [], [])
      return
    }

    const { min, max } = site.pricing.rublesPerEP
    const lo = roundMoney(total * min)
    const hi = roundMoney(total * max)
    outCost.textContent = `${fmt.format(lo)} — ${fmt.format(hi)} ₽`

    const weeks = Math.round(total / site.pricing.velocityPerWeek)
    outWeeks.textContent = `${weeks} ${plural(weeks, ['неделя', 'недели', 'недель'])}`

    breakdown.innerHTML = [
      ...picked.map(p => `<li class="breakdown__row"><span>${p.title}</span><span class="t-mono">${p.ep} EP</span></li>`),
      coefs.length
        ? `<li class="breakdown__row breakdown__row--coef"><span>Коэффициенты: ${coefs.join(', ')}</span><span class="t-mono">×${String(factor.toFixed(2)).replace('.', ',')}</span></li>`
        : '',
    ].join('')

    /* Здесь фон перестаёт быть украшением: чем больше набран
       объём работ, тем плотнее изолинии поля. Расчёт и сцена —
       одна система, а не картинка и форма поверх неё. */
    field?.setDensity(9 + Math.min(total / 300, 1) * 16)
    field?.setSignalMix(Math.min(total / 260, 1))

    updateLink(ep, weeks, picked, coefs)
  }

  /* Человек приходит в чат с готовым брифом, а не с «здравствуйте». */
  function updateLink(ep, weeks, picked, coefs) {
    if (!tgLink) return
    if (!ep) { tgLink.href = site.telegram; return }
    const lines = [
      'Здравствуйте! Посчитал проект на сайте:',
      '',
      ...picked.map(p => `• ${p.title} — ${p.ep} EP`),
      ...(coefs.length ? [`• Коэффициенты: ${coefs.join(', ')}`] : []),
      '',
      `Итого ≈ ${fmt.format(ep)} EP, ориентировочно ${weeks} ${plural(weeks, ['неделя', 'недели', 'недель'])}.`,
      'Хочу обсудить детали.',
    ]
    tgLink.href = `${site.telegram}?text=${encodeURIComponent(lines.join('\n'))}`
  }

  form.addEventListener('change', render)
  render()
}
