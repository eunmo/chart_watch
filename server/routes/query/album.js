(function () {
	'use strict';

	var Promise = require('bluebird');

	var getDetail = function (db, album) {
		return db.album.getDetails([album.id])
			.then(function (rows) {
				var row = rows[0];
				album.title = row.title;
				album.format = row.format;
				album.release = row.release;
			});
	};

	var getArtist = function (db, album) {
		return db.album.getArtists([album.id])
			.then(function (albumArtists) {
				album.artists = albumArtists[album.id];
			});
	};
	
	var getChart = function (db, album) {
		return db.chartWeeks.getOneAlbum(album.id)
			.then(function (charts) {
				album.charts = charts;
			});
	};

	var getArtists = function (db, albums) {
		var i;
		var ids = [];

		for (i in albums) {
			ids.push(albums[i].id);
		}
		
		return db.album.getArtists(ids)
			.then(function (albumArtists) {
				var i, album;

				for (i in albums) {
					album = albums[i];
					album.artists = albumArtists[album.id];
				}
			});
	};

	module.exports = function (router, _, db) {
		router.get('/api/album/:_id', function (req, res) {
			var id = req.params._id;
			var promises = [];
			var album = { id: id };

			promises.push(getDetail(db, album));
			promises.push(getArtist(db, album));
			promises.push(getChart(db, album));

			Promise.all(promises)
			.then(function () {
				res.json(album);
			});
		});
		
		router.get('/api/album/format/:_format', function (req, res) {
			var albums = [];

			return db.album.getByFormat(req.params._format)
				.then(function(rows) {
					var i, row;

					for (i in rows) {
						row = rows[i];
						albums.push({
							id: row.id,
							title: row.title,
							format: row.format,
							release: row.release
						});
					}

					return getArtists(db, albums);
				}).then(function () {
					res.json(albums);
				});
		});
		
		router.get('/api/album/format2/:_format', function (req, res) {
			var albums = [];

			return db.album.getByFormat2(req.params._format)
				.then(function(rows) {
					var i, row;

					for (i in rows) {
						row = rows[i];
						albums.push({
							id: row.id,
							title: row.title,
							release: row.release
						});
					}

					return getArtists(db, albums);
				}).then(function () {
					res.json(albums);
				});
		});
		
		router.get('/api/all-albums', function (req, res) {
			var query = 'SELECT id, title, `release`, format FROM Albums';
			var albums = [];
			var album, row;

			db.promisifyQuery(query)
			.then (function (rows) {
				for (var i in rows) {
					album = rows[i];
					album.artists = [];
					album.release = new Date(album.release);
					albums[album.id] = album;
				}
				query = 'Select AlbumId, ArtistId, `order`, name FROM AlbumArtists a, Artists b where a.ArtistId = b.id';
			
				return db.promisifyQuery(query);
			}).then (function (rows) {
				for (var i in rows) {
					row = rows[i];
					albums[row.AlbumId].artists[row.order] = { id: row.ArtistId, name: row.name };
				}
				res.json (albums);
			});
		});
		
		router.get('/api/album/monthly/:_month', function (req, res) {
			const date = req.params._month;
			const year = date.substring(0, 4);
			const month = date.substring(4, 6);
			var query = 
				'SELECT id, title, `release`, format FROM Albums' +
			  ' WHERE MONTH(`release`) = ' + month +
				  ' AND YEAR(`release`) = ' + year;

			db.promisifyQuery(query)
			.then (function (rows) {
				res.json(rows);
			});
		});
	};
}());
