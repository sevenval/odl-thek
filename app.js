/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, white: false */
'use strict';

var express = require('express');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var multer  = require('multer');
var helper = require('./helper.js');
var util = require('util');
var routes = require('./routes/index');
var users = require('./routes/users');
var gadgets = require('./routes/gadgets');
var bookings = require('./routes/bookings');

var moment              = require('moment');
var passport            = require('passport');
var GitHubStrategy      = require('passport-github').Strategy;
var GoogleStrategy      = require('passport-google-oauth').OAuth2Strategy;
var Mongoose            = require('mongoose');
var MongoStore          = require('connect-mongo')(session);
var Config              = require('./config/app');
var IndexController     = require('./routes/index');
var BookingsController  = require('./routes/bookings');
var GadgetsController   = require('./routes/gadgets');


//
// Setup passport strategies
//
passport.use(new GitHubStrategy(Config.auth.github, function (at, rt, user, cb) {
  return cb(null, user);
}));

passport.use(new GoogleStrategy(Config.auth.google, function (at, rt, user, cb) {
  return cb(null, user);
}));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});


//
// Setup mongodb
//
Mongoose.connect(Config.db.url + Config.db.name);
Mongoose.set('debug', true);


//
// Setup express
//
var app = express();
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
//app.use(session({ secret: 'odl-theklafksjd flaksjdflkajsdlkfjalksdjf', name : 'sid' }));
app.use(session({ secret: '***SECRET***', store: new MongoStore({ db: Config.db.name }) }));
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
// View helper
//
app.locals.fmtDatetime = function (datetime) {
  return moment.utc(datetime).format('YYYY-MM-DD HH:mm');
};

app.locals.createBreadcrumbs = function (breadcrumb) {
  if (!breadcrumb) { return ''; }
  var bc = [];
  breadcrumb.forEach(function (bcObj) {
    if (bcObj.url) {
      bc.push('<a href="' + bcObj.url + '">' + bcObj.name + '</a>');
    } else {
      bc.push(bcObj.name);
    }
  });
  return '<div class="breadcrumb">' +
    '<a href="/gadgets">Start</a> &raquo; ' + bc.join(' &raquo; ') +
    '</div>';
};


//
// Setup routing
//
app.get('/',                          IndexController.index);
app.get('/imprint',                   IndexController.imprint);

// AUTH ROUTES
// app.all('/',                AuthController.isAuthenticated);
app.get('/bookings',                  BookingsController.listAll);

// ADMIN ROUTES
// app.all('/',                AuthController.isAdmin);
app.get('/bookings/:id/handout',      BookingsController.handout);
app.get('/bookings/:id/takeback',     BookingsController.takeback);
app.get('/bookings/:id/new',          BookingsController.newBooking);
app.post('/bookings/:id/new',         BookingsController.saveBooking);
app.get('/bookings/:id/edit',         BookingsController.editBooking);
app.post('/bookings/:id/edit',        BookingsController.saveBooking);
app.get('/bookings/:id/remove',       BookingsController.delBooking);

app.use('/users', users);


app.get('/gadgets',                   GadgetsController.listAll);
app.get('/gadgets/top',               GadgetsController.listTop);
app.get('/gadgets/new',               GadgetsController.create);
app.get('/gadgets/:id',               GadgetsController.list);
app.get('/gadgets/:id/edit',          GadgetsController.edit);
app.post('/gadgets/:id/save',         GadgetsController.save);
app.get('/gadgets/:id/remove',        GadgetsController.remove);



//app.use('/gadgets', gadgets);


// error handling
app.use(function (err, req, res, next) {

  if (!module.parent) {
    console.error(err.stack);
  }

  res.status  = err.status || 500;
  err.message = err.message || 'Internal server error';

  res.render('error', {
    title: 'Something went wrong',
    error: err,
    showStacktrace: (app.get('env') !== 'PRODUCTION')
  });
});


// assume 404 since no middleware responded
app.use(function (req, res) {
  res.status(404).render('404', {
    title: '404',
    url: req.originalUrl
  });
});


module.exports = app;