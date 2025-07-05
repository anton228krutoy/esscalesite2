// --- БУРГЕР-МЕНЮ ---
const menuBtn = document.querySelector('.menu-btn');
const menuNav = document.querySelector('.menu');
const menuLinks = document.querySelectorAll('.menu__link');
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

if (menuLinks.length > 0) {
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}
if (menuWorkWithBtn) {
    menuWorkWithBtn.addEventListener('click', closeMenu);
}


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