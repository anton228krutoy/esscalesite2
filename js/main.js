// --- БУРГЕР-МЕНЮ (существующий код) ---
const menuBtn = document.querySelector('.menu-btn');
const menuNav = document.querySelector('.menu');
const menuLinks = document.querySelectorAll('.menu__link');

const toggleMenu = () => {
    menuNav.classList.toggle('menu--open');
    // Добавим блокировку скролла страницы при открытом меню
    document.body.classList.toggle('no-scroll');
};

if (menuBtn && menuNav) {
    menuBtn.addEventListener('click', toggleMenu);
}

const closeMenu = () => {
    menuNav.classList.remove('menu--open');
    document.body.classList.remove('no-scroll');
};

if (menuLinks.length > 0) {
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}


// --- НОВЫЙ КОД: 1. ЭФФЕКТ ПРОКРУТКИ ФОНОВОГО ВИДЕО ---
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bg-video');
    if (!video) return;

    // Функция, которая будет обновлять позицию видео
    const handleScroll = () => {
        // Вычисляем процент прокрутки страницы (от 0 до 1)
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        
        // Преобразуем процент в значение от 0 до 100 для CSS
        // Мы используем диапазон от 0% до 100% для object-position, 
        // где 0% - верх видео, 100% - низ видео.
        const videoPosition = scrollPercent * 100;

        // Применяем стиль к видео. Мы меняем вертикальную позицию.
        video.style.objectPosition = `center ${videoPosition}%`;
    };

    // Вешаем обработчик на событие скролла
    window.addEventListener('scroll', handleScroll);
});


// --- НОВЫЙ КОД: 2. ФИЛЬТРАЦИЯ В ПОРТФОЛИО ---
document.addEventListener('DOMContentLoaded', () => {
    const filterContainer = document.querySelector('.portfolio__filters');
    if (!filterContainer) return;

    const filterButtons = filterContainer.querySelectorAll('.portfolio__filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio__item');

    filterContainer.addEventListener('click', (event) => {
        // Убеждаемся, что кликнули именно по кнопке
        const targetButton = event.target.closest('.portfolio__filter-btn');
        if (!targetButton) return;

        // Получаем значение data-filter из нажатой кнопки
        const filterValue = targetButton.dataset.filter;

        // Обновляем активный класс у кнопок
        filterButtons.forEach(button => button.classList.remove('active'));
        targetButton.classList.add('active');

        // Фильтруем элементы
        portfolioItems.forEach(item => {
            const itemCategory = item.dataset.category;

            // Если категория совпадает или выбрана кнопка "Все проекты"
            if (filterValue === 'all' || itemCategory === filterValue) {
                // Показываем элемент
                item.classList.remove('hidden');
                // Убираем display: none, если он был
                item.style.display = 'flex';
                item.style.gap = '5%';
                item.style.margin = '0 0 80px 0'; // Возвращаем отступ, если он был обнулен
                item.style.border = '1px solid var(--border-color)';
                
            } else {
                // Сначала добавляем класс для анимации скрытия
                item.classList.add('hidden');
                // Ждем окончания анимации (в CSS transition: 0.4s), а затем скрываем полностью
                setTimeout(() => {
                    // Это нужно, чтобы элемент не занимал место после анимации
                     if (item.classList.contains('hidden')) {
                        item.style.display = 'none';
                     }
                }, 400); // 400ms - время анимации
            }
        });
        
        // Корректируем последний элемент, чтобы у него не было нижнего отступа
        const visibleItems = [...portfolioItems].filter(item => item.style.display !== 'none');
        if (visibleItems.length > 0) {
            visibleItems.forEach(item => item.style.marginBottom = '80px'); // Сначала ставим всем
            visibleItems[visibleItems.length - 1].style.marginBottom = '0'; // Убираем у последнего
        }
    });
});