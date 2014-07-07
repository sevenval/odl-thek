/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';


var _             = require('underscore');
var moment        = require('moment');
var Config        = require('../config/app');
var BookingModel  = require('../models/booking');
var GadgetModel   = require('../models/gadget');
var UserModel     = require('../models/user');


var express = require('express');
var router = express.Router();
var helper = require('../helper.js');
var users = helper.db.collection('users');
var bookings = helper.db.collection('bookings');
var passport = require('passport');


//
// Dev helper for making the current user to admin
//
router.get('/makeadmin', function (req, res, next) {
  UserModel.findOneAndUpdate({
    _id: req.session.user._id,
  }, {
    role: 'admin'
  }, function (err, user) {
    req.session.user = user;
    res.redirect('/');
  });
});
//
// Dev helper for making the current user to admin
//
router.get('/makeuser', function (req, res, next) {
  UserModel.findOneAndUpdate({
    _id: req.session.user._id,
  }, {
    role: 'user'
  }, function (err, user) {
    req.session.user = user;
    res.redirect('/');
  });
});



router.get(
  '/auth/google',
  passport.authenticate('google', Config.auth.google.options)
);


router.get('/auth/google/callback',
   passport.authenticate('google', { failureRedirect: '/users/login' }),
   function (req, res, next) {

    var userData = req.session.passport.user._json;

    UserModel.findOneAndUpdate({
      email: userData.email,
      type: 'google'
    }, {
      email: userData.email,
      displayname: userData.name,
      name: userData.name,
      active: true,
      avatarurl: userData.picture,
      type: 'google'
    }, {
      // create user if not exists
      upsert: true
    }, function (err, user) {

      if (err) {
        return next(err);
      }

      // store user in session
      req.session.user = user;

      res.redirect('/gadgets');
    });
  });


router.get('/auth/github', passport.authenticate('github'));


router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/users/login' }),
  function (req, res) {

    if(req.session&&req.session.passport&&req.session.passport.user) {
      var suser = req.session.passport.user;

      users.findOne({displayname : suser.username, type :'github' },function(_err,_user){
        if(_user == null) {
          console.log('suser',suser._json);
          var user = {
            displayname : suser.username,
            name : suser._json.name,
            active : true,
            avatarurl : suser._json.avatar_url,
            email : suser._json.email,
            type : 'github',
            role : 'user'
          }
          users.insert(user,function(_err,_newuser,_zwei){
            req.session.user = _newuser[0];
            /* check if this is the first user */
            users.find({}).toArray(function(_err,_result){
              if(_result.length==1) {
                _result[0].role = 'admin';

                users.save(_result[0],function(_err,_myuser){
                  req.session.user = _result[0];
                   res.redirect('/gadgets/');
                })
              } else {
                 res.redirect('/gadgets/');
              }
            })
          })
        } else {
          req.session.user = _user;
          res.redirect('/gadgets/');
        }
      })
    }
  });



router.get('/', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  users.find({}).toArray(function(_err,_users){
    res.render('users/list', { title: 'ODL: users', users : _users});
  })
});


router.post('/:id/setrole', helper.ensureAuthenticated, function(req, res) {
  users.findById(req.params.id,function(_err,_user){
    console.log(req.body);
    if(req.body.role) {
      _user.role = req.body.role;
      if(req.body.active) {
        _user.active = true;
      } else {
        _user.active = false;
      }
      users.save(_user,function(_err,_newuser){
        console.log(_err,_newuser);
        res.redirect('/users/'+_user._id);
      })
    }
  })
});


router.get('/logout', function(req, res){
  req.logout();
  req.session.destroy();
  res.redirect('/');
});


router.get('/:id', helper.ensureAuthenticated, function(req, res) {
  users.findById(req.params.id, function(_err,_user){

  bookings.find( {user:req.params.id} ).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {
      console.log(_result[0]);
      for(var i = 0 ; i < _result.length ; i++) {
        _result[i].startdate = helper.prettyDate(_result[i].start);
        _result[i].enddate = helper.prettyDate(_result[i].end);
      }
    }

	  res.render('users/detail',{
      title : 'userdetail',
      euser : _user,
      bookings : _result,
      breadcrumb: [
        { url: '/users/', name: 'Users' },
        { name: req.session.user.email }
      ]
    });
  })
  })
});


// TODO: Delete related bookings (?)
router.get('/remove/:id', helper.ensureAuthenticated, function(req, res) {
  console.log('ID',req.params.id);
  users.findById(req.params.id,function(_err,_user){
    users.remove(_user,function(_err,_result){
      res.redirect('/users/');
    })
  })
});

module.exports = router;
