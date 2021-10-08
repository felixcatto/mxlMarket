import { emptyObject, validate, cacheControlStates } from '../lib/utils';
import encrypt from '../lib/secure';

export default async app => {
  const { User } = app.objection;
  const { urlFor } = app.ctx;

  app.get('/session/new', { name: 'newSession' }, async (request, reply) => {
    reply.render('common/Session', {
      user: emptyObject,
      turboCacheControl: cacheControlStates.noPreview,
    });
  });

  app.post(
    '/session',
    { name: 'session', preHandler: validate(User.yupLoginSchema) },
    async (request, reply) => {
      if (request.errors) {
        return reply.code(422).render('common/Session', { user: request.entityWithErrors });
      }

      const user = await User.query().findOne('email', request.data.email);
      if (!user) {
        return reply.code(422).render('common/Session', {
          user: {
            ...request.data,
            errors: { email: 'User with such email not found' },
          },
        });
      }

      if (user.password_digest !== encrypt(request.data.password)) {
        return reply.code(422).render('common/Session', {
          user: {
            ...request.data,
            errors: { password: 'Wrong password' },
          },
        });
      }

      request.session.set('userId', user.id);
      reply.redirect(urlFor('home'));
    }
  );

  app.delete('/session', async (request, reply) => {
    request.session.delete();
    reply.redirect(urlFor('home'));
  });
};
