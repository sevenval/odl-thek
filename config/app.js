/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2 */
'use strict';


var DEVELOPMENT = {
  db: {
    url: 'mongodb://localhost/',
    name: 'odlthek'
  },
  auth: {
    github: {
      clientID: 'aa8e3665f93ee81d67fc',
      clientSecret: '224c80c352126f65f26b1e7fd4092d015caf9b87',
      callbackURL: 'http://127.0.0.1:3000/users/auth/github/callback'
    },
    google: {
      clientID: '1011998292679-n8capudopv0mnt8pcfgd0jumltmdbjtr.apps.googleusercontent.com',
      clientSecret: 'z7Dn4iTx7Hzjlm8-9FA9SSMB',
      callbackURL: "http://127.0.0.1:3000/users/auth/google/callback",
      options: {
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        hostedDomain: 'sevenval.com'
      }
    }
  }
};


// PRODUCTION environment
var PRODUCTION = {};


// TESTING environment
var TESTING = {};


// export config based on current process environment
module.exports = (function () {
  var env = process.env.NODE_ENV || 'development';
  switch (env.toUpperCase()) {
  case 'DEVELOPMENT':
    return DEVELOPMENT;
  case 'PRODUCTION':
    return PRODUCTION;
  default:
    return TESTING;
  }
}());