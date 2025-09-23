// sections/portfolio/portfolio.js
// JavaScript функциональность для секции "Портфолио"

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.portfolio__filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio__item');
    
    // Функция плавной фильтрации проектов без дергания
    function filterProjects(filter) {
        const visibleItems = [];
        const hiddenItems = [];
        
        // Разделяем элементы на видимые и скрытые
        portfolioItems.forEach(item => {
            const category = item.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
                visibleItems.push(item);
            } else {
                hiddenItems.push(item);
            }
        });
        
        // Сначала скрываем ненужные элементы
        hiddenItems.forEach((item, index) => {
            // Убираем все классы состояний
            item.classList.remove('visible', 'appearing', 'hover-effect');
            
            // Добавляем класс скрытия с небольшой задержкой
            setTimeout(() => {
                item.classList.add('hidden');
            }, index * 30);
        });
        
        // Показываем нужные элементы после завершения скрытия
        setTimeout(() => {
            visibleItems.forEach((item, index) => {
                // Убираем классы состояний
                item.classList.remove('hidden', 'appearing');
                
                // Используем requestAnimationFrame для более плавной анимации
                requestAnimationFrame(() => {
                    item.classList.add('appearing');
                    
                    // Затем показываем с плавной задержкой
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            item.classList.remove('appearing');
                            item.classList.add('visible');
                        });
                    }, 50 + (index * 100));
                });
            });
        }, hiddenItems.length > 0 ? 300 : 50);
    }
    
    // Обработчики событий для кнопок фильтрации
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Предотвращаем повторные клики во время анимации
            if (this.classList.contains('processing')) return;
            
            // Помечаем все кнопки как обрабатывающие
            filterButtons.forEach(btn => btn.classList.add('processing'));
            
            // Убираем активный класс со всех кнопок
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс к нажатой кнопке
            this.classList.add('active');
            
            // Получаем фильтр из data-атрибута
            const filter = this.getAttribute('data-filter');
            
            // Применяем фильтрацию сразу
            filterProjects(filter);
            
            // Снимаем блокировку после завершения анимации
            setTimeout(() => {
                filterButtons.forEach(btn => btn.classList.remove('processing'));
            }, 800); // Оптимизированное время блокировки
        });
    });
    
    // Плавная прокрутка при клике на ссылки
    const portfolioLinks = document.querySelectorAll('.portfolio__item-btn');
    portfolioLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Если это внешняя ссылка, открываем в новой вкладке
            if (href.startsWith('http') || href.startsWith('https')) {
                e.preventDefault();
                window.open(href, '_blank');
            }
        });
    });
    
    // Эффект параллакса для фона
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const portfolio = document.querySelector('.portfolio');
        
        if (portfolio) {
            const rate = scrolled * -0.5;
            portfolio.style.backgroundPosition = `center ${rate}px`;
        }
    }
    
    // Применяем эффект параллакса при прокрутке
    window.addEventListener('scroll', updateParallax);
    
    // Анимация появления элементов при прокрутке (без конфликтов с фильтрацией)
    function animateOnScroll() {
        const items = document.querySelectorAll('.portfolio__item');
        
        items.forEach(item => {
            const itemTop = item.getBoundingClientRect().top;
            const itemVisible = 150;
            
            // Только если элемент не имеет классов фильтрации
            if (itemTop < window.innerHeight - itemVisible && 
                !item.classList.contains('hidden') && 
                !item.classList.contains('appearing')) {
                // Используем CSS классы вместо inline стилей
                item.classList.add('visible');
            }
        });
    }
    
    // Проверяем элементы при загрузке и прокрутке
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
    
    // Инициализация элементов портфолио
    function initializePortfolio() {
        portfolioItems.forEach((item, index) => {
            // Начинаем с состояния appearing
            item.classList.add('appearing');
            
            // Затем плавно показываем с requestAnimationFrame
            setTimeout(() => {
                requestAnimationFrame(() => {
                    item.classList.remove('appearing');
                    item.classList.add('visible');
                });
            }, 100 + (index * 120));
        });
    }
    
    // Инициализация анимации появления
    animateOnScroll();
    initializePortfolio();
    
    // Добавляем hover эффекты через CSS классы (без конфликтов)
    portfolioItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('hidden') && 
                !this.classList.contains('appearing') &&
                !this.classList.contains('processing')) {
                this.classList.add('hover-effect');
            }
        });
        
        item.addEventListener('mouseleave', function() {
            this.classList.remove('hover-effect');
        });
    });
});