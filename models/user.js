var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  recipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }]
});

schema.plugin(uniqueValidator, { message: 'This email address already exists' });

module.exports = mongoose.model('User', schema);