document.addEventListener('DOMContentLoaded', () => {

    const scrollController = () => {
        const body = document.body;
        const scrollThreshold = 50;
        
        

        if (window.scrollY > scrollThreshold) {
            body.classList.add('scrolled');
        } else {
            body.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', scrollController);

    scrollController();
});

// Анимация элементов timeline
const timelineItems = document.querySelectorAll('.about-timeline__item');

function animateTimeline() {
    timelineItems.forEach(item => {
        const itemTop = item.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (itemTop < windowHeight * 0.85) {
            item.classList.add('visible');
        }
    });
}

// Инициализация
window.addEventListener('load', animateTimeline);
window.addEventListener('scroll', animateTimeline);