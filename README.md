# Задание 2 - Задание на вёрстку

В задании было сказано, что нельзя использовать JS-фреймворки, поэтому не Angular=( Из-за этого
перед началом работы пришлось придумать, как сделать задание так, чтоб не плодить кучу копи-паста и получить хоть 
какую-то модульность, которую потом в дальнейшем можно будет легко использовать в том же проекте на Angular. 
Т.к. мне хорошо известен WebPack, было принято решение собрать кастомную конфигурацию WebPack, чтоб можно было 
разбить проект на модули. 

За основу организации модулей взята структура проекта на Angular, а так же некоторые идеи БЭМ-методологии.
Организовать модули решил так: в корне `src` находятся папки с назначением модулей:
- `assets` - все зависимости (картинки, видео, шрифты и т.д.);
- `components` - модули-компоненты (блоки), которые используются на страницах и в других компонентах;
- `forms` - элементы форм;
- `js` - базовые файлы JS, не относящиеся к компонентам, формам, страницам и модальным окнам;
- `modals` - модальные окна;
- `pages` - страницы (в нашем случае, страница одна `home`);
- `scss` - базовые файлы SCSS, не относящиеся к компонентам, формам, страницам и модальным окнам;

Каждый компонент, элемент формы, модальное окно или страница представляю из себя один блок методологии БЭМ. 

Внутри папок `components`, `forms`, `modals` и `pages` находятся под-папки, и файлы, именованные по следующему
правилу: все папки и файлы начинаются с префикса, который является первой буквой базовой папки `components`, `forms`, 
`modals` или `pages`. Это сделано для того, чтобы гарантировать уникальность имени файла, содержащего блок, который
он описывает. Блоки могут включать в себя файл описания HTML на языке шаблонизаци Twig, файл JS и файл стилей
написанном на SCSS. Для того, чтобы уникально идентифицировать блок, применяется такое правило: в каждом Twig-файле
описывается только один блок, он представляет из себя какой-то HTML-элемент, с классом, таким же как и название файла.
Внутри корневого HTML-элемента используются элементы по методологии БЭМ. Правила именования селекторов БЭМ отличаются
от принятых в Яндекс, я использую правила Гарри Робертса, т.к. они мне кажутся более читабельными. Файлов стилей (SCSS)
может быть больше чем один для одного блока, WebPack настроен так, что если найдет файл стилей с названием, например
`c-footer.scss` и `c-footer.min-950.scss`, то он их скомпилирует в два выходных CSS-файла `style.css` и 
`style.min-950.css` и автоматически подключит и тот и другой, но второй с медиа-запросом 
`only screen and (min-width: 950px)`, что избавляет он необходимости загромождать один файл стилей кучей медиа-запросов.
Плюс, разбиение стилей на файлы по медиа-запросам является "хорошей практикой", т.к. браузеру не нужно будет грузить
всю кучу стилей с ненужными медиа-запросами. Файл JS для блока так же подключается автоматически.

Вкратце, как настрое WebPack: Он ищет в папке `src/pages` все страницы, находи все нужные стили и скрипты, компилирует 
их. SCSS-файлы сначала компилируются, потом к ним применяется автопрефиксер и если билд продакшена, то еще применяется
и минифиактор. JS-скрипты компилится при помощи Babel (чтоб использовать ES6-импорты), и если билд продакшена, то
к ним применяется минификатор. Скопмилированные CSS и JS добавляются на страницу (с учетом медиа-запросов CSS
и служебных JS-скриптов WebPack), после чего страничка собирается при помощи шаблонизатора Twig (twig.js). 
На выходе получаем одну собранную страницу, assets'ы, используемые страницей, файлы стилей `style*.css`, 
файлы JS-скриптов. Конфигурацию WebPack никак не комментировал и не старался сделать аккуратной, в задании этого 
не было, поэтому она была написана максимально быстро, лишь бы выполняла свои функции и я понимал как все работает. 

Для запуска проекта можно выполнить (запустится WebPack Dev Server):
~~~
npm install
npm start
# открыть http://localhost:4200/home.html
~~~

Так же можно собрать проект в продакшн (собранный проект уже лежит в `dist`) при помощи:
~~~
npm install
npm run build
~~~

В проекте настроены линтеры для SCSS (stylelint) и JS (ESLint). А так же прописаны хуки git, которые запускают
эти линтеры перед каждым коммитом (при помощи husky и lint-staged).

Было написано, что нужно использовать минимум JS, поэтому из сторонних JS-библиотек используются только полифил
для ResizeObserver и MobileSelect, для выподающего меню на мобильных устройства, все остальное написано на 
"чистом" нативном JS. Кода на JS получилось достаточно мого, т.к. нужно было и постраничное листание сделать и
"крутилку" и диалоговые окна "вылетающие" из определенных элементов, но я как мог старался использовать минимум
JS, к тому же он очень подробно прокомментирован. "Крутилку" реализовал самым элементарным способом, при помощи
чуть-чуть перепиленного стороннего примера, т.к. что-то более сложно потребует большого колличества кода на JS 
для расчета углов крутилки, обработки действий мыши и нормального рисования ее в каких-нибудь Canvas'ах.

Проект тестировался в Linux на браузерах Google Chrome и Mozilla FireFox, в Windows Яндекс Браузере (Edge у меня 
нет), и на Android-устройстве в Google Chrome. На MacOS в Safari и на iOS в Safari не тестировался (100% там 
что-нибудь поползет, т.к. это Safari). В Windows Edge так же не тестировалось. Если сильно прям надо будет, то 
протестирую и на оставшихся устройствах.

Безопасную деградацию CSS использовал минимум (в градиентах и в адаптивных изображениях), для "Избранных сценариев"
на десктоп-версии, чтоб не воротить колхоз с JS для разбивки на страницы, использовал гриды, поэтому на старых 
браузерах точно работать не будет. Но уделили особое внимание доступности, все фокусы, подписи и т.д. сделал.

PS: Для проверки "крутилки" нужно щелкнуть по избранному сценарию "Я ухожу".
