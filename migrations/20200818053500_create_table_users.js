exports.up = async knex => {
  await knex.schema.createTable('users', table => {
    table.increments().primary();
    table.string('name');
    table.string('role');
    table.string('email').unique();
    table.string('password_digest');
  });
};

exports.down = async knex => {
  await knex.schema.dropTable('users');
};
