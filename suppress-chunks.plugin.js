const path = require('path');
const fs = require('fs');

module.exports = class SuppressChunksPlugin {
  constructor(options) {
    this.breakpoints = options.breakpoints;
  }

  apply(compiler) {
    const context = path.join(process.cwd(), 'src');

    const skipChunkNames = ['style', 'vendors', 'commons', 'runtime'];

    // Добавим брейкпоинты
    for (const breakpoint in this.breakpoints) {
      if (!this.breakpoints.hasOwnProperty(breakpoint)) {
        continue;
      }

      skipChunkNames.push(`style.${breakpoint}`);
    }

    compiler.hooks.shouldEmit.tap('SuppressChunksPlugin', compilation => {
      for (const chunk of compilation.chunks) {
        if (skipChunkNames.indexOf(chunk.name) !== -1) {
          continue;
        }

        const jsFile = path.join(context, chunk.name + '.js');
        if (!fs.existsSync(jsFile)) {
          // Удалим js и js.map
          const js = chunk.files.filter(file => file.match(/\.js$/));
          const jsMap = chunk.files.filter(file => file.match(/\.js\.map$/));
          delete compilation.assets[js];
          delete compilation.assets[jsMap];
        }
      }
      return true;
    });
  }
};
