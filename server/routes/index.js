(function() {
  'use strict';

  var express = require('express');
  var path = require('path');
  var fs = require('fs');
  var db = require('../db/index');

  var router = express.Router();

  function getRoutes(__dirname) {
    fs.readdirSync(__dirname)
      .filter(function(file) {
        return file.indexOf('.js') > 0 && file.indexOf('.swp') < 0;
      })
      .forEach(function(file) {
        require(path.join(__dirname, file))(router, db);
      });
  }

  fs.readdirSync(__dirname)
    .filter(function(subDir) {
      return subDir.indexOf('.js') < 0;
    })
    .forEach(function(subDir) {
      getRoutes(path.join(__dirname, subDir));
    });

  router.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, '../../build/index.html'));
  });

  module.exports = router;
})();
