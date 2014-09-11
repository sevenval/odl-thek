/*jslint indent: 4, node: true, stupid: true, indent: 2 */
'use strict';

require('dotenv').load();

var _             = require('underscore');
var crypto        = require('crypto');
var moment        = require('moment');
var Mongoose      = require('mongoose');
var async         = require('async');
var csv           = require('csv');
var fs            = require('fs');
var Utils         = require('../lib/utils');
var BookingModel  = require('../models/booking');
var GadgetModel   = require('../models/gadget');
var UserModel     = require('../models/user');
var args          = process.argv.slice(2);


// Setup mongodb and run script
//Mongoose.set('debug', true);
Mongoose.connect(args[2]);


function importUsers(data, finalCb) {
  async.each(data, function (line, cb) {

    var disabled = false;
    var displayname = line[1];
    var email = line[2].toLowerCase();
    var name = email.split('@')[0].split('.');

    if (email.indexOf('@sevenval.com') === -1) {
      displayname = '(' + displayname + ')*';
      disabled = true;
    }

    // import only users with sevenval email address
    UserModel.create({
      userIdProvider: line[0],
      type: 'google',
      name: Utils.capitalize(name[0]) + ' ' + Utils.capitalize(name[1]),
      email: email,
      displayname: displayname,
      role: 'editor',
      disabled: disabled
    }, function (err) {
      if (err) {
        console.error('Error importing %s: %s', line.join(', '), err.message);
      }
      cb();
    });

  }, finalCb);
}


function importBookings(data, finalCb) {

  var gadgets = {}, users = {};

  async.series([

    function (cb) {
      GadgetModel.find({}, function (err, gList) {
        _.each(gList, function (gadget) { gadgets[gadget.hwid] = gadget; });
        cb();
      });
    },

    function (cb) {
      UserModel.find({}, function (err, uList) {
        _.each(uList, function (user) { users[user.userIdProvider] = user; });
        cb();
      });
    }

  ], function (err) {

    async.each(data, function (line, cb) {

      if (!gadgets[line[1]]) { console.log('Gadget with HWID %s not found.', line[1]); return cb(); }

      // hwaid, hwid, start, start_confirmed, stop, stop_confirmed, uid, start_real, start_confirmed_by, stop_real, stop_confirmed_by, email_remind
      // 1, 1, 2010-04-20 09:42:00+02, t, 2010-04-20 10:08:02.140925+02, t, 7,,,,

      var status, endDate, notificationSent = false, openend = false;
      var startDate   = (line[2].length > 5) ? new Date(line[2]) : null;
      var handoutdate = (line[7].length > 5) ? new Date(line[7]) : null;
      var closedate   = (line[9].length > 5) ? new Date(line[9]) : null;

      if (line[4].length > 5) {
        if (line[4] === 'infinity') {
          openend = true;
          endDate = new Date('2030-01-01');
          notificationSent = true;
        } else {
          endDate = new Date(line[4]);
        }
      }

      status = 'closed';

      if (!handoutdate && !closedate && startDate > new Date()) {
        // upcoming/open bookings
        status = 'open';
      }

      if (handoutdate && !closedate) {
        // device back in ODL
        status = 'handout';
      }

      BookingModel.create({
        gadget: gadgets[line[1]]._id,
        gadgetname: gadgets[line[1]].name,
        user: users[line[6]]._id,
        username: users[line[6]].name,
        start: startDate,
        end: endDate,
        status: status,
        handoutdate: handoutdate,
        handoutuser: users[line[8]] && users[line[8]]._id,
        closedate: closedate,
        closeuser: users[line[10]] && users[line[10]]._id,
        openend: openend,
        notificationSent: notificationSent,
        oldId: line[0]
      }, function (err) {
        cb();
      });

    }, finalCb);
  });
}


function run() {

  async.series({

    userImport: function (callback) {
      fs.createReadStream(__dirname + '/' + args[0], 'utf-8').pipe(csv.parse(
        function (err, data) {
          importUsers(data, callback);
        }
      ));
    },

    bookingImport: function (callback) {
      fs.createReadStream(__dirname + '/' + args[1], 'utf-8').pipe(csv.parse(
        function (err, data) {
          importBookings(data, callback);
        }
      ));
    }

  }, function (err, results) {
    console.log('Done.');
    process.exit(0);
  });
}

run();
