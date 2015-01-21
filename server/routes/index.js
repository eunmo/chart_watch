(function () {
  'use strict';

  var express = require('express');
	var path = require('path');
	var fs = require('fs');
	var AWS = require('aws-sdk');
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
	
	var mp3Bucket = 'mp3-tokyo';

	router.get('/s3', function (req, res) {
		var objects = [];
		var s3 = new AWS.S3();
		s3.listObjects({ Bucket: mp3Bucket }, function (err, data) {
			console.log(data);
			if (data.Contents.length === 0) {
				res.status(200).send(objects);
			}
			data.Contents.forEach(function (content) {
				var s3 = new AWS.S3();
				var params = { Bucket: mp3Bucket, Key: content.Key };
				var url = s3.getSignedUrl('getObject', params);
				console.log(url);
				objects.push(url);
				if (objects.length === data.Contents.length) {
					res.status(200).send(objects);
				}
			});
		});
	});

  module.exports = router;
}());
