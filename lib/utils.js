import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fp from 'fastify-plugin';
import knexConnect from 'knex';
import { Model } from 'objection';
import { isUndefined, isString, isEmpty } from 'lodash';
import Context from '../client/lib/context';
import knexConfig from '../knexfile';
import { roles, isBelongsToUser, makeUndefinedKeyError } from './sharedUtils';

export * from './sharedUtils';

export const cacheControlStates = makeUndefinedKeyError({
  noPreview: 'no-preview',
  noCache: 'no-cache',
});

const clearCache = (rootModulePath, { ignoreRegex = null } = {}) => {
  const clearCacheInner = moduleAbsPath => {
    const imodule = require.cache[moduleAbsPath];
    if (!imodule) return;

    if (imodule.id.match(/node_modules/) || (ignoreRegex && imodule.id.match(ignoreRegex))) return;

    delete require.cache[moduleAbsPath];
    imodule.children.forEach(el => clearCacheInner(el.id));
  };

  clearCacheInner(rootModulePath);
};

const isAdmin = currentUser => currentUser.role === roles.admin;

export const checkAdmin = async (request, reply) => {
  if (!isAdmin(request.currentUser)) {
    reply.code(403).send({ message: 'Forbidden' });
  }
};

export const checkBelongsToUser = getResourceAuthorId => async (request, reply) => {
  const resourceAuthorId = await getResourceAuthorId(request);
  if (!isBelongsToUser(request.currentUser)(resourceAuthorId)) {
    reply.code(403).send({ message: 'Forbidden' });
  }
};

export const isSignedIn = currentUser => currentUser.role !== roles.guest;

export const checkSignedIn = async (request, reply) => {
  if (!isSignedIn(request.currentUser)) {
    reply.code(401).send({ message: 'Unauthorized' });
  }
};

export const currentUserPlugin = fp(async app => {
  app.addHook('preHandler', async request => {
    const userId = request.session.get('userId');
    const { User } = app.objection;
    let user;
    if (userId) {
      user = await User.query().findById(userId);
    }

    if (user) {
      request.currentUser = user;
    } else {
      request.currentUser = User.guestUser;
    }
  });
});

export const routesPlugin = fp(async app => {
  app.addHook('onRoute', routeOptions => {
    if (routeOptions.name) {
      app.ctx.routes = { ...app.ctx.routes, [routeOptions.name]: routeOptions.url };
    }
  });
});

export const reactRenderPlugin = fp(async app => {
  app.addHook('preHandler', async (request, reply) => {
    reply.render = (viewPath, { turboCacheControl = null, ...props } = {}) => {
      const { template, viewsPath, urlFor, routes, isDevelopment, manifest } = app.ctx;
      const { currentUser } = request;
      const helpers = {
        routes,
        urlFor,
        curPath: request.url,
        currentUser,
        isSignedIn: isSignedIn(currentUser),
        isAdmin: isAdmin(currentUser),
        isBelongsToUser: isBelongsToUser(currentUser),
      };
      const data = { ...helpers, ...props };

      const absoluteViewPath = path.resolve(viewsPath, viewPath);
      if (isDevelopment) {
        clearCache(require.resolve(absoluteViewPath), { ignoreRegex: /context/ });
      }
      const Page = require(absoluteViewPath).default; // eslint-disable-line
      const renderedComponent = renderToString(
        <Context.Provider value={data}>
          <Page {...data} />
        </Context.Provider>
      );

      const initialState = `<script>window.INITIAL_STATE = ${JSON.stringify(data)}</script>`;
      const turboCacheControlTag = turboCacheControl
        ? `<meta name="turbo-cache-control" content="${turboCacheControl}">`
        : '';

      const html =
        template
          .replace('{{content}}', renderedComponent)
          .replace('{{initialState}}', initialState)
          .replace('{{clientPageScript}}', manifest[`${viewPath}.client.js`])
          .replace('{{turboCacheControl}}', turboCacheControlTag)
        |> (v =>
          Object.keys(manifest)
            .filter(filename => !filename.match(/.*client.*/))
            .reduce((acc, filename) => acc.replace(`{{${filename}}}`, manifest[filename]), v));

      reply.type('text/html');
      reply.send(html);
    };
  });
});

export const emptyObject = new Proxy(
  {},
  {
    get() {
      return '';
    },
  }
);

const getYupErrors = e => {
  if (e.inner) {
    return e.inner.reduce(
      (acc, el) => ({
        ...acc,
        [el.path]: el.message,
      }),
      {}
    );
  }

  return e.message; // no object?
};

export const validate = (schema, payloadType = 'body') => async request => {
  const payload = payloadType === 'query' ? request.query : request.body;

  try {
    request.data = schema.validateSync(payload, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (e) {
    const { id } = request.params;
    request.errors = getYupErrors(e);
    request.entityWithErrors = { ...payload, errors: getYupErrors(e), id };
  }
};

export const requiredIfExists = () => [
  'requiredIfExists',
  'required',
  value => isUndefined(value) || (isString(value) && !isEmpty(value)),
];

export const objectionPlugin = fp(async (app, { mode, models }) => {
  const knex = knexConnect(knexConfig[mode]);
  Model.knex(knex);
  app.objection = { ...models, knex };

  app.addHook('onClose', async (_, done) => {
    await knex.destroy();
    done();
  });
});

export const checkValueUnique = async (Enitity, column, value, id = null) => {
  const existingEntities = await Enitity.query().select(column).whereNot('id', id);
  if (existingEntities.some(entity => entity[column] === value)) {
    return {
      isUnique: false,
      errors: { errors: { [column]: `${column} should be unique` }, id },
    };
  }

  return { isUnique: true, errors: null };
};
