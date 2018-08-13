/**
 * Возвращает данные ярлыков
 *
 * @param {HTMLElement} badgesBlock Блок "Ярлыки"
 *
 * @return {{id, value}[]}
 */
export function getOptions(badgesBlock) {
  return Array.from(badgesBlock.querySelectorAll('.c-badges__badge-button')).map(badge => {
    const {param, value} = badge.dataset;
    return {
      id: {
        param,
        value,
      },
      value: badge.innerHTML,
    };
  });
}

/**
 * Устанавливает ярлык активным
 *
 * @param {HTMLElement[]} allBadges Все ярлыки
 * @param {HTMLElement} activeBadge Активный ярлык
 */
function setActiveBadge(allBadges, activeBadge) {
  // Сбросим признак активности у всех ярлыков
  for (const badge of allBadges) {
    badge.classList.remove('c-badges__badge-button--active');
  }

  // Установим признак активности у нужного ярлыка
  activeBadge.classList.add('c-badges__badge-button--active');
}

// Найдем все блоки с ярлыками
const badgeBlocks = document.querySelectorAll('.c-badges');
for (const badgeBlock of badgeBlocks) {
  // Найдем все ярлыки в блоке
  const badges = badgeBlock.querySelectorAll('.c-badges__badge-button');

  for (const badge of badges) {
    // Добавим каждому ярлыку обработчки клика
    badge.addEventListener('click', () => {
      // Установим ярлык активным
      setActiveBadge(badges, badge);

      const {param, value} = badge.dataset;
      const activeId = {param, value};

      // Выкинем событие о том, что ярлык стал активным
      const activeChangedEvent = new CustomEvent('activeChanged', {detail: {activeId}});
      badgeBlock.dispatchEvent(activeChangedEvent);
    });
  }
}
