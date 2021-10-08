import path from 'path';
import { Model } from 'objection';
import * as y from 'yup';
import { roles } from '../lib/utils';
import encrypt from '../lib/secure';

export class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get guestUser() {
    return {
      id: '-1',
      name: 'Guest',
      role: roles.guest,
      email: '',
      password_digest: '',
    };
  }

  static get yupSchema() {
    return y.object({
      name: y.string().required('required'),
      role: y.mixed().oneOf(Object.values(roles)).required('required'),
      email: y.string().email().required('required'),
      password: y.string().required('required'),
    });
  }

  static get yupLoginSchema() {
    return y.object({
      email: y.string().email().required('required'),
      password: y.string().required('required'),
    });
  }

  set password(value) {
    this.password_digest = encrypt(value);
  }
}
