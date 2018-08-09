const fs = require('fs');
const twig = require('twig');
const loaderUtils = require('loader-utils');
const path = require('path');
const glob = require('glob');

module.exports = function(content) {
  const callback = this.async();

  const options = loaderUtils.getOptions(this);
  const {serve, servePort, breakpoints} = options;

  const context = path.join(process.cwd(), 'src');

  const resourceBaseName = path.basename(this.resourcePath);

  if (!resourceBaseName.startsWith('p-')) {
    callback(null, '');
    return;
  }

  const twigOptions = {
    settings: {
      views: context,
    },
  };

  const twigs = glob.sync(path.join(context, '**/*.twig'));
  for (const twig of twigs) {
    this.addDependency(twig);
  }

  if (serve) {
    twig.cache(false);
  }

  twig.renderFile(this.resourcePath, twigOptions, (err, html) => {
    if (err) {
      return callback(err);
    }

    let styles = '';

    // Добавим style.css
    styles += `<link rel="stylesheet"  type="text/css" href="./style.css">\n`;

    let scripts = '';

    // Добавим runtime.js
    scripts += `<script type="text/javascript" src="./runtime.js" defer></script>\n`;

    // Добавим style.js, т.к. иначе WebPack не запустит все, что зависит от style
    scripts += `<script type="text/javascript" src="./style.js" defer></script>\n`;

    // Добавим брейкпоинты
    for (const breakpoint in breakpoints) {
      if (!breakpoints.hasOwnProperty(breakpoint)) {
        continue;
      }

      styles += `<link rel="stylesheet" type="text/css" href="./style.${breakpoint}.css"`
        + ` media="${breakpoints[breakpoint]}">\n`;

      scripts +=
        `<script type="text/javascript" src="./style.${breakpoint}.js" defer></script>\n`;
    }

    // Если serve, то добавим скрипт вебпака
    if (serve) {
      scripts += `<script type="text/javascript" src="http://localhost:${servePort}/webpack-dev-server.js" defer></script>\n`;
    }

    for (const twig of twigs) {
      const jsFile = twig.replace(/\.twig$/, '.js');

      if (fs.existsSync(jsFile)) {
        const jsDistFile = jsFile.replace(context, '.');
        scripts += `<script  type="text/javascript" src="${jsDistFile}" defer></script>\n`;
      }
    }


    // Добавим стили
    html = html.replace('</head>', `${styles}</head>`);

    // Добавим скрипты в boby
    html = html.replace('</body>', `${scripts}</body>`);

    callback(null, html);
  });
};
