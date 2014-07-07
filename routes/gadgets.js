/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';


var GadgetModel   = require('../models/gadget');
var BookingModel  = require('../models/booking');



var GadgetController = {

  /**
   * List all gadgets.
   */
  listAll: function (req, res, next) {

    var where = {};

    if (req.query.q) {
      where.name = { $regex : '.*' + req.query.q + '.*', $options: 'i' };
    }

    GadgetModel.find(where)
      .sort({ brand: 1 })
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        res.render('gadgets/list', {
          title: 'gadgets',
          gadgets: gadgets
        });
      });
  },

  /*
  // REFACTOR in listAll
  router.get('/',  helper.ensureAuthenticated, function(req, res) {
    var find = { };
    if(req.query.q) {
      find.name = {$regex : ".*"+req.query.q+".*", $options: 'i'};
    }
    gadgets.find(find).sort({brand:1}).toArray(function(_err,_result){
      if(_result&&_result!=undefined&&_result.length) {
      bookings.find({}).toArray(function(_err,_bookings){
        var book = {};
        var now = new Date();
        for(var i = 0; i < _bookings.length ; i++) {
          if(!book[_bookings[i].gadget]) {
            book[_bookings[i].gadget] = {
              last : null,
              current : null
            };
          }
          if(_bookings[i].end < now) { // todo nur übernehmen, wenn wirklich das letzte.
            book[_bookings[i].gadget].last = _bookings[i];
          }
          if(_bookings[i].start < now && _bookings[i].end > now) {
            book[_bookings[i].gadget].current = _bookings[i];
          }
        }
        for(var i = 0 ; i < _result.length;i++) {
          _result[i].bookings = book[_result[i]._id];
        }
        console.log(_result[0]);
        res.render('gadgets/list', { title: 'ODL: gadgets', gadgets : _result});
      })
      } else {
        res.render('gadgets/list', { title: 'ODL: gadgets' });
      }
    })
  });
  */

  listTop: function (req, res, next) {
    GadgetModel.find({ type :  "mobile", handoutcount : {$gt : 0 } })
      .sort({ brand: 1 })
      .exec(function (err, gadgets) {
        if (err) { return next(err); }

        res.render('gadgets/list', {
          title: 'top gadgets',
          gadgets: gadgets
        });
      });
  },


  /**
   * Display gadget details page with booking history.
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


  create: function (req, res, next) {
    res.render('gadgets/edit', {
      title: "ODL: new gadget",
      gadget: {}
    });
  },


  edit: function (req, res, next) {
    GadgetModel.findById(req.params.id, function (err, gadget) {
      if (err) { return next(err); }

      res.render('gadgets/edit', {
        title: gadget.name,
        gadget: gadget
      });
    });
  },


  save: function (req, res, next) {

    console.log('a');
    console.dir(req.body);

    var where = {};

    if (req.params.id !== 'undefined') {
      where._id = req.params.id;
    }

    GadgetModel.findOneAndUpdate(
      where,
      req.body,
      {
        // create gadget if not exists
        upsert: true
      },
      function (err, gadget) {

        console.dir(err);

        if (err) { return next(err); }

        var id = req.params.id || gadget._id;

        res.redirect('/gadgets/' + id + '/edit');
      }
    );
  },


  /**
   * Delete a gadget.
   * @todo: Delete related bookings
   */
  remove: function (req, res, next) {
    GadgetModel.remove({ _id: req.params.id }, function (err, result) {
      if (err) { return next(err); }
      res.redirect('/gadgets/');
    });
  }

};

module.exports = GadgetController;


/*
// TODO REFACTOR
router.post('/:id/upload',  function(req, res) {
  var s3 = knox.createClient({
      key: helper.aws.ID,
      secret: helper.aws.Secret,
      bucket: "odlthek2"
  });


  var s3Headers = {
    'Content-Type': req.files.image.mimetype,

    'Content-Length': req.files.image.size,
    'x-amz-acl': 'public-read'
  };

  console.log(s3,s3Headers,req.files.image);

  s3.putFile("./"+req.files.image.path, req.files.image.name, s3Headers, function(err, s3response){
      gadgets.findById(req.params.id,function(_err,_gadget){
        _gadget.image = s3response.req.url;
        gadgets.save(_gadget,function(_err,_result){
          res.render('gadgets/edit', { title: _gadget.name , gadget : _gadget});
        })
      })
  });
});
*/