import {
  emptyObject,
  validate,
  roles,
  checkValueUnique,
  checkAdmin,
  cacheControlStates,
} from '../lib/utils';

export default async app => {
  const { User } = app.objection;
  const { urlFor } = app.ctx;

  app.get('/users', { name: 'users' }, async (request, reply) => {
    const users = await User.query();
    reply.render('users/Index', { users });
  });

  app.get('/users/new', { name: 'newUser', preHandler: checkAdmin }, async (request, reply) => {
    reply.render('users/New', {
      user: emptyObject,
      roles,
      turboCacheControl: cacheControlStates.noPreview,
    });
  });

  app.get(
    '/users/:id/edit',
    { name: 'editUser', preHandler: checkAdmin },
    async (request, reply) => {
      const user = await User.query().findById(request.params.id);
      reply.render('users/Edit', { user, roles });
    }
  );

  app.post(
    '/users',
    { preHandler: [checkAdmin, validate(User.yupSchema)] },
    async (request, reply) => {
      if (request.errors) {
        return reply.code(422).render('users/New', {
          user: request.entityWithErrors,
          roles,
        });
      }

      const { isUnique, errors } = await checkValueUnique(User, 'email', request.data.email);
      if (!isUnique) {
        return reply.code(422).render('users/New', {
          user: { ...request.data, ...errors },
          roles,
        });
      }

      await User.query().insert(request.data);
      reply.redirect(urlFor('users'));
    }
  );

  app.put(
    '/users/:id',
    { name: 'user', preHandler: [checkAdmin, validate(User.yupSchema)] },
    async (request, reply) => {
      const { id } = request.params;
      if (request.errors) {
        return reply.code(422).render('users/Edit', {
          user: request.entityWithErrors,
          roles,
        });
      }

      const { isUnique, errors } = await checkValueUnique(User, 'email', request.data.email, id);
      if (!isUnique) {
        return reply.code(422).render('users/Edit', {
          user: { ...request.data, ...errors },
          roles,
        });
      }

      await User.query().update(request.data).where('id', id);
      reply.redirect(urlFor('users'));
    }
  );

  app.delete('/users/:id', { preHandler: checkAdmin }, async (request, reply) => {
    await User.query().delete().where('id', request.params.id);
    reply.redirect(urlFor('users'));
  });
};
