(function () {
	'use strict';

	var common = require('../common/cwcommon');
	var Promise = require('bluebird');

	var getArtists = function (models, id, results) {
		return models.Album.findOne({
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
	
	var getCharts = function (db, id, results) {
		return db.chartWeeks.getOneAlbum(id)
			.then(function (charts) {
				results.charts = charts;
			});
	};

	module.exports = function (router, models, db) {
		router.get('/api/album/:_id', function (req, res) {
			var id = req.params._id;
			var promises = [];
			var results = {};

			promises.push(getArtists(models, id, results));
			promises.push(getCharts(db, id, results));

			Promise.all(promises)
			.then(function () {
				var album = common.newAlbum(results.artists);
				album.artists = results.artists.Artists;
				album.charts = results.charts;
				res.json(album);
			});
		});
		
		router.get('/api/album/format/:_format', function (req, res) {

			var filter = 'a.format = \"' + req.params._format + '\"';

			if (req.params._format === 'null')
				filter = 'a.format is null';

			var query = '';
		 	query	+= 'SELECT AlbumId, title, `release`, ArtistId, `order`, name FROM Albums a, AlbumArtists b, Artists c ';
			query += 'WHERE ' + filter + ' AND a.id = b.AlbumId and c.id = b.ArtistId;';

			db.handleQuery(query, function (rows) {
				var albums = [];
				var i, row;

				for (i in rows) {
					row = rows[i];

					if (albums[row.AlbumId] === undefined) {
						albums[row.AlbumId] = { id: row.AlbumId, title: row.title, artists: [], release: new Date(row.release) };
					}

					albums[row.AlbumId].artists[row.order] = { id: row.ArtistId, name: row.name };
				}

				var out = [];

				for (i in albums) {
					out.push (albums[i]);
				}

				out.sort(function (a, b) { return a.release - b.release; });

				res.json(out);
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
	};
}());
