(function() {
  'use strict';

  var express = require('express');
	var formidable = require('formidable');
  var util = require('util');
	var path = require('path');
	var fs = require('fs');
	var exec = require('child_process').exec;
	var AWS = require('aws-sdk');
	var models = require('../models/index');

  var router = express.Router();

  /* GET home page. */
  router.get('/', function(req, res) {
    res.render('index');
  });
	
	router.get('/db/album', function(req, res) {
		models.Album.findAll().then(function(albums) {
			res.status(200).send(albums);
		});
	});
	
	router.get('/db/artist', function(req, res) {
		models.Artist.findAll().then(function(artists) {
			res.status(200).send(artists);
		});
	});
	
	router.get('/db/song', function(req, res) {
		models.Song.findAll().then(function(songs) {
			res.status(200).send(songs);
		});
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
			var tag = JSON.parse(stdout);
			console.log(tag);

			models.Artist.findOrCreate({ where: { name: tag.albumArtist } })
			.then(function(artist) {
				models.Album.findOrCreate({ where: { title: tag.album } })
				.then(function(album) {
					models.Song.create({
						file: filename,
						title: tag.title,
						time: tag.time,
						bitrate: tag.bitrate
					}).then(function(song) {
						song.createAlbum(album, {disk: tag.disk, track: tag.track});
					});
				});
			});

			var fileBuffer = fs.readFileSync(filePath);
			var s3 = new AWS.S3();
			var param = { Bucket: mp3Bucket, Key: filename, Body: fileBuffer };
			s3.putObject(param, function(error, response) {
				fs.unlinkSync(filePath);
				tags.push(tag);
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
