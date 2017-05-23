var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');

var cert = fs.readFileSync(path.join(__dirname, '..', 'public.pem'));

router.post('/', function(req, res) {
  jwt.verify(req.body.token, cert, function(err, decoded) {
    if (err) {
      return res.status(401).json({
        title: 'Not Authenticated',
        error: err
      });
    }
    var newToken = jwt.sign({user: decoded.user}, cert, { expiresIn: '1h' });

    res.status(200).json({
      title: 'Authenticated',
      token: newToken
    })
  });
});

router.post('/signup', function(req, res) {
  var user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password)
  });

  user.save(function(err, result) {
    if (err) { 
      // Extract the validation error path
      const errorKey = Object.keys(err.errors)[0];
      
      return res.status(500).json({
        title: 'An error occurred',
        message: err.errors[errorKey].message
      });
    }
    res.status(201).json({
      title: 'User created',
      data: result
    });
  });
});

router.post('/signin', function(req, res) {
  User.findOne({ email: req.body.email }, function(err, user) {
    if (err) {
      return res.status(500).json({
        title: 'An error occurred',
        message: err.message
      });
    }
    if (!user) {
      return res.status(401).json({
        title: 'Login faild',
        message: 'Incorrect Email or Password'
      });
    }
    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(401).json({
        title: 'Login faild',
        message: 'Incorrect Email or Password'
      });
    }
    var token = jwt.sign({user: user._id}, cert, { expiresIn: '1h' });
    res.status(200).json({
      title: 'You\'re Logged in Successfully',
      token: token,
      userId: user._id
    });
  });
});

module.exports = router;