export default async app => {
  app.get('/', { name: 'home' }, (request, reply) => {
    reply.render('common/Index');
  });

  app.get('/structure', { name: 'structure' }, (request, reply) => {
    reply.render('common/Structure');
  });
};
