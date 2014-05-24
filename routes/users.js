var express = require('express');
var router = express.Router();

var helper = require('../helper.js');

var users = helper.db.collection('users');


var passport = require('passport');

/* GET users listing. */
router.get('/', helper.ensureAuthenticated, function(req, res) {
  res.render('index', { title: 'logged in '+req.session.user.displayname});  
});


router.get('/list', helper.ensureAuthenticated, function(req, res) {
  users.find({}).toArray(function(_err,_users){
    console.log(_users);
    res.render('users/list', { title: 'users'+_users.length, users : _users});  
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
      users.findOne({displayname : suser.username, role :'user' },function(_err,_user){

        console.log(_user);
        if(_user == null) {
          console.log('suser',suser._json);
          var user = {
            displayname : suser.username,
            name : suser._json.name,
            auth : true,
            email : suser._json.email,
            type : 'github',
            role : 'user'
          }
          users.insert(user,function(_err,_newuser){
            req.session.user = _newuser;
            res.redirect('/users/');    
          })
        } else {
          req.session.user = _user;
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
