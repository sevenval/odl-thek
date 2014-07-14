/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mailer        = require('../lib/mailer');
var BookingModel  = require('../models/booking');
var GadgetModel   = require('../models/gadget');



function findExpiredBookings() {
  var where = {
    status: { $ne: 'closed' },
    end: { $gt: new Date() }
  };

  BookingModel.find(where)
    .populate('user')
    .exec(function (err, bookings) {
      bookings.forEach(function (booking) {
        // send mail (ignore callback)
        Mailer.sendBookingExpiredMail(booking);
      });
    });
}


var Cron = {

  start: function () {
    this.interval = setInterval(function () {

      // TODO: when to send notification mails? Check in intervals vs. daily
      // reports?
      // findExpiredBookings();

    }, 60000);
  },

  stop: function () {
    clearInterval(this.interval);
  }

};

module.exports = Cron;