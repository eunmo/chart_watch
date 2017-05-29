(function () {
	'use strict';

	var Promise = require('bluebird');
	
	var getArtists = function (models, id, results) {
		return models.Song.findOne({
			where: {id: id},
			include: [
				{ model: models.Artist, attributes: [ 'id', 'name' ],
					include: [
						{ model: models.Artist, as: 'Group', attributes: [ 'id', 'name' ] }
					]
				}
			]
		}).then(function (array) {
			results.artists = array;
		});
	};

	var getAlbums = function (models, id, results) {
		return models.Song.findOne({
			where: {id: id},
			include: [
				{ model: models.Album,
					include: [
						{ model: models.Artist, attributes: [ 'id', 'name' ],
							include: [
								{ model: models.Artist, as: 'Group', attributes: [ 'id', 'name' ] }
							]
						}
					]
				}
			]
		}).then(function (array) {
			var albums = [];
			for (var i in array.Albums) {
					var albumRow = array.Albums[i];
					albums.push(common.newAlbum(albumRow));
			}
			results.albums = albums;
		});
	};

	var getCharts = function (db, id, results) {
		return db.chartWeeks.getOneSong(id)
			.then(function (charts) {
				results.charts = charts;
			});
	};

	module.exports = function (router, models, db) {
		router.get('/api/song/:_id', function (req, res) {
			var id = req.params._id;
			var promises = [];
			var results = {};

			promises.push(getArtists(models, id, results));
			promises.push(getAlbums(models, id, results));
			promises.push(getCharts(db, id, results));

			Promise.all(promises)
			.then(function () {
				var song = common.newSong(results.artists);
				song.artists = results.artists.Artists;
				song.albums = results.albums;
				song.charts = results.charts;
				res.json(song);
			});
		});
	};
}());
