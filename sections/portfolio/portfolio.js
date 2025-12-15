document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // КОНФИГУРАЦИЯ
  // ==========================================
  
  const CONFIG = {
    HIDE_DURATION: 400,
    HIDE_STAGGER: 40,
    SHOW_DURATION: 600,
    SHOW_BASE_DELAY: 50,
    SHOW_STAGGER: 100,
    EASING: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  };
  
  // ==========================================
  // DOM ЭЛЕМЕНТЫ
  // ==========================================
  
  const filtersContainer = document.querySelector('.portfolio__filters');
  const portfolioItems = document.querySelectorAll('.portfolio__item');
  
  if (!filtersContainer || portfolioItems.length === 0) {
    console.warn('Portfolio elements not found');
    return;
  }
  
  // ==========================================
  // СОСТОЯНИЕ
  // ==========================================
  
  let isAnimating = false;
  let currentFilter = 'all';
  
  // Хранилище активных анимаций
  const activeAnimations = new WeakMap();
  
  // ==========================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ==========================================
  
  function shouldBeVisible(item, filter) {
    if (filter === 'all') return true;
    const category = item.getAttribute('data-category');
    return category === filter;
  }
  
  // Полный сброс состояния элемента
  function resetItemState(item, visible) {
    // Отменяем анимацию
    const prevAnimation = activeAnimations.get(item);
    if (prevAnimation) {
      try {
        prevAnimation.cancel();
      } catch (e) {
        // Уже отменена
      }
      activeAnimations.delete(item);
    }
    
    // Удаляем все data-атрибуты
    item.removeAttribute('data-animating');
    item.removeAttribute('data-hidden');
    
    // Устанавливаем финальное состояние
    if (visible) {
      item.style.opacity = '1';
      item.style.transform = 'translateY(0) scale(1)';
      item.style.pointerEvents = '';
    } else {
      item.style.opacity = '0';
      item.style.transform = 'translateY(50px) scale(0.9)';
      item.style.pointerEvents = 'none';
      item.setAttribute('data-hidden', 'true');
    }
  }
  
  // ==========================================
  // АНИМАЦИЯ СКРЫТИЯ
  // ==========================================
  
  function hideItem(item, index) {
    // СРАЗУ устанавливаем конечное состояние
    item.setAttribute('data-animating', 'true');
    item.setAttribute('data-hidden', 'true');
    item.style.pointerEvents = 'none';
    
    // Отменяем предыдущую анимацию
    const prevAnimation = activeAnimations.get(item);
    if (prevAnimation) {
      try {
        prevAnimation.cancel();
      } catch (e) {}
      activeAnimations.delete(item);
    }
    
    // Определяем начальное состояние для анимации
    const currentOpacity = parseFloat(getComputedStyle(item).opacity) || 1;
    const currentTransform = getComputedStyle(item).transform;
    
    const animation = item.animate(
      [
        { 
          opacity: String(currentOpacity),
          transform: currentTransform === 'none' ? 'translateY(0px) scale(1)' : currentTransform,
          offset: 0
        },
        { 
          opacity: '0',
          transform: 'translateY(50px) scale(0.9)',
          offset: 1
        }
      ],
      {
        duration: CONFIG.HIDE_DURATION,
        delay: index * CONFIG.HIDE_STAGGER,
        easing: CONFIG.EASING,
        fill: 'forwards'
      }
    );
    
    activeAnimations.set(item, animation);
    
    return animation.finished
      .then(() => {
        // Проверяем, что анимация не была отменена
        if (activeAnimations.get(item) === animation) {
          item.style.opacity = '0';
          item.style.transform = 'translateY(50px) scale(0.9)';
          item.setAttribute('data-animating', 'false');
          activeAnimations.delete(item);
        }
      })
      .catch(() => {
        // Анимация отменена - нормально
      });
  }
  
  // ==========================================
  // АНИМАЦИЯ ПОЯВЛЕНИЯ
  // ==========================================
  
  function showItem(item, index) {
    // сбрасываем блокировки
    item.removeAttribute('data-hidden');
    item.setAttribute('data-animating', 'true');
    item.style.pointerEvents = '';
    
    // Отменяем предыдущую анимацию
    const prevAnimation = activeAnimations.get(item);
    if (prevAnimation) {
      try {
        prevAnimation.cancel();
      } catch (e) {}
      activeAnimations.delete(item);
    }
    
    // Определяем начальное состояние для анимации
    const currentOpacity = parseFloat(getComputedStyle(item).opacity) || 0;
    const currentTransform = getComputedStyle(item).transform;
    
    const animation = item.animate(
      [
        { 
          opacity: String(currentOpacity),
          transform: currentTransform === 'none' ? 'translateY(70px) scale(0.85)' : currentTransform,
          offset: 0
        },
        { 
          opacity: '1',
          transform: 'translateY(0px) scale(1)',
          offset: 1
        }
      ],
      {
        duration: CONFIG.SHOW_DURATION,
        delay: CONFIG.SHOW_BASE_DELAY + (index * CONFIG.SHOW_STAGGER),
        easing: CONFIG.EASING,
        fill: 'forwards'
      }
    );
    
    activeAnimations.set(item, animation);
    
    return animation.finished
      .then(() => {
        // Проверяем, что анимация не была отменена
        if (activeAnimations.get(item) === animation) {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0) scale(1)';
          item.setAttribute('data-animating', 'false');
          activeAnimations.delete(item);
        }
      })
      .catch(() => {
        // Анимация отменена - нормально
      });
  }
  
  
// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

