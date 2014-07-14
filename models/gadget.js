/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mongoose  = require('mongoose');


var GadgetSchema = new Mongoose.Schema({

  hwid: {
    type: Number,
    unique: true,
    required: true
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

});


GadgetSchema.virtual('detailedName').get(function () {
  return this.name + ' (' + this.hwid + ')';
});


GadgetSchema.virtual('hasImage').get(function () {
  return this.image.data && this.image.data.length > 0;
});


GadgetSchema.virtual('imagePath').get(function () {
  return '/img/cache/' + this._id + '.jpg';
});


//
// TODO: Add/update search keywords on every insert/update
//
// GadgetSchema.pre('init', function (next) {
//   console.log('pre init');
//   this.keywords = [
//     this.name,
//     'other'
//   ];
//   next();
// });

// GadgetSchema.pre('validate', function (next) {
//   console.log('pre validate');
//   next();
// });


module.exports = Mongoose.model('Gadget', GadgetSchema);
