/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var moment        = require('moment');
var nodemailer    = require("nodemailer");
var Config        = require('../config/app');


var transport;
if (Config.mail && Config.mail.transport.toUpperCase() === 'SMTP') {
  transport = nodemailer.createTransport("SMTP", {
    service: Config.mail.service,
    auth: {
      user: Config.mail.username,
      pass: Config.mail.password
    }
  });
} else {
  transport = nodemailer.createTransport('Sendmail');
}


/**
 * @api private
 */
function sendMail(subject, msg, to, cb) {

  to = to || Config.mail.to;

  var mailOptions = {
    from: Config.mail.from,
    to: to,
    subject: 'Odlthek // ' + subject,
    text: msg
  };

  transport.sendMail(mailOptions, function (err, response) {
    if (err) {
      console.log(err);
    }
    console.log('Mail send');
    if (cb) { cb(err); }
  });
}


var Mailer = {

  sendNewBookingMail: function (gadget, booking, user) {
    var msg = '';
    msg += 'New booking for Gadget ' + gadget.name + ' (' + gadget.hwid + '):\n\n';
    msg += 'Start: ' + moment.utc(booking.start).format('YYYY-MM-DD HH:mm') + '\n';
    msg += 'End: ' + moment.utc(booking.end).format('YYYY-MM-DD HH:mm') + '\n';
    msg += 'User: ' + user.email + '\n';

    sendMail('New booking', msg);
  },

  sendBookingUpdatedMail: function (gadget, booking, user) {
    var msg = '';
    msg += 'Booking for Gadget ' + gadget.name + ' (' + gadget.hwid + ') updated:\n\n';
    msg += 'Start: ' + moment.utc(booking.start).format('YYYY-MM-DD HH:mm') + '\n';
    msg += 'End: ' + moment.utc(booking.end).format('YYYY-MM-DD HH:mm') + '\n';
    msg += 'User: ' + user.email + '\n';

    sendMail('Booking updated', msg);
  },

  sendBookingExpiredMail: function (booking, callback) {
    var msg = '';
    msg += 'Booking for Gadget ' + booking.gadgetname + ' expired:\n\n';
    msg += 'Start: ' + moment.utc(booking.start).format('YYYY-MM-DD HH:mm') + '\n';
    msg += 'End: ' + moment.utc(booking.end).format('YYYY-MM-DD HH:mm') + '\n';
    msg += 'User: ' + booking.user.email + '\n';

    sendMail('Booking expired', msg, null, callback);
  }

};

module.exports = Mailer;