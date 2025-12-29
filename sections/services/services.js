// sections/services/services.js
// JavaScript функциональность для секции "Услуги"

/* Функция закрытия окна с анимацией */
function closeServiceDialog(dialog) {
  if (!dialog) return;
  
  // Предотвращаем множественные вызовы
  if (dialog.classList.contains('closing')) return;
  
  // Сохраняем позицию прокрутки перед разблокировкой
  const scrollPosition = parseInt(document.body.style.top || '0') * -1;

  // Разблокируем прокрутку
  document.body.classList.remove('services-modal-open');
  document.body.style.top = '';
  
  document.documentElement.style.scrollBehavior = 'auto';
  // Восстанавливаем позицию прокрутки
  window.scrollTo(0, scrollPosition);
  
  // Возвращаем плавную прокрутку
  document.documentElement.style.scrollBehavior = '';

  dialog.classList.add('closing');
  setTimeout(() => {
    dialog.close();
    dialog.classList.remove('closing');
  }, 300);
}

/* Функция открытия модального окна с закрытием других */
function openServiceDialog(dialogId) {
  // Закрываем все открытые диалоги услуг
  const allDialogs = document.querySelectorAll('.services_dialog[open]');
  allDialogs.forEach(dialog => {
    if (dialog.id !== dialogId) {
      closeServiceDialog(dialog);
    }
  });
  
  // Открываем нужный диалог
  const dialog = document.getElementById(dialogId);
  if (dialog) {
    // Сохраняем текущую позицию прокрутки
    const scrollPosition = window.pageYOffset;
    
    // Блокируем прокрутку
    document.body.classList.add('services-modal-open');
    document.body.style.top = `-${scrollPosition}px`;
    
    // Открываем модальное окно
    dialog.showModal();
  }
}

/* Функция для закрытия всех модальных окон при загрузке */
function closeAllServiceDialogs() {
  // Разблокируем прокрутку
  document.body.classList.remove('services-modal-open');
  document.body.style.top = '';
  
  const dialogs = document.querySelectorAll('.services_dialog[open]');
  dialogs.forEach(dialog => {
    dialog.close();
    dialog.classList.remove('closing');
  });
}

/* Инициализация модальных окон услуг */
window.initServicesDialogs = function() {
  // Предотвращаем множественные вызовы
  if (window.servicesDialogsInitialized) {
    console.log('initServicesDialogs: Уже инициализировано, пропускаем...');
    return;
  }
  
  console.log('initServicesDialogs: Инициализация модальных окон услуг...');
  
  // Сначала закрываем все открытые диалоги
  closeAllServiceDialogs();
  
  const dialogs = document.querySelectorAll('.services_dialog');
  console.log('initServicesDialogs: Найдено диалогов услуг:', dialogs.length);
  
  // Удаляем старые обработчики, если они есть
  dialogs.forEach(dialog => {
    dialog.removeEventListener('show', dialog._showHandler);
    dialog.removeEventListener('close', dialog._closeHandler);
    dialog.removeEventListener('keydown', dialog._keydownHandler);
    dialog.removeEventListener('click', dialog._clickHandler);
  });
  
  // Инициализация кнопок закрытия
  const closeButtons = document.querySelectorAll('.services_close-button');
  console.log('initServicesDialogs: Найдено кнопок закрытия:', closeButtons.length);
  
  closeButtons.forEach(button => {
    // Удаляем старые обработчики, если они есть
    button.removeEventListener('click', button._clickHandler);
    button.removeEventListener('touchend', button._touchendHandler);
    
    // Создаем именованные функции для обработчиков
    button._clickHandler = (event) => {
      console.log('Клик по кнопке закрытия services:', {
        button: button,
        dialog: button.closest('dialog'),
        event: event
      });
      event.preventDefault();
      event.stopPropagation();
      const dialog = button.closest('dialog');
      if (dialog) {
        console.log('Закрываем диалог services:', dialog.id);
        closeServiceDialog(dialog);
      } else {
        console.error('Диалог не найден для кнопки закрытия services');
      }
    };
    
    button._touchendHandler = (event) => {
      console.log('Touch по кнопке закрытия услуги');
      event.preventDefault();
      event.stopPropagation();
      const dialog = button.closest('dialog');
      closeServiceDialog(dialog);
    };
    
    // Добавляем обработчики
    button.addEventListener('click', button._clickHandler);
    button.addEventListener('touchend', button._touchendHandler);
  });
  
  dialogs.forEach(dialog => {
    // Создаем именованные функции для обработчиков
    dialog._showHandler = () => {
      document.body.style.overflow = 'hidden';
    };
    
    dialog._closeHandler = () => {
      document.body.style.overflow = '';
    };
    
    dialog._keydownHandler = (event) => {
      console.log('Клавиша нажата в диалоге услуги:', event.key, 'код:', event.keyCode);
      if (event.key === 'Escape' || event.keyCode === 27) {
        console.log('Закрытие диалога услуги по клавише Escape');
        event.preventDefault();
        event.stopPropagation();
        closeServiceDialog(dialog);
      }
    };
    
    dialog._clickHandler = (event) => {
      console.log('Диалог услуги клик:', event.target === dialog, 'target:', event.target, 'currentTarget:', event.currentTarget);
      
      // Проверяем, что клик был по самому диалогу (backdrop)
      if (event.target === dialog) {
        console.log('Закрытие диалога услуги по клику на фон');
        event.preventDefault();
        event.stopPropagation();
        closeServiceDialog(dialog);
      }
    };
    
    // Добавляем обработчики
    dialog.addEventListener('show', dialog._showHandler);
    dialog.addEventListener('close', dialog._closeHandler);
    dialog.addEventListener('keydown', dialog._keydownHandler);
    dialog.addEventListener('click', dialog._clickHandler);
  });
  
  // Помечаем как инициализированное
  window.servicesDialogsInitialized = true;
  
  console.log('initServicesDialogs: Инициализация завершена');
  console.log('initServicesDialogs: Проверка обработчиков:');
  dialogs.forEach((dialog, index) => {
    console.log(`Диалог ${index + 1}:`, {
      hasShowHandler: !!dialog._showHandler,
      hasCloseHandler: !!dialog._closeHandler,
      hasKeydownHandler: !!dialog._keydownHandler,
      hasClickHandler: !!dialog._clickHandler
    });
  });
};