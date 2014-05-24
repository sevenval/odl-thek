var express = require('express');
var helper = require('../helper.js');
var bookings = helper.db.collection('bookings');
var gadgets = helper.db.collection('gadgets');
var router = express.Router();



/* all bookings */
router.get('/', helper.ensureAuthenticated,  function(req, res) {
  var find = {};
  if(req.session.user.role != 'admin'){ 
     find.user = req.session.user._id;
  }

  bookings.find(find).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {
      console.log(_result[0]);
      for(var i = 0 ; i < _result.length ; i++) {
        _result[i].startdate = helper.prettyDate(_result[i].start);
        _result[i].enddate = helper.prettyDate(_result[i].end);
      }
      res.render('bookings/list', { title: 'Bookings: '+_result.length, bookings : _result });  
    } else {
      res.render('index', { title: 'No Bookings' });  
    }
  })
});

/* shows a form to insert a new booking */
router.get('/:gid/new',helper.ensureAuthenticated, function(req,res){
  gadgets.findById(req.params.gid,function(_err,_gadget){
    res.render('bookings/new', { gadget : _gadget, now : helper.now()});
  })
});

router.post('/:gid/new',helper.ensureAuthenticated, function(req,res){
   gadgets.findById(req.params.gid,function(_err,_gadget){
    console.log(req.body);
    var start = req.body.startdate;
    var starttime = req.body.starttime;
    var end = req.body.enddate;
    var endtime = req.body.endtime;
    /* wenn das datum leer ist, wird generell abgewiesen */
    if(start==undefined||start==''||end==undefined||end=='') {
      res.render('bookings/new', { gadget : _gadget, error : 'Datum nicht ausgewählt.' })
    } else {
      if(starttime!=undefined&&starttime!='') {
        start = start+'T'+starttime;
      }
      if(endtime!=undefined&&endtime!='') {
        end = end+'T'+endtime;
      }
      var start = new Date(start);
      var end = new Date(end);


      var find = {
        gadget : _gadget._id
      }
      find.start = {$lt: end};
      find.end = {$gte: end};


      bookings.find(find, function(_err,_bookings1){
        if(_bookings1.length > 0) {
          res.render('bookings/new', { gadget : _gadget, error : 'Gerät ist bereits gebucht. (1)' })
        } else {

          find.start = {$lte: start};
          find.end = {$gt: start};
          bookings.find(find, function(_err,_bookings2){
            if(_bookings2.length > 0) {
              res.render('bookings/new', { gadget : _gadget, error : 'Gerät ist bereits gebucht. (2)' })
            } else {
              find.start =  {$gte: start}
              find.end =  {$lte: end}
              bookings.find(find, function(_err,_bookings3){
                if(_bookings3.length > 0) {
                  res.render('bookings/new', { gadget : _gadget, error : 'Gerät ist bereits gebucht. (3)' })
                } else {
            
                  /* ist frei, also buchen */
                  var booking = {
                    gadget : req.params.gid,
                    gadgetname : _gadget.name,
                    user : req.session.user._id,
                    username : req.session.user.displayname,
                    start : start,
                    end : end
                  }
                  bookings.insert(booking,function(_err,_booking){
                    res.render('bookings/ok',{ gadget : _gadget});
                  }) 
                }
               });
            
              }
            });
          }
        });

 
    }
    
  })
})


router.get('/:id', function(req, res) {
  bookings.findById(req.params.id,function(_err,_booking){
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
