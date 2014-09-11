/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2 */
'use strict';

var Mongoose = require('mongoose');

var UserSchema = new Mongoose.Schema({

  userIdProvider: {
    type: String,
    unique: true
  },

  type: {
    type: String,
    enum: [
      'github',
      'google'
    ]
  },

  email: {
    type: String
  },

  displayname: {
    type: String
  },

  name: {
    type: String
  },

  active: {
    type: Boolean,
    default: true
  },

  avatarurl: {
    type: String
  },

  role: {
    type: String,
    enum: [
      'user', // external users
      'editor', // internal users
      'admin'
    ],
    default: 'user'
  },

  disabled: {
    type: Boolean,
    default: false
  },

});

module.exports = Mongoose.model('User', UserSchema);
