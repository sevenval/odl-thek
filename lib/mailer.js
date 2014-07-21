/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var moment        = require('moment');
var nodemailer    = require("nodemailer");


var transport;
if (process.env.MAIL_TRANSPORT === 'SMTP') {
  transport = nodemailer.createTransport("SMTP", {
    service: process.env.MAIL_SERVICE,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  });
} else {
  transport = nodemailer.createTransport('Sendmail');
}


/**
 * @api private
 */
function sendMail(subject, msg, to, cb) {

  to = to || process.env.MAIL_RECIPIENT;

  var mailOptions = {
    from: process.env.MAIL_FROM,
    to: to,
    subject: 'Odlthek // ' + subject,
    text: msg
  };

  transport.sendMail(mailOptions, function (err, response) {
    if (err) { console.log(err); }

    if (cb) { cb(err); }
  });
}


var Mailer = {

  sendNewBookingMail: function (gadget, booking, user) {
    var msg = '';
    msg += 'New booking for Gadget ' + gadget.name + ' (' + gadget.hwid + '):\n\n';
    msg += 'Start: ' + moment(booking.start).format(process.env.DATE_TIME_FORMAT) + '\n';
    msg += 'End: ' + moment(booking.end).format(process.env.DATE_TIME_FORMAT) + '\n';
    msg += 'User: ' + user.email + '\n';

    sendMail('New booking', msg);
  },

  sendBookingUpdatedMail: function (gadget, booking, user) {
    var msg = '';
    msg += 'Booking for Gadget ' + gadget.name + ' (' + gadget.hwid + ') updated:\n\n';
    msg += 'Start: ' + moment(booking.start).format(process.env.DATE_TIME_FORMAT) + '\n';
    msg += 'End: ' + moment(booking.end).format(process.env.DATE_TIME_FORMAT) + '\n';
    msg += 'User: ' + user.email + '\n';

    sendMail('Booking updated', msg);
  },

  sendBookingExpiredMail: function (booking, callback) {
    var msg = '';
    msg += 'Booking for Gadget ' + booking.gadgetname + ' expired:\n\n';
    msg += 'Start: ' + moment(booking.start).format(process.env.DATE_TIME_FORMAT) + '\n';
    msg += 'End: ' + moment(booking.end).format(process.env.DATE_TIME_FORMAT) + '\n';
    msg += 'User: ' + booking.user.email + '\n';

    sendMail('Booking expired', msg, null, callback);
  },

  sendTransferRequestMail: function (booking, url, to) {
    var msg = '';
    msg += 'Accept booking transfer request for ' + booking.gadgetname + ':\n\n';
    msg += url + '\n';

    sendMail('Booking transfer request', msg, to);
  },

};

module.exports = Mailer;