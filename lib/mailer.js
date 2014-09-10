/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var moment        = require('moment');
var async         = require('async');
var nodemailer    = require("nodemailer");
var BookingModel  = require('../models/booking');
var GadgetModel   = require('../models/gadget');
var UserModel     = require('../models/user');


if (process.env.MAIL_TRANSPORT === 'SMTP') {
  var transport = nodemailer.createTransport("SMTP", {
    service: process.env.MAIL_SERVICE,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  });
} else {
  var transport = nodemailer.createTransport('Sendmail');
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
    msg += 'Hallo Device-Team,\n';
    msg += '\n';
    msg += user.name  + ' (' + user.email + ') hat eine neue Buchung erstellt:\n';
    msg += 'Gerät: #' + gadget.hwid + ' (' + gadget.name + ')\n';
    msg += 'Start: ' + moment(booking.start).format(process.env.DATE_TIME_FORMAT) + '\n';
    msg += 'End: ' + moment(booking.end).format(process.env.DATE_TIME_FORMAT) + '\n';

    sendMail('Neue Buchung', msg);
  },


  sendBookingUpdatedMail: function (gadget, booking, user) {
    var msg = '';
    msg += 'Hallo Device-Team,\n';
    msg += '\n';
    msg += user.name  + ' (' + user.email + ') hat eine Buchung aktualisiert:\n';
    msg += 'Gerät: #' + gadget.hwid + ' (' + gadget.name + ')\n';
    msg += 'Start: ' + moment(booking.start).format(process.env.DATE_TIME_FORMAT) + '\n';
    msg += 'End: ' + moment(booking.end).format(process.env.DATE_TIME_FORMAT) + '\n';

    sendMail('Buchung aktualisiert', msg);
  },


  sendBookingDeletedMail: function (data) {
    async.parallel({
      user: function (callback) {
        UserModel.findById(data.userId, callback);
      },
      gadget: function (callback) {
        GadgetModel.findById(data.gadgetId, callback);
      }
    }, function (err, p) {

      var msg = '';
      msg += 'Hallo Device-Team,\n';
      msg += '\n';
      msg += p.user.name  + ' (' + p.user.email + ') hat eine Buchung gelöscht:\n';
      msg += 'Gerät: #' + p.gadget.hwid + ' (' + p.gadget.name + ')\n';
      msg += 'Start: ' + moment(data.booking.start).format(process.env.DATE_TIME_FORMAT) + '\n';
      msg += 'End: ' + moment(data.booking.end).format(process.env.DATE_TIME_FORMAT) + '\n';

      sendMail('Buchung gelöscht', msg);
    });
  },


  sendBookingExpiredMail: function (data, callback) {
    async.parallel({
      user: function (callback) {
        UserModel.findById(data.userId, callback);
      },
      gadget: function (callback) {
        GadgetModel.findById(data.gadgetId, callback);
      }
    }, function (err, p) {

      var gadget = '#' + p.gadget.hwid + ' (' + p.gadget.name + ')';
      var msg = '';
      msg += 'Hallo Device-Team,\n';
      msg += '\n';
      msg += 'der Buchungszeitraum für das Gerät ' + gadget + ' wurde überschritten:\n\n';
      msg += 'Start: ' + moment(data.booking.start).format(process.env.DATE_TIME_FORMAT) + '\n';
      msg += 'End: ' + moment(data.booking.end).format(process.env.DATE_TIME_FORMAT) + '\n';
      msg += 'Benutzer: ' + p.user.email + '\n';

      sendMail('Rückgabedatum überschritten ', msg, null, callback);
    });
  },


  sendTransferRequestMail: function (data) {
    async.parallel({
      currentUser: function (callback) {
        UserModel.findById(data.currentUserId, callback);
      },
      newUser: function (callback) {
        UserModel.findById(data.newUserId, callback);
      },
      gadget: function (callback) {
        GadgetModel.findById(data.gadgetId, callback);
      }
    }, function (err, p) {

      var gadget = '#' + p.gadget.hwid + ' (' + p.gadget.name + ')';
      var msg = '';
      msg += 'Hallo ' + p.newUser.name + ',\n';
      msg += '\n';
      msg += p.currentUser.name + ' möchte Dir das Gerät ' + gadget + ' übergeben.\n';
      msg += '\n';
      msg += 'Wenn Du die Buchung übernehmen möchtest klicke hier:\n';
      msg += data.url + '\n';
      msg += '\n';
      msg += 'Bitte behandel das Gerät und das Zubehör sorgfältig und bringe das Gerät und das Zubehör\n';
      msg += ' - pünktlich,\n';
      msg += ' - sauber,\n';
      msg += ' - aufgeladen und\n';
      msg += ' - ausgeschaltet\n';
      msg += 'zurück.\n';
      msg += '\n';
      msg += 'Das Device Management\n';

      sendMail('Gerätübergabe', msg, p.newUser.email);
    });
  },


  sendTransferConfirmationMail: function (data) {
    async.parallel({
      oldUser: function (callback) {
        UserModel.findById(data.oldUserId, callback);
      },
      newUser: function (callback) {
        UserModel.findById(data.newUserId, callback);
      },
      gadget: function (callback) {
        GadgetModel.findById(data.gadgetId, callback);
      }
    }, function (err, p) {

      var gadget = '#' + p.gadget.hwid + ' (' + p.gadget.name + ')';
      var msg = '';
      msg += 'Hallo ' + p.oldUser.name + ',\n';
      msg += '\n';
      msg += 'Du hast gerade das Gerät ' + gadget + ' an ' + p.newUser.name + ' übergeben.\n';
      msg += '\n';
      msg += 'Das Device Management\n';

      sendMail('Gerät erfolgreich übergeben', msg, p.newUser.email);
    });
  },


};

module.exports = Mailer;