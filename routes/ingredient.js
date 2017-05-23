var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var fs = require('fs');
var path = require('path');

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
  var decoded = jwt.decode(req.query.token);

  User.findById(decoded.user)
    .populate('ingredients')
    .exec(function(err, user) {
      if (err) {
        return res.status(500).json({
          title: 'An error occurred',
          message: err.message
        });
      }
      if (!user) {
        return res.status(500).json({
          title: 'Not found',
          message: 'User not found'
        });
      }
      res.status(200).json({
        title: 'Success',
        ingredients: user.ingredients,
        token: req.newToken
      });
    });
});

router.post('/new', function(req, res) {
  var decoded = jwt.decode(req.query.token);
  var ingredient = {
    name: req.body.name,
    amount: req.body.amount
  };
  
  User.findById(decoded.user, function(err, user) {
    if (err) {
      return res.status(500).json({
        title: 'An error occurred',
        message: err.message
      });
    }
    if (!user) {
      return res.status(500).json({
        title: 'Not found',
        message: 'User not found'
      });
    }
    var index = user.ingredients.length;

    user.ingredients.push(ingredient);
    user.save(function(err, user) {
      if (err) {
        return res.status(500).json({
          title: 'An error occurred',
          message: err.message
        });
      }
      res.status(201).json({
        title: 'Ingredient saved',
        ingredient: user.ingredients[index],
        token: req.newToken
      });
    })
  });
});

router.patch('/update', function(req, res) {
  var decoded = jwt.decode(req.query.token);

  User.findById(decoded.user, function(err, user) {
    if (err) {
      return res.status(500).json({
        title: 'An error occurred',
        message: err.message
      });
    }
    if (!user) {
      return res.status(500).json({
        title: 'Not found',
        message: 'User not found'
      });
    }
    var ingredient = user.ingredients.id(req.body._id);

    if (req.query.onlyAmount === 'true') {
      ingredient.amount += req.body.amount;
    }
    else {
      ingredient.name = req.body.name;
      ingredient.amount = req.body.amount;
    }
    user.save(function(err, item) {
      if (err) {
        // Extract the validation error path
        const errorKey = Object.keys(err.errors)[0];

        return res.status(500).json({
          title: 'An error occurred',
          message: err.errors[errorKey].message
        });
      }
      res.status(200).json({
        title: 'Ingredient updated',
        ingredient: ingredient,
        token: req.newToken
      });
    });
  });
});

router.delete('/delete/:id', function(req, res) {
  var decoded = jwt.decode(req.query.token);

  User.findById(decoded.user, function(err, user) {
    if (err) {
      return res.status(500).json({
        title: 'An error occurred',
        message: err.message
      });
    }
    if (!user) {
      return res.status(500).json({
        title: 'Not found',
        message: 'User not found'
      });
    }
    user.ingredients.pull(req.params.id);
    user.save(function(err) {
      if (err) {
        return res.status(500).json({
          title: 'An error occurred',
          message: err.message
        });
      }
      res.status(200).json({
        title: 'Ingredient deleted',
        token: req.newToken
      });
    });
  });
});

module.exports = router;