var express = require('express');
var helper = require('../helper.js');
var gadgets = helper.db.collection('gadgets');
var bookings = helper.db.collection('bookings');
var users = helper.db.collection('users');

var router = express.Router();



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
      res.render('gadgets/list', { title: 'Gadgets: '+_result.length, gadgets : _result});  
    })
    } else {
      res.render('gadgets/list', { title: 'No devices' });  
    }
  })
});


/* aufräumen */
router.get('/top',  helper.ensureAuthenticated, function(req, res) { 
  var find = { type :  "mobile", handoutcount : {$gt : 0 } };
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
      res.render('gadgets/list', { title: 'Gadgets: '+_result.length, gadgets : _result});  
    })
    } else {
      res.render('index', { title: 'No devices' });  
    }
  })
});



router.get('/new', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) { // 
  var basic = { 
  hwid: '',
  name: '',
  available: '',
  location: '',
  description: '',
  brand: '',
  model: '',
  os: '',
  type: ''}
    res.render('gadgets/new', { title: "new gadget" , gadget : basic});
});

router.post('/new', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  var gadget = {};
  for(var key in req.body) {
    gadget[key] = req.body[key];
  }
  gadgets.insert(gadget,function(_err,_result){
     res.redirect('/gadgets/'+_result[0]._id+'/edit');
  }) 
});

router.get('/:id', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  gadgets.findById(req.params.id,function(_err,_gadget){
    bookings.find({gadget : _gadget._id.toString()}).toArray(function(_err,_bookings){
      for(var i = 0 ; i < _bookings.length ; i++) {
        _bookings[i].startdate = helper.prettyDate(_bookings[i].start);
        if(_bookings[i].handoutdate) {
          _bookings[i].handoutdate = helper.prettyDate(_bookings[i].handoutdate);
        }
        _bookings[i].enddate = helper.prettyDate(_bookings[i].end);
      }

      _gadget.description = _gadget.description.replace(/\\n/g,'<br/>')
      res.render('gadgets/detail', { title: _gadget.name , gadget : _gadget, bookings : _bookings });  
    })
  })
});


router.get('/:id/edit',helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {  
  gadgets.findById(req.params.id,function(_err,_gadget){
    res.render('gadgets/edit', { title: _gadget.name , gadget : _gadget});  
  })
});



router.post('/:id/upload', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  gadgets.findById(req.params.id,function(_err,_gadget){
    _gadget.image = req.files.image.path.replace(/public\//,'');
    gadgets.save(_gadget,function(_err,_result){
      res.render('gadgets/edit', { title: _gadget.name , gadget : _gadget});  
    })
  })
});




router.post('/:id/edit', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  gadgets.findById(req.params.id,function(_err,_gadget){
    for(var key in req.body) {
      _gadget[key] = req.body[key];
    }
    gadgets.save(_gadget,function(_err,_result){
       res.redirect('/gadgets/'+_gadget._id+'/edit');
    }) 
  })
});

module.exports = router;
