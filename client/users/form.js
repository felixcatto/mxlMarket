import React from 'react';
import Context from '../lib/context';
import { Error } from '../lib/utils';

export default ({ user, roles, method = 'post' }) => {
  const { urlFor } = React.useContext(Context);
  const action = method === 'put' ? urlFor('user', { id: user.id }) : urlFor('users');

  return (
    <form action={action} method="post">
      <input type="hidden" name="_method" value={method} />
      <div className="row mb-20">
        <div className="col-6">
          <div className="mb-15">
            <label>Name</label>
            <input type="text" className="form-control" name="name" defaultValue={user.name} />
            <Error entity={user} path="name" />
          </div>
          <div className="mb-15">
            <label>Role</label>
            <select name="role" className="form-control" defaultValue={user.role}>
              {Object.values(roles).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Error entity={user} path="role" />
          </div>
          <div className="mb-15">
            <label>Email</label>
            <input type="text" className="form-control" name="email" defaultValue={user.email} />
            <Error entity={user} path="email" />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
            />
            <Error entity={user} path="password" />
          </div>
        </div>
      </div>

      <a href={urlFor('users')} className="mr-10">
        Back
      </a>
      <button className="btn btn-primary" type="submit">
        Save
      </button>
    </form>
  );
};
