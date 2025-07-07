document.addEventListener('DOMContentLoaded', () => {

    // --- НАСТРОЙКИ АНИМАЦИИ ---
    const config = {
        mainTitle: { element: document.querySelector('.title__company'), text: document.querySelector('.title__company')?.textContent, speed: 150 },
        subTitle: { element: document.querySelector('.title__accent'), text: document.querySelector('.title__accent')?.textContent, speed: 50 },
        startDelay: 500,
        interDelay: 300,
    };

    /**
     * Основная функция для эффекта печати.
     */
    function typeWriter(element, text, speed) {
        return new Promise((resolve) => {
            if (!element || !text) return resolve();
            
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

    /**
     * Запускает анимацию для главного экрана.
     */
    async function startAnimationSequence() {
        if (config.mainTitle.element && config.subTitle.element) {
            await typeWriter(config.mainTitle.element, config.mainTitle.text, config.mainTitle.speed);
            await new Promise(resolve => setTimeout(resolve, config.interDelay));
            await typeWriter(config.subTitle.element, config.subTitle.text, config.subTitle.speed);
        }
    }
    
    if (document.querySelector('.title__company')) {
        setTimeout(startAnimationSequence, config.startDelay);
    }

    const anchorLinks = document.querySelectorAll('.menu__link[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (!targetSection) return;

            const sectionTitleContainer = targetSection.querySelector('.section-title');
            if (sectionTitleContainer) {
                const title = sectionTitleContainer.querySelector('h2');
                const subtitle = sectionTitleContainer.querySelector('p');

                if (title) title.style.visibility = 'hidden';
                if (subtitle) subtitle.style.visibility = 'hidden';
                
                const runTypingAnimation = async () => {
                    if (title) {
                        const originalTitleText = title.textContent;
                        await typeWriter(title, originalTitleText, 75);
                    }
                    if (subtitle) {
                        const originalSubtitleText = subtitle.textContent;

                        await new Promise(resolve => setTimeout(resolve, 100)); 
                        await typeWriter(subtitle, originalSubtitleText, 40);
                    }
                };

                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                waitForScrollEnd(runTypingAnimation);
            }
        });
    });

    /**
     * Надежная функция для отслеживания завершения прокрутки.
     */
    function waitForScrollEnd(callback) {
        let scrollTimeout;
        const scrollListener = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                window.removeEventListener('scroll', scrollListener);
                callback();
            }, 100);
        };
        window.addEventListener('scroll', scrollListener);
    }
});