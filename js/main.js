// --- НОВЫЙ, ОБЪЕДИНЕННЫЙ main.js ---

document.addEventListener('DOMContentLoaded', () => {

    // Инициализируем все модули после загрузки DOM
    initBurgerMenu();
    initSmoothScroll();
    initPortfolioFilter();
    initHeadlineAnimation();
    initAccordions();
    initScrollAnimations();

});

/**
 * Модуль: Бургер-меню
 */
function initBurgerMenu() {
    const menuBtn = document.querySelector('.menu-btn');
    const menuNav = document.querySelector('.menu');
    const menuLinks = document.querySelectorAll('.menu__link');
    const menuWorkWithBtn = document.querySelector('.menu__workwith');

    if (!menuBtn || !menuNav) return;

    const toggleMenu = () => {
        menuNav.classList.toggle('menu--open');
        document.body.classList.toggle('no-scroll');
    };

    const closeMenu = () => {
        menuNav.classList.remove('menu--open');
        document.body.classList.remove('no-scroll');
    };

    menuBtn.addEventListener('click', toggleMenu);
    
    menuLinks.forEach(link => link.addEventListener('click', closeMenu));
    if (menuWorkWithBtn) {
        menuWorkWithBtn.addEventListener('click', closeMenu);
    }
}

/**
 * Модуль: Плавная прокрутка к якорям
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId.length > 1) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

/**
 * Модуль: Фильтрация в портфолио
 * УЛУЧШЕНО: Максимально плавный вариант без скачков. Управляет только классами,
 * а затем корректирует отступ у последнего видимого элемента.
 */
function initPortfolioFilter() {
    const filterContainer = document.querySelector('.portfolio__filters');
    if (!filterContainer) return;

    const filterButtons = filterContainer.querySelectorAll('.portfolio__filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio__item');
    
    const updateLastItemMargin = () => {
        // Сначала сбрасываем стили у всех элементов
        portfolioItems.forEach(item => item.style.marginBottom = '');
        
        // Находим все видимые элементы
        const visibleItems = document.querySelectorAll('.portfolio__item:not(.hidden)');
        
        if (visibleItems.length > 0) {
            // Убираем отступ у последнего видимого элемента
            visibleItems[visibleItems.length - 1].style.marginBottom = '0';
        }
    };

    filterContainer.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.portfolio__filter-btn');
        if (!targetButton || targetButton.classList.contains('active')) return;

        filterButtons.forEach(button => button.classList.remove('active'));
        targetButton.classList.add('active');

        const filterValue = targetButton.dataset.filter;

        portfolioItems.forEach(item => {
            const itemCategory = item.dataset.category;
            const shouldBeVisible = (filterValue === 'all' || itemCategory === filterValue);
            
            if (shouldBeVisible) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });

        // После применения классов, обновляем отступ
        // Делаем это с небольшой задержкой, чтобы дождаться окончания CSS-анимации
        setTimeout(updateLastItemMargin, 400); 
    });

    // Вызываем функцию при загрузке страницы для начальной установки
    updateLastItemMargin();
}


/**
 * Модуль: Анимация печати для заголовка
 */
function initHeadlineAnimation() {
    const mainTitle = document.querySelector('.title__company');
    const subTitle = document.querySelector('.title__accent');
    
    if (!mainTitle || !subTitle) return;

    function typeWriter(element, text, speed) {
        return new Promise((resolve) => {
            element.style.visibility = 'visible';
            element.textContent = '';
            element.classList.add('typing-cursor');
            
            let i = 0;
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    element.classList.remove('typing-cursor');
                    resolve();
                }
            }
            type();
        });
    }

    async function startHeroAnimation() {
        const mainTitleText = mainTitle.getAttribute('data-text') || mainTitle.textContent;
        const subTitleText = subTitle.getAttribute('data-text') || subTitle.textContent;
        
        mainTitle.textContent = '';
        subTitle.textContent = '';

        await typeWriter(mainTitle, mainTitleText, 150);
        await new Promise(resolve => setTimeout(resolve, 300));
        await typeWriter(subTitle, subTitleText, 50);
    }
    
    setTimeout(startHeroAnimation, 500);
}

/**
 * Модуль: Аккордеон
 * ИСПРАВЛЕНО: Не работает в секции "Интересы" на десктопах.
 */
function initAccordions() {
    document.querySelectorAll('.accordion-item').forEach(item => {
        const header = item.querySelector('.accordion-header');
        const contentWrapper = item.querySelector('.accordion-content');

        if (!header || !contentWrapper) return;

        // Определяем, должен ли элемент "прыгать"
        const toggleJumpAnimation = (e) => {
            // Предотвращаем стандартное поведение браузера
            e.preventDefault();

            // Если это секция "Интересы" и экран широкий, ничего не делаем
            if (item.closest('.facts') && window.innerWidth > 991) {
                return;
            }

            const isActive = item.classList.contains('active');

            if (isActive) {
                // Если аккордеон уже активен, закрываем его
                item.classList.remove('active');
                contentWrapper.style.height = '0px';
                // Убираем анимацию "прыжка"
                item.classList.remove('facts__item--jumping');
            } else {
                // Если аккордеон не активен, открываем его
                item.classList.add('active');
                contentWrapper.style.height = contentWrapper.scrollHeight + 'px';
                // Убираем анимацию "прыжка"
                item.classList.remove('facts__item--jumping');
            }
        };

        // Запускаем анимацию "прыжка" при касании
        header.addEventListener('touchstart', (e) => {
            // Если это не мобильное устройство, ничего не делаем
            if (window.innerWidth > 991) return;
            // Добавляем класс, чтобы запустить анимацию
            item.classList.add('facts__item--jumping');
        });

        // Останавливаем анимацию, когда палец отпущен
        header.addEventListener('touchend', (e) => {
            // Если это не мобильное устройство, ничего не делаем
            if (window.innerWidth > 991) return;
            // Удаляем класс, чтобы остановить анимацию
            item.classList.remove('facts__item--jumping');
        });

        // Основное событие для открытия/закрытия аккордеона
        header.addEventListener('click', toggleJumpAnimation);
    });
}

/**
 * Модуль: Анимации при прокрутке
 */
function initScrollAnimations() {
    const particlesCanvas = document.querySelector('#particles-js canvas');
    const timelineItems = document.querySelectorAll('.about-timeline__item');
    
    const parallaxIntensity = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--parallax-intensity'), 10) || 0;
        
    let isTicking = false;
    

    const handleHeaderScroll = () => {
        const scrollThreshold = 250;
        if (window.scrollY > scrollThreshold) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
    };
    
    const handleParallaxScroll = () => {
        if (!particlesCanvas || !parallaxIntensity) return;
        const rect = particlesCanvas.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const translateY = scrollPercent * parallaxIntensity * -1;
        particlesCanvas.style.transform = `translateY(${translateY}px)`;
    };
    
    const handleTimelineAnimation = () => {
        timelineItems.forEach(item => {
            const itemTop = item.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (itemTop < windowHeight * 0.85) {
                item.classList.add('visible');
            }
        });
    };
    
    const onScroll = () => {
        handleHeaderScroll();
        handleParallaxScroll();
        handleTimelineAnimation();
    };

    window.addEventListener('scroll', () => {
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                onScroll();
                isTicking = false;
            });
            isTicking = true;
        }
    });

    onScroll();
}