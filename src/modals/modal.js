export class Modal {
  constructor(id) {
    this._modal = document.getElementById(id);
    if (!this._modal) {
      throw new Error(`Not found modal with id=${id}`);
    }

    this._modalWrapper = this._modal.querySelector('.modal__wrapper');
    this._staticContent = document.querySelector('.modal__static-content');

    const buttons = this._modal.querySelectorAll('.modal__button');
    for (const button of buttons) {
      button.addEventListener('click', () => this.hide());
      button.addEventListener('keypress', () => this.hide());
    }
  }

   hide() {
     if (!this._modal) {
       return;
     }

     if (!this._modal.classList.contains('modal--visible')) {
       return;
     }

     if (this._elementTop && this._elementLeft && this._elementWidth && this._elementHeight) {
       const widthScale = this._elementWidth / window.screen.width;
       const heightScale = this._elementHeight / window.screen.height;

       this._modal.classList.remove('modal--modal-visible');
       this._staticContent.classList.remove('modal__static-content--modal-visible');
       this._modalWrapper.classList.remove('modal__wrapper--visible');
       this._modalWrapper.style.transform =
         `matrix(${widthScale}, 0, 0, ${heightScale}, ${this._elementLeft}, ${this._elementTop})`;
       setTimeout(() => {
         this._modal.classList.remove('modal--visible');
         this._staticContent.setAttribute('aria-hidden', 'false');
       }, 200);
     } else {
       this._modal.classList.remove('modal--visible');
     }
  }

  showFrom(element) {
    const viewportOffset = element.getBoundingClientRect();

    this._elementTop = viewportOffset.top;
    this._elementLeft = viewportOffset.left;
    this._elementWidth = element.offsetWidth;
    this._elementHeight = element.offsetHeight;

    const widthScale = this._elementWidth / window.screen.width;
    const heightScale = this._elementHeight / window.screen.height;

    this._staticContent.setAttribute('aria-hidden', 'true');
    this._modal.classList.add('modal--visible');
    this._modalWrapper.classList.add('modal__wrapper--transition-disabled');
    this._modalWrapper.style.transform =
      `matrix(${widthScale}, 0, 0, ${heightScale}, ${this._elementLeft}, ${this._elementTop})`;
    setTimeout(() => {
      this._modal.classList.add('modal--modal-visible');
      this._staticContent.classList.add('modal__static-content--modal-visible');
      this._modalWrapper.classList.remove('modal__wrapper--transition-disabled');
      this._modalWrapper.classList.add('modal__wrapper--visible');
      this._modalWrapper.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
    }, 50);
  }
}
