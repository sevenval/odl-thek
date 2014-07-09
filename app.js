/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, white: true */
'use strict';

var express             = require('express');
var favicon             = require('static-favicon');
var logger              = require('morgan');
var cookieParser        = require('cookie-parser');
var bodyParser          = require('body-parser');
var session             = require('express-session');
var multer              = require('multer');
var moment              = require('moment');
var passport            = require('passport');
var GitHubStrategy      = require('passport-github').Strategy;
var GoogleStrategy      = require('passport-google-oauth').OAuth2Strategy;
var Mongoose            = require('mongoose');
var MongoStore          = require('connect-mongo')(session);
var Config              = require('./config/app');
var IndexController     = require('./controllers/index');
var AuthController      = require('./controllers/auth');
var BookingsController  = require('./controllers/bookings');
var GadgetsController   = require('./controllers/gadgets');
var UserController      = require('./controllers/users');


// Setup mongodb
Mongoose.connect(Config.db.url + Config.db.name);
Mongoose.set('debug', Config.db.debug);


//
// Setup passport strategies
//
passport.use(new GitHubStrategy(Config.auth.github, function (at, rt, user, cb) {
  return cb(null, user);
}));

passport.use(new GoogleStrategy(Config.auth.google, function (at, rt, user, cb) {
  return cb(null, user);
}));

passport.serializeUser(function (user, done) { done(null, user); });
passport.deserializeUser(function (user, done) { done(null, user); });


//
// Setup express
//
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('env', process.env.NODE_ENV || 'DEVELOPMENT');
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.disable('view cache');
app.disable('etag');
app.use(favicon());
app.use(logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({
  secret: '00c282c815f5336757e1953af53b37ec',
  store: new MongoStore({ db: Config.db.name })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(multer({
  dest: './public/uploads/',
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();
  }
}));

app.use(function (req, res, next) {
  // make current user obj available in templates
  app.locals.user = req.session.user;
  next();
});


//
// Register view helper
//
app.locals.fmtDatetime = function (datetime) {
  return moment.utc(datetime).format('YYYY-MM-DD HH:mm');
};


//
// Setup routes
//
app.get ('/',                                                       IndexController.index);
app.get ('/imprint',                                                IndexController.imprint);
app.get ('/users/auth/google',                                      AuthController.authWithGoogle);
app.get ('/users/auth/google/callback',                             AuthController.authWithGoogleCb);
app.get ('/users/auth/github',                                      AuthController.authWithGithub);
app.get ('/users/auth/github/callback',                             AuthController.authWithGithubCb);
app.get ('/users/logout',                 AuthController.isAuth,    AuthController.logout);
app.get ('/users/',                       AuthController.isAdmin,   UserController.listAll);
app.get ('/users/:id',                    AuthController.isAdmin,   UserController.list);
app.post('/users/:id',                    AuthController.isAdmin,   UserController.update);
app.get ('/users/:id/remove',             AuthController.isAdmin,   UserController.remove);
app.get ('/gadgets',                      AuthController.isAuth,    GadgetsController.listAll);
app.get ('/gadgets/top',                  AuthController.isAuth,    GadgetsController.listTop);
app.get ('/gadgets/new',                  AuthController.isAdmin,   GadgetsController.create);
app.get ('/gadgets/:id',                  AuthController.isAuth,    GadgetsController.list);
app.get ('/gadgets/:id/edit',             AuthController.isAdmin,   GadgetsController.edit);
app.post('/gadgets/:id/save',             AuthController.isAdmin,   GadgetsController.save);
app.get ('/gadgets/:id/remove',           AuthController.isAdmin,   GadgetsController.remove);
app.get ('/gadgets/:id/upload',           AuthController.isAdmin,   GadgetsController.upload);
app.get ('/bookings',                     AuthController.isAuth,    BookingsController.listAll);
app.get ('/bookings/:id/new',             AuthController.isAuth,    BookingsController.create);
app.post('/bookings/:id/new',             AuthController.isAuth,    BookingsController.save);
app.get ('/bookings/:id/edit',            AuthController.isAuth,    BookingsController.edit);
app.post('/bookings/:id/edit',            AuthController.isAuth,    BookingsController.save);
app.get ('/bookings/:id/remove',          AuthController.isAuth,    BookingsController.remove);
app.get ('/bookings/:id/handout',         AuthController.isAdmin,   BookingsController.handout);
app.get ('/bookings/:id/takeback',        AuthController.isAdmin,   BookingsController.takeback);


// error handling
app.use(function (err, req, res, next) {

  if (!module.parent) {
    console.error(err.stack);
  }

  err.statusCode  = err.statusCode  || 500;
  err.message     = err.message     || 'Internal server error';

  switch (err.statusCode) {
    case 401:
      err.message = 'Unauthorized';
      break;
    case 403:
      err.message = 'Forbidden';
      break;
  }

  res.statusCode = err.statusCode;
  res.render('error', {
    title: err.message,
    error: err,
    showStacktrace: (app.get('env') === 'DEVELOPMENT')
  });
});


// assume 404 since no middleware responded
app.use(function (req, res) {
  res.status(404).render('404', {
    title: '404',
    url: req.originalUrl
  });
});


app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});