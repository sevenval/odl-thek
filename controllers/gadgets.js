/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose      = require('mongoose');
var Formidable    = require('formidable');
var _             = require('underscore');
var fs            = require('fs');
var knox          = require('knox');
var gm            = require('gm');
var csv           = require('csv');
var async         = require('async');
var Utils         = require('../lib/utils');
var GadgetModel   = require('../models/gadget');
var BookingModel  = require('../models/booking');



var s3Client = knox.createClient({
  key: process.env.AWS_ACCESS_KEY_ID,
  secret: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_MEDIA_BUCKET
});


/**
 * Fetches active and last bookings for gadgets.
 * @private
 */
function createGadgetStats(cb) {

  var stats = {}, now = new Date();

  BookingModel.find({ status: { $ne: 'closed' }}, function (err, bookings) {

    _.each(bookings, function (booking) {
      if (booking.start < now && booking.end > now) {
        stats[booking.gadget] = {
          status: booking.status,
          booking: booking
        };
      }
    });

    cb(stats);
  });
}


function uploadImage(gadgetId, fields, files, cb) {
  if (!files.image || files.image.size === 0) {
    return cb(null);
  }

  fs.readFile(files.image.path, function (err, data) {
    if (err) { return cb(err); }

    // resize image and convert to jpg
    gm(data)
      .options({ imageMagick: true })
      .resize(210)
      .toBuffer('jpg', function (err, buffer) {
        if (err) { return cb(err); }

        var file = gadgetId + '.jpg';
        var headers = {
          'x-amz-acl': 'public-read',
          'Content-Type': 'image/jpeg'
        };

        s3Client.putBuffer(buffer, file, headers, function (err) {
          cb(err, file);
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

    if (req.body.q) {
      where.keywords = { $regex : ".*" + req.body.q + ".*", $options: 'i' };
    }

    if (req.body.l) {
      where.location = { $in: req.body.l };
    }

    if (req.body.t) {
      where.type = { $in: req.body.t };
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
      .sort({ brand: 1, model: 1, _id: -1 })
      .limit(750)
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        var groupedGadgets = {};
        _.each(gadgets, function (gadget) {
          groupedGadgets[gadget.type] = groupedGadgets[gadget.type] || {
            name: gadget.type,
            count: 0,
            data: []
          };
          groupedGadgets[gadget.type].data.push(gadget);
          groupedGadgets[gadget.type].count++;
        });
        groupedGadgets = _.sortBy(groupedGadgets, function (gadgetGroup) {
          return -gadgetGroup.count;
        });

        createGadgetStats(function (stats) {
          res.render('gadgets/list', {
            title: 'gadgets',
            gadgets: groupedGadgets,
            stats: stats,
            q: req.body.q,
            l: req.body.l,
            t: req.body.t,
            types: GadgetModel.schema.path('type').enumValues,
            locations: GadgetModel.schema.path('location').enumValues
          });
        });
      });
  },


  listTop: function (req, res, next) {
    GadgetModel.find({ handoutcount : {$gt : 0 } })
      .sort({
        handoutcount: 1,
        brand: 1
      })
      .limit(30)
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        createGadgetStats(function (stats) {
          res.render('gadgets/top', {
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

      if (!gadget) {
        return res.redirect('/gadgets');
      }

      BookingModel.find({ gadget: req.params.id })
        .sort({ start: -1 })
        .limit(10)
        .populate('user')
        .populate('handoutuser')
        .populate('closeuser')
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
      types: GadgetModel.schema.path('type').enumValues,
      locations: GadgetModel.schema.path('location').enumValues
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
        types: GadgetModel.schema.path('type').enumValues,
        locations: GadgetModel.schema.path('location').enumValues
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

      uploadImage(req.params.id, fields, files, function (err, imageUrl) {
        if (err) { return next(err); }

        // enrich with image data if present
        _.extend(fields, { image: imageUrl });

        GadgetModel.findById(req.params.id, function (err, gadget) {

          gadget = gadget || new GadgetModel({ _id: req.params.id });
          gadget.set(fields);
          gadget.save(function (err) {
            if (err) {
              return res.render('gadgets/edit', {
                title: (gadget && gadget.isNew) ? 'New Gadget' : gadget.name,
                gadget: gadget,
                errors: err,
                types: GadgetModel.schema.path('type').enumValues,
                locations: GadgetModel.schema.path('location').enumValues
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

        var file = req.params.id + '.jpg';
        s3Client.deleteFile(file, function (err) {
          res.redirect('/gadgets/');
        });

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
                  description: line[4].replace(/\\n/g, '\n').replace(/\\t/g, ': '),
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