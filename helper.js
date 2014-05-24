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
var bookings = db.collection('bookings');


/* test if the user ist authorized */
var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}

/* test if the user ist authorized */
var ensureAdmin = function (req, res, next) {
  if (req.session.user&&req.session.user.role == 'admin') { return next(); }
  res.redirect('/')
}

var prettyDate = function(_date) {
  return getDate(_date)+' '+getTime(_date);
}

var getDate = function(_date) {
  return _date.getFullYear()+'-'+fillZero(_date.getMonth()+1,2)+'-'+fillZero(_date.getDate(),2);
}

var getTime = function(_date) {
  return fillZero(_date.getHours(),2)+':'+fillZero(_date.getMinutes(),2);
}

var fillZero = function(_int,_num) {
  var string = _int.toString();
  var length = string.length;
  for(var i = length ; i < _num ; i++) {
    string = '0'+string;
  }
  return string;
}

var now = function() {
  return fillZero(new Date().getHours(),2)+":"+fillZero(new Date().getMinutes(),2);
}


var checkGadgetBooking = function(_gid,_start,_end,_callback) {
  var find = { gadget : _gid.toString() };
      find.start = {$lt: _end};
      find.end = {$gte: _end};
      bookings.find(find).toArray( function(_err,_bookings1){
        
        if(_bookings1.length > 0) {
          _callback(false, '1');
        } else {
          find.start = {$lte: _start};
          find.end = {$gt: _start};
          bookings.find(find).toArray( function(_err,_bookings2){
            console.log('2',_bookings2);
            if(_bookings2.length > 0) {
              _callback(false, '2');
            } else {
              find.start = {$gte: _start}
              find.end = {$lte: _end}
              bookings.find(find).toArray( function(_err,_bookings3){
                console.log('3',_bookings3);
                if(_bookings3.length > 0) {
                  _callback(false, '3');
                } else {
                  _callback(true, 'OK');
                }
               });
            
              }
            });
          }
        });
};




var helper = {
  github : config.github,
  db : db,
  ensureAuthenticated : ensureAuthenticated,
  ensureAdmin : ensureAdmin,
  prettyDate : prettyDate,
  now : now,
  getTime : getTime,
  getDate : getDate,
  checkGadgetBooking : checkGadgetBooking
}

module.exports = helper;
