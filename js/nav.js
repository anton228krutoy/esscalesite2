// function closeMobileMenuAndNavigate(targetSelector) {
//     const navMenu = document.querySelector('.nav__menu');
//     const hamburger = document.querySelector('.nav__toggle');
//     const body = document.body;
    
//     if (navMenu && navMenu.classList.contains('active')) {
//         // Сохраняем текущую позицию прокрутки
//         const scrollPosition = parseInt(body.style.top || '0') * -1;
        
//         // Закрываем меню
//         hamburger.classList.remove('active');
//         navMenu.classList.remove('active');
//         body.classList.remove('mobile-menu-open');
        
//         // Временно отключаем smooth scroll для восстановления позиции
//         document.documentElement.style.scrollBehavior = 'auto';
//         body.style.top = '';
//         window.scrollTo(0, scrollPosition);
        
//         // Через короткую задержку включаем smooth scroll и переходим к секции
//         requestAnimationFrame(() => {
//             document.documentElement.style.scrollBehavior = 'smooth';
            
//             if (targetSelector) {
//                 const targetElement = document.querySelector(targetSelector);
//                 if (targetElement) {
//                     targetElement.scrollIntoView({ 
//                         behavior: 'smooth',
//                         block: 'start'
//                     });
//                 }
//             }
//         });
//     }
// }

// document.addEventListener('DOMContentLoaded', function() {
//     const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
    
//     navLinks.forEach(link => {
//         link.addEventListener('click', function(e) {
//             e.preventDefault();
//             const targetId = this.getAttribute('href');
//             closeMobileMenuAndNavigate(targetId);
//         });
//     });
// });