/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mailer        = require('../lib/mailer');
var BookingModel  = require('../models/booking');
var GadgetModel   = require('../models/gadget');


/**
 * Searches for expired bookings and sends a notification mail to odlthek owners
 */
function findExpiredBookings() {
  var where = {
    status: { $ne: 'closed' },
    end: { $lt: new Date() },
    notificationSent: { $ne: true }
  };

  BookingModel.find(where, function (err, bookings) {
    bookings.forEach(function (booking) {

      Mailer.sendBookingExpiredMail({
        userId: booking.user,
        gadgetId: booking.gadget,
        booking: booking
      }, function () {

        // update booking to make sure notification mail is sent only once
        booking.update({ notificationSent: true });

      });
    });
  });
}


var Cron = {

  start: function () {
    this.interval = setInterval(function () {

      findExpiredBookings();

    // run every minute
    }, 60000);
  },

  stop: function () {
    clearInterval(this.interval);
  }

};

module.exports = Cron;