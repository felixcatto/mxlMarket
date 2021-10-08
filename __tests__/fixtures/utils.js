import usersFixture from './users';

export const getLoginCookie = async server => {
  const [admin] = usersFixture;
  const response = await server.inject({
    method: 'post',
    url: '/session',
    payload: admin,
  });

  const [cookie] = response.cookies;
  return { [cookie.name]: cookie.value };
};
