const fs = require('fs');
const loaderUtils = require('loader-utils');
const path = require('path');

module.exports = function(content) {
  const options = loaderUtils.getOptions(this);
  const {serve, servePort} = options;

  const context = path.join(process.cwd(), 'src');

  const resourceBaseName = path.basename(this.resourcePath);

  let jsDistFile;

  const jsFile = this.resourcePath.replace(/\.twig$/, '.js');
  if (fs.existsSync(jsFile)) {
    jsDistFile = this.resourcePath.replace(context, objectPath).replace(/\.twig$/, '.js');
  }

  const script = `<script  type="text/javascript" src="${jsDistFile}" defer></script>\n`;

  if (resourceBaseName.startsWith('p-')) {
    let headScripts = '';

    // Добавим style.js, т.к. иначе WebPack не запустит все, что зависит от style
    headScripts += `<script type="text/javascript" src="/style.js" defer></script>\n`;

    // Если serve, то добавим скрипт вебпака
    if (serve) {
      headScripts += `<script type="text/javascript" src="http://localhost:${servePort}/webpack-dev-server.js" defer></script>\n`;
    }

    // Добавим скрипты в head
    content = content.replace('</head>', `${headScripts}</head>`);

    let baseScripts = '';

    // Если есть скрип для base, то добавим его
    if (jsDistFile) {
      baseScripts += script;
    }

    // Добавим блок для js
    baseScripts = `\n{% block js %}${baseScripts}{% endblock %}\n`;

    // Добавим срипты
    content = content.replace('</body>', `${baseScripts}</body>`);

    let headStyles = '';

    // Добавим style.css
    headStyles += `<link rel="stylesheet"  type="text/css" href="/style.css">\n`;

    // Добавим стили
    content = content.replace('</head>', `${headStyles}</head>`);
  } else {
    // Для остальных шаблонов
    if (jsDistFile) {
      // Если шаблон расширяет другой шаблон
      const block = /{%\s+extends/.test(content)
        ? `\n{% block js %}\n  {{ parent() }}\n  ${script}\n{% endblock %}\n`
        : `\n{% block js %}${script}{% endblock %}\n`;

      const rx = /{%\s*block\s+js\s*%}\s*{%\s*endblock\s*%}/;
      if (rx.test(content)) {
        // Если в шаблоне указан блок для JS, то заменим его
        content = content.replace(rx, block);
      } else {
        // Иначе добавим блок в конец шаблона
        content += block;
      }
    }
  }

  return content;
};
