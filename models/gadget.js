/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose  = require('mongoose');

var GadgetSchema = new Mongoose.Schema({

  hwid: {
    type: Number
  },

  name: {
    type: String,
    required: true
  },

  // TODO:
  available: {
    type: String
  },

  location: {
    type: String,
    enum: [
      'cologne',
      'berlin'
    ]
  },

  description: {
    type: String
  },

  brand: {
    type: String
  },

  model: {
    type: String
  },

  os: {
    type: String
  },

  type: {
    type: String
  },

  handoutcount: {
    type: Number,
    default: 0
  }

});


GadgetSchema.virtual('detailedName').get(function () {
  return this.name + ' (' + this.hwid + ')';
});


module.exports = Mongoose.model('Gadget', GadgetSchema);
