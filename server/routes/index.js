(function() {
  'use strict';

  var express = require('express');
	var formidable = require('formidable');
  var util = require('util');
	var path = require('path');
	var fs = require('fs');
	var exec = require('child_process').exec;
	var AWS = require('aws-sdk');

  var router = express.Router();

  /* GET home page. */
  router.get('/', function(req, res) {
    res.render('index');
  });

	var mp3Bucket = 'mp3-tokyo';

	router.get('/s3', function(req, res) {
		var objects = [];
		var s3 = new AWS.S3();
		s3.listObjects({ Bucket: mp3Bucket }, function(err, data) {
			console.log(data);
			if (data.Contents.length === 0) {
				res.status(200).send(objects);
			}
			data.Contents.forEach(function(content) {
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

	var uploadDir = path.resolve('uploads/mp3');
	var imageDir = path.resolve('uploads/img');
	var perlScript = path.resolve('perl/tag.pl');

	router.get('/upload', function(req, res) {
		var stats = [];
		fs.readdir(uploadDir, function(err, list) {
			console.log(list.length + ' files');
			if (list.length === 0) {
				res.status(200).send(stats);
			}
			list.forEach(function(name) {
				var filePath = path.join(uploadDir, name);
				exec('perl ' + perlScript + ' ' + filePath, function(error, stdout, stderr) {
					if (error !== null) {
						console.log('exec error: ' + error);
					}
					stats.push(JSON.parse(stdout));
					if (stats.length === list.length) {
						res.status(200).send(stats);
					}
				});
			});
		});
	});

	router.post('/upload',function(req, res) {
		var form = new formidable.IncomingForm();
		var files = [];
		var tags = [];

    form.uploadDir = uploadDir;

    form
      .on('file', function(field, file) {
        files.push(file);
      })
      .on('end', function() {
        console.log('-> upload done');
				for (var i = 0; i < files.length; i++) {
					getTagsAndMoveToS3(i, files, tags, res);
				}
      });
    form.parse(req);
	});

	function getTagsAndMoveToS3(i, files, tags, res) {
		var file = files[i];
		var filePath = file.path;
		var index = filePath.lastIndexOf('/') + 1;
		var filename = filePath.substr(index);
		var imgPath = path.join(imageDir, filename + '.jpg');

		//var execStr = 'perl ' + perlScript + ' ' + filePath + ' ' + imgPath;
		var execStr = 'perl ' + perlScript + ' ' + filePath;
		
		exec(execStr, function (error, stdout, stderr) {
			if (error !== null) {
				console.log('exec error: ' + error);
			}

			var fileBuffer = fs.readFileSync(filePath);
			var s3 = new AWS.S3();
			var param = { Bucket: mp3Bucket, Key: filename, Body: fileBuffer };
			s3.putObject(param, function(error, response) {
				fs.unlinkSync(filePath);
				tags.push(JSON.parse(stdout));
				if (tags.length === files.length) {
					res.writeHead(200, {'content-type': 'text/plain'});
					res.write('received files:\n\n '+util.inspect(files));
					res.end('tags:\n\n '+util.inspect(tags));
				}
			});
		});
	}

  module.exports = router;
}());
