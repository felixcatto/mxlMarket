/* eslint-disable */
import React from 'react';
import { hydrate } from 'react-dom';
import Page from '{{page}}';
import Context from '../../../client/lib/context';
import { makeUrlFor, isBelongsToUser } from '../../../client/lib/utils';

const isPreviewFromCacheDisplayed = document.documentElement.hasAttribute('data-turbo-preview');
if (!isPreviewFromCacheDisplayed) {
  const { routes, currentUser } = window.INITIAL_STATE;
  window.INITIAL_STATE.urlFor = makeUrlFor(routes);
  window.INITIAL_STATE.isBelongsToUser = isBelongsToUser(currentUser);

  hydrate(
    <Context.Provider value={window.INITIAL_STATE}>
      <Page {...window.INITIAL_STATE} />
    </Context.Provider>,
    document.querySelector('#page')
  );
}
