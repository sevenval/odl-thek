var express = require('express');
var router = express.Router();

var helper = require('../helper.js');

var users = helper.db.collection('users');


var passport = require('passport');

/* GET users listing. */
router.get('/', helper.ensureAuthenticated, function(req, res) {
  res.render('index', { title: 'logged in'});  
});


router.get('/list', helper.ensureAuthenticated, function(req, res) {
  users.find({}).toArray(function(_err,_users){
    console.log(_users);
    res.render('users/list', { title: 'users'+_users.length, users : _users});  
  })
});

router.get('/auth/github',
  passport.authenticate('github'),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

router.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/users/login' }),
  function(req, res) {
    if(req.session&&req.session.passport&&req.session.passport.user) {
      users.findOne({login : req.session.passport.user.login },function(_err,_user){
        if(_user == null) {
          users.insert(req.session.passport.user,function(_err,_newuser){
            res.redirect('/users/');    
          })
        } else {
          req.session.passport.user = _user;
          res.redirect('/users/');
        }
      })
    }
  });

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});



module.exports = router;
