(function() {
	'use strict';
  
	var formidable = require('formidable');
	var util = require('util');
	var path = require('path');
	var fs = require('fs');
	var exec = require('child_process').exec;
	var AWS = require('aws-sdk');
	var promise = require('bluebird');

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
					handleUpload(i, files, tags, res);
				}
			});
			form.parse(req);
		});

		function getArtist(name, array, i) {
			return models.Artist.findOrCreate({ where: { name: name } })
			.spread(function(artist, artistCreated) {
				array[i] = artist;
			});
		}

		function handleUpload(i, files, tags, res) {
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

				var i, index;
				var artistPromises = [];
				var albumArtistArray = [];
				var songArtistArray = [];
				var featArtistArray = [];

				for (i = 0; i < tag.albumArtist.length; i++) {
					artistPromises[i] = getArtist(tag.albumArtist[i], albumArtistArray, i);
				}
				
				for (i = 0; i < tag.artist.length; i++) {
					index = i + tag.albumArtist.length;
					artistPromises[index] = getArtist(tag.artist[i], songArtistArray, i);
				}
				
				for (i = 0; i < tag.feat.length; i++) {
					index = i + tag.albumArtist.length + tag.artist.length;
					artistPromises[index] = getArtist(tag.feat[i], featArtistArray, i);
				}

				promise.all(artistPromises)
				.then(function() {
					return albumArtistArray[0].getAlbums()
					.then(function(albums) {
						var matchingAlbum = null;

						for (i in albums) {
							if (tag.album === albums[i].title) {
								matchingAlbum = albums[i];
							}
						}

						if (matchingAlbum !== null) {
							return matchingAlbum;
						} else {
							return models.Album.create({ title: tag.album })
							.then(function(album) {
								for (var i = 0; i < tag.albumArtist.length; i++) {
									album.addArtist(albumArtistArray[i], {order: i});
								}
								return album;
							});
						}
					});
				})
				.bind({})
				.then(function(album) {
					this.album = album;
					return models.Song.create({
						file: filename,
						title: tag.title,
						time: tag.time,
						bitrate: tag.bitrate
					});
				})
				.then(function(song) {
					song.addAlbum(this.album, {disk: tag.disk, track: tag.track});
					for (i = 0; i < songArtistArray.length; i++) {
						song.addArtist(songArtistArray[i], {order: i});
					}
					for (i = 0; i < featArtistArray.length; i++) {
						song.addArtist(featArtistArray[i], {order: i, feat: true});
					}
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
