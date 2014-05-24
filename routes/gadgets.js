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
      res.render('index', { title: 'No devices' });  
    }
  })
});

router.get('/:id', function(req, res) {
  gadgets.find({ hwid : parseInt(req.params.id) }).toArray(function(_err,_result){
    console.log(_result[0]);
    res.render('detail', { title: 'Express', device : _result[0] });  
  })
});

module.exports = router;
