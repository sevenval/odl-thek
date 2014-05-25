var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('impress', { title: 'ODL: impress'});  
});


module.exports = router;
