// --- БУРГЕР-МЕНЮ (существующий код с дополнением) ---
const menuBtn = document.querySelector('.menu-btn');
const menuNav = document.querySelector('.menu');
const menuLinks = document.querySelectorAll('.menu__link');
// НОВЫЙ ЭЛЕМЕНТ: Находим кнопку "Работа с нами" в мобильном меню
const menuWorkWithBtn = document.querySelector('.menu__workwith');

const toggleMenu = () => {
    menuNav.classList.toggle('menu--open');
    document.body.classList.toggle('no-scroll');
};

if (menuBtn && menuNav) {
    menuBtn.addEventListener('click', toggleMenu);
}

const closeMenu = () => {
    menuNav.classList.remove('menu--open');
    document.body.classList.remove('no-scroll');
};

// Вешаем обработчик клика на каждую ссылку в меню
if (menuLinks.length > 0) {
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}
// НОВЫЙ ОБРАБОТЧИК: Вешаем обработчик клика на кнопку "Работа с нами"
if (menuWorkWithBtn) {
    menuWorkWithBtn.addEventListener('click', closeMenu);
}


// --- ЭФФЕКТ ПРОКРУТКИ ФОНОВОГО ВИДЕО ---
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bg-video');
    if (!video) return;

    const handleScroll = () => {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const videoPosition = scrollPercent * 100;
        video.style.objectPosition = `center ${videoPosition}%`;
    };

    window.addEventListener('scroll', handleScroll);
});


// --- ФИЛЬТРАЦИЯ В ПОРТФОЛИО ---
document.addEventListener('DOMContentLoaded', () => {
    const filterContainer = document.querySelector('.portfolio__filters');
    if (!filterContainer) return;

    const filterButtons = filterContainer.querySelectorAll('.portfolio__filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio__item');

    filterContainer.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.portfolio__filter-btn');
        if (!targetButton) return;

        const filterValue = targetButton.dataset.filter;

        filterButtons.forEach(button => button.classList.remove('active'));
        targetButton.classList.add('active');

        portfolioItems.forEach(item => {
            const itemCategory = item.dataset.category;

            if (filterValue === 'all' || itemCategory === filterValue) {
                item.classList.remove('hidden');
                item.style.display = 'flex';
                item.style.gap = '5%';
                item.style.margin = '0 0 80px 0';
                item.style.border = '1px solid var(--border-color)';
            } else {
                item.classList.add('hidden');
                setTimeout(() => {
                     if (item.classList.contains('hidden')) {
                        item.style.display = 'none';
                     }
                }, 400); 
            }
        });
        
        const visibleItems = [...portfolioItems].filter(item => item.style.display !== 'none');
        if (visibleItems.length > 0) {
            visibleItems.forEach(item => item.style.marginBottom = '80px');
            visibleItems[visibleItems.length - 1].style.marginBottom = '0';
        }
    });
});