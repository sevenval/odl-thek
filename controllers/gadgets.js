/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose      = require('mongoose');
var Formidable    = require('formidable');
var _             = require('underscore');
var fs            = require('fs');
var gm            = require('gm');
var csv           = require('csv');
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


function handleImage(gadgetId, fields, files, cb) {
  if (!files.image || files.image.size === 0) {
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
            data: buffer.toString('base64')
          };

          cb(err, fields);
        });

    });
  });
}



var GadgetController = {

  /**
   * Lists or searches all gadgets.
   * @todo Pagination? / Endless scrolling?
   */
  listAll: function (req, res, next) {
    var where = {};

    if (req.query.q) {
      where.keywords = { $regex : ".*" + req.query.q + ".*", $options: 'i' };
    }

    // Full text search is not supported in mongolabs current free plan
    //   GadgetModel.textSearch(req.query.q, function (err, search) {
    //     if (err) { return next(err); }

    //     for (var gadgets = [], i = 0; i < search.results.length; i++) {
    //       gadgets.push(search.results[i].obj);
    //     };

    //     createGadgetStats(function (stats) {
    //       res.render('gadgets/list', {
    //         title: 'gadgets',
    //         gadgets: gadgets,
    //         stats: stats,
    //         q: req.query.q
    //       });
    //     });

    //   });
    // } else {

    GadgetModel.find(where)
      .sort({ brand: 1, name: 1, _id: 1 })
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
    res.render('gadgets/edit', {
      title: 'New Gadget',
      gadget: {},
      types: GadgetModel.schema.path('type').enumValues
    });
  },


  /**
   * Renders the filled gadget details form.
   */
  edit: function (req, res, next) {
    GadgetModel.findById(req.params.id, function (err, gadget) {
      if (err) { return next(err); }

      res.render('gadgets/edit', {
        title: gadget && gadget.name,
        gadget: gadget,
        types: GadgetModel.schema.path('type').enumValues
      });
    });
  },


  /**
   * Updates or inserts a gadget. Inserting is done when no id is passed.
   */
  save: function (req, res, next) {

    var form = new Formidable.IncomingForm();
    form.keepExtensions = true;
    form.uploadDir = '/tmp/';

    if (req.params.id === 'undefined') {
      req.params.id = new Mongoose.Types.ObjectId();
    }

    form.parse(req, function (err, fields, files) {
      if (err) { return next(err); }

      handleImage(req.params.id, fields, files, function (err, updFields) {
        if (err) { return next(err); }

        // enrich with image data if present
        fields = updFields || fields;

        GadgetModel.findById(req.params.id, function (err, gadget) {

          gadget = gadget || new GadgetModel();
          gadget.set(fields);
          gadget.save(function (err) {
            if (err) {
              return res.render('gadgets/edit', {
                title: (gadget && gadget.isNew) ? 'New Gadget' : gadget.name,
                gadget: gadget,
                errors: err,
                types: GadgetModel.schema.path('type').enumValues
              });
            }
            res.redirect('/gadgets/' + gadget._id + '/edit');
          });

        });
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
          }

          res.end(buf);
        });
    });
  },


  /**
   * Renders the gadget import view
   */
  uploadCsv: function (req, res, next) {
    res.render('gadgets/import', {
      title: 'Import'
    });
  },


  /**
   * Imports the gadget CSV list
   * @todo Refator/Use promises or async.js
   */
  importCsv: function (req, res, next) {

    var form = new Formidable.IncomingForm(), errors = [], columns;

    columns = [ 'hwid', 'name', 'available', 'location', 'description',
      'brand', 'model', 'os', 'type' ];

    form.keepExtensions = true;
    form.uploadDir = '/tmp/';
    form.parse(req, function (err, fields, files) {
      if (err) { return next(err); }

      if (files.file.size === 0) {
        return res.redirect('/gadgets/import');
      }


      BookingModel.remove({}, function () {
        GadgetModel.remove({}, function () {

          fs.readFile(files.file.path, function (err, buffer) {
            if (err) { return next(err); }

            csv.parse(buffer.toString(), { quote: "" }, function (err, data) {

              async.each(data, function (line, cb) {

                if (columns.indexOf(line[0]) !== -1) {
                  // skip header line
                  return cb();
                }

                GadgetModel.create({
                  hwid: line[0],
                  //name: line[1],
                  available: line[2],
                  location: line[3],
                  description: line[4].replace(/\\n/g, '\n'),
                  brand: line[5],
                  model: line[6],
                  os: line[7],
                  type: Utils.capitalize(line[8])
                }, function (err) {
                  if (err) {
                    errors.push({ object: err, line: line });
                  }
                  cb();
                });

              }, function (err) {
                res.render('gadgets/import', {
                  title: 'Import',
                  errors: errors
                });
              });

            });
          });
        });
      });

    });
  }

};

module.exports = GadgetController;