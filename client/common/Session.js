import React from 'react';
import Layout from './layout';
import Context from '../lib/context';
import { Error } from '../lib/utils';

export default ({ user }) => {
  const { urlFor } = React.useContext(Context);

  return (
    <Layout>
      <h3>Login form</h3>
      <form action={urlFor('session')} method="post">
        <div className="row mb-20">
          <div className="col-6">
            <div className="mb-15">
              <label>Email</label>
              <input type="text" className="form-control" name="email" defaultValue={user.email} />
              <Error entity={user} path="email" />
            </div>

            <div>
              <label>Password</label>
              <input type="password" className="form-control" name="password" />
              <Error entity={user} path="password" />
            </div>
          </div>
        </div>

        <a href={urlFor('home')} className="mr-10">
          Cancel
        </a>
        <button className="btn btn-primary" type="submit">
          Sign in
        </button>
      </form>
    </Layout>
  );
};
