import '../styles/tokens.css'
import '../styles/fonts.css'
import '../styles/base.css'
import '../styles/case.css'      /* схема города переиспользуется */
import '../styles/scandere.css'

/* ============================================================
   Страница проекта.

   Тяжёлого здесь нет намеренно: это витрина продукта, её
   открывают по ссылке из работ и с телефона. Ни WebGL, ни
   плавного скролла — только разметка, стили и два штриха
   на скрипте.
   ============================================================ */

const year = document.querySelector('[data-year]')
if (year) year.textContent = new Date().getFullYear()

/* Выбор точки на схеме. */
import('./map.js').then(m => m.initMap())

/* Магнитная реакция на курсор — только на мышином вводе. */
import('./magnetic.js').then(m => m.initMagnetic())

/* Кнопки без готовой ссылки не должны вести в пустоту. */
for (const el of document.querySelectorAll('[data-soon]')) {
  el.addEventListener('click', e => e.preventDefault())
}

/* Появление секций. IntersectionObserver, а не обработчик
   скролла: браузер считает пересечения сам. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const items = document.querySelectorAll('.s-section, .s-cta')

if (reduce) {
  items.forEach(el => el.setAttribute('data-in', ''))
} else {
  /* data-in ставится один раз — это появление.
     data-visible живёт, пока секция в кадре: к нему привязано
     покачивание, чтобы оно не работало за экраном. */
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.setAttribute('data-in', '')
        e.target.toggleAttribute('data-visible', e.isIntersecting)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  )
  items.forEach(el => io.observe(el))
}

/* Стрелка «дальше». В разметке она спрятана, и показываем её, только
   если круг целиком помещается в первый экран и не ближе 8 px
   к нижнему краю. Высота первого экрана без шапки — его min-height,
   поэтому край окна считаем от его верха.

   Пересчёт — и по размеру блока (поворот телефона, догрузка шрифта),
   и по размеру окна: когда блок вырос по содержимому, смена высоты
   окна его размер не трогает, а край окна сдвигает. */
const hero = document.querySelector('.s-hero')
const next = hero?.querySelector('.s-hero__next')
const target = document.getElementById('about')

if (next) {
  const fit = () => {
    const fold = parseFloat(getComputedStyle(hero).minHeight)
    const end = next.getBoundingClientRect().bottom - hero.getBoundingClientRect().top
    next.toggleAttribute('data-off', end > fold - 8)
  }
  new ResizeObserver(fit).observe(hero)
  addEventListener('resize', fit, { passive: true })

  /* Прокрутка скриптом, а не переходом по якорю: адрес не меняется
     и в истории не остаётся лишней записи. Иначе «Назад» сначала
     возвращал бы к первому экрану, а не уводил со страницы, а ссылка,
     скопированная после нажатия, открывалась бы сразу на описании —
     без названия и кнопок скачивания. */
  next.addEventListener('click', e => {
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  })
}
