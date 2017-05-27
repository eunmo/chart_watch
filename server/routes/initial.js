(function () {
	'use strict';

	var common = require('../common/cwcommon.js');	
	var Sequelize = require('sequelize');
	var Promise = require('bluebird');

	var getAlbumSummary = function (db, artists, ids) {
		var query = "SELECT ArtistId, format, AlbumId, `release` " +
								"FROM AlbumArtists aa, Albums a " +
								"WHERE aa.ArtistId in (" + ids.toString() + ") " + 
								"AND aa.AlbumId = a.id;";

		return db.promisifyQuery(query)	
		.then(function (rows) {
			var i, album, id, format;

			for (i in rows) {
				album = rows[i];
				id = album.ArtistId;
				format = album.format;
				if (format) {
					if (artists[id].albums[format] === undefined)
						artists[id].albums[format] = 0;
					artists[id].albums[format] += 1;
				}
				if (artists[id].maxDate < album.release) {
					artists[id].maxDate = album.release;
					artists[id].maxAlbum = album.AlbumId;
				}
			}
		});
	};
	
	var getSongSummary = function (db, artists, ids) {
		var idString = ids.toString();
		var query = "SELECT ArtistId, count(*) AS count " +
									"FROM SongArtists sa " +
								 "WHERE sa.ArtistId in (" + ids.toString() + ") " +
						  "GROUP BY sa.ArtistId;";
		
		return db.promisifyQuery(query)	
		.then(function (rows) {
			var i, songCount, id, feat;

			for (i in rows) {
				songCount = rows[i];
				id = songCount.ArtistId;
				artists[id].songCount = songCount.count;
			}
		});
	};

	var getHitSummary = function (db, artists, ids) {
		var idString = ids.toString();
		var query = "SELECT ArtistId, count(distinct sa.SongId) AS count " +
									"FROM SongArtists sa, SongCharts sc " +
								 "WHERE sa.SongId = sc.SongId " +
								   "AND sa.ArtistId in (" + ids.toString() + ") " +
								   "AND sc.rank <= 10 " +
							"GROUP BY ArtistId;";
		
		return db.promisifyQuery(query)	
		.then(function (rows) {
			var i, songCount, id, feat;

			for (i in rows) {
				songCount = rows[i];
				id = songCount.ArtistId;
				artists[id].chartedSongs = songCount.count;
			}
		});
	};

	var getBs = function (db, artists, ids) {

		return db.artist.getB(ids)
			.then(function (rows) {
				var i, row, b, type, artist;

				for (i in rows) {
					row = rows[i];
					type = row.type;
					artist = artists[row.a];

					if (artist.Bs === undefined)
						artist.Bs = {};

					b = { id: row.b, name: row.name };

					if (type !== 'p') {
						artist.Bs[type] = b;
					} else if (row.order !== undefined) { // project group needs an order.
						if (artist.Bs[type] === undefined) {
							artist.Bs[type] = [];
						}
						artist.Bs[type][row.order] = b;
					}
				}
			});
	};
	
	module.exports = function (router, models, db) {
		router.get('/api/initial/:_initial', function (req, res) {
			var initial = req.params._initial;
			var queryOption = {};
			var artists = [];
			var promises = [];

			var query = "SELECT id, name, nameNorm, origin, type, gender " +
									"FROM Artists " +
									"WHERE ";

			if (initial.match(/[가나다라마바사아자차카타파하]/)) {
				// korean
				var krnInitials = '가나다라마바사아자차카타파하';
				var index = krnInitials.indexOf(initial);

				query += "nameNorm >= '" + krnInitials[index] + "' ";

				if (index < 13) {
					query += "AND nameNorm < '" + krnInitials[index+1] + "' ";
				}
			} else if (initial.match(/0-9/)) {
				// numbers
				query += "nameNorm < '가' and not nameNorm regexp '^[A-Za-z]'";
			} else if (initial.match(/Favorites/)) {
				query += "favorites = true ";
			} else {
				// alphabet
				query += "nameNorm like '" + initial + "%' ";
			}

			return db.promisifyQuery(query + ';')
		 	.then(function (rows) {
				var ids = [];
				var artist, i, id;
			
				for (i in rows) {
					artist = rows[i];
					id = artist.id;
					ids.push(id);
					artists[id] = {
						id: id,
						name: artist.name,
						nameNorm: artist.nameNorm,
						origin: artist.origin,
						type: artist.type,
						gender: artist.gender,
						maxDate: '0',
						maxAlbum: 0,
						albums: {},
						chartedSongs: 0,
						songCount: 0
					};
				}

				promises.push(getAlbumSummary(db, artists, ids));
				promises.push(getSongSummary(db, artists, ids));
				promises.push(getHitSummary(db, artists, ids));
				promises.push(getBs(db, artists, ids));

				return Promise.all(promises);
		 	}).then(function () {
				var result = [];
			
				for (var i in artists) {
					result.push(artists[i]);
				}

				res.json(result);
			});
		});
	};
}());
