// Находим нужные элементы на странице
const menuBtn = document.querySelector('.menu-btn');
const menuNav = document.querySelector('.menu');
const menuLinks = document.querySelectorAll('.menu__link');

// Функция для переключения меню
const toggleMenu = () => {
    menuNav.classList.toggle('menu--open');
};

// Вешаем обработчик клика на кнопку "бургер"
if (menuBtn && menuNav) {
    menuBtn.addEventListener('click', toggleMenu);
}

// Функция для закрытия меню
const closeMenu = () => {
    menuNav.classList.remove('menu--open');
};

// Вешаем обработчик клика на каждую ссылку в меню
// чтобы меню закрывалось после выбора пункта
if (menuLinks.length > 0) {
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}