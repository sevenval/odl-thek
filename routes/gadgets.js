var express = require('express');
var helper = require('../helper.js');
var gadgets = helper.db.collection('gadgets');
var bookings = helper.db.collection('bookings');

var router = express.Router();

router.get('/', helper.ensureAuthenticated,  function(req, res) {
  gadgets.find({ type :  "mobile" }).sort({brand:1}).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {
      console.log(_result[0]);
      res.render('gadgets/list', { title: 'Gadgets: '+_result.length, gadgets : _result });  
    } else {
      res.render('index', { title: 'No devices' });  
    }
  })
});

router.get('/:id', helper.ensureAuthenticated, function(req, res) {
  gadgets.findById(req.params.id,function(_err,_gadget){
    bookings.find({gadget : _gadget._id.toString()}).toArray(function(_err,_bookings){
      for(var i = 0 ; i < _bookings.length ; i++) {
        _bookings[i].startdate = helper.prettyDate(_bookings[i].start);
        _bookings[i].enddate = helper.prettyDate(_bookings[i].end);
      }
      res.render('gadgets/detail', { title: _gadget.name , gadget : _gadget, bookings : _bookings });  
    })
  })
});

module.exports = router;
