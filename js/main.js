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


// --- ЭФФЕКТ ПАРАЛЛАКСА ДЛЯ ФОНА ---
document.addEventListener('DOMContentLoaded', () => {
    const particlesCanvas = document.querySelector('#particles-js canvas');

    if (!particlesCanvas) {
        console.error('Canvas for particles not found! Check script order in index.html');
        return;
    }

    const intensityValue = getComputedStyle(document.documentElement)
        .getPropertyValue('--parallax-intensity');

    const parallaxIntensity = parseInt(intensityValue, 10);

    let isTicking = false;

    const handleParallaxScroll = () => {
        if (!parallaxIntensity) return;
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const translateY = scrollPercent * parallaxIntensity * -1;
        particlesCanvas.style.transform = `translateY(${translateY}px)`;
    };

    window.addEventListener('scroll', () => {
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                handleParallaxScroll();
                isTicking = false;
            });
            isTicking = true;
        }
    });
});

// --- ПЛАВНАЯ ПРОКРУТКА К ЯКОРЯМ ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {        
    anchor.addEventListener('click', function (e) {                     
      e.preventDefault();                                               
      const targetId = this.getAttribute('href');                       
      const targetElement = document.querySelector(targetId);            
      if (targetElement) {
        targetElement.scrollIntoView({                                   
          behavior: 'smooth'
        });
      }
    });
});




// Ждём, пока весь HTML-документ загрузится
document.addEventListener('DOMContentLoaded', () => {

    // --- Логика для анимации заголовка при скролле ---
    const scrollController = () => {
        const body = document.body;
        const scrollThreshold = 50; // Порог в пикселях, после которого сработает анимация

        // Проверяем, насколько прокручена страница
        if (window.scrollY > scrollThreshold) {
            // Если прокрутили больше порога, добавляем класс
            body.classList.add('scrolled');
        } else {
            // Иначе — убираем класс
            body.classList.remove('scrolled');
        }
    };

    // Вешаем "слушателя" на событие прокрутки страницы
    window.addEventListener('scroll', scrollController);

    // Вызываем функцию один раз при загрузке на случай, если страница уже прокручена (например, после перезагрузки)
    scrollController();

    // Если у вас в main.js есть другой код, просто добавьте этот блок к нему.
});