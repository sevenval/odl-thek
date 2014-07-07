/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2 */
'use strict';

var GadgetModel = require('../models/gadget');
var Config      = require('../config/app');


var IndexController = {

  /**
   * Index action
   */
  index: function (req, res, next) {
    GadgetModel.find({}, function (err, gadgets) {

      if (err) {
        return next(err);
      }

      res.render('index', {
        title: 'ODL: welcome',
        gadgets: (gadgets.length > 0) ? gadgets.slice(0, 12) : [],
        devices: gadgets.length
      });
    });
  },

  /**
   * Imprint action
   */
  imprint: function (req, res, next) {
    res.render('imprint', {
      title: 'ODL: imprint'
    });
  }

};

module.exports = IndexController;