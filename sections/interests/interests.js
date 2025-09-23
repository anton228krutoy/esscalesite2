// sections/interests/interests.js
// JavaScript функциональность для секции "Интересы"

/* Функция закрытия окна с анимацией */
function closeDialog(dialog) {
  if (!dialog) return;
  
  // Предотвращаем множественные вызовы
  if (dialog.classList.contains('closing')) return;
  
  dialog.classList.add('closing');
  setTimeout(() => {
    dialog.close();
    dialog.classList.remove('closing');
  }, 300);
}

/* Глобальные обработчики удалены - используются только в initInterestsDialogs */

/* Функция для закрытия всех модальных окон интересов при загрузке */
function closeAllInterestsDialogs() {
  const dialogs = document.querySelectorAll('.interests_dialog[open]');
  dialogs.forEach(dialog => {
    dialog.close();
    dialog.classList.remove('closing');
  });
}

/* Инициализация диалогов - вызывается после загрузки HTML секций */
window.initInterestsDialogs = function() {
  // Предотвращаем множественные вызовы
  if (window.interestsDialogsInitialized) {
    console.log('initInterestsDialogs: Уже инициализировано, пропускаем...');
    return;
  }
  
  console.log('initInterestsDialogs: Инициализация диалогов интересов...');
  
  // Сначала закрываем все открытые диалоги
  closeAllInterestsDialogs();
  
  const dialogs = document.querySelectorAll('.interests_dialog');
  console.log('initInterestsDialogs: Найдено диалогов:', dialogs.length);
  
  // Удаляем старые обработчики, если они есть
  dialogs.forEach(dialog => {
    dialog.removeEventListener('show', dialog._showHandler);
    dialog.removeEventListener('close', dialog._closeHandler);
    dialog.removeEventListener('keydown', dialog._keydownHandler);
    dialog.removeEventListener('click', dialog._clickHandler);
  });
  
  // Инициализация кнопок закрытия
  const closeButtons = document.querySelectorAll('.interests_close-button');
  console.log('initInterestsDialogs: Найдено кнопок закрытия:', closeButtons.length);
  
  closeButtons.forEach((button, index) => {
    console.log(`Инициализация кнопки закрытия ${index + 1}:`, button);
    
    // Удаляем старые обработчики, если они есть
    if (button._clickHandler) {
      button.removeEventListener('click', button._clickHandler);
      console.log(`Удален старый click handler для кнопки ${index + 1}`);
    }
    if (button._touchendHandler) {
      button.removeEventListener('touchend', button._touchendHandler);
      console.log(`Удален старый touchend handler для кнопки ${index + 1}`);
    }
    
    // Создаем именованные функции для обработчиков
    button._clickHandler = (event) => {
      console.log('🔥 КЛИК ПО КНОПКЕ ЗАКРЫТИЯ INTERESTS!', {
        button: button,
        buttonId: button.id || 'no-id',
        buttonClass: button.className,
        dialog: button.closest('dialog'),
        dialogId: button.closest('dialog')?.id,
        event: event,
        eventTarget: event.target,
        eventCurrentTarget: event.currentTarget
      });
      event.preventDefault();
      event.stopPropagation();
      const dialog = button.closest('dialog');
      if (dialog) {
        console.log('✅ Закрываем диалог interests:', dialog.id);
        closeDialog(dialog);
      } else {
        console.error('❌ Диалог не найден для кнопки закрытия interests');
      }
    };
    
    button._touchendHandler = (event) => {
      console.log('🔥 TOUCH ПО КНОПКЕ ЗАКРЫТИЯ INTERESTS!', {
        button: button,
        dialog: button.closest('dialog'),
        event: event
      });
      event.preventDefault();
      event.stopPropagation();
      const dialog = button.closest('dialog');
      if (dialog) {
        console.log('✅ Закрываем диалог interests по touch:', dialog.id);
        closeDialog(dialog);
      }
    };
    
    // Добавляем обработчики
    button.addEventListener('click', button._clickHandler);
    button.addEventListener('touchend', button._touchendHandler);
    
    console.log(`✅ Добавлены обработчики для кнопки ${index + 1}:`, {
      hasClickHandler: !!button._clickHandler,
      hasTouchendHandler: !!button._touchendHandler,
      buttonElement: button
    });
  });
  
  dialogs.forEach((dialog, index) => {
    console.log(`Инициализация диалога ${index + 1}:`, dialog.id, dialog);
    
    // Создаем именованные функции для обработчиков
    dialog._showHandler = () => {
      console.log(`📖 Диалог ${dialog.id} показан`);
      document.body.style.overflow = 'hidden';
    };
    
    dialog._closeHandler = () => {
      console.log(`📕 Диалог ${dialog.id} закрыт`);
      document.body.style.overflow = '';
    };
    
    dialog._keydownHandler = (event) => {
      console.log(`⌨️ Клавиша нажата в диалоге ${dialog.id}:`, event.key, 'код:', event.keyCode);
      if (event.key === 'Escape' || event.keyCode === 27) {
        console.log(`🚪 Закрытие диалога ${dialog.id} по клавише Escape`);
        event.preventDefault();
        event.stopPropagation();
        closeDialog(dialog);
      }
    };
    
    dialog._clickHandler = (event) => {
      console.log(`🖱️ Диалог ${dialog.id} клик:`, {
        target: event.target,
        currentTarget: event.currentTarget,
        isDialog: event.target === dialog,
        targetTagName: event.target.tagName,
        targetClass: event.target.className
      });
      
      // Проверяем, что клик был по самому диалогу (backdrop)
      if (event.target === dialog) {
        console.log(`🚪 Закрытие диалога ${dialog.id} по клику на фон`);
        event.preventDefault();
        event.stopPropagation();
        closeDialog(dialog);
      }
    };
    
    // Добавляем обработчики
    dialog.addEventListener('show', dialog._showHandler);
    dialog.addEventListener('close', dialog._closeHandler);
    dialog.addEventListener('keydown', dialog._keydownHandler);
    dialog.addEventListener('click', dialog._clickHandler);
    
    console.log(`✅ Добавлены обработчики для диалога ${index + 1} (${dialog.id}):`, {
      hasShowHandler: !!dialog._showHandler,
      hasCloseHandler: !!dialog._closeHandler,
      hasKeydownHandler: !!dialog._keydownHandler,
      hasClickHandler: !!dialog._clickHandler
    });
  });
  
  // Помечаем как инициализированное
  window.interestsDialogsInitialized = true;
  
  console.log('initInterestsDialogs: Инициализация завершена');
  console.log('initInterestsDialogs: Проверка обработчиков:');
  dialogs.forEach((dialog, index) => {
    console.log(`Диалог ${index + 1}:`, {
      hasShowHandler: !!dialog._showHandler,
      hasCloseHandler: !!dialog._closeHandler,
      hasKeydownHandler: !!dialog._keydownHandler,
      hasClickHandler: !!dialog._clickHandler
    });
  });
  
  // Добавляем глобальную функцию для тестирования
  window.testInterestsModal = function(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (dialog) {
      console.log('🧪 Тестируем модальное окно interests:', dialogId);
      dialog.showModal();
      
      // Проверяем обработчики
      const closeButton = dialog.querySelector('.interests_close-button');
      console.log('🧪 Кнопка закрытия найдена:', closeButton);
      console.log('🧪 Обработчики кнопки:', {
        hasClickHandler: !!closeButton?._clickHandler,
        hasTouchendHandler: !!closeButton?._touchendHandler
      });
    } else {
      console.error('❌ Диалог не найден:', dialogId);
    }
  };
};