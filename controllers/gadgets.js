/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose      = require('mongoose');
var Formidable    = require('formidable');
var fs            = require('fs');
var async         = require('async');
var Config        = require('../config/app');
var Utils         = require('../lib/utils');
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

      if (booking.end < now && booking.status === 'closed') {
         // todo nur übernehmen, wenn wirklich das letzte.
        stats[booking.gadget] = { lastBooking: booking };
      }

      if (booking.status !== 'closed' && booking.start < now && booking.end > now) {
        stats[booking.gadget] = {
          status: booking.status,
          booking: booking
        };
      }
    });

    cb(stats);
  });
}


/**
 * Checks if a gadget image exists in local fs and creates it if not.
 * @private
 */
function writeGadgetImages(gadgets, finalCb) {
  async.each(gadgets, function (gadget, cb) {

    fs.exists('public' + gadget.imagePath, function (imgExists) {
      if (!imgExists && gadget.image.data) {
        fs.writeFile(
          'public' + gadget.imagePath,
          new Buffer(gadget.image.data, 'base64'),
          cb
        );
      } else {
        cb();
      }
    });
  }, finalCb);
}


var GadgetController = {

  /**
   * Lists all gadgets.
   * @todo Pagination? / Endless scrolling?
   */
  listAll: function (req, res, next) {
    console.time('listAll');
    var where = {};

    if (req.query.q) {
      where.keywords = { $regex : '.*' + req.query.q + '.*', $options: 'i' };
    }

    GadgetModel.find(where)
      .sort({
        brand: 1,
        name: 1,
        _id: 1
      })
      .limit(750)
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        // TODO: Do we need this on each gadget request?
        writeGadgetImages(gadgets, createGadgetStats(function (stats) {
          res.render('gadgets/list', {
            title: 'gadgets',
            gadgets: gadgets,
            stats: stats
          });
          console.timeEnd('listAll');
        }));

      });
  },


  listTop: function (req, res, next) {
    GadgetModel.find({ type: "mobile", handoutcount : {$gt : 0 } })
      .sort({ brand: 1 })
      .limit(20)
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        // TODO: Do we need this on each gadget request?
        writeGadgetImages(gadgets, createGadgetStats(function (stats) {
          res.render('gadgets/list', {
            title: 'top gadgets',
            gadgets: gadgets,
            stats: stats
          });
        }));
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
        title: gadget && gadget.name,
        gadget: gadget
      });
    });
  },


  /**
   * Updates or inserts a gadget. Inserting is done when no id is passed.
   * @todo Refactor!
   */
  save: function (req, res, next) {

    if (req.params.id === 'undefined') {
      req.params.id = new Mongoose.Types.ObjectId();
    }

    var form = new Formidable.IncomingForm();
    form.keepExtensions = true;
    form.uploadDir = '/tmp/';

    form.parse(req, function (err, fields, files) {
      if (err) { return next(err); }

      fs.readFile(files.image.path, function (err, data) {

        if (!err && files) {
          // image passed
          var base64data = new Buffer(data).toString('base64');
          fields.image = {
            data: base64data,
            extension: Utils.getFileExtension(files.image.path)
          };
          // TODO: Callback / error handling
          fs.unlink('public/img/cache/' + req.params.id + '.' + Utils.getFileExtension(files.image.path));
        }

        GadgetModel.findByIdAndUpdate(
          req.params.id,
          fields,
          {
            upsert: true
          },
          function (err, gadget) {
            if (err) { return next(err); }

            writeGadgetImages([ gadget ], function () {
              res.redirect('/gadgets/' + req.params.id + '/edit');
            });
          }
        );
      });
    });
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

};

module.exports = GadgetController;