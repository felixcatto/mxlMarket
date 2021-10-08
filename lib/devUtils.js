const sass = require('sass'); // eslint-disable-line
const crypto = require('crypto');
const klawSync = require('klaw-sync'); // eslint-disable-line
const fs = require('fs-extra'); // eslint-disable-line
const path = require('path');
const { isString } = require('lodash');

const distViewsPath = path.resolve(__dirname, '../dist/client');
const viewsPath = path.resolve(__dirname, '../client');

const getViewsStats = () =>
  klawSync(viewsPath, { nodir: true })
    .map(el => el.path)
    .filter(filepath => {
      const [fileName] = filepath.split('/').slice(-1);
      const isFirstLetterUpperCase = fileName[0] === fileName[0].toUpperCase();
      return isFirstLetterUpperCase;
    })
    .map(filepath => ({
      viewPath: filepath,
      viewName: filepath.split('/').slice(-1)[0],
      clientPagePath: filepath.replace('.js', '.client.js').replace(viewsPath, distViewsPath),
      clientPageName: filepath.replace('.js', '.client').replace(`${viewsPath}/`, ''),
    }));

const makeWebpackEntries = () =>
  getViewsStats().reduce((acc, el) => ({ ...acc, [el.clientPageName]: el.clientPagePath }), {});

const generateClientPages = async (singleViewPath = null) => {
  const clientPageStub = await fs.readFile(
    path.resolve(__dirname, '../lib/clientPageStub.js'),
    'utf8'
  );

  if (isString(singleViewPath)) {
    const viewPath = singleViewPath;
    const clientPagePath = viewPath.replace('.js', '.client.js').replace(viewsPath, distViewsPath);
    const content = clientPageStub.replace('{{page}}', viewPath);
    await fs.writeFile(clientPagePath, content);
  } else {
    await Promise.all(
      getViewsStats()
        .map(({ clientPagePath, viewPath }) => ({
          content: clientPageStub.replace('{{page}}', viewPath),
          clientPagePath,
        }))
        .map(el => fs.writeFile(el.clientPagePath, el.content))
    );
  }
};

const generateScopedName = (localName, resourcePath) => {
  const getHash = value => crypto.createHash('sha256').update(value).digest('hex');
  const hash = getHash(`${resourcePath}${localName}`).slice(0, 5);
  return `${localName}--${hash}`;
};

const preprocessCss = (data, filename) => {
  if (!filename.endsWith('module.scss')) return '';
  return sass.renderSync({ file: filename }).css.toString('utf8');
};

const clearCache = moduleAbsPath => {
  const imodule = require.cache[moduleAbsPath];
  if (!imodule) return;

  if (imodule.id.match(/node_modules/)) return;

  delete require.cache[moduleAbsPath];
  imodule.children.forEach(el => clearCache(el.id));
};

module.exports = {
  getViewsStats,
  makeWebpackEntries,
  generateClientPages,
  generateScopedName,
  preprocessCss,
  clearCache,
};
