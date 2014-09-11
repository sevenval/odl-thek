/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var BookingModel  = require('../models/booking');
var UserModel     = require('../models/user');


var UserController = {

  /**
   * Temp helper /
   * @†odo Remove
   */
  drop: function (req, res, next) {
    UserModel.remove({}, function (err, users) {
      res.redirect('/');
    });
  },


  /**
   * Lists all users
   * @todo  Pagination?
   */
  listAll: function (req, res, next) {
    UserModel.find({})
      .sort({ disabled: 1, email: 1 })
      .exec(function (err, users) {
        res.render('users/list', {
          title: 'Users',
          users : users
        });
      });
  },


  /**
   * Fetches details and bookings for a single user
   */
  list: function (req, res, next) {
    UserModel.findById(req.params.id, function (err, user) {
      if (err) { return next(err); }

      BookingModel
        .find({ user: user._id })
        .sort({ status: -1})
        .populate('user')
        .populate('gadget', { image: 0 })
        .populate('handoutuser')
        .populate('closeuser')
        .exec(function (err, bookings) {
          if (err) { return next(err); }

          res.render('users/detail', {
            title: user.displayname,
            euser: user,
            bookings: bookings,
            roles: UserModel.schema.path('role').enumValues
          });

        });
    });
  },


  /**
   * Updates a user entry
   */
  update: function (req, res, next) {
    UserModel.findByIdAndUpdate(req.params.id, {
      role: req.body.role,
      active: req.body.active,
    }, function (err) {
      if (err) { return next(err); }

      res.redirect('/users/' + req.params.id);
    });
  },


  /**
   * Removes a user and related bookings from db
   */
  remove: function (req, res, next) {
    // delete user from db
    UserModel.findByIdAndRemove(req.params.id, function (err) {
      if (err) { return next(err); }

      // delete users bookings from db
      BookingModel.remove({ user: req.params.id }, function (err) {
        if (err) { return next(err); }

        res.redirect('/users/');
      });
    });
  }

};

module.exports = UserController;