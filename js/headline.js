document.addEventListener('DOMContentLoaded', () => {

    // --- НАСТРОЙКИ АНИМАЦИИ ---
    const config = {
        mainTitle: {
            element: document.querySelector('.title__company'),
            text: document.querySelector('.title__company').textContent, 
            speed: 150, // Скорость печати (ms)
        },
        subTitle: {
            element: document.querySelector('.title__accent'),
            text: document.querySelector('.title__accent').textContent,
            speed: 50,
        },
        startDelay: 500,    // Задержка перед началом всей анимации
        interDelay: 300,    // Задержка между печатью заголовка и подзаголовка
    };

    /**
     * Основная функция для эффекта печати.
     * @param {HTMLElement} element - Элемент, в котором будет печататься текст.
     * @param {string} text - Текст для печати.
     * @param {number} speed - Скорость печати в миллисекундах.
     * @returns {Promise} - Возвращает Promise, который разрешается после завершения печати.
     */
    function typeWriter(element, text, speed) {
        return new Promise((resolve) => {
            if (!element || !text) return resolve();
            element.style.visibility = 'visible';
            element.textContent = ''; // Очищаем элемент
            element.classList.add('typing-cursor'); // Добавляем курсор
            
            let i = 0;
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    // Убираем курсор с текущего элемента перед завершением
                    element.classList.remove('typing-cursor');
                    resolve(); // Сообщаем, что печать завершена
                }
            }
            type();
        });
    }

    /**
     * Запускает всю последовательность анимаций.
     */
    async function startAnimationSequence() {
        if (config.mainTitle.element && config.subTitle.element) {
            // 1. Печатаем главный заголовок и ждем завершения
        await typeWriter(config.mainTitle.element, config.mainTitle.text, config.mainTitle.speed);
        
        // 2. Делаем паузу
        await new Promise(resolve => setTimeout(resolve, config.interDelay));

        // 3. Печатаем подзаголовок и ждем завершения
        await typeWriter(config.subTitle.element, config.subTitle.text, config.subTitle.speed);
        }
        // Вся анимация завершена. Курсор уже убран.
    }

    if (document.querySelector('.title__company')) {
        setTimeout(startAnimationSequence, config.startDelay);
    }

    const anchorLinks = document.querySelectorAll('.menu__link[href^="#"]');

    anchorLinks.forEach(link =>{
        link.addEventListener('click', function(event){
            event.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (!targetSection) return;

                const sectionTitle = targetSection.querySelector('.section-title h2');
                if (sectionTitle) {
                    const originalText = sectionTitle.textContent;
                    sectionTitle.style.visibility = 'hidden';

                    const onScrollEnd = () => {
                        typeWriter(sectionTitle, originalText, 75);
                    };

                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    waitForScrollEnd(onScrollEnd);
                }

            });
        }); 

        /**
         *  Надёжная функция для отслеживания завершения прокрутки.
         * @param {function} callback - Функция, которую нужно вызвать после завершения скролла.
        */
    function waitForScrollEnd(callback) {
        let scrollTimeout;
        const scrollListener = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                window.removeEventListener('scroll', scrollListener);
                callback();
            }, 100); // Короткая задержка в 100 мс - этого достаточно
        };
        window.addEventListener('scroll', scrollListener);
    }
});