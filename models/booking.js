/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2 */
'use strict';

var Mongoose  = require('mongoose');

var BookingSchema = new Mongoose.Schema({

  gadget: {
    type: String,
    ref: 'Gadget'
  },

  username: {
    type: String
  },

  user: {
    type: String,
    ref: 'User'
  },

  gadgetname: {
    type: String
  },

  start: {
    type: Date
  },

  end: {
    type: Date
  },

  status: {
    type: String,
    enum: [
      'open',
      'handout',
      'closed'
    ],
    default: 'open'
  },

  handoutdate: {
    type: Date
  },

  handoutuser: {
    type: String,
    ref: 'User'
  },

  closedate: {
    type: Date
  },

  closeuser: {
    type: String,
    ref: 'User'
  },

  openend: {
    type: Boolean
  },

  notificationSent: {
    type: Boolean
  },

  transferhash: String,

}, {
  strict: true
});


BookingSchema.virtual('expired').get(function () {
  if (this.openend) {
    return false;
  }
  return (this.end < new Date());
});


module.exports = Mongoose.model('Booking', BookingSchema);