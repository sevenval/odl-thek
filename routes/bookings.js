var express = require('express');
var helper = require('../helper.js');
var bookings = helper.db.collection('bookings');
var gadgets = helper.db.collection('gadgets');
var router = express.Router();


/* Todo */

router.get('/:gid/new',helper.ensureAuthenticated, function(req,res){
  gadgets.findById(req.params.gid,function(_err,_gadget){
    console.log(_gadget);
    res.render('bookings/new', { gadget : _gadget});
  })
});

router.post('/:gid/new',helper.ensureAuthenticated, function(req,res){
   gadgets.findById(req.params.gid,function(_err,_gadget){
    var booking = {
      gadget : req.params.gid,
      user : req.session.user._id
    }
    bookings.insert(booking,function(_err,_booking){
      res.redirect('/bookings/');
    })
  })
})

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


router.get('/remove/:id', helper.ensureAuthenticated, function(req, res) {
  bookings.findById(req.params.id,function(_err,_booking){
    bookings.remove(_booking,function(_err,_result){
      res.redirect('/bookings/');  
    })
  })
});


module.exports = router;
