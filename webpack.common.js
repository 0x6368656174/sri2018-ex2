const fs = require('fs');
const glob = require('glob');
const path = require('path');
const cssnano = require('cssnano');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractCssPlugin = require('mini-css-extract-plugin');
const PostCssPresetEnv = require('postcss-preset-env');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const SuppressChunksPlugin = require('./suppress-chunks.plugin');


module.exports = (mode, serve) => {
  function nodeModulesPath() {
    const main = require.main;
    if (!main) {
      throw new Error('Not found main');
    }

    return main.paths;
  }

  const context = path.join(process.cwd(), 'src');

  const breakpointRx = /[^\.]+\.((min-(\d+))?_?(max-(\d+))?).scss$/;

  const scssFiles = glob.sync(path.join(context,'**', '*.scss'))
    .map(file => path.normalize(file));
  const breakpoints = {};
  for (const scssFile of scssFiles) {
    const name = path.basename(scssFile).toLowerCase();
    let match = name.match(breakpointRx);
    if (match) {
      if (match[3] && match[5]) {
        breakpoints[match[1]] = `only screen and (min-width: ${match[3]}px) and (max-width: ${match[5]}px)`;
      } else if (match[3]) {
        breakpoints[match[1]] = `only screen and (min-width: ${match[3]}px)`;
      } else if (match[5]) {
        breakpoints[match[1]] = `only screen and (max-width: ${match[5]}px)`;
      }
    }
  }

  const extractTwigPlugin = new ExtractTextPlugin({
    filename: '[name].html',
  });

  const extractCssPlugin = new ExtractCssPlugin({
    filename: '[name].css',
  });

  const suppressChunksPlugin = new SuppressChunksPlugin({
    breakpoints,
  });

  const postCssCssNextPlugins = [
    PostCssPresetEnv,
  ];

  if (mode === 'production') {
    postCssCssNextPlugins.push(cssnano({autoprefixer: false}));
  }

  const splitChunksCacheGroups = {
    style: {
      chunks: 'all',
      enforce: true,
      name: 'style',
      test: m => {
        if (m.constructor.name !== 'CssModule') {
          return false;
        }

        const fileName = m.issuer.resource.toLowerCase();
        const match = fileName.match(breakpointRx);
        return !match;
      }
    },
  };

  for (const breakpoint in breakpoints) {
    if (!breakpoints.hasOwnProperty(breakpoint)) {
      continue;
    }

    splitChunksCacheGroups[breakpoint] = {
      chunks: 'all',
      enforce: true,
      name: `style.${breakpoint}`,
      test: m => {
        if (m.constructor.name !== 'CssModule') {
          return false;
        }

        const fileName = m.issuer.resource.toLowerCase();
        const match = fileName.match(breakpointRx);
        if (!match) {
          return false;
        }

        return match[1] === breakpoint;
      }
    }
  }

  return {
    mode: 'development',
    devtool: mode !== 'production' ? 'inline-source-map' : false,
    entry: () => {
      const files = glob.sync(path.join(context, '**', '*.twig'))
        .map(file => path.normalize(file));
      const assets = files
        .map(file => {
          const relativeFile = path.relative(context, file);
          const relativeFileParts = path.parse(relativeFile);
          const entryName = path.join(
            relativeFileParts.dir,
            relativeFileParts.name
          );

          let files = [];

          // Добавим JS файл
          const jsFile = path.join(context, `${entryName}.js`);
          if (fs.existsSync(jsFile)) {
            files.push(jsFile);
          }

          // Добавим SCSS файлы
          const scssFiles = glob.sync(path.join(context, `${entryName}*.scss`))
            .map(file => path.normalize(file));
          for (const scssFile of scssFiles) {
            files.push(scssFile);
          }

          return {entryName, files};
        })
        .filter(({files}) => files.length > 0)
        .reduce((entry, {entryName, files}) => {
          return {...entry, [entryName]: files};
      }, {});

      const pagesDir = path.join(context, 'pages');

      const pages = files
        .filter(file => file.startsWith(pagesDir))
        .map(file => {
          const entryName = path.basename(file, '.twig').substr(2);

          return {entryName, file};
        })
        .reduce((entry, {entryName, file}) => {
          return {...entry, [entryName]: file};
        }, {});

      return {...assets, ...pages};
    },
    module: {
      rules: [
        {
          test: /\.twig$/,
          use: extractTwigPlugin.extract({
            use: [
              {
                loader: 'html-loader',
                options: {
                  attrs: ['img:src', 'img:srcset', 'source:srcset']
                }
              },
              {
                loader: 'twig-loader',
                options: {
                  serve,
                  servePort: 4200,
                  breakpoints,
                },
              },
            ],
          }),
        },
        {
          test: /\.s?[ac]ss$/,
          use: [
            ExtractCssPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                minimize: mode !== 'production',
                sourceMap: mode !== 'production',
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: postCssCssNextPlugins,
                sourceMap: mode !== 'production',
              },
            },
            {
              // Используем, для того, чтоб в scss правильно резелвились url()
              loader: 'resolve-url-loader',
            },
            {
              loader: 'sass-loader',
              options: {
                // Для Sass-loader source map должен генерироваться всегда, иначе не будет работать resolve-url-loader
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|svg|ttf|woff|woff2|eot)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: 'assets/',
              },
            },
          ],
        },
        {
          exclude: /(node_modules|bower_components)/,
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              cacheDirectory: true,
              plugins: ['@babel/plugin-transform-runtime'],
              presets: ['@babel/preset-env'],
            },
          },
        },
      ],
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: splitChunksCacheGroups,
      },
    },
    output: {
      path: path.resolve(process.cwd(), 'dist'),
    },
    performance: {
      hints: false, // Уберем предупреждения
    },
    plugins: [
      new CleanWebpackPlugin(['dist'], {root: process.cwd(), verbose: false}),
      extractTwigPlugin,
      extractCssPlugin,
      suppressChunksPlugin,
    ],
    resolveLoader: {
      // Модули (лоадеры) будем искать в node_modules и в папке со скриптом
      modules: [...nodeModulesPath(), __dirname],
    },
    resolve: {
      extensions: ['.js', '.scss', '.twig', '.html'],
    },
    target: 'web',
  };
};
