// sections/interests/interests.js
// JavaScript функциональность для секции "Интересы"

/* Функция открытия модального окна с блокировкой прокрутки */
function openInterestsDialog(dialog) {
  if (!dialog) return;
  
  // Сохраняем текущую позицию прокрутки
  const scrollPosition = window.pageYOffset;
  
  // Блокируем прокрутку
  document.body.classList.add('interests-modal-open');

  document.body.style.overflow = 'hidden';
  document.body.style.top = `-${scrollPosition}px`;
  
  // Открываем модальное окно
  dialog.showModal();
}

/* Функция закрытия окна с анимацией */
function closeDialog(dialog) {
  if (!dialog) return;
  
  // Предотвращаем множественные вызовы
  if (dialog.classList.contains('closing')) return;
  
  // Сбрасываем состояние всех карточек интересов
  resetAllInterestCards();
  
  // Сохраняем позицию прокрутки перед разблокировкой
  const scrollPosition = parseInt(document.body.style.top || '0') * -1;
  
  // Разблокируем прокрутку
  document.body.classList.remove('interests-modal-open');
  document.body.style.top = '';
  
  // Восстанавливаем позицию прокрутки
  window.scrollTo(0, scrollPosition);
  
  dialog.classList.add('closing');
  setTimeout(() => {
    dialog.close();
    dialog.classList.remove('closing');
  }, 300);
}

/* Функция сброса состояния всех карточек интересов */
function resetAllInterestCards() {
  const allCards = document.querySelectorAll('.interests_card-item');
  const allButtons = document.querySelectorAll('.interests_open-button');
  const allButtonContainers = document.querySelectorAll('.interests_button-container');
  const allTitles = document.querySelectorAll('.interests_card-item-title');
  
  allCards.forEach(card => {
    // Убираем все классы состояний
    card.classList.remove('active', 'hover', 'pressed', 'focused');
    
    // Принудительно сбрасываем стили
    card.style.transform = 'none';
    card.style.boxShadow = '';
    card.style.backgroundColor = '';
    card.style.borderColor = '';
    card.style.opacity = '';
  });
  
  allButtons.forEach(button => {
    button.classList.remove('active', 'hover', 'pressed', 'focused');
    button.style.transform = 'none';
    button.style.boxShadow = '';
    button.style.backgroundColor = '';
  });
  
  allButtonContainers.forEach(container => {
    container.classList.remove('active', 'hover', 'pressed', 'focused');
    container.style.transform = 'none';
    container.style.boxShadow = '';
    container.style.backgroundColor = '';
    container.style.width = '';
    container.style.height = '';
    container.style.padding = '';
  });
  
  allTitles.forEach(title => {
    title.classList.remove('active', 'hover', 'pressed', 'focused');
    title.style.transform = 'none';
    title.style.textShadow = '';
    title.style.color = '';
  });
  
  console.log('🔄 Состояние всех карточек интересов сброшено');
}


/* Инициализация кликов по карточкам */
function initCardClicks() {
  console.log('initCardClicks: Инициализация кликов по карточкам...');
  
  const cardItems = document.querySelectorAll('.interests_card-item');
  const openButtons = document.querySelectorAll('.interests_open-button');
  
  // Обработчики для кликов по карточкам
  cardItems.forEach((card, index) => {
    console.log(`Инициализация карточки ${index + 1}:`, card);
    
    // Удаляем старые обработчики
    card.removeEventListener('click', card._cardClickHandler);
    
    // Создаем новые обработчики
    card._cardClickHandler = (event) => {
      console.log('🔥 КЛИК ПО КАРТОЧКЕ!', {
        card: card,
        cardIndex: index,
        event: event,
        target: event.target
      });
      
      // Предотвращаем всплытие события, чтобы избежать конфликтов
      event.preventDefault();
      event.stopPropagation();
      
      // Определяем ID диалога из HTML onclick атрибута
      const dialogId = card.dataset.dialogId;
      
      if (dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
          console.log('✅ Открываем диалог по клику на карточку:', dialogId);
          openInterestsDialog(dialog);
        }
      }
    };
    
    
    
    // Добавляем обработчики
    card.addEventListener('click', card._cardClickHandler);
    
    
    console.log(`✅ Добавлены обработчики для карточки ${index + 1}:`, {
      hasClickHandler: !!card._cardClickHandler,
    });
  });
  
  // Обработчики для кнопок "Подробнее"
  openButtons.forEach((button, index) => {
    console.log(`Инициализация кнопки ${index + 1}:`, button);
    
    // Удаляем старые обработчики
    button.removeEventListener('click', button._buttonClickHandler);
    
    // Создаем новые обработчики
    button._buttonClickHandler = (event) => {
      console.log('🔥 КЛИК ПО КНОПКЕ ПОДРОБНЕЕ!', {
        button: button,
        buttonIndex: index,
        event: event,
        target: event.target
      });
      
      // Предотвращаем всплытие события
      event.preventDefault();
      event.stopPropagation();
      
      // Определяем ID диалога из HTML onclick атрибута
      const dialogId = button.onclick && button.onclick.toString().match(/getElementById\('([^']+)'\)/)?.[1];
      
      if (dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
          console.log('✅ Открываем диалог по клику на кнопку:', dialogId);
          openInterestsDialog(dialog);
        }
      }
    };
    
    
    // Добавляем обработчики
    button.addEventListener('click', button._buttonClickHandler);
    
    console.log(`✅ Добавлены обработчики для кнопки ${index + 1}:`, {
      hasClickHandler: !!button._buttonClickHandler,
    });
  });
  
  console.log('initCardClicks: Инициализация завершена');
}

/* Функция для закрытия всех модальных окон интересов при загрузке */
function closeAllInterestsDialogs() {
  // Сбрасываем состояние всех карточек
  resetAllInterestCards();
  
  // Разблокируем прокрутку
  document.body.classList.remove('interests-modal-open');
  document.body.style.top = '';
  
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
  
  // Инициализация кликов по карточкам
  initCardClicks();
  
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
    
    
    // Добавляем обработчики
    button.addEventListener('click', button._clickHandler);
    
    console.log(`✅ Добавлены обработчики для кнопки ${index + 1}:`, {
      hasClickHandler: !!button._clickHandler,
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
      
      // Дополнительно сбрасываем состояние карточек при закрытии
      resetAllInterestCards();
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
        targetClass: event.target.className,
        timeStamp: event.timeStamp
      });
      
      // Проверяем, что клик был именно по backdrop диалога (не по содержимому)
      // И что это не программный клик
      if (event.target === dialog && event.isTrusted) {
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
      });
    } else {
      console.error('❌ Диалог не найден:', dialogId);
    }
  };
  
  // Добавляем глобальные функции
  window.resetInterestsCards = resetAllInterestCards;
  window.initInterestsCardClicks = initCardClicks;
};
