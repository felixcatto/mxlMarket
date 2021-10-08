import fastifyFormbody from 'fastify-formbody';
import fastifyMethodOverride from 'fastify-method-override';
import { currentUserPlugin } from '../lib/utils';
import home from './home';
import session from './session';
import users from './users';
import articles from './articles';
import tags from './tags';

const controllers = [session, home, users, articles, tags];

export default async app => {
  app.register(fastifyFormbody);
  app.register(fastifyMethodOverride);
  app.register(currentUserPlugin);
  controllers.forEach(route => app.register(route));
};
