/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose      = require('mongoose');
var Knox          = require('knox');
var Config        = require('../config/app');
var GadgetModel   = require('../models/gadget');
var BookingModel  = require('../models/booking');


/**
 * Fetches active and last bookings for gadgets.
 * @private
 */
function createGadgetStats(cb) {

  var stats = {}, now = new Date();

  BookingModel.find({}, function (err, bookings) {

    // create booking stats per gadget (last and current booking)
    bookings.forEach(function (booking) {

      // index gadgets by id
      stats[booking.gadget] = stats[booking.gadget] || {};

      if (booking.end < now) {
         // todo nur übernehmen, wenn wirklich das letzte.
        stats[booking.gadget].last = booking;
      }
      if (booking.start < now && booking.end > now) {
        stats[booking.gadget].current = booking;
      }
    });

    cb(stats);
  });
}


var GadgetController = {

  /**
   * Lists all gadgets.
   * @todo Pagination needed?
   */
  listAll: function (req, res, next) {

    var where = {};

    if (req.query.q) {
      where.keywords = { $regex : '.*' + req.query.q + '.*', $options: 'i' };
    }

    GadgetModel.find(where)
      .sort({ brand: 1 })
      .limit(750)
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        createGadgetStats(function (stats) {
          res.render('gadgets/list', {
            title: 'gadgets',
            gadgets: gadgets,
            stats: stats
          });
        });

      });
  },


  listTop: function (req, res, next) {
    GadgetModel.find({ type: "mobile", handoutcount : {$gt : 0 } })
      .sort({ brand: 1 })
      .limit(20)
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        createGadgetStats(function (stats) {
          res.render('gadgets/list', {
            title: 'top gadgets',
            gadgets: gadgets,
            stats: stats
          });
        });
      });
  },


  /**
   * Displays the gadget overview page with booking history.
   */
  list: function (req, res, next) {
    GadgetModel.findById(req.params.id, function (err, gadget) {
      if (err) { return next(err); }

      BookingModel.find({ gadget: req.params.id })
        .sort({'startdate': 1})
        .populate('user')
        .populate('handoutuser')
        .exec(function (err, bookings) {
          if (err) { return next(err); }

          res.render('gadgets/detail', {
            title: gadget.name,
            gadget: gadget,
            bookings: bookings
          });

        });
    });
  },


  /**
   * Renders the blank gadget details form.
   */
  create: function (req, res, next) {
    res.render('gadgets/edit', { title: 'New Gadget', gadget: {} });
  },


  /**
   * Renders the filled gadget details form.
   */
  edit: function (req, res, next) {
    GadgetModel.findById(req.params.id, function (err, gadget) {
      if (err) { return next(err); }

      res.render('gadgets/edit', {
        title: gadget.name,
        gadget: gadget
      });
    });
  },


  /**
   * Updates or inserts a gadget. Inserting is done when no id is passed.
   */
  save: function (req, res, next) {

    if (req.params.id === 'undefined') {
      req.params.id = new Mongoose.Types.ObjectId();
    }

    GadgetModel.update(
      { _id: req.params.id },
      req.body,
      { upsert: true },
      function (err, gadget) {
        if (err) { return next(err); }

        res.redirect('/gadgets/' + req.params.id + '/edit');
      }
    );
  },


  /**
   * Deletes a gadget and related bookings.
   */
  remove: function (req, res, next) {
    GadgetModel.remove({ _id: req.params.id }, function (err) {
      if (err) { return next(err); }

      BookingModel.remove({ gadget: req.params.id }, function (err) {
        if (err) { return next(err); }

        res.redirect('/gadgets/');

      });
    });
  },


  /**
   * Uploads a file to S3.
   */
  upload: function (req, res, next) {
    var s3 = Knox.createClient(Config.aws);

    s3.putFile(
      "./" + req.files.image.path,
      req.files.image.name,
      {
        'Content-Type': req.files.image.mimetype,
        'Content-Length': req.files.image.size,
        'x-amz-acl': 'public-read'
      },
      function (err, s3response) {
        if (err) { return next(err); }

        GadgetModel.findByIdAndUpdate(
          req.params.id,
          { image: s3response.req.url },
          { new: true },
          function (err, gadget) {
            if (err) { return next(err); }

            res.render('gadgets/edit', { title: gadget.name, gadget: gadget });
          }
        );

      }
    );
  }

};

module.exports = GadgetController;