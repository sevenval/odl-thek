/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Utils = {


  getError: function (attr1, attr2) {

    var error;

    if (arguments.length === 1) {
      error = new Error();
      error.statusCode = attr1;
    }

    if (arguments.length === 2) {
      error = new Error(attr1);
      error.statusCode = attr2;
    }

    return error;
  },


  getFileExtension: function (filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i + 1);
  },


  capitalize: function (string) {
    string = string || '';
    string = string.toLowerCase();
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

};

module.exports = Utils;