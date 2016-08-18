(function () {
	'use strict';
  
	var formidable = require('formidable');
	var util = require('util');
	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var uploadDir = path.resolve('uploads/temp');
	var musicDir = path.resolve('uploads/music');
	var imageDir = path.resolve('uploads/img');
	var tagScript = path.resolve('perl/tag.pl');
	var imgScript = path.resolve('perl/img.pl');
	var mp3Bucket = 'mp3-tokyo';

	module.exports = function (router, models) {

		router.post('/upload',function (req, res) {
			var form = new formidable.IncomingForm();
			var files = [];
			var tags = [];
			var albumArtistArray = [];

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
						return handleUpload(file, tags, albumArtistArray);
					}, {concurrency: 1})
					.then(function () {
						res.redirect('/#/artist/' + albumArtistArray[0].id);
					});
				}
			});
			form.parse(req);
		});

		function getArtist(name, nameNorm, array, i) {
			return models.Artist.findOrCreate({
				where: models.sequelize.or({ name: name }, { nameNorm: nameNorm }),
				defaults: { name: name, nameNorm: nameNorm }
			})
			.spread(function (artist, artistCreated) {
				array[i] = artist;
			});
		}

		function handleUpload(file, tags, albumArtistArray) {
			
			var filePath = file.path;
			var index = filePath.lastIndexOf('/') + 1;

			var execTagStr = 'perl ' + tagScript + ' ' + filePath;

			return exec(execTagStr)
			.spread(function (stdout, stderr) {
				var tag = JSON.parse(stdout);

				var i, index;
				var artistPromises = [];
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
							var releaseDate = new Date(Date.UTC(tag.year, tag.month, tag.day));
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
					return new Promise(function (resolve, reject) {
						var newPath = path.resolve(musicDir, song.id.toString() + '.mp3');
						fs.renameSync(filePath, newPath);
						tags.push(tag);
						resolve(tag);
					});
				});
			});
		}
	};
}());
