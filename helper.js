var config = require('./config.json');

var db = require('mongoskin').db(config.mongourl);


helper = {
  db : db
}

module.exports = helper;
