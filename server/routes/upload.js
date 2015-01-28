(function () {
	'use strict';
  
	var formidable = require('formidable');
	var util = require('util');
	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');
	var AWS = require('aws-sdk');
	var exec = Promise.promisify(require('child_process').exec);

	var uploadDir = path.resolve('uploads/mp3');
	var imageDir = path.resolve('uploads/img');
	var tagScript = path.resolve('perl/tag.pl');
	var imgScript = path.resolve('perl/img.pl');
	var mp3Bucket = 'mp3-tokyo';

	module.exports = function (router, models) {

		router.post('/upload',function (req, res) {
			var form = new formidable.IncomingForm();
			var files = [];
			var tags = [];

			form.uploadDir = uploadDir;

			form
			.on('file', function (field, file) {
				if (file.size > 0)
					files.push(file);
			})
			.on('end', function () {
				console.log('-> upload done');
				if (files.length === 0) {
					res.json(null);
				} else {
					var promises = [];
					Promise.map(files, function (file) {
						return handleUpload(file, tags);
					}, {concurrency: 1})
					.then(function () {
						res.writeHead(200, {'content-type': 'text/plain'});
						res.write('received files:\n\n '+util.inspect(files));
						res.end('tags:\n\n '+util.inspect(tags));
					});
				}
			});
			form.parse(req);
		});

		function getArtist(name, nameNorm, array, i) {
			return models.Artist.findOrCreate({
				where: { name: name },
				defaults: { nameNorm: nameNorm }
			})
			.spread(function (artist, artistCreated) {
				array[i] = artist;
			});
		}

		function handleUpload(file, tags) {
			console.log(file);
			
			var filePath = file.path;
			var index = filePath.lastIndexOf('/') + 1;

			var execTagStr = 'perl ' + tagScript + ' ' + filePath;

			return exec(execTagStr)
			.spread(function (stdout, stderr) {
				var tag = JSON.parse(stdout);
				console.log(tag);

				var i, index;
				var artistPromises = [];
				var albumArtistArray = [];
				var songArtistArray = [];
				var featArtistArray = [];

				for (i = 0; i < tag.albumArtist.length; i++) {
					artistPromises[i] = getArtist(tag.albumArtist[i],
																				tag.albumArtistNorm[i],
																				albumArtistArray, i);
				}

				for (i = 0; i < tag.artist.length; i++) {
					index = i + tag.albumArtist.length;
					artistPromises[index] = getArtist(tag.artist[i],
																						tag.artistNorm[i],
																						songArtistArray, i);
				}

				for (i = 0; i < tag.feat.length; i++) {
					index = i + tag.albumArtist.length + tag.artist.length;
					artistPromises[index] = getArtist(tag.feat[i],
																						tag.featNorm[i],
																						featArtistArray, i);
				}

				return Promise.all(artistPromises)
				.then(function () {
					return albumArtistArray[0].getAlbums()
					.then(function (albums) {
						var matchingAlbum = null;

						for (i in albums) {
							if (tag.album === albums[i].title) {
								matchingAlbum = albums[i];
							}
						}

						if (matchingAlbum !== null) {
							return matchingAlbum;
						} else {
							var releaseDate = new Date(tag.year, tag.month, tag.day);
							return models.Album.create({
								title: tag.album,
								titleNorm: tag.albumNorm,
								release: releaseDate,
								genre: tag.genre
							})
							.then(function (album) {
								var albumArtistPromises = [];

								for (var i = 0; i < tag.albumArtist.length; i++) {
									albumArtistPromises[i] = album.addArtist(albumArtistArray[i], {order: i});
								}
								return Promise.all(albumArtistPromises).then(function () {return album;});
							})
							.then(function (album) {
								var imgPath = path.resolve(imageDir, album.id + '.jpg');
								var execImgStr = 'perl ' + imgScript + ' ' + filePath + ' ' + imgPath;
								return exec(execImgStr).then(function () {
									return album;
								});
							});
						}
					});
				})
				.bind({})
				.then(function (album) {
					this.album = album;
					return models.Song.create({
						title: tag.title,
						titleNorm: tag.titleNorm,
						time: tag.time,
						bitrate: tag.bitrate
					});
				})
				.then(function (song) {
					song.addAlbum(this.album, {disk: tag.disk, track: tag.track});
					for (i = 0; i < songArtistArray.length; i++) {
						song.addArtist(songArtistArray[i], {order: i});
					}
					for (i = 0; i < featArtistArray.length; i++) {
						song.addArtist(featArtistArray[i], {order: i, feat: true});
					}
					var fileBuffer = fs.readFileSync(filePath);
					var s3 = new AWS.S3();
					var param = {
						Bucket: mp3Bucket,
						Key: song.id.toString(),
						ContentType: 'audio/mpeg',
						Body: fileBuffer
					};
					return new Promise(function (resolve, reject) {
						s3.putObject(param, function (error, response) {
							if (error !== null) {
								console.log('s3 error: ' + error);
								return reject();
							}
							fs.unlinkSync(filePath);
							tags.push(tag);
							resolve(tag);
						});
					});
				});
			});
		}
	};
}());
