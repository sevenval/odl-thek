var github = {};

try {
  github = require('./github.json');
} catch (e) {
  github = {  
    GITHUB_CLIENT_ID : "",
    GITHUB_CLIENT_SECRET : ""
  }
}

var config = {
  "github" : {
    "GITHUB_CLIENT_ID" : process.env.GITHUB_CLIENT_ID ? process.env.GITHUB_CLIENT_ID : github.GITHUB_CLIENT_ID, 
    "GITHUB_CLIENT_SECRET" : process.env.GITHUB_CLIENT_SECRET ? process.env.GITHUB_CLIENT_SECRET : github.GITHUB_CLIENT_SECRET,
    "callbackURL" : process.env.callbackURL ? process.env.callbackURL : "http://localhost:3000/users/auth/github/callback"
  },
  "mongourl" : process.env.mongodburl ? process.env.mongodburl : "mongodb://localhost:27017/odlthek"
}

var db = require('mongoskin').db(config.mongourl);


/* test if the user ist authorized */
var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}



var helper = {
  github : config.github,
  db : db,
  ensureAuthenticated : ensureAuthenticated
}

module.exports = helper;
