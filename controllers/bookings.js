/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';


var _             = require('underscore');
var moment        = require('moment');
var Mongoose      = require('mongoose');
var Mailer        = require('../lib/mailer');
var BookingModel  = require('../models/booking');
var GadgetModel   = require('../models/gadget');


/**
 * @private
 */
function renderBookings(res, gadget, booking, error) {
  res.render('bookings/edit', {
    gadget: gadget,
    booking: booking,
    gadgetId: gadget._id,
    startdate: booking.startdate,
    enddate: booking.enddate,
    starttime: booking.starttime,
    endtime: booking.endtime,
    error: error
  });
}


var BookingsController = {

  /**
   * Lists all open and closed bookings for the current user. When the current
   * user has admin permissions, all bookings are shown.
   *
   * @todo: Pagination?
   */
  listAll: function (req, res, next) {
    var where = {};

    if (req.session.user.role !== 'admin') {
      // limit bookings to current user when users role is not admin
      where.user = req.session.user._id;
    }

    BookingModel.find(where)
      .sort({
        'user': 1,
        'startdate': 1
      })
      .populate('user')
      .populate('gadget')
      .exec(function (err, bookings) {
        if (err) { return next(err); }

        if (req.session.user.role === 'admin') {
          // render admin view
          res.render('bookings/list-admin', {
            title: 'bookings',
            bookings : _.groupBy(bookings, 'status')
          });
        } else {
          // render user view
          res.render('bookings/list', {
            title: 'bookings',
            bookings: bookings
          });
        }
      });
  },


  create: function (req, res, next) {
    GadgetModel.findById(req.params.id, function (err, gadget) {
      res.render('bookings/edit', {
        booking: {},
        gadget: gadget,
        gadgetId: gadget._id,
        startdate: moment().add(1, 'day').format('YYYY-MM-DD'),
        enddate: moment().add(2, 'days').format('YYYY-MM-DD'),
        starttime: moment().add(1, 'hour').format('HH:00'),
        endtime: moment().add(1, 'hour').format('HH:00')
      });
    });
  },


  edit: function (req, res, next) {
    BookingModel.findById(req.params.id, function (err, booking) {
      if (err) { return next(err); }

      res.render('bookings/edit', {
        booking: booking,
        gadgetId: booking.gadget,
        startdate: moment(booking.start).format('YYYY-MM-DD'),
        starttime: moment(booking.start).format('HH:mm'),
        enddate: moment(booking.end).format('YYYY-MM-DD'),
        endtime: moment(booking.end).format('HH:mm'),
      });
    });
  },


  save: function (req, res, next) {

    var sBooking, eBooking, error, idBooking;

    if (!req.body._id) {
      idBooking = new BookingModel()._id;
    } else {
      idBooking = req.body._id;
    }

    sBooking = new Date(req.body.startdate + ' ' + req.body.starttime);
    eBooking = new Date(req.body.enddate + ' ' + req.body.endtime);

    if (sBooking.getTime() < Date.now()) {
      error = 'Start date not valid';
    } else if (eBooking.getTime() < sBooking.getTime()) {
      error = 'End date not valid';
    }

    GadgetModel.findById(req.params.id, function (err, gadget) {

      if (error) {
        // start or end date not valid -> return
        return renderBookings(res, gadget, req.body, error);
      }

      BookingModel.count({
        // count bookings colliding with requested date range and exclude the
        // current booking (on updates)...
        _id: { $ne: idBooking },
        gadget: gadget._id,
        start: { $lte: eBooking },
        end: { $gte: sBooking }
      }, function (err, bookings) {
        if (err) { return next(err); }

        if (bookings !== 0) {
          // ...if number of bookings is not zero, the gadget is not available
          error = 'Gadget not available in selected time range';
          return renderBookings(res, gadget, req.body, error);
        }

        // gadget available -> create booking entry
        BookingModel.findByIdAndUpdate(
          idBooking,
          {
            gadget: gadget._id,
            gadgetname: gadget.name,
            user: req.session.user._id,
            username: req.session.user.displayname,
            start: sBooking,
            end: eBooking,
            notificationSent: false
          },
          {
            upsert: true
          },
          function (err, booking) {
            if (err) { return next(err); }

            if (!req.body._id) {
              Mailer.sendNewBookingMail(gadget, booking, req.session.user);
            } else {
              Mailer.sendBookingUpdatedMail(gadget, booking, req.session.user);
            }

            res.render('bookings/ok', { gadget : gadget });
          }
        );
      });
    });
  },


  handout: function (req, res, next) {
    BookingModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'handout',
          handoutdate: new Date(),
          handoutuser: req.session.user._id
        }
      },
      function (err, booking) {
        if (err) { return next(err); }

        GadgetModel.findByIdAndUpdate(
          booking.gadget,
          {
            $inc: { handoutcount: 1 }
          },
          function (err, result) {
            res.redirect('/bookings/');
          }
        );
      }
    );
  },


  takeback: function (req, res, next) {
    BookingModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'closed',
          closedate: new Date(),
          closeduser: req.session.user._id
        }
      },
      function (err, booking) {
        if (err) { return next(err); }

        res.redirect('/bookings/');
      }
    );
  },


  remove: function (req, res, next) {
    BookingModel.remove({ _id: req.params.id }, function (err, result) {
      if (err) { return next(err); }

      // redirect to last page
      res.redirect(req.headers.referer);
    });
  }

};

module.exports = BookingsController;