const gulp = require('gulp');
const path = require('path');
const del = require('del');
const webpack = require('webpack');
const babel = require('gulp-babel');
const EventEmitter = require('events');
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const readline = require('readline');
const { makeServer, listen } = require('blunt-livereload');
const stream = require('stream');
const { promisify } = require('util');
const { generateClientPages, clearCache } = require('./lib/devUtils');
const babelConfig = require('./babelconfig.js');

const finished = promisify(stream.finished);
const { series, parallel } = gulp;

const paths = {
  public: {
    src: 'public/**/*',
    dest: 'dist/public',
  },
  serverJs: {
    src: [
      '*/**/*.js',
      'knexfile.js',
      '!node_modules/**',
      '!dist/**',
      '!client/**',
      '!__tests__/**',
      '!seeds/**',
      '!migrations/**',
      '!services/**',
    ],
    dest: 'dist',
  },
  client: {
    pages: 'client/**/[A-Z]*.js',
    components: 'client/**/[a-z]*.js',
    css: 'client/**/index.scss',
    cssModules: 'client/**/*.module.scss',
    dest: 'dist/client',
  },
  madge: {
    allFilesSrc: ['**', '!node_modules/**'],
    jsFilesSrc: 'dist/**/*.js',
    dest: 'dist',
  },
};

let server;
let isWaitonListening = false;
const startServer = async () => {
  server = spawn('node', ['dist/bin/server.js'], { stdio: 'inherit' });

  if (!isWaitonListening) {
    isWaitonListening = true;
    await waitOn({
      resources: ['http-get://localhost:4000'],
      delay: 500,
      interval: 1000,
      validateStatus: status => status !== 503,
    });
    isWaitonListening = false;
  }
};

const restartServer = async () => {
  server.kill();
  await startServer();
};

process.on('exit', () => server && server.kill());

const webpackEmitter = new EventEmitter();
let webpackWatching;
const startWebpack = done => {
  clearCache(require.resolve('./webpack.config.js'));
  const compiler = webpack(require('./webpack.config.js')); // eslint-disable-line
  compiler.hooks.done.tap('done', () => webpackEmitter.emit('webpackDone'));
  webpackWatching = compiler.watch({}, done);
};
const restartWebpack = (done = () => {}) => webpackWatching.close(() => startWebpack(done));

const devServer = makeServer();
const startDevServer = async () => listen(devServer);
const reloadBrowser = async () => devServer.reloadBrowser();

const clean = async () => del(['dist']);

const copyAll = () => gulp.src(paths.madge.allFilesSrc).pipe(gulp.dest(paths.madge.dest));
const transpileMadgeJs = () =>
  gulp
    .src(paths.madge.jsFilesSrc)
    .pipe(babel(babelConfig.client))
    .pipe(gulp.dest(paths.madge.dest));

const copyPublic = () => gulp.src(paths.public.src).pipe(gulp.dest(paths.public.dest));
const copyPublicDev = () =>
  gulp
    .src(paths.public.src, { since: gulp.lastRun(copyPublicDev) })
    .pipe(gulp.symlink(paths.public.dest, { overwrite: false }));

// eslint-disable-next-line
const bundleClient = done => webpack(require('./webpack.config.js')).run(done);
const waitBundleClient = async () =>
  new Promise(resolve => webpackEmitter.once('webpackDone', resolve));

const transpileServerJs = () =>
  gulp
    .src(paths.serverJs.src, { since: gulp.lastRun(transpileServerJs) })
    .pipe(babel(babelConfig.server))
    .pipe(gulp.dest(paths.serverJs.dest));
const transpileCC = () =>
  gulp
    .src(paths.client.components, {
      since: gulp.lastRun(transpileCC),
    })
    .pipe(babel(babelConfig.server))
    .pipe(gulp.dest(paths.client.dest));
const transpileCP = () =>
  gulp
    .src(paths.client.pages, {
      since: gulp.lastRun(transpileCP),
    })
    .pipe(babel(babelConfig.server))
    .pipe(gulp.dest(paths.client.dest));
const transpileFolder = async (src, dest) =>
  finished(gulp.src(src).pipe(babel(babelConfig.server)).pipe(gulp.dest(dest)));

const trackChangesInDist = () => {
  const watcher = gulp.watch(['dist/**/*']); // TODO: remove array
  watcher
    .on('add', pathname => console.log(`File ${pathname} was added`))
    .on('change', pathname => console.log(`File ${pathname} was changed`))
    .on('unlink', pathname => console.log(`File ${pathname} was removed`));
};

const watchManualRestart = async () => {
  const terminal = readline.createInterface({ input: process.stdin });
  terminal.on('line', input => {
    if (input === 'rs') {
      series(parallel(transpileServerJs, transpileCP, transpileCC), restartServer)();
    }
  });
};

const watch = async () => {
  gulp.watch(paths.public.src, series(copyPublicDev, restartServer, reloadBrowser));
  gulp.watch(paths.serverJs.src, series(transpileServerJs, restartServer));
  gulp
    .watch(paths.client.pages)
    .on('change', series(parallel(waitBundleClient, transpileCP), reloadBrowser))
    .on('add', async pathname => {
      await generateClientPages(path.resolve(__dirname, pathname));
      restartWebpack();
    });
  gulp
    .watch(paths.client.components)
    .on('change', series(parallel(waitBundleClient, transpileCC), reloadBrowser));
  gulp.watch(paths.client.css).on('change', series(waitBundleClient, reloadBrowser));
  gulp.watch(paths.client.cssModules).on('change', async pathname => {
    const dirs = pathname.split('/').slice(0, -1);
    const src = dirs.concat('*').join('/');
    const dest = `dist/${dirs.join('/')}`;

    await Promise.all([transpileFolder(src, dest), waitBundleClient()]);
    reloadBrowser();
  });

  trackChangesInDist();
};

const dev = series(
  clean,
  watchManualRestart,
  parallel(copyPublicDev, transpileServerJs, transpileCP, transpileCC, startDevServer),
  generateClientPages,
  startWebpack,
  startServer,
  watch
);

const build = series(
  clean,
  parallel(copyPublic, transpileServerJs, transpileCP, transpileCC),
  generateClientPages,
  bundleClient
);

module.exports = {
  dev,
  build,
  buildForMadge: series(clean, copyAll, transpileMadgeJs),
};
