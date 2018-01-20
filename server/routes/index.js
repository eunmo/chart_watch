(function () {
  'use strict';

  var express = require('express');
	var path = require('path');
	var fs = require('fs');
	var models = require('../models/index');
	var db = require('../db/index');

  var router = express.Router();

	function getRoutes (__dirname) {
		fs.readdirSync(__dirname)
			.filter(function (file) {
				return (file.indexOf('.js') > 0 && file.indexOf('.swp') < 0);
			}).forEach(function (file) {
				require(path.join(__dirname, file))(router, models, db);
			});
	}

	fs.readdirSync(__dirname)
		.filter(function (subDir) {
			return (subDir.indexOf('.js') < 0);
		}).forEach(function (subDir) {
			getRoutes(path.join(__dirname, subDir));
		});

  /* GET home page. */
  router.get('/', function (req, res) {
    res.render('index');
  });
	
  module.exports = router;
}());
