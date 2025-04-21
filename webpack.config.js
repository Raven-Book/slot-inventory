const path = require('path');
const glob = require('glob');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const { versions } = require('./package.json');

const getFiles = (pattern) => {
  return glob.sync(pattern)
    .map(file => './' + file.replace(/\\/g, '/'))
    .sort();
};

const getJsEntries = () => {
  return getFiles('assets/js/*.js');
};

const getCssEntries = () => {
  return getFiles('assets/css/*.{css,scss}');
};

const names = {
  'inventory': 'Slot Inventory',
  'recipes': 'Recipes'
};

const footers = {
  'inventory': ', Fork from simple-inventory',
  'recipes': ', By BlackStar'
};

const paths = {
  inventory: [
    './assets/js/inventory/000-popup.js',
    './assets/js/inventory/001-type.js',
    './assets/js/inventory/002-item.js',
    './assets/js/inventory/003-inv.js',
    './assets/js/inventory/004-display.js',
    './assets/js/inventory/005-macro.js',
    './assets/css/inventory.scss',
    './assets/css/popup.scss'
  ],
  recipes: [
    './assets/js/recipes/001-recipe.js',
    './assets/js/recipes/002-book.js',
    './assets/js/recipes/003-macro.js'
  ]
};



module.exports = {
  entry: {
    'inventory': paths.inventory,
    'recipes': paths.recipes
  },
  
  output: {
    path: path.resolve(__dirname, 'dist/assets'),
    filename: '[name]/[name].js',
    clean: {
      keep: /^(?!js|css|scss).+$/
    }
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                outputStyle: 'compressed',
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },

  optimization: {
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin()
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name]/[name].css'
    }),
    {
      apply: (compiler) => {
        compiler.hooks.compilation.tap('AddHeaderAndFooterPlugin', (compilation) => {
          compilation.hooks.processAssets.tap(
            {
              name: 'AddHeaderAndFooterPlugin',
              stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE
            },
            (assets) => {
              // 获取所有入口名称
              const entryNames = Object.keys(compiler.options.entry);
              
              entryNames.forEach(entryName => {
                const jsFile = `${entryName}/${entryName}.js`;
                const cssFile = `${entryName}/${entryName}.css`;

                if (assets[jsFile]) {
                  const content = assets[jsFile].source();
                  const header = `/* ${names[entryName]}, Ver.${versions[entryName]}${footers[entryName]} */\n/// Build Date: ${new Date().toISOString()}\n`;
                  const footer = `\n/* End ${names[entryName]} */`;
                  assets[jsFile] = new compiler.webpack.sources.RawSource(
                    header + content + footer
                  );
                }
                if (assets[cssFile]) {
                  const content = assets[cssFile].source();
                  const header = `/* ${names[entryName]} Styles, Ver.${versions[entryName]} */\n/* Build Date: ${new Date().toISOString()} */\n`;
                  const footer = `\n/* End ${names[entryName]} Styles */`;
                  assets[cssFile] = new compiler.webpack.sources.RawSource(
                    header + content + footer
                  );
                }
              });
            }
          );
        });
      }
    }
  ]
}; 