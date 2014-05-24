var express = require('express');
var helper = require('../helper.js');
var bookings = helper.db.collection('bookings');
var gadgets = helper.db.collection('gadgets');
var router = express.Router();



/* all bookings */
router.get('/',helper.ensureAuthenticated, function(req, res) {
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
      res.render('bookings/list', { title: 'No Bookings' });  
    }
  })
});


router.get('/:id',helper.ensureAuthenticated, function(req, res) {
  bookings.findById(req.params.id,function(_err,_booking){
    console.log(_booking);
    gadgets.findById(_booking.gadget,function(_err,_gadget){
      console.log(_gadget);

    _gadget.description = _gadget.description.replace(/\\n/g,'<br/>')
      res.render('bookings/detail', { title: 'Express', booking : _booking, gadget : _gadget }); 
    })
  })
});


/* just set the status to handout */
router.get('/:gid/handout', helper.ensureAuthenticated, function(req,res){
  bookings.findById(req.params.gid,function(_err,_booking){
    var now = new Date();
    _booking.status = 'handout';
    _booking.handoutdate = now;
    if(_booking.start < _booking.handoutdate) {
      _booking.start = now;
    }
    _booking.handoutuser = req.session.user._id;
    console.log(_booking);
    bookings.save(_booking,function(_err,_booking){
      console.log(_booking);
      res.redirect('/bookings/');
    })
  })
});


/* just set the status to takeout */
router.get('/:gid/takeback', helper.ensureAuthenticated, function(req,res){
  bookings.findById(req.params.gid,function(_err,_booking){
    var now = new Date();
    _booking.status = 'closed';
    _booking.closedate = now;
    if(_booking.end > _booking.closedate) {
      _booking.end = now;
    }
    _booking.closeuser = req.session.user._id;
    console.log(_booking);

    bookings.save(_booking,function(_err,_booking){
      console.log(_booking);
      res.redirect('/bookings/');
    })
  })
});



/* shows a form to edit an existing booking  helper.ensureAuthenticated,*/
router.get('/:gid/edit',helper.ensureAuthenticated, function(req,res){
  bookings.findById(req.params.gid,function(_err,_booking){


    res.render('bookings/edit', { booking : _booking, stime : helper.getTime(_booking.start), etime : helper.getTime(_booking.end), sdate : helper.getDate(_booking.start), edate : helper.getDate(_booking.end)});
  })
});



/* shows a form to insert a new booking */
router.get('/:gid/new',helper.ensureAuthenticated, function(req,res){
  gadgets.findById(req.params.gid,function(_err,_gadget){
    res.render('bookings/new', { gadget : _gadget, stime : helper.now(), etime : helper.now()});
  })
});

/* insert new booking */
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
	  
      /* if start is to big, reverse them both */
  	  if( start > end ){
    		tmp_start = start;
    		start = end;
    		end = tmp_start;
  	  }

      helper.checkGadgetBooking(_gadget._id,start,end,function(_result,_info){
        if(_result) {
          /* ist frei, also buchen */
          var booking = {
            gadget : req.params.gid,
            gadgetname : _gadget.name+'('+_gadget._id+')',
            user : req.session.user._id,
            username : req.session.user.displayname,
            start : start,
            end : end
          }
          bookings.insert(booking,function(_err,_booking){
            res.render('bookings/ok',{ gadget : _gadget});
          }) 
        } else {
          res.render('bookings/new', { gadget : _gadget, error : 'Datum belegt.'+_info })
        }
      })

 
    }
    
  })
})




router.get('/remove/:id', helper.ensureAuthenticated, function(req, res) {
  bookings.findById(req.params.id,function(_err,_booking){
    bookings.remove(_booking,function(_err,_result){
      res.redirect('/bookings/');  
    })
  })
});


module.exports = router;
