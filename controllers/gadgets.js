/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose      = require('mongoose');
var Formidable    = require('formidable');
var fs            = require('fs');
var gm            = require('gm');
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


function handleImage(gadgetId, fields, files, cb) {
  if (!files) {
    return cb();
  }

  fs.unlink('public/img/cache/' + gadgetId + '.jpg', function (err) {
    // ignore errors here (e.g. file not found)
    console.log('public/img/cache/' + gadgetId + '.jpg deleted');

    fs.readFile(files.image.path, function (err, data) {
      if (err) { return cb(err); }

      // resize image and convert to jpg
      gm(data)
        .options({ imageMagick: true })
        .resize(210)
        .toBuffer('jpg', function (err, buffer) {
          fields.image = {
            data: buffer.toString('base64'),
            extension: Utils.getFileExtension(files.image.path)
          };

          cb(err, fields);
        });

    });
  });
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
      //where.keywords = { $regex : '.*' + req.query.q + '.*', $options: 'i' };
      where.name = { $regex : '.*' + req.query.q + '.*', $options: 'i' };
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

        createGadgetStats(function (stats) {

          console.log('render');
          res.render('gadgets/list', {
            title: 'gadgets',
            gadgets: gadgets,
            stats: stats
          });
          console.timeEnd('listAll');
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
        title: gadget && gadget.name,
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

    var form = new Formidable.IncomingForm();
    form.keepExtensions = true;
    form.uploadDir = '/tmp/';

    form.parse(req, function (err, fields, files) {
      if (err) { return next(err); }

      handleImage(req.params.id, fields, files, function (err, fields) {
        if (err) { return next(err); }

        GadgetModel.findByIdAndUpdate(
          req.params.id,
          fields,
          { upsert: true },
          function (err, gadget) {
            if (err) { return next(err); }

            res.redirect('/gadgets/' + req.params.id + '/edit');
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


  /**
   * Loads the gadget image from mongodb and stores it in the filesystem.
   */
  image: function (req, res, next) {
    GadgetModel.findById(req.params.id, function (err, gadget) {
      var buf = new Buffer(gadget.image.data, 'base64');
      gm(buf)
        .options({ imageMagick: true })
        .resize(210)
        .write('public' + gadget.imagePath, function (err) {
          if (err) {
            console.log('public' + gadget.imagePath + ' cant be written!');
            console.log(err);
          } else {
            console.log('public' + gadget.imagePath + ' written!');
          }

          res.end(buf);
        });
    });
  }

};

module.exports = GadgetController;