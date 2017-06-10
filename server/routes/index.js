(function () {
  'use strict';

  var express = require('express');
	var path = require('path');
	var fs = require('fs');
	var models = require('../models/index');
	var db = require('../db/index');

  var router = express.Router();

	var dir = path.resolve('server/routes');	

	function getRoutes (dir) {
		fs.readdirSync(dir)
			.filter(function (file) {
				return (file.indexOf('.js') > 0 && file.indexOf('.swp') < 0);
			}).forEach(function (file) {
				require(path.join(dir, file))(router, models, db);
			});
	}

	fs.readdirSync(dir)
		.filter(function (subDir) {
			return (subDir.indexOf('.js') < 0);
		}).forEach(function (subDir) {
			getRoutes(path.join(dir, subDir));
		});

  /* GET home page. */
  router.get('/', function (req, res) {
    res.render('index');
  });
	
  module.exports = router;
}());
