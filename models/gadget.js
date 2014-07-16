/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose    = require('mongoose');
var textSearch  = require('mongoose-text-search');

var GadgetSchema = new Mongoose.Schema({

  hwid: {
    type: Number,
    unique: true,
    required: true
  },

  available: {
    type: Boolean,
    default: true
  },

  location: {
    type: String,
    required: true
    // enum: [
    //   'cologne',
    //   'berlin'
    // ]
  },

  description: {
    type: String
  },

  brand: {
    type: String,
    required: true
  },

  model: {
    type: String,
    required: true
  },

  os: {
    type: String,
    required: true
  },

  type: {
    type: String,
    required: true,
    enum: [
      'Mobile',
      'Tablet',
      'Desktop',
      'Tv',
      'Incar',
      'Console',
      'Glasses',
      'Watch',
      'Sim'
    ],
    default: 'Mobile'
  },

  image: {
    data: {
      type: String
    }
  },

  handoutcount: {
    type: Number,
    default: 0
  },

  keywords: {
    type: [ String ]
  }

}, {
  strict: true
});


// add a text index to the keywords array
// GadgetSchema.plugin(textSearch);
// GadgetSchema.index({ keywords: 'text' });


// Create and update the gadget keyword search field on every save action
GadgetSchema.pre('save', function (next) {
  this.keywords = [];
  this.keywords.push(this.model);
  this.keywords.push(this.brand);
  this.keywords.push(this.os);
  this.keywords.push(this.type);
  this.keywords.push(this.description);
  next();
});


GadgetSchema.virtual('name').get(function () {
  return this.brand + ' ' + this.model;
});


GadgetSchema.virtual('hasImage').get(function () {
  return this.image.data && this.image.data.length > 0;
});


GadgetSchema.virtual('imagePath').get(function () {
  return '/img/cache/' + this._id + '.jpg';
});


module.exports = Mongoose.model('Gadget', GadgetSchema);
