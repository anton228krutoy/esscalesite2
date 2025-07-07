// --- БУРГЕР-МЕНЮ ---
const menuBtn = document.querySelector('.menu-btn'); /* Находит кнопку-бургер */
const menuNav = document.querySelector('.menu');  /* Находит само меню */
const menuLinks = document.querySelectorAll('.menu__link');  /* Находит все ссылки внутри меню */
const menuWorkWithBtn = document.querySelector('.menu__workwith'); /* находит кнопку "Работа с нами" внутри меню */

const toggleMenu = () => {         /* Функция, которая переключает классы. Она идеально подходит для открытия/закрытия меню по клику на бургер */
    menuNav.classList.toggle('menu--open');
    document.body.classList.toggle('no-scroll');
};

if (menuBtn && menuNav) {
    menuBtn.addEventListener('click', toggleMenu);  /* Привязывает открытие/закрытие к кнопке */
}

const closeMenu = () => {          /* Функция, которая только убирает классы */
    menuNav.classList.remove('menu--open');
    document.body.classList.remove('no-scroll');
};

if (menuLinks.length > 0) {
    menuLinks.forEach(link => {    /* Привязывает закрытие меню к каждой ссылке */
        link.addEventListener('click', closeMenu);
    });
}
if (menuWorkWithBtn) {
    menuWorkWithBtn.addEventListener('click', closeMenu);   /* Привязывает закрытие меню к кнопке "Работа с нами" */
}
