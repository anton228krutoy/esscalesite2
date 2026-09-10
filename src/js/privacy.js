import '../styles/tokens.css'
import '../styles/fonts.css'
import '../styles/base.css'
import '../styles/scandere.css'   /* шапка, подвал и колонка — как на странице проекта */
import '../styles/privacy.css'

/* ============================================================
   Политика конфиденциальности.

   Документ, а не витрина: ни карты, ни анимаций. Её открывают
   по ссылке из карточки App Store — в том числе ревьюер Apple,
   и на медленной сети она обязана появиться сразу.
   ============================================================ */

const year = document.querySelector('[data-year]')
if (year) year.textContent = new Date().getFullYear()
