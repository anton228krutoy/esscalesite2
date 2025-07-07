document.addEventListener('DOMContentLoaded', () => {

        // --- АНИМАЦИЯ ЗАГОЛОВКА НА ГЛАВНОМ ЭКРАНЕ ---
    async function startHeroAnimation() {
        const mainTitle = document.querySelector('.title__company');
        const subTitle = document.querySelector('.title__accent');
        
        if (mainTitle && subTitle) {
            // Сохраняем текст перед печатью
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
    
    // --- ФУНКЦИЯ ПЕЧАТИ ТЕКСТА ---
    function typeWriter(element, text, speed) {
        return new Promise((resolve) => {
            if (!element || typeof text === 'undefined' || text === null) {
                return resolve();
            }
            
            element.style.visibility = 'visible';
            element.style.opacity = 1; // Убедимся, что текст видимый
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

    // --- Вся остальная ваша логика (анимация заголовков и т.д.) может быть здесь ---
    // ...

    // ===================================================================
    // === НАДЕЖНЫЙ АККОРДЕОН С ПЛАВНОЙ АНИМАЦИЕЙ И ПЕЧАТЬЮ ===
    // ===================================================================
    document.querySelectorAll('.accordion-item').forEach(item => {
        const header = item.querySelector('.accordion-header');
        const contentWrapper = item.querySelector('.accordion-content');
        const textElement = contentWrapper.querySelector('p');

        // Сохраняем оригинальный текст при загрузке
        if (textElement && !textElement.dataset.originalText) {
            textElement.dataset.originalText = textElement.textContent;
        }

        header.addEventListener('click', () => {
            // Если это секция "Интересы" на ПК, ничего не делаем
            if (item.closest('.facts') && window.innerWidth > 991) {
                return; 
            }

            // Предотвращаем "двойные" клики во время анимации
            if (item.dataset.animating === 'true') {
                return;
            }
            item.dataset.animating = 'true';

            const isActive = item.classList.contains('active');

            if (isActive) {
                // --- ЗАКРЫВАЕМ АККОРДЕОН ---
                item.classList.remove('active');
                contentWrapper.style.height = '0px';

                // После завершения анимации высоты, удаляем флаг
                setTimeout(() => {
                    item.dataset.animating = 'false';
                }, 400); // Длительность transition из CSS

            } else {
                // --- ОТКРЫВАЕМ АККОРДЕОН ---
                item.classList.add('active');
                
                // 1. Делаем текст ПОЛНОСТЬЮ ПРОЗРАЧНЫМ, но он все еще там
                if (textElement) {
                    textElement.style.opacity = 0;
                    textElement.textContent = textElement.dataset.originalText; // Восстанавливаем текст "невидимо"
                }

                // 2. Устанавливаем высоту, чтобы блок развернулся.
                // Так как текст на месте (хоть и невидимый), scrollHeight будет правильным.
                contentWrapper.style.height = contentWrapper.scrollHeight + 'px';

                // 3. Ждем, пока анимация высоты завершится
                setTimeout(() => {
                    // 4. Запускаем печать текста. Функция typeWriter сама сделает его видимым.
                    if (textElement) {
                        typeWriter(textElement, textElement.dataset.originalText, 20);
                    }
                    item.dataset.animating = 'false';
                }, 400); // Длительность transition из CSS
            }
        });
    });
});