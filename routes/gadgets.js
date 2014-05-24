var express = require('express');
var helper = require('../helper.js');
var gadgets = helper.db.collection('gadgets');

var router = express.Router();

router.get('/', helper.ensureAuthenticated,  function(req, res) {
  gadgets.find({ type :  "mobile" }).sort({brand:1}).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {
      console.log(_result[0]);
      res.render('gadgets/list', { title: 'Gadgets: '+_result.length, gadgets : _result });  
    } else {
      // res.render('index', { title: 'No devices' });  
      res.render('index', { title: 'Gadgets: '+_result.length, gadgets : _result });
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
