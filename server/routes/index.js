(function () {
  'use strict';

  var express = require('express');
	var path = require('path');
	var fs = require('fs');
	var models = require('../models/index');

  var router = express.Router();
	
	var routeDir = path.resolve('server/routes');

	fs.readdirSync(routeDir)
		.filter(function (file) {
			return (file.indexOf('.') !== 0) && (file !== 'index.js');
		})
		.forEach(function (file) {
			require(path.join(routeDir, file))(router, models);
		});

  /* GET home page. */
  router.get('/', function (req, res) {
    res.render('index');
  });
	
  module.exports = router;
}());
