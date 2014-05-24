var express = require('express');

var helper = require('../helper.js');
var gadgets = helper.db.collection('gadgets');
var count = helper.db.collection('count');

var router = express.Router();

router.get('/',  function(req, res) {
  gadgets.find({ type :  "mobile" }).sort({brand:1}).limit(12).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {
      console.log(_result[0]);
      res.render('index', { title: 'Gadgets: '+_result.length, gadgets : _result });  
    } else {
      // res.render('index', { title: 'No devices' });  
      res.render('index', { title: 'Gadgets: '+_result.length, gadgets : _result });
    }
  })
});

module.exports = router;
