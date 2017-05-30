(function () {
	'use strict';

	var Promise = require('bluebird');

	var getDetails = function (db, song) {
		return db.song.getDetails([song.id])
			.then(function (rows) {
				var row = rows[0];
				song.title = row.title;
				song.plays = row.plays;
			});
	};
	
	var getArtists = function (db, song) {
		return db.song.getArtists([song.id])
			.then(function (artists) {
				song.artists = artists[song.id].artists;
				song.features = artists[song.id].features;
			});
	};
	
	var getAlbums = function (db, song) {
		return db.song.getAlbums([song.id])
			.then(function (albums) {
				song.albums = albums[song.id];
			});
	};

	var getCharts = function (db, song) {
		return db.chartWeeks.getOneSong(song.id)
			.then(function (charts) {
				song.charts = charts;
			});
	};

	module.exports = function (router, _, db) {
		router.get('/api/song/:_id', function (req, res) {
			var id = req.params._id;
			var promises = [];
			var song = { id: id };

			promises.push(getDetails(db, song));
			promises.push(getArtists(db, song));
			promises.push(getAlbums(db, song));
			promises.push(getCharts(db, song));

			Promise.all(promises)
			.then(function () {
				res.json(song);
			});
		});
	};
}());
