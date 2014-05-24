var express = require('express');

var helper = require('../helper.js');
var odl = helper.db.collection('odl');
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
  res.render('index', { title: 'ODL-thek' });
});
router.get('/detail', function(req, res) {
res.render('detail', { title: 'Detail' });
});

module.exports = router;
