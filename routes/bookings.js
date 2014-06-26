/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';


var _             = require('underscore');
var moment        = require('moment');
var BookingModel  = require('../models/booking');
var GadgetModel   = require('../models/gadget');


function renderBookings(res, gadget, data, error) {
  res.render('bookings/new', {
    gadget: gadget,
    data: data,
    error: error
  });
}


var BookingsController = {

  /**
   * Lists all open and closed bookings for the current user. When the current
   * has admin permissions, all bookins are shown.
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
      .sort({'startdate': 1})
      .exec(function (err, bookings) {

        if (err) {
          return next(err);
        }

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
            bookings : bookings
          });
        }

      });

  },


  newBooking: function (req, res, next) {

    var data = {
      startdate: moment().add(1, 'day').format('YYYY-MM-DD'),
      enddate: moment().add(2, 'days').format('YYYY-MM-DD'),
      starttime: moment().add(1, 'hour').format('HH:00'),
      endtime: moment().add(1, 'hour').format('HH:00')
    };

    GadgetModel.findById(req.params.id, function (err, gadget) {
      res.render('bookings/new', {
        gadget: gadget,
        data: data
      });
    });
  },


  saveBooking: function (req, res, next) {

    var sBooking, eBooking, error;

    sBooking = new Date(req.body.startdate + 'T' + req.body.starttime);
    eBooking = new Date(req.body.enddate + 'T' + req.body.endtime);

    if (sBooking.getTime() < Date.now()) {
      error = 'Start date not valid';
    } else if (eBooking.getTime() < sBooking.getTime()) {
      error = 'End date not valid';
    }

    GadgetModel.findById(req.params.id, function (err, gadget) {

      if (error) {
        return renderBookings(res, gadget, req.body, error);
      }

      BookingModel.count({
        // FIXME: Not covering all ranges!
        gadget: gadget._id,
        $or: [{
          // Is the start date within a reserved booking range?
          start: { $lte: sBooking.toISOString() },
          end: { $gte: sBooking.toISOString() }
        }, {
          // Is the end date within a reserved booking range?
          start: { $lte: eBooking.toISOString() },
          end: { $gte: eBooking.toISOString() }
        }]
      }, function (err, bookings) {

        if (bookings !== 0) {
          error = 'Gadget not available in selected time range';
          return renderBookings(res, gadget, req.body, error);
        }

        BookingModel.create({
          gadget: gadget._id,
          gadgetname: gadget.detailedName,
          user: req.session.user._id,
          username: req.session.user.displayname,
          start: sBooking.toISOString(),
          end: eBooking.toISOString()
        });

        res.render('bookings/ok', { gadget : gadget });

      });
    });
  },


  handout: function (req, res, next) {

    // if(_booking.start < _booking.handoutdate) {
    //  _booking.start = now;
    // }

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
        if (err) {
          return next(err);
        }

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
        if (err) {
          return next(err);
        }

        res.redirect('/bookings/');
      }
    );
  },


  delBooking: function (req, res, next) {
    BookingModel.remove({ _id: req.params.id }, function (err, result) {

      if (err) return next(err);

      res.redirect('/bookings/');
    });
  },


  editBooking: function (req, res, next) {
    BookingModel.findById(req.params.id, function (err, booking) {

      if (err) return next(err);

      res.render('bookings/edit', {
        booking: booking,
        startdate: moment(booking.startdate).format('YYYY-MM-DD'),
        starttime: moment(booking.startdate).format('HH:mm'),
        enddate: moment(booking.enddate).format('YYYY-MM-DD'),
        endtime: moment(booking.endtime).format('HH:mm'),
      });
    });
  }

};

module.exports = BookingsController;