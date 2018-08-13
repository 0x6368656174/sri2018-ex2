import MobileSelect from 'mobile-select';
import ResizeObserver from 'resize-observer-polyfill';
import {disableFocus, enableFocus} from '../c-tile/c-tile';
import {getOptions} from '../c-badges/c-badges';
import {desktopMedia} from '../../js/media';

// ФИЛЬТРЫ

/**
 * Находит родителя с указанным классом
 *
 * @param {HTMLElement} element Элемент
 * @param {string} parentClass Родительский класс
 * @return {HTMLElement}
 */
function findAncestor(element, parentClass) {
  // Взято с https://stackoverflow.com/a/22119674/1778685
  while ((element = element.parentElement) && !element.classList.contains(parentClass));
  return element;
}

/**
 * Применяет фильтр к плашкам
 *
 * @param {HTMLElement} filter Элемент фильтра
 * @param {{param, value}} id ID фильтра, должен содержать param и value
 * @param {boolean} isDesktop Признак того, что фильтр вызван из десктоп-версии
 */
function applyTilesFilter(filter, id, isDesktop = true) {
  const {param, value} = id;
  // Найдем родительский блок с плашками
  const tileListBlock = findAncestor(filter, 'c-tile-list');
  // Найдем плашки
  const tiles = tileListBlock.querySelectorAll('.c-tile-list__tile');

  // Пройдем по всем плашкам
  for (const tile of tiles) {
    if (!param && !value) {
      // Если выбрали все, то покажем плашку
      tile.classList.remove('c-tile-list__tile--hidden');
    } else {
      // Скроем плашки, которые не подходят под фильтр
      const tileParam = tile.dataset[param] || null;
      if (tileParam !== value) {
        tile.classList.add('c-tile-list__tile--hidden');
      } else {
        tile.classList.remove('c-tile-list__tile--hidden');
      }
    }
  }

  // Если фильтр применили в десктоп версии
  if (isDesktop) {
    // Сбросим статус
    resetState(tileListBlock);
  }
}

// Пройдемся по всем фильтрам
const filters = document.querySelectorAll('.c-tile-list__filters');
let id = 0;
for (const filter of filters) {
  // Проверим, что фильтр реальный HTMLElement
  if (!(filter instanceof HTMLElement)) {
    continue;
  }

  ++id;
  // Добавим фильтру уникальный ид
  const idClass = `c-tile-list__filters--id-${id}`;
  filter.classList.add(idClass);

  // Найдем ярлыки
  const badges = filter.querySelector('.c-badges');
  // Подготовим данные
  const data = getOptions(badges);

  // Привяжем плагин с фильтром
  new MobileSelect({
    trigger: `.${idClass} .c-tile-list__filter-button`,
    title: 'Фильтр устройств',
    wheels: [
      {
        data,
      },
    ],
    ensureBtnText: 'Выбрать',
    cancelBtnText: 'Отмена',
    callback: (index, data) => applyTilesFilter(filter, data[0].id, false),
  });
  // В плагине табы и управление с клавиатуры работать не будут, т.к. он это не поддерживает, а в задаче про
  // выпадающее меню ничего сказано не было. Если бы был дизайн, то можно было бы и там нормальный accessibility
  // запилить

  // Повещаем обработчик события на изменение текущего ярлыка
  badges.addEventListener('activeChanged', event => applyTilesFilter(filter, event.detail.activeId));
}

// ПРОКРУТКА

/**
 * Возвращает текущее смещение
 *
 * @param {HTMLElement} tilesContainer
 * @return {number}
 */
function getCurrentOffset(tilesContainer) {
  const left = tilesContainer.style.left || '';
  return -1 * (left.substr(0, left.length - 2) || 0);
}

/**
 * Показывает следующую страницу с плашками
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области отображения
 * @param {number} animationTimeout ID таймера текущей анимации
 *
 * @return {number} ID таймера анимации, либо -1, если достигли конца списка
 */
function showNextPage(tilesContainer, tiles, clientWidth, animationTimeout) {
  // Сбросим старый таймер анимации
  if (animationTimeout !== -1) {
    clearTimeout(animationTimeout);
  }

  // Найдем первую плашку следующей страницы
  const nextFirstTile = findNextPageFirstTile(tilesContainer, tiles, clientWidth);

  // Если не нашли такую плашку, значит мы достигли конца списка и выйдем
  if (!nextFirstTile) {
    return -1;
  }

  // Рассчитаем новое смещение
  const nextOffset = -1 * nextFirstTile.offsetLeft;

  // Сдвинем плашки
  return moveTiles(tilesContainer, tiles, clientWidth, animationTimeout, nextOffset);
}

/**
 * Находит первую плашку из следующей страницы
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области отображения
 *
 * @return {null|HTMLElement}
 */
function findNextPageFirstTile(tilesContainer, tiles, clientWidth) {
  // Получим текущее смещение
  const currentOffset = getCurrentOffset(tilesContainer);

  // Найдем первую плашку, у которой правый край за областью просмотра
  return tiles.find(tile => {
    return tile.offsetLeft + tile.offsetWidth > currentOffset + clientWidth;
  });
}

/**
 * Показывает предыдущую страницу с плашками
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области отображения
 * @param {number} animationTimeout ID таймера текущей анимации
 *
 * @return {number} ID таймера анимации, либо -1, если достигли конца списка
 */
function showPrevPage(tilesContainer, tiles, clientWidth, animationTimeout) {
  // Сбросим старый таймер анимации
  if (animationTimeout !== -1) {
    clearTimeout(animationTimeout);
  }

  // Найдем первую плашку, у которой правый край будет за новой областью просмотра
  const nextFirstTile = findPrevPageFirstTile(tilesContainer, tiles, clientWidth);

  // Если не нашли такую плашку, значит мы достигли конца списка и выйдем
  if (!nextFirstTile) {
    return -1;
  }

  // Рассчитаем новое смещение
  const nextOffset = -1 * nextFirstTile.offsetLeft;

  // Сдвинем плашки
  return moveTiles(tilesContainer, tiles, clientWidth, animationTimeout, nextOffset);
}

/**
 * Находит первую плашку из предыдущей страницы
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области отображения
 *
 * @return {null|HTMLElement}
 */
function findPrevPageFirstTile(tilesContainer, tiles, clientWidth) {
  // Получим текущее смещение
  const currentOffset = getCurrentOffset(tilesContainer);

  // Если текущее смещение равно 0, то нет предыдущей плашки
  if (currentOffset === 0) {
    return null;
  }

  // Найдем первую плашку, у которой правый край будет за новой областью просмотра
  return tiles.find(tile => {
    return tile.offsetLeft + tile.offsetWidth > currentOffset - clientWidth;
  });
}

/**
 * Сдвигает tilesContainer на offset
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области отображения
 * @param {number} animationTimeout ID таймера текущей анимации
 * @param {number} offset Смещение
 *
 * @return {number} ID таймера анимации
 */
function moveTiles(tilesContainer, tiles, clientWidth, animationTimeout, offset) {
  // Покажем все плашки
  showAllTiles(tiles);

  // Сдвинем контейнер
  tilesContainer.style.left = `${offset}px`;

  // Запустим таймер анимации, в конце которого скроем все невидимые плашки
  return setTimeout(() => hideInvisibleTiles(tilesContainer, tiles, clientWidth), 200);
}

/**
 * Показывает (устанавливает visibility: null) все плашки
 *
 * @param {HTMLElement[]} tiles
 */
function showAllTiles(tiles) {
  // Пройдемся по всем плашкам
  for (const tile of tiles) {
    // Покажем плашку
    tile.style.visibility = null;
    // Включим у плашки фокус
    enableFocus(tile.querySelector('.c-tile'));
  }
}

/**
 * Скрывает (устанавливает visibility: hidden) для плашек, которые не видны
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области просмотра
 * @param {number} margin На сколько пикселей "вылазит" контент из плашки
 */
function hideInvisibleTiles(tilesContainer, tiles, clientWidth, margin = 40) {
  // Минимальное смещение, где начинают быть видны плашки
  const minOffset = getCurrentOffset(tilesContainer);

  // Максимально смещение, где заканчивают быть видны плашки
  const maxOffset = minOffset + clientWidth;

  // Пройдемся по всем плашкам
  for (const tile of tiles) {
    // Выключим фокус у плашек, которые "вылазят" слева за область просмотра
    if (tile.offsetLeft + tile.offsetWidth < minOffset) {
      disableFocus(tile.querySelector('.c-tile'));
    }

    // Скроем, если плашка левее минимального смещения
    if (tile.offsetLeft + tile.offsetWidth < minOffset - margin) {
      tile.style.visibility = 'hidden';
    }

    // Выключим фокус у плашек, которые "вылазят" справа за область просмотра
    if (tile.offsetLeft > maxOffset) {
      disableFocus(tile.querySelector('.c-tile'));
    }

    // Скроем плашки, которые "вылазят" справа за область просмотра с учетом отступа справа
    if (tile.offsetLeft > maxOffset + margin) {
      tile.style.visibility = 'hidden';
    }
  }
}

/**
 * Проверяет, если ли следующая страница с плашками
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области отображения
 *
 * @return {boolean}
 */
function hasNextTilesPage(tilesContainer, tiles, clientWidth) {
  // Найдем первую плашку следующей страницы
  return !!findNextPageFirstTile(tilesContainer, tiles, clientWidth);
}

/**
 * Проверяет, если ли предыдущая страница с плашками
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области отображения
 *
 * @return {boolean}
 */
function hasPrevTilesPage(tilesContainer, tiles, clientWidth) {
  // Найдем первую плашку следующей страницы
  return !!findPrevPageFirstTile(tilesContainer, tiles, clientWidth);
}

/**
 * Обновляет состояние кнопок навигации
 *
 * @param {HTMLElement} nextButton Кнопка "вперед"
 * @param {HTMLElement} prevButton Кнопка "назад"
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области отображения
 */
function updateNavigateButtonState(nextButton, prevButton, tilesContainer, tiles, clientWidth) {
  if (hasNextTilesPage(tilesContainer, tiles, clientWidth)) {
    nextButton.removeAttribute('disabled');
  } else {
    nextButton.setAttribute('disabled', 'true');
  }

  if (hasPrevTilesPage(tilesContainer, tiles, clientWidth)) {
    prevButton.removeAttribute('disabled');
  } else {
    prevButton.setAttribute('disabled', 'true');
  }
}

// Блоки "Список плашек"
const tileListBlocks = document.querySelectorAll('.c-tile-list');

/**
 * Сбрасывает состояние
 *
 * Данный метод нужно вызывать при инициализации, а так же изменении размера плашек
 *
 * @param {HTMLElement} tileListBlock Блок "Список плашек"
 */
function resetState(tileListBlock) {
  const prevButton = tileListBlock.querySelector('.c-tile-list__page-button--prev');
  const nextButton = tileListBlock.querySelector('.c-tile-list__page-button--next');
  const tileViewPort = tileListBlock.querySelector('.c-tile-list__tiles');
  const tilesContainer = tileListBlock.querySelector('.c-tile-list__tiles-container');
  const tiles = Array.from(tileListBlock.querySelectorAll('.c-tile-list__tile'));

  // Покажем все плашки
  showAllTiles(tiles);

  // Сдвинем контейнер в 0
  tilesContainer.style.left = '0px';

  // Обновим статусы кнопок
  const clientWidth = tileViewPort.offsetWidth;
  updateNavigateButtonState(nextButton, prevButton, tilesContainer, tiles, clientWidth);

  // Скроем все невидимые плашки
  hideInvisibleTiles(tilesContainer, tiles, clientWidth);
}

/**
 * Список обзервелов изменения размера
 *
 * @type {Map<HTMLElement, ResizeObserver>}
 */
const resizeObservables = new Map();

// Пройдем по всем блока с плашками
for (const tileListBlock of tileListBlocks) {
  if (!(tileListBlock instanceof HTMLElement)) {
    continue;
  }

  const prevButton = tileListBlock.querySelector('.c-tile-list__page-button--prev');
  const nextButton = tileListBlock.querySelector('.c-tile-list__page-button--next');
  const tileList = tileListBlock.querySelector('.c-tile-list__tiles');
  const tilesContainer = tileListBlock.querySelector('.c-tile-list__tiles-container');
  const tiles = Array.from(tileListBlock.querySelectorAll('.c-tile-list__tile'));

  let currentAnimationTimer = -1;

  // Добавим обработчики кликов по кнопкам навигации
  prevButton.addEventListener('click', () => {
    const clientWidth = tileList.offsetWidth;
    currentAnimationTimer = showPrevPage(tilesContainer, tiles, clientWidth, currentAnimationTimer);
    updateNavigateButtonState(nextButton, prevButton, tilesContainer, tiles, clientWidth);
  });

  nextButton.addEventListener('click', () => {
    const clientWidth = tileList.offsetWidth;
    currentAnimationTimer = showNextPage(tilesContainer, tiles, clientWidth, currentAnimationTimer);
    updateNavigateButtonState(nextButton, prevButton, tilesContainer, tiles, clientWidth);
  });

  // Добавим обзервер изменения размера области просмотра плашек
  const ro = new ResizeObserver(() => {
    // В случае изменения размера, сбросим статус
    resetState(tileListBlock);
  });
  resizeObservables.set(tileList, ro);
}

/**
 * Обработчик, вызываемый при изменении сайта с десктоп на мобильную версию
 *
 * @param {MediaQueryList} event
 */
function desktopMediaListener(event) {
  if (event.matches) {
    for (const tileListBlock of tileListBlocks) {
      // Это десктоп версия
      if (!(tileListBlock instanceof HTMLElement)) {
        continue;
      }

      // Включим обзевыблы изменения размера
      const tileList = tileListBlock.querySelector('.c-tile-list__tiles');
      resizeObservables.get(tileList).observe(tileList);

      // Сбросим статус
      resetState(tileListBlock);
    }
  } else {
    // Если это мобильная версия
    for (const tileListBlock of tileListBlocks) {
      if (!(tileListBlock instanceof HTMLElement)) {
        continue;
      }

      // Выключим обзевыблы изменения размера
      const tileList = tileListBlock.querySelector('.c-tile-list__tiles');
      resizeObservables.get(tileList).disconnect();

      // Восстановим состояние
      const tilesContainer = tileListBlock.querySelector('.c-tile-list__tiles-container');
      const tiles = Array.from(tileListBlock.querySelectorAll('.c-tile-list__tile'));
      tilesContainer.style.left = null;
      showAllTiles(tiles);
    }
  }
}

// Добавим обработчик изменения размера сайта
desktopMedia.addListener(desktopMediaListener);
desktopMediaListener(desktopMedia);
