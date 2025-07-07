

document.addEventListener('DOMContentLoaded', () => {

    // --- ФУНКЦИЯ ПЕЧАТИ ТЕКСТА (остается для заголовков) ---
    function typeWriter(element, text, speed) {
        return new Promise((resolve) => {
            if (!element || typeof text === 'undefined' || text === null) {
                return resolve();
            }
            
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

    // --- АНИМАЦИЯ ЗАГОЛОВКА НА ГЛАВНОМ ЭКРАНЕ ---
    async function startHeroAnimation() {
        const mainTitle = document.querySelector('.title__company');
        const subTitle = document.querySelector('.title__accent');
        
        if (mainTitle && subTitle) {
            const mainTitleText = mainTitle.textContent;
            const subTitleText = subTitle.textContent;
            
            await typeWriter(mainTitle, mainTitleText, 150);
            await new Promise(resolve => setTimeout(resolve, 300));
            await typeWriter(subTitle, subTitleText, 50);
        }
    }

    if (document.querySelector('.title__company')) {
        setTimeout(startHeroAnimation, 500);
    }

    // ===================================================================
    // === ПРОСТОЙ И НАДЕЖНЫЙ АККОРДЕОН (БЕЗ ПЕЧАТИ ТЕКСТА) ===
    // ===================================================================
    document.querySelectorAll('.accordion-item').forEach(item => {
        const header = item.querySelector('.accordion-header');
        const contentWrapper = item.querySelector('.accordion-content');

        header.addEventListener('click', () => {
            // Если это секция "Интересы" на ПК, ничего не делаем
            if (item.closest('.facts') && window.innerWidth > 991) {
                return; 
            }

            const isActive = item.classList.contains('active');

            if (isActive) {
                // Закрываем аккордеон
                item.classList.remove('active');
                contentWrapper.style.height = '0px';
            } else {
                // Открываем аккордеон
                item.classList.add('active');
                // Устанавливаем высоту, равную полной высоте контента
                contentWrapper.style.height = contentWrapper.scrollHeight + 'px';
            }
        });
    });

    // Тут может быть ваш код для скролла по якорям, если он нужен.
    // ...

});