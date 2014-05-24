
var config = {
  "github" : {
    "GITHUB_CLIENT_ID" : process.env.GITHUB_CLIENT_ID, 
    "GITHUB_CLIENT_SECRET" : process.env.GITHUB_CLIENT_SECRET,
    "callbackURL" : process.env.callbackURL
  },
  "mongourl" : process.env.mongodburl
}


var db = require('mongoskin').db(config.mongourl);





/* test if the user ist authorized */
var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/users/login')
}



var helper = {
  github : config.github,
  db : db,
  ensureAuthenticated : ensureAuthenticated
}

module.exports = helper;
