var express = require('express');

var helper = require('../helper.js');
var gadgets = helper.db.collection('gadgets');
var count = helper.db.collection('count');

var router = express.Router();

router.get('/', function(req, res) {

  count.find({}).toArray(function(_err,_result){
    console.log(_result);
    console.log('a');
    if(_result&&_result.length > 0) {
      console.log('b');
      _result[0].count= _result[0].count+1;
      count.save(_result[0],function(_err,_result2){
        console.log(_result2);
      })
    } else {
      console.log('c');
      count.insert({ count : 0},function(_err,_result3){
        console.log(_result3);
      });
    }
  });
  gadgets.find({}).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {
      res.render('index', { title: 'Express'+_result.length });  
    } else {
      res.render('index', { title: 'No devices' });  
    }
  })
});

// router.get('/:id', function(req, res) {
//   gadgets.find({ hwid : parseInt(req.params.id) }).toArray(function(_err,_result){
//     console.log(_result[0]);
//     res.render('detail', { title: 'Express', device : _result[0] });  
//   })
// });

module.exports = router;
