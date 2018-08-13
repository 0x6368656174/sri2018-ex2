import MobileSelect from 'mobile-select';
import ResizeObserver from 'resize-observer-polyfill';

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
 * @param {string} param Параметр фильтра (например, type)
 * @param {string} value Значение параметра фильтра (например, cam)
 */
function applyTilesFilter(filter, {param, value}) {
  // Найдем родительский блок с плашками
  const tilesBlock = findAncestor(filter, 'c-tile-list');
  // Найдем плашки
  const tiles = tilesBlock.querySelectorAll('.c-tile-list__tile');

  // Пройдем по всем плашкам
  for (const tile of tiles) {
    if (param === undefined && value === undefined) {
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

  // Подготовим данные
  const filterOptions = filter.querySelectorAll('.c-tile-list__filter');
  const data = Array.from(filterOptions)
    .map(filter => {
      const {param, value} = filter.dataset;
      return {
        id: {
          param,
          value,
        },
        value: filter.innerHTML,
      };
    });

  // Привяжем плагин с фильтром
  const select = new MobileSelect({
    trigger: `.${idClass} .c-tile-list__filter--active`,
    title: 'Фильтр устройств',
    wheels: [
      {
        data,
      },
    ],
    ensureBtnText: 'Выбрать',
    cancelBtnText: 'Отмена',
    callback: (index, data) => applyTilesFilter(filter, data[0].id),
  });

  // Добавим обработчики для нажатия на Энтер и пробел над фильтром
  for (const filterOption of filterOptions) {
    filterOption.addEventListener('keypress', event => {
      if (event.key === ' ' || event.key === 'Enter') {
        select.show();
      }
    });
  }

  // В плагине табы и управление с клавиатуры работать не будут, т.к. он это не поддерживает, а в задаче про
  // выпадающее меню ничего сказано не было. Если бы был дизайн, то можно было бы и там нормальный accessibility
  // запилить
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
  }
}

/**
 * Скрывает (устанавливает visibility: hidden) для плашек, которые не видны
 *
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 * @param {number} clientWidth Ширина области просмотра
 * @param {number} marginRight На сколько пикселей "вылазит" контент из плашки
 */
function hideInvisibleTiles(tilesContainer, tiles, clientWidth, marginRight = 40) {
  // Минимальное смещение, где начинают быть видны плашки
  const minOffset = getCurrentOffset(tilesContainer);

  // Максимально смещение, где заканчивают быть видны плашки
  const maxOffset = minOffset + clientWidth + marginRight;

  // Пройдемся по всем плашкам
  for (const tile of tiles) {
    // Скроем, если плашка левее минимального смещения
    if (tile.offsetLeft + tile.offsetWidth < minOffset) {
      tile.style.visibility = 'hidden';
      continue;
    }

    // Скроем, если плашка правее максимального смещения
    if (tile.offsetLeft > maxOffset) {
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
  return !! findNextPageFirstTile(tilesContainer, tiles, clientWidth);
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
  return !! findPrevPageFirstTile(tilesContainer, tiles, clientWidth);
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
 * @param {HTMLElement} nextButton Кнопка "вперед"
 * @param {HTMLElement} prevButton Кнопка "назад"
 * @param {HTMLElement} tileViewPort Контейнер области просмотра плашек
 * @param {HTMLElement} tilesContainer Контейнер с плашками
 * @param {HTMLElement[]} tiles Плашки
 */
function resetState(nextButton, prevButton, tileViewPort, tilesContainer, tiles) {
  // Покажем все плашки
  showAllTiles(tiles);

  // Сдвинем контейнер в 0
  tilesContainer.style.left = '0px';

  // Обновим статусы кнопок
  const clientWidth = tileViewPort.offsetWidth;
  updateNavigateButtonState(nextButton, prevButton, tilesContainer, tiles, clientWidth);

  // Запустим таймер анимации, в конце которого скроем все невидимые плашки
  setTimeout(() => hideInvisibleTiles(tilesContainer, tiles, clientWidth), 200);
}

// Пройдем по всем блока с плашками
for (const tileListBlock of tileListBlocks) {
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

  // Сбросим статус
  resetState(nextButton, prevButton, tileList, tilesContainer, tiles);

  // Добавим обзервер изменения размера области просмотра плашек
  const ro = new ResizeObserver(() => {
    // В случае изменения размера, сбросим статус
    resetState(nextButton, prevButton, tileList, tilesContainer, tiles);
  });
  ro.observe(tileList);
}
