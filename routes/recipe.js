var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var fs = require('fs');
var path = require('path');

var Recipe = require('../models/recipe');
var User = require('../models/user');

var cert = fs.readFileSync(path.join(__dirname, '..', 'public.pem'));

router.use('/', function(req, res, next) {
  jwt.verify(req.query.token, cert, function(err, decoded) {
    if (err) {
      return res.status(401).json({
        title: 'Authentication Faild!',
        message: 'Token expired'
      });
    }
    var newToken = jwt.sign({user: decoded.user}, cert, { expiresIn: '1h' });

    req.newToken = newToken;
    next();
  });
});

router.get('/', function(req, res) {
  var limit = +req.query.limit;
  var skip = +req.query.skip;

  Recipe.count().exec(function(err, result) {
    var total = result;

    if (total > 0 && skip < total) {
      Recipe.find()
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName')
        .exec(function(err, recipes) {
          if (err) {
            return res.status(500).json({
              title: 'An error occurred',
              message: err.message
            });
          }
          res.status(200).json({
            title: 'Success',
            recipes: recipes,
            token: req.newToken
          });
        });
    }
    else {
      res.status(200).json({
        title: 'No recipes',
        token: req.newToken
      });
    }
  });
});

router.post('/new', function(req, res) {
  var decoded = jwt.decode(req.query.token);

  User.findById(decoded.user, function(err, user) {
    if (err) {
      return res.status(500).json({
        title: 'An error occurred',
        message: err.message
      });
    }
    var recipe = new Recipe({
      title: req.body.title,
      description: req.body.description,
      difficulty: req.body.difficulty,
      ingredients: req.body.ingredients,
      imgUrl: req.body.imgUrl,
      user: user
    });
    
    recipe.save(function(err, recipe) {
      recipe.user = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName
      };
      if (err) {
        // Extract the validation error path
        const errorKey = Object.keys(err.errors)[0];

        return res.status(500).json({
          title: 'An error occurred',
          message: err.errors[errorKey].message
        });
      }
      res.status(201).json({
        title: 'Recipe saved',
        recipe: recipe,
        token: req.newToken
      });
    });
  });
});

router.patch('/update/:id', function(req, res) {
  var decoded = jwt.decode(req.query.token);

  Recipe.findById(req.params.id, function(err, recipe) {
    if (err) {
      return res.status(500).json({
        title: 'An error occurred',
        message: err.message
      });
    }
    if (!recipe) {
      return res.status(500).json({
        title: 'Not found',
        message: 'Recipe not found'
      });
    }
    if (recipe.user != decoded.user) {
      return res.status(401).json({
        title: 'Not authorized',
        message: 'You are not authorized to edit this recipe'
      });
    }
    recipe.title = req.body.title;
    recipe.description = req.body.description;
    recipe.difficulty = req.body.difficulty;
    recipe.ingredients = req.body.ingredients;
    recipe.imgUrl = req.body.imgUrl;
    recipe.save(function(err, recipe) {
      if (err) {
        // Extract the validation error path
        const errorKey = Object.keys(err.errors)[0];

        return res.status(500).json({
          title: 'An error occurred',
          message: err.errors[errorKey].message
        });
      }
      res.status(200).json({
        title: 'Recipe updated',
        recipe: recipe,
        token: req.newToken
      });
    });
  });
});

router.delete('/delete/:id', function(req, res) {
  var decoded = jwt.decode(req.query.token);

  Recipe.findById(req.params.id, function(err, recipe) {
    if (err) {
      return res.status(500).json({
        title: 'An error occurred',
        message: err.message
      });
    }
    if (!recipe) {
      return res.status(500).json({
        title: 'Not found',
        message: 'Recipe not found'
      });
    }
    if (recipe.user != decoded.user) {
      return res.status(401).json({
        title: 'Not authorized',
        message: 'You are not authorized to delete this recipe'
      });
    }
    recipe.remove(function(err) {
      if (err) {
        return res.status(500).json({
          title: 'An error occurred',
          message: err.message
        });
      }
      res.status(200).json({
        title: 'Recipe deleted',
        token: req.newToken
      });
    });
  });
});

module.exports = router;