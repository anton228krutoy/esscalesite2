import '../styles/tokens.css'
import '../styles/fonts.css'
import '../styles/base.css'
import '../styles/scandere.css'        /* каркас витрины проекта — общий со Scandere */
import '../styles/wearninglords.css'   /* цвета и лента снимков — свои */

/* Магнит — статическим импортом, а не через import(), как у Scandere.
   Третий динамический импорт на сайте заставляет Vite вынести
   preload-helper в отдельный чанк, а следом меняется порядок CSS
   на главной: case.css встаёт после main.css и растягивает заголовки
   секций. Модуль весит полтора килобайта и на сенсорном вводе сразу
   выходит — откладывать его загрузку незачем. */
import { initMagnetic } from './magnetic.js'

/* ============================================================
   Страница WearningLords.

   Тот же набор штрихов, что у страницы Scandere, минус карта:
   год в подвале, магнит на чипах и карточках, появление секций.
   Схема города здесь не нужна, поэтому ни map.js, ни case.css
   сюда не тянутся.
   ============================================================ */

const year = document.querySelector('[data-year]')
if (year) year.textContent = new Date().getFullYear()

/* Магнитная реакция на курсор — только на мышином вводе. */
initMagnetic()

/* Кнопка без готовой ссылки не должна вести в пустоту. */
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
     покачивание чипов, чтобы оно не работало за экраном. */
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
