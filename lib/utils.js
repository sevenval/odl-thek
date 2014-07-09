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
  }

};

module.exports = Utils;