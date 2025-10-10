document.addEventListener('DOMContentLoaded', () => {
  const filtersContainer = document.querySelector('.portfolio__filters');
  const portfolioItems = document.querySelectorAll('.portfolio__item');

  function filterProjects(filter) {
        const visibleItems = [];
        const hiddenItems = [];
        
        // Разделяем элементы на видимые и скрытые
        portfolioItems.forEach(item => {
            const category = item.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
                visibleItems.push(item);
            } else {
                hiddenItems.push(item);
            }
        });
        
        // Сначала скрываем ненужные элементы
        hiddenItems.forEach((item, index) => {
            // Убираем все классы состояний
            item.classList.remove('visible', 'appearing', 'hover-effect');
            
            // Добавляем класс скрытия с небольшой задержкой
            setTimeout(() => {
                item.classList.add('hidden');
            }, index * 30);
        });
        
        // Показываем нужные элементы после завершения скрытия
        setTimeout(() => {
            visibleItems.forEach((item, index) => {
                // Убираем классы состояний
                item.classList.remove('hidden', 'appearing');
                
                // Используем requestAnimationFrame для более плавной анимации
                requestAnimationFrame(() => {
                    item.classList.add('appearing');
                    
                    // Затем показываем с плавной задержкой
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            item.classList.remove('appearing');
                            item.classList.add('visible');
                        });
                    }, 50 + (index * 100));
                });
            });
        }, hiddenItems.length > 0 ? 300 : 50);
    }

  filtersContainer.addEventListener('click', (e) => {
    const wrapper = e.target.closest('.btn-wrapper');
    if (!wrapper || !filtersContainer.contains(wrapper)) return;

    // внутренний визуальный элемент и источник data-filter
    const btn = wrapper.querySelector('.portfolio__filter-btn');
    if (!btn) return;

    const filter = btn.getAttribute('data-filter');
    if (!filter) return;

    // блокировка (опционально)
    filtersContainer.querySelectorAll('.btn-wrapper').forEach(w => w.classList.add('processing'));

    // переключаем active на внутренней кнопке (согласовано с CSS)
    filtersContainer.querySelectorAll('.portfolio__filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    filterProjects(filter);

    setTimeout(() => {
      filtersContainer.querySelectorAll('.btn-wrapper').forEach(w => w.classList.remove('processing'));
    }, 800);
  });
});
