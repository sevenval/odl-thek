/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2 */
'use strict';


var DEVELOPMENT = {
  db: {
    url: process.env.MONGOLAB_URI || process.env.mongodburl || 'mongodb://localhost/odlthek',
    debug: true
  },
  auth: {
    github: {
      clientID: process.env.GITHUB_CLIENT_ID || 'aa8e3665f93ee81d67fc',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '224c80c352126f65f26b1e7fd4092d015caf9b87',
      callbackURL: process.env.GITHUB_CALLBACK || process.env.callbackURL || 'http://127.0.0.1:3000/users/auth/github/callback'
    },
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '1011998292679-n8capudopv0mnt8pcfgd0jumltmdbjtr.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'z7Dn4iTx7Hzjlm8-9FA9SSMB',
      callbackURL: process.env.GOOGLE_CALLBACK || "http://127.0.0.1:3000/users/auth/google/callback",
      options: {
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        hostedDomain: 'sevenval.com'
      }
    }
  },
  mail: {
    to: 'joachim.feldmann@sevenval.com',
    from: 'Sevenval Odlthek <no-reply@odlthek.com>'
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