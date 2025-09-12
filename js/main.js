// --- НОВЫЙ, ОБЪЕДИНЕННЫЙ main.js ---

document.addEventListener("DOMContentLoaded", () => {
    // Инициализируем все модули после загрузки DOM
    initBurgerMenu();
    initSmoothScroll();
    initPortfolioFilter();
    initHeadlineAnimation();
    initAccordions();
    initScrollAnimations();
    initServicesModal();
});

/**
 * Модуль: Бургер-меню
 */
function initBurgerMenu() {
    const menuBtn = document.querySelector(".menu-btn");
    const menuNav = document.querySelector(".menu");
    const menuLinks = document.querySelectorAll(".menu__link");
    const menuWorkWithBtn = document.querySelector(".menu__workwith");

    if (!menuBtn || !menuNav) return;

    const toggleMenu = () => {
        menuNav.classList.toggle("menu--open");
        document.body.classList.toggle("no-scroll");
    };

    const closeMenu = () => {
        menuNav.classList.remove("menu--open");
        document.body.classList.remove("no-scroll");
    };

    menuBtn.addEventListener("click", toggleMenu);

    menuLinks.forEach((link) => link.addEventListener("click", closeMenu));
    if (menuWorkWithBtn) {
        menuWorkWithBtn.addEventListener("click", closeMenu);
    }
}

/**
 * Модуль: Плавная прокрутка к якорям
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            if (targetId.length > 1) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: "smooth",
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
    const filterContainer = document.querySelector(".portfolio__filters");
    if (!filterContainer) return;

    const filterButtons = filterContainer.querySelectorAll(
        ".portfolio__filter-btn"
    );
    const portfolioItems = document.querySelectorAll(".portfolio__item");

    const updateLastItemMargin = () => {
        // Сначала сбрасываем стили у всех элементов
        portfolioItems.forEach((item) => (item.style.marginBottom = ""));

        // Находим все видимые элементы
        const visibleItems = document.querySelectorAll(
            ".portfolio__item:not(.hidden)"
        );

        if (visibleItems.length > 0) {
            // Убираем отступ у последнего видимого элемента
            visibleItems[visibleItems.length - 1].style.marginBottom = "0";
        }
    };

    filterContainer.addEventListener("click", (event) => {
        const targetButton = event.target.closest(".portfolio__filter-btn");
        if (!targetButton || targetButton.classList.contains("active")) return;

        filterButtons.forEach((button) => button.classList.remove("active"));
        targetButton.classList.add("active");

        const filterValue = targetButton.dataset.filter;

        portfolioItems.forEach((item) => {
            const itemCategory = item.dataset.category;
            const shouldBeVisible =
                filterValue === "all" || itemCategory === filterValue;

            if (shouldBeVisible) {
                item.classList.remove("hidden");
            } else {
                item.classList.add("hidden");
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
    const mainTitle = document.querySelector(".title__company");
    const subTitle = document.querySelector(".title__accent");

    if (!mainTitle || !subTitle) return;

    function typeWriter(element, text, speed) {
        return new Promise((resolve) => {
            element.style.visibility = "visible";
            element.textContent = "";
            element.classList.add("typing-cursor");

            let i = 0;
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    element.classList.remove("typing-cursor");
                    resolve();
                }
            }
            type();
        });
    }

    async function startHeroAnimation() {
        const mainTitleText =
            mainTitle.getAttribute("data-text") || mainTitle.textContent;
        const subTitleText =
            subTitle.getAttribute("data-text") || subTitle.textContent;

        mainTitle.textContent = "";
        subTitle.textContent = "";

        await typeWriter(mainTitle, mainTitleText, 150);
        await new Promise((resolve) => setTimeout(resolve, 300));
        await typeWriter(subTitle, subTitleText, 50);
    }

    setTimeout(startHeroAnimation, 500);
}

/**
 * Модуль: Аккордеон
 * ИСПРАВЛЕНО: Не работает в секции "Интересы" на десктопах.
 */
function initAccordions() {
    document.querySelectorAll(".accordion-item").forEach((item) => {
        const header = item.querySelector(".accordion-header");
        const contentWrapper = item.querySelector(".accordion-content");

        if (!header || !contentWrapper) return;

        // Определяем, должен ли элемент "прыгать"
        const toggleJumpAnimation = (e) => {
            // Предотвращаем стандартное поведение браузера
            e.preventDefault();

            // Если это секция "Интересы" и экран широкий, ничего не делаем
            if (item.closest(".facts") && window.innerWidth > 991) {
                return;
            }

            const isActive = item.classList.contains("active");

            if (isActive) {
                // Если аккордеон уже активен, закрываем его
                item.classList.remove("active");
                contentWrapper.style.height = "0px";
                // Убираем анимацию "прыжка"
                item.classList.remove("facts__item--jumping");
                
                // Принудительно убираем полосу при закрытии на мобильных устройствах
                if (window.innerWidth <= 991) {
                    header.style.setProperty('--bar-width', '0');
                }
            } else {
                // Если аккордеон не активен, открываем его
                item.classList.add("active");
                contentWrapper.style.height =
                    contentWrapper.scrollHeight + "px";
                // Убираем анимацию "прыжка"
                item.classList.remove("facts__item--jumping");
                
                // Принудительно показываем полосу при открытии на мобильных устройствах
                if (window.innerWidth <= 991) {
                    header.style.setProperty('--bar-width', '100%');
                }
            }
        };

        // Запускаем анимацию "прыжка" при касании
        header.addEventListener("touchstart", (e) => {
            // Если это не мобильное устройство, ничего не делаем
            if (window.innerWidth > 991) return;
            // Добавляем класс, чтобы запустить анимацию
            item.classList.add("facts__item--jumping");
        });

        // Останавливаем анимацию, когда палец отпущен
        header.addEventListener("touchend", (e) => {
            // Если это не мобильное устройство, ничего не делаем
            if (window.innerWidth > 991) return;
            // Удаляем класс, чтобы остановить анимацию
            item.classList.remove("facts__item--jumping");
        });

        // Основное событие для открытия/закрытия аккордеона
        header.addEventListener("click", toggleJumpAnimation);
    });
}

/**
 * Модуль: Анимации при прокрутке (оптимизированная версия)
 */
function initScrollAnimations() {
    const particlesCanvas = document.querySelector("#particles-js canvas");
    const timelineItems = document.querySelectorAll(".about-timeline__item");

    const parallaxIntensity =
        parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
                "--parallax-intensity"
            ),
            10
        ) || 0;

    let isTicking = false;
    let lastScrollY = 0;
    let ticking = false;

    // Debounced scroll handler для лучшей производительности
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const handleHeaderScroll = () => {
        const scrollThreshold = 250;
        const currentScrollY = window.scrollY;
        
        // Избегаем лишних операций DOM
        if (currentScrollY > scrollThreshold && !document.body.classList.contains("scrolled")) {
            document.body.classList.add("scrolled");
        } else if (currentScrollY <= scrollThreshold && document.body.classList.contains("scrolled")) {
            document.body.classList.remove("scrolled");
        }
        
        lastScrollY = currentScrollY;
    };

    const handleParallaxScroll = () => {
        if (!particlesCanvas || !parallaxIntensity) return;
        
        // Используем Intersection Observer для оптимизации
        const rect = particlesCanvas.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        const scrollPercent =
            window.scrollY /
            (document.documentElement.scrollHeight - window.innerHeight);
        const translateY = scrollPercent * parallaxIntensity * -1;
        
        // Используем transform3d для аппаратного ускорения
        particlesCanvas.style.transform = `translate3d(0, ${translateY}px, 0)`;
    };

    const handleTimelineAnimation = () => {
        timelineItems.forEach((item) => {
            if (item.classList.contains("visible")) return; // Пропускаем уже видимые
            
            const itemTop = item.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (itemTop < windowHeight * 0.85) {
                item.classList.add("visible");
            }
        });
    };

    const onScroll = () => {
        handleHeaderScroll();
        handleParallaxScroll();
        handleTimelineAnimation();
    };

    // Оптимизированный scroll listener с throttling
    const throttledScroll = debounce(() => {
        if (!ticking) {
            requestAnimationFrame(() => {
                onScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, 16); // ~60fps

    window.addEventListener("scroll", throttledScroll, { passive: true });

    // Intersection Observer для timeline анимаций
    if ('IntersectionObserver' in window) {
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    timelineObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        timelineItems.forEach(item => {
            if (!item.classList.contains("visible")) {
                timelineObserver.observe(item);
            }
        });
    }

    onScroll();
}

/**
 * Модуль: Модальные окна для услуг
 */
function initServicesModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modalContent");
    const modalClose = document.getElementById("modalClose");
    const serviceCircles = document.querySelectorAll(".services__circle");

    if (!modalOverlay || !modal || !modalContent || !modalClose) return;

    // Данные для модальных окон
    const servicesData = {
        analytics: {
            title: "Data Science и Machine Learning",
            description:
                "Превращаем данные в работающие бизнес-решения с помощью математических моделей и алгоритмов ИИ. Специализируемся на сложных ML-проектах, где важны точность прогнозов и глубина анализа. Внедряем машинное обучение для автоматизации процессов, прогнозирования и извлечения ценных инсайтов из данных.",
            features: [
                "Разработка Machine Learning моделей",
                "Внедрение машинного обучения в бизнес",
                "Разработка систем предиктивной аналитики / прогнозных моделей",
                "Анализ Big Data",
                "Разработка систем компьютерного зрения (Computer Vision)",
                "Разработка алгоритмов распознавания образов / объектов",
                "Обработка естественного языка (NLP) на заказ",
                "Разработка чат-ботов и голосовых ассистентов",
            ],
        },
        ml: {
            title: " Сложная веб-разработка",
            description:
                "Создаем высоконагруженные и функционально богатые веб-системы для решения бизнес-задач. Мы специализируемся на сложных проектах, где важны производительность, масштабируемость и уникальная логика.",
            features: [
                "Разработка сложных веб-приложений",
                "Создание Highload-систем",
                "Создание маркетплейсов под ключ",
                "Разработка SaaS-платформ",
                "Создание API для сервисов",
                "Backend-разработка на Python / Django / Fastapi / C++",
                "Frontend-разработка на React / Vue / Angular",
                "Full-stack разработка на заказ",
            ],
        },
        consulting: {
            title: "Наукоемкое ПО и R&D",
            description:
                "Разработка сложного программного обеспечения для научных исследований, инженерного анализа и моделирования физических процессов. Полный цикл: от постановки задачи до внедрения. ",
            features: [
                "Разработка наукоемкого ПО",
                "R&D аутсорсинг / R&D as a service",
                "Разработка сложного программного обеспечения",
                "Разработка наукоемкого софта",
                "Разработка ПО для моделирования физических процессов",
                "Создание ПО для обработки экспериментальных данных",
                "Софт для статистического анализа данных",
                "Разработка ПО для обработки сигналов",
            ],
        },
        development: {
            title: "Консалтинг и Аудит",
            description:
                "Предоставляем экспертизу для существующих проектов и команд. Помогаем решать сложные технические challenges, проводим аудит и оптимизацию, усиливаем вашу команду нашими специалистами.",
            features: [
                "IT-консалтинг и технологический консалтинг",
                "Аудит кода / code review",
                "Аудит архитектуры программного обеспечения",
                "Оптимизация производительности ПО",
                "Проектирование архитектуры IT-решений",
                "Усиление команды разработки / выделенная команда разработчиков",
            ],
        },
        optimization: {
            title: "Мобильная разработка",
            description:
                "Создаем мобильные приложения с комплексной логикой и интеграцией передовых технологий. Специализируемся на нетривиальных проектах, где мобильное приложение становится ключевым элементом цифровой экосистемы.",
            features: [
                "Разработка мобильных приложений под ключ",
                "Разработка приложений для IOS/ Android",
                "Кроссплатформенная разработка на Flutter / React Native",
                "Backend-разработка для мобильных приложений",
                "Разработка мобильных приложений с AI/ML",
                "Создание IoT-приложений",
                "Разработка финтех-приложений",
                "Разработка геолокационных сервисов",
            ],
        },
    };

    // Функция открытия модального окна
    function openModal(serviceType) {
        const serviceData = servicesData[serviceType];
        if (!serviceData) return;

        modalContent.innerHTML = `
            <h2>${serviceData.title}</h2>
            <p>${serviceData.description}</p>
            
            <h3>Что входит в услугу:</h3>
            <ul>
                ${serviceData.features
                    .map((feature) => `<li>${feature}</li>`)
                    .join("")}
            </ul>
        `;

        modalOverlay.classList.add("active");
        document.body.classList.add("no-scroll");
    }

    // Функция закрытия модального окна
    function closeModal() {
        modalOverlay.classList.remove("active");
        document.body.classList.remove("no-scroll");
    }

    // Обработчики событий для кружков услуг
    serviceCircles.forEach((circle) => {
        circle.addEventListener("click", () => {
            const serviceType = circle.getAttribute("data-service");
            openModal(serviceType);
        });
    });

    // Обработчики для закрытия модального окна
    modalClose.addEventListener("click", closeModal);

    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Закрытие по клавише Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
            closeModal();
        }
    });
}
