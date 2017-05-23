var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = require('./user');

var schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, required: true },
  ingredients: { type: Array, required: true },
  imgUrl: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

schema.post('save', function(recipe) {
  User.findById(recipe.user, function(err, user) {
    user.recipes.push(recipe);
    user.save();
  });
});

schema.post('remove', function(recipe) {
  User.findById(recipe.user, function(err, user) {
    user.recipes.pull(recipe);
    user.save();
  });
});

module.exports = mongoose.model('Recipe', schema);