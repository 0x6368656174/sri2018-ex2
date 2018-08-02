const fs = require('fs');
const os = require('os');
const path = require('path');
const glob = require('glob');
const twig = require('twig');
const shortid = require('shortid');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');


module.exports = class SuppressChunksPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('TwigPlugin', (compilation, cb) => {
      // Соберем проект во врменной папке
      // Наверное, можно как-то следать, чтоб дважды не собирать проект, но разбираться лень, работает быстро и так,
      // начнет тормозить, переделаю
      const tmp = path.join(os.tmpdir(), shortid.generate());
      fs.mkdirSync(tmp);

      for (const [file, asset] of Object.entries(compilation.assets)) {
        const filePath = path.join(tmp, file);
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
          mkdirp.sync(fileDir);
        }

        fs.writeFileSync(filePath, asset.source());
      }

      // Соберем шаблоны
      const pagesGlob = path.join(tmp, 'pages', '**/*.twig');
      const pageFiles = glob.sync(pagesGlob);

      const twigOptions = {
        settings: {
          views: tmp,
        },
      };

      const promises = [];

      for (const pageFile of pageFiles) {
        const fileName = path.basename(pageFile, '.twig').substr(2);

        promises.push(new Promise((resolve, reject) => {
          twig.renderFile(pageFile, twigOptions, (err, html) => {
            if (err) {
              return reject(err);
            }

            compilation.assets[`${fileName}.html`] = {
              source: () => new Buffer(html),
              size: () => Buffer.byteLength(html),
            };

            resolve();
          });
        }));
      }

      Promise.all(promises)
        .then(() => rimraf.sync(tmp))
        .then(() => cb());

      return true;
    });
  }
};