function shouldBeVisible(item, filter) {
  // Показываем все элементы для фильтра "all"
  if (filter === 'all') return true;
  
  // Получаем категорию элемента
  const category = item.getAttribute('data-category');
  
  // Защита от null/undefined
  if (!category) {
    console.warn('Элемент без data-category:', item);
    return false;
  }
  
  // Нормализация и сравнение
  return category.trim().toLowerCase() === filter.trim().toLowerCase();
}

// ==========================================
// ОСНОВНАЯ ФУНКЦИЯ ФИЛЬТРАЦИИ
// ==========================================

//Здесь есть закомментированные логи для дебага.
//Если словится баг с отображением проектов при перекликивании фильтров (особенно быстрых)- можно будет их раскомментировать
async function filterProjects(targetFilter) {
  // Сохраняем предыдущий фильтр ДО обновления
  const previousFilter = currentFilter;
  
  // Обновляем текущий фильтр
  currentFilter = targetFilter;
  
  //console.log(` Фильтрация: "${previousFilter}" → "${targetFilter}"`);
  
  const itemsToHide = [];
  const itemsToShow = [];
  const itemsToKeep = [];
  
  //  Анализ изменений
  portfolioItems.forEach((item, index) => {
    const category = item.getAttribute('data-category');
    
    // : используем previousFilter, а НЕ currentFilter!
    const wasVisible = shouldBeVisible(item, previousFilter);
    const willBeVisible = shouldBeVisible(item, targetFilter);
    
    // Отладочный лог
    //console.log(`  [${index}] ${category}: was=${wasVisible}, will=${willBeVisible}`);
    
    if (wasVisible && willBeVisible) {
      // Элемент был и остаётся видимым
      itemsToKeep.push(item);
      
      // Отменяем активные анимации
      const prevAnimation = activeAnimations.get(item);
      if (prevAnimation) {
        try {
          prevAnimation.cancel();
        } catch (e) {}
        activeAnimations.delete(item);
      }
      
      // Принудительно гарантируем видимое состояние
      item.style.opacity = '1';
      item.style.transform = 'translateY(0) scale(1)';
      item.style.pointerEvents = '';
      item.removeAttribute('data-hidden');
      item.removeAttribute('data-animating');
      
    } else if (wasVisible && !willBeVisible) {
      // Элемент был видимым, нужно скрыть
      itemsToHide.push(item);
      
    } else if (!wasVisible && willBeVisible) {
      // Элемент был скрыт, нужно показать
      itemsToShow.push(item);
      
    } else {
      // Элемент был и остаётся скрытым
      const prevAnimation = activeAnimations.get(item);
      if (prevAnimation) {
        try {
          prevAnimation.cancel();
        } catch (e) {}
        activeAnimations.delete(item);
      }
      
      // Принудительно гарантируем скрытое состояние
      item.style.opacity = '0';
      item.style.transform = 'translateY(50px) scale(0.9)';
      item.style.pointerEvents = 'none';
      item.setAttribute('data-hidden', 'true');
      item.removeAttribute('data-animating'); //Выше отменили анимацию, поэтому здесь вручную выставляем, что анимация не проигрывается
    }
  });
  
  //console.log(`📊 Keep: ${itemsToKeep.length}, Hide: ${itemsToHide.length}, Show: ${itemsToShow.length}`);
  
  // Скрываем ненужные элементы
  if (itemsToHide.length > 0) {
    await Promise.allSettled(
      itemsToHide.map((item, index) => hideItem(item, index))
    );
  }
  
  // Показываем новые элементы
  if (itemsToShow.length > 0) {
    const allVisibleItems = [...itemsToKeep, ...itemsToShow];
    
    await Promise.allSettled(
      itemsToShow.map((item) => {
        const finalIndex = allVisibleItems.indexOf(item);
        return showItem(item, finalIndex);
      })
    );
  }
  
  //console.log(`Фильтрация "${targetFilter}" завершена`);
}

  
  // ==========================================
  // ОБРАБОТЧИК КЛИКОВ
  // ==========================================
  
  filtersContainer.addEventListener('click', async (e) => {
    const wrapper = e.target.closest('.btn-wrapper');
    if (!wrapper || !filtersContainer.contains(wrapper)) return;
    
    const btn = wrapper.querySelector('.portfolio__filter-btn');
    if (!btn) return;
    
    const filter = btn.getAttribute('data-filter');
    if (!filter) return;
    
    // Игнорируем повторный клик на активный фильтр
    if (filter === currentFilter) return;
    
    // Блокировка во время анимации
    if (isAnimating) return;
    
    isAnimating = true;
    
    // Визуальная блокировка кнопок
    filtersContainer.querySelectorAll('.btn-wrapper').forEach(w => 
      w.classList.add('processing')
    );
    
    // Переключаем активную кнопку
    filtersContainer.querySelectorAll('.portfolio__filter-btn').forEach(b => 
      b.classList.remove('active')
    );
    btn.classList.add('active');
    
    try {
      await filterProjects(filter);
      // Небольшая задержка для гарантии завершения всех визуальных изменений
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error('Filter animation error:', error);
    } finally {
      filtersContainer.querySelectorAll('.btn-wrapper').forEach(w => 
        w.classList.remove('processing')
      );
      isAnimating = false;
    }
  });
  
  // ==========================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==========================================
  
  const activeBtn = filtersContainer.querySelector('.portfolio__filter-btn.active');
  if (activeBtn) {
    currentFilter = activeBtn.getAttribute('data-filter') || 'all';
  }
  
  // Принудительно устанавливаем начальное состояние
  portfolioItems.forEach((item) => {
    const isVisible = shouldBeVisible(item, currentFilter);
    resetItemState(item, isVisible);
  });
  
  //console.log('Portfolio initialized with filter:', currentFilter);
  
});
