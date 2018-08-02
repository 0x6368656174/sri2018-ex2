const fs = require('fs');
const glob = require('glob');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractCssPlugin = require('mini-css-extract-plugin');
const PostCssPresetEnv = require('postcss-preset-env');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const SuppressChunksPlugin = require('./suppress-chunks.plugin');
const TwigPlugin = require('./twig.plugin');

function nodeModulesPath() {
  const main = require.main;
  if (!main) {
    throw new Error('Not found main');
  }

  return main.paths;
}

const extractTwigPlugin = new ExtractTextPlugin({
  filename: '[name].twig',
});

const extractCssPlugin = new ExtractCssPlugin({
  filename: '[name].css',
});

const suppressChunksPlugin = new SuppressChunksPlugin();
const twigPlugin = new TwigPlugin();

const postCssCssNextPlugins = [
  PostCssPresetEnv,
];

const context = path.join(process.cwd(), 'src');

module.exports = (mode, serve) => ({
  mode: 'development',
  entry: () => {
    const files = glob.sync(`${context}/**/*.twig`);
    return files.reduce((entry, file) => {
      const relativeFile = path.relative(context, file);
      const relativeFileParts = path.parse(relativeFile);
      const entryName = path.join(
        relativeFileParts.dir,
        relativeFileParts.name
      );

      let files = file;

      // Добавим SCSS файл
      const scssFile = path.join(context, `${entryName}.scss`);
      if (fs.existsSync(scssFile)) {
        files = [file, scssFile];
      }

      return {...entry, [entryName]: files};
    }, {});
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
              loader: 'add-asserts.loader',
              options: {
                serve,
                servePort: 4200,
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
    ],
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        style: {
          chunks: 'all',
          enforce: true,
          name: 'style',
          test: m => m.constructor.name === 'CssModule',
        },
      },
    },
  },
  output: {
    path: path.resolve(process.cwd(), 'dist'),
  },
  plugins: [
    new CleanWebpackPlugin(['dist'], {root: process.cwd(), verbose: true}),
    extractTwigPlugin,
    extractCssPlugin,
    suppressChunksPlugin,
    twigPlugin,
  ],
  resolveLoader: {
    // Модули (лоадеры) будем искать в node_modules и в папке со скриптом
    modules: [...nodeModulesPath(), __dirname],
  },
  resolve: {
    extensions: ['.js', '.scss', '.twig'],
  },
});
