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
      }
    });
  }, finalCb);
}


var GadgetController = {

  /**
   * Lists all gadgets.
   * @todo Pagination?
   */
  listAll: function (req, res, next) {
    console.time('listAll');
    var where = {};

    if (req.query.q) {
      where.keywords = { $regex : '.*' + req.query.q + '.*', $options: 'i' };
    }

    GadgetModel.find(where)
      .sort({ brand: 1 })
      .limit(60)
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        writeGadgetImages(gadgets, createGadgetStats(function (stats) {
          res.render('gadgets/list', {
            title: 'gadgets',
            gadgets: gadgets,
            stats: {}
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

    var form = new Formidable.IncomingForm();
    form.keepExtensions = true;
    form.uploadDir = '/tmp/';

    form.parse(req, function (err, fields, files) {
      if (err) { return res.end('You found error'); }

      console.log(files.image);

      fs.readFile(files.image.path, function (err, data) {
        var base64data = new Buffer(data).toString('base64');

        GadgetModel.update(
          {_id: req.params.id},
          {
            image: {
              data: base64data,
              extension: Utils.getFileExtension(files.image.path)
            }
          },
          function (err) {
            res.redirect('/gadgets/' + req.params.id);
          }
        );
      });

    });
  }

};

module.exports = GadgetController;