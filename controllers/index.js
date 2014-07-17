/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2 */
'use strict';

var GadgetModel = require('../models/gadget');


var IndexController = {


  /**
   * Renders the startpage or redirects to /gadget for authenticated users.
   */
  index: function (req, res, next) {

    if (req.isAuthenticated()) {
      // redirect authenticated users to gadget list instead of startpage
      return res.redirect('/gadgets/');
    }

    GadgetModel.find({}, function (err, gadgets) {

      if (err) { return next(err); }

      res.render('index', {
        title: 'welcome',
        gadgets: (gadgets.length > 0) ? gadgets.slice(0, 12) : [],
        devices: gadgets.length
      });
    });
  },


  /**
   * Renders the imprint page
   */
  imprint: function (req, res, next) {
    res.render('imprint', {
      title: 'imprint'
    });
  }


};

module.exports = IndexController;