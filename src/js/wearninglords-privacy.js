import '../styles/tokens.css'
import '../styles/fonts.css'
import '../styles/base.css'
import '../styles/scandere.css'              /* шапка, подвал и колонка — как на странице проекта */
import '../styles/wearninglords.css'         /* цвета приложения */
import '../styles/wearninglords-privacy.css' /* документ и переключатель языков */

/* ============================================================
   Политика конфиденциальности WearningLords.

   Документ собран как политика Scandere, но её скрипт privacy.js
   сюда не подключается: это точка входа другой страницы, и импорт
   одной точки входа из другой меняет то, как Vite собирает политику
   Scandere. Своего поведения нет: переключатель языков — обычные
   якорные ссылки, страница обязана открыться у ревьюера Apple сразу
   и без скриптов. Скрипт только ставит год в подвале.
   ============================================================ */

const year = document.querySelector('[data-year]')
if (year) year.textContent = new Date().getFullYear()
