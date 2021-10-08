import React from 'react';
import Layout from '../common/layout';
import Form from './form';

export default props => (
  <Layout>
    <h3>Create New User</h3>
    <Form {...props} />
  </Layout>
);
