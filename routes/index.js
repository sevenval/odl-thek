var express = require('express');

var helper = require('../helper.js');
var gadgets = helper.db.collection('gadgets');
var count = helper.db.collection('count');

var router = express.Router();

router.get('/',  function(req, res) {
  gadgets.find({ }).sort({brand:1}).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {
      var length = _result.length;
      _result = _result.slice(3,15);
      res.render('index', { title: 'ODL: welcome', gadgets : _result , devices : length});  
    } else {
      // res.render('index', { title: 'No devices' });  
      res.render('index', { title: 'ODL: welcome', gadgets : _result , devices : 0 });
    }
  })
});

module.exports = router;
