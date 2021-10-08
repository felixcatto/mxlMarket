import React from 'react';
import { compile } from 'path-to-regexp';
import { roles } from '../../lib/sharedUtils';

export * from '../../lib/sharedUtils';

export const Link = ({ href, method, children }) => (
  <form method="POST" action={href} className="fake-link">
    <input type="hidden" name="_method" value={method} />
    <button type="submit" className="fake-link__button">
      {children}
    </button>
  </form>
);

export const Error = ({ entity, path }) => {
  const errorMsg = entity.errors?.[path];
  return errorMsg ? <div className="error">{errorMsg}</div> : null;
};

export const userRolesToIcons = {
  [roles.admin]: 'fa fa-star',
  [roles.user]: 'fa fa-fire',
  [roles.guest]: 'fa fa-ghost',
};

export const makeUrlFor = rawRoutes => {
  const routes = Object.keys(rawRoutes).reduce(
    (acc, name) => ({ ...acc, [name]: compile(rawRoutes[name]) }),
    {}
  );

  return (name, args, opts) => {
    const toPath = routes[name];
    if (!toPath) {
      throw new Error(`Route with name ${name} is not registered`);
    }

    return toPath(args, opts);
  };
};
