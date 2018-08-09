import {desktopMedia} from '../../js/media';

const moveScriptsTopButton = document.querySelector('.c-main__favorite-scripts-move-top');
const scripts = document.querySelector('.c-main__favorite-scripts');
const scriptElements = document.querySelectorAll('.c-main__favorite-script');

console.log(moveScriptsTopButton, scripts);

let listener;
let currentVisibleScript = 0;

function showScriptsFrom(index) {
  for (let i = 0; i < scriptElements.length; ++i) {
    const script = scriptElements[i];
    console.log(script);
    if (i < index || i > index + 1) {
      setTimeout(() => {
        script.style.visibility = 'hidden';
      }, 200);
    } else {
      script.style.visibility = 'visible';
    }
  }

  scripts.style.top = `${index * -135}px`;
}

function desktopMediaListener(event) {
  if (event.matches) {
    if (!listener) {
      currentVisibleScript = 0;
      showScriptsFrom(currentVisibleScript);

      listener = moveScriptsTopButton.addEventListener('click', () => {
        currentVisibleScript++;
        showScriptsFrom(currentVisibleScript);
      });
    }
  } else {
    if (listener) {
      moveScriptsTopButton.removeEventListener('click', listener);
      listener = null;
      scripts.style.top = null;
      for (const script of scriptElements) {
        script.setAttribute('tabindex', 0);
      }
    }
  }
}

desktopMedia.addListener(desktopMediaListener);
desktopMediaListener(desktopMedia);
