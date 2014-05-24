var express = require('express');
var helper = require('../helper.js');
var bookings = helper.db.collection('bookings');
var router = express.Router();


/* Todo */

router.get('/new',function(req,res){
  res.render('bookings/new');
});

router.get('/', helper.ensureAuthenticated,  function(req, res) {
  bookings.find({}).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {
      console.log(_result[0]);
      res.render('bookings/list', { title: 'Bookings: '+_result.length, bookings : _result });  
    } else {
      res.render('index', { title: 'No Bookings' });  
    }
  })
});

router.get('/:id', function(req, res) {
  booking.findById(req.params.id,function(_err,_booking){
    console.log(_booking);
    res.render('bookings/detail', { title: 'Express', booking : _booking });  
  })
});

module.exports = router;
