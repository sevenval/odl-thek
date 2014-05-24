var express = require('express');
var helper = require('../helper.js');
var gadgets = helper.db.collection('gadgets');
var bookings = helper.db.collection('bookings');

var router = express.Router();

router.get('/', helper.ensureAuthenticated,  function(req, res) {
  console.log(new Date());
  gadgets.find({ type :  "mobile" }).sort({brand:1}).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {	  
		bookings.find({ start: {$lte: new Date()}, end: {$gte: new Date()} }).toArray(function(_err,_booked_result){
			if(_booked_result&&_booked_result!=undefined&&_booked_result.length) {
				console.log(_booked_result);
				for(i = 0;i < _result.length;i++) {
					_result[i].booked = false;
					for(j = 0;j < _booked_result.length;j++) {
						if(_result[i]._id == _booked_result[j].gadget){
							console.log(_result[i]._id);
							_result[i].booked = true;
						}
					}
				}	
			}
			res.render('gadgets/list', { title: 'Gadgets: '+_result.length, gadgets : _result});  
		})
    } else {
      // res.render('index', { title: 'No devices' });  
      res.render('index', { title: 'Gadgets: '+_result.length, gadgets : _result });
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
