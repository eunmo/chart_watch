(function() {
	'use strict';
  
	var formidable = require('formidable');
	var util = require('util');
	var path = require('path');
	var fs = require('fs');
	var exec = require('child_process').exec;
	var AWS = require('aws-sdk');

	var uploadDir = path.resolve('uploads/mp3');
	var imageDir = path.resolve('uploads/img');
	var perlScript = path.resolve('perl/tag.pl');
	var mp3Bucket = 'mp3-tokyo';

	module.exports = function (router, models) {

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

				models.Artist.findOrCreate({ where: { name: tag.albumArtist[0] } })
				.spread(function(artist, artistCreated) {
					console.log(artist);
					return models.Album.findOrCreate({ where: { title: tag.album } });
				})
				.bind({})
				.spread(function(album, albumCreated) {
					console.log(album);
					this.album = album;
					return models.Song.create({
						file: filename,
						title: tag.title,
						time: tag.time,
						bitrate: tag.bitrate
					});
				})
				.then(function(song) {
					console.log(song);
					song.addAlbum(this.album, {disk: tag.disk, track: tag.track});
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
			});
		}
	};
}());
