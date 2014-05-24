var express = require('express');
var router = express.Router();

var helper = require('../helper.js');

var users = helper.db.collection('users');


var passport = require('passport');

router.get('/', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  users.find({}).toArray(function(_err,_users){
    res.render('users/list', { title: 'users'+_users.length, users : _users});  
  })
});





router.post('/:id/setrole', helper.ensureAuthenticated, function(req, res) {
  users.findById(req.params.id,function(_err,_user){
    console.log(req.body);
    if(req.body.role) {
      _user.role = req.body.role;
      if(req.body.active) {
        _user.active = true;
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
  users.findById(req.params.id,function(_err,_user){
      res.render('users/detail',{ title : 'userdetail', user : _user});  
  })
});

router.get('/remove/:id', helper.ensureAuthenticated, function(req, res) {
  console.log('ID',req.params.id);
  users.findById(req.params.id,function(_err,_user){
    users.remove(_user,function(_err,_result){
      res.redirect('/users/list');  
    })
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
      var suser = req.session.passport.user;
      users.findOne({displayname : suser.username, type :'github' },function(_err,_user){
        if(_user == null) {
          console.log('suser',suser._json);
          var user = {
            displayname : suser.username,
            name : suser._json.name,
            active : true,
            email : suser._json.email,
            type : 'github',
            role : 'user'
          }
          users.insert(user,function(_err,_newuser){
            req.session.user = _newuser;
            /* check if this is the first user */
            users.find({}).toArray(function(_err,_result){
              if(_result.length==1) {
                _result[0].role = 'admin';

                users.save(_result[0],function(_err,_myuser){
                  req.session.user = _myuser;
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



module.exports = router;
