var config = require('./config.json');

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
