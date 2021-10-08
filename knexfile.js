const POSTGRES_HOST = process.env.POSTGRES_HOST || '127.0.0.1';

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: POSTGRES_HOST,
      user: 'postgres',
      password: '1',
      database: 'mxlmarket',
    },
    useNullAsDefault: true,
    migrations: {
      stub: 'lib/migrationStub.js',
    },
    seeds: {
      stub: 'lib/seedStub.js',
    },
  },

  test: {
    client: 'pg',
    connection: {
      host: POSTGRES_HOST,
      user: 'postgres',
      password: '1',
      database: 'mxlmarket_test',
    },
    useNullAsDefault: true,
  },

  production: {
    client: 'pg',
    connection: {
      host: POSTGRES_HOST,
      user: 'postgres',
      password: '1',
      database: 'mxlmarket',
    },
    useNullAsDefault: true,
  },
};
