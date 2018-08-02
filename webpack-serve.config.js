const common = require('./webpack.common');

module.exports = (env, argv) => common(argv.mode, true);

