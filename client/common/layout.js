import React from 'react';
import cn from 'classnames';
import Context from '../lib/context';
import { Link, userRolesToIcons } from '../lib/utils';

export default ({ children }) => {
  const { urlFor, curPath, currentUser, isSignedIn } = React.useContext(Context);
  const linkClass = (linkPath = '#') =>
    cn('app__nav-link', {
      'app__nav-link_active':
        (linkPath === '/' && curPath === '/') || (linkPath !== '/' && curPath.startsWith(linkPath)),
    });
  const userIconClass = role => cn('app__user-role-icon mr-5', userRolesToIcons[role]);

  return (
    <div className="app">
      <div className="app__header">
        <div className="container app__header-fg">
          <div className="d-flex align-items-center">
            <img src="/img/bag.png" className="app__logo mr-30" />
            <div className="d-flex">
              <a href={urlFor('home')} className={linkClass(urlFor('home'))}>
                Home
              </a>
              <a href={urlFor('users')} className={linkClass(urlFor('users'))}>
                Users
              </a>
              <a href="#" className={linkClass()}>
                My WTS
              </a>
              <a href="#" className={linkClass()}>
                My WTB
              </a>
              <a href="#" className={linkClass()}>
                WTS
              </a>
              <a href="#" className={linkClass()}>
                WTB
              </a>
            </div>
          </div>
          {isSignedIn ? (
            <div className="d-flex align-items-center">
              <i className={userIconClass(currentUser.role)}></i>
              <div className="app__user-name mr-10">{currentUser.name}</div>
              <Link href={urlFor('session')} method="delete">
                <i className="fa fa-sign-out-alt app__sign-icon" title="Sign out"></i>
              </Link>
            </div>
          ) : (
            <a href={urlFor('newSession')} className="app__sign-in">
              <div className="app__sign-in-text">Sign In</div>
              <i className="fa fa-sign-in-alt app__sign-icon" title="Sign in"></i>
            </a>
          )}
        </div>
      </div>

      <div className="container app__body">{children}</div>
    </div>
  );
};
