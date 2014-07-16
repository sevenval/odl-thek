/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var passport      = require('passport');
var Config        = require('../config/app');
var Utils         = require('../lib/utils');
var UserModel     = require('../models/user');

/**
 * Stores the auth data return from OAuth providers in local db. User data is
 * matched by email addresses and updated on every login action.
 * @api private
 */
function upsertUser(userData, cb) {
  UserModel.findOneAndUpdate({
    userIdProvider: userData.userIdProvider,
    type: userData.type
  }, userData, {
    // create user if (email) not exists
    upsert: true
  }, function (err, user) {

    if (err) { return cb(err); }

    UserModel.count({}, function (err, userCount) {

      if (err) { return cb(err); }

      if (userCount === 1) {
        // grant admin permissions to the first user in db
        UserModel.findByIdAndUpdate(user._id, { role: 'admin' }, function (err, user) {
          cb(null, user);
        });
      } else {
        cb(null, user);
      }
    });
  });
}


var AuthController = {

  /**
   * Redirects to github.com for authentication. After authorization, Github
   * will redirect the user back to this application at /users/auth/github/callback
   */
  authWithGithub: function (req, res, next) {
    passport.authenticate('github', {})(req, res);
  },


  /**
   * Redirects to google.com for authentication. After authorization, Google
   * will redirect the user back to this application at /users/auth/google/callback
   */
  authWithGoogle: function (req, res, next) {
    passport.authenticate('google', Config.auth.google.options)(req, res);
  },


  /**
   * Callback action for Google OAuth requests.
   */
  authWithGoogleCb: function (req, res, next) {
    passport.authenticate('google', { failureRedirect: '/' })(req, res, function () {

      var user, json = req.session.passport.user._json;

      user = {
        userIdProvider: json.id,
        email: json.email,
        displayname: req.session.passport.user.displayName,
        name: json.name,
        avatarurl: json.picture,
        type: 'google'
      };

      upsertUser(user, function (err, user) {
        if (err) { return next(err); }

        // store user object in session
        req.session.user = user;

        res.redirect('/gadgets');
      });
    });
  },


  /**
   * Callback action for Github OAuth requests.
   */
  authWithGithubCb: function (req, res, next) {
    passport.authenticate('github', { failureRedirect: '/' })(req, res, function () {

      var user, json = req.session.passport.user._json;

      user = {
        userIdProvider: req.session.passport.user.id, // github user id
        email: json.email || '', // email might not be present on github oauth
        displayname: req.session.passport.user.username,
        name: json.name || '',
        avatarurl: json.avatar_url,
        type: 'github'
      };

      upsertUser(user, function (err, user) {
        if (err) { return next(err); }

        // store user object in session
        req.session.user = user;

        res.redirect('/gadgets');
      });

    });
  },


  /**
   * Checks if a request is authenticated
   */
  isAuth: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next(Utils.getError(401));
    }
    next();
  },


  /**
   * Checks if the current user has admin permissions
   */
  isAdmin: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next(Utils.getError(401));
    }
    if (!req.session.user || req.session.user.role.toLowerCase() !== 'admin') {
      return next(Utils.getError(403));
    }
    next();
  },


  /**
   * Destroys the session object and logs out the current user
   */
  logout: function (req, res, next) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
  }

};

module.exports = AuthController;