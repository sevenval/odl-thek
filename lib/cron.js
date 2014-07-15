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
    end: { $gt: new Date() },
    notificationSent: { $ne: true }
  };

  BookingModel.find(where)
    .populate('user')
    .exec(function (err, bookings) {
      bookings.forEach(function (booking) {

        Mailer.sendBookingExpiredMail(booking, function () {

          // update booking to make sure notification mail is sent only once
          booking.update({ notificationSent: true }, function (err) {
            //console.log('Booking saved');
          });

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