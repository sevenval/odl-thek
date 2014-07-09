/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose  = require('mongoose');

var GadgetSchema = new Mongoose.Schema({

  hwid: {
    type: Number,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  available: {
    type: Boolean,
    default: true
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
    type: String,
    enum: [
      'mobile',
      'tablet'
    ],
    default: 'mobile'
  },

  handoutcount: {
    type: Number,
    default: 0
  },

  keywords: {
    type: [ String ]
  }

});


GadgetSchema.virtual('detailedName').get(function () {
  return this.name + ' (' + this.hwid + ')';
});

GadgetSchema.pre('init', function (next) {
  this.keywords = [
    this.name,
    'other'
  ];
  next();
});


module.exports = Mongoose.model('Gadget', GadgetSchema);
