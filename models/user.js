/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2 */
'use strict';

var Mongoose = require('mongoose');

var UserSchema = new Mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true
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

  // oauth providers
  type: {
    type: String,
    enum: [
      'github',
      'google'
    ]
  },

  role: {
    type: String,
    enum: [
      'user',
      'admin'
    ],
    default: 'user'
  }

});

module.exports = Mongoose.model('User', UserSchema);