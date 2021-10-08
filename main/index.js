import path from 'path';
import fs from 'fs';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyReverseRoutes from 'fastify-reverse-routes';
import fastifySecureSession from 'fastify-secure-session';
import { reactRenderPlugin, objectionPlugin, routesPlugin } from '../lib/utils';
import routes from '../routes';
import * as models from '../models';

export default () => {
  const mode = process.env.NODE_ENV || 'development';
  const pathPublic = path.resolve(__dirname, '../public');
  const viewsPath = path.resolve(__dirname, '../client');
  const template = fs.readFileSync(path.resolve(__dirname, pathPublic, 'html/index.html'), 'utf8');
  const manifest =
    fs.readFileSync(path.resolve(__dirname, pathPublic, 'manifest.json'), 'utf8') |> JSON.parse;

  const app = fastify({
    logger: {
      prettyPrint: true,
      level: 'error',
    },
  });

  app.decorate('ctx', {
    template,
    manifest,
    viewsPath,
    urlFor: fastifyReverseRoutes,
    routes: null,
    isDevelopment: mode === 'development',
  });
  app.decorate('objection', null);
  app.decorateReply('render', null);
  app.decorateRequest('data', null);
  app.decorateRequest('errors', null);
  app.decorateRequest('entityWithErrors', null);
  app.decorateRequest('currentUser', null);

  app.register(fastifySecureSession, {
    secret: 'a secret with minimum length of 32 characters',
    cookie: { path: '/' },
  });
  app.register(routesPlugin);
  app.register(fastifyReverseRoutes.plugin);
  app.register(fastifyStatic, { root: pathPublic });
  app.register(objectionPlugin, { mode, models });
  app.register(reactRenderPlugin);
  app.register(routes);

  return app;
};
