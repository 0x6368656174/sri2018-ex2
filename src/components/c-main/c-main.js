import {desktopMedia} from '../../js/media';

const moveScriptsTopButton = document.querySelector('.c-main__favorite-scripts-move-top');
const scripts = document.querySelector('.c-main__favorite-scripts');
const scriptElements = document.querySelectorAll('.c-main__favorite-script');

let currentVisibleScript = 0;

function showScriptsFrom(index) {
  for (let i = 0; i < scriptElements.length; ++i) {
    const script = scriptElements[i];
    if (i < index || i > index + 1) {
      setTimeout(() => {
        script.style.visibility = 'hidden';
      }, 200);
    } else {
      script.style.visibility = null;
    }
  }

  scripts.style.top = `${index * -135}px`;
}

function moveScripts() {
  currentVisibleScript++;
  showScriptsFrom(currentVisibleScript);
}

function desktopMediaListener(event) {
  if (event.matches) {
    currentVisibleScript = 0;
    showScriptsFrom(currentVisibleScript);

    moveScriptsTopButton.addEventListener('click', moveScripts);
  } else {
    moveScriptsTopButton.removeEventListener('click', moveScripts);
    scripts.style.top = null;
    for (const script of scriptElements) {
      script.style.visibility = null;
    }
  }
}

desktopMedia.addListener(desktopMediaListener);
desktopMediaListener(desktopMedia);
