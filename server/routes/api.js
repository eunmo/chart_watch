(function () {
	'use strict';

	var common = require('../common/cwcommon.js');	
	var Sequelize = require('sequelize');
	var Promise = require('bluebird');

	var getPrimaryGroupSummary = function (models, artists, ids) {
		var query = "SELECT MemberId, GroupId, name " + 
								"FROM ArtistGroups g, Artists a " +
								"WHERE g.MemberId in (" + ids.toString() + ") " +
								"AND g.GroupId = a.id " + 
								"AND g.primary = true;";
		return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
		.then(function (rows) {
			var i, primary, id, type;

			for (i in rows) {
				primary = rows[i];
				artists[primary.MemberId].primaryGroup = {
					id: primary.GroupId,
					name: primary.name
				};
			}
		});
	};

	var getAlbumSummary = function (models, artists, ids) {
		var query = "SELECT ArtistId, format, AlbumId, `release` " +
								"FROM AlbumArtists aa, Albums a " +
								"WHERE aa.ArtistId in (" + ids.toString() + ") " + 
								"AND aa.AlbumId = a.id;"; 
		return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
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

	var getChartedSongSummary = function (models, artists, ids) {
		var idString = ids.toString();
		var query = "SELECT ArtistId, count(distinct sa.SongId) AS count " +
									"FROM SongArtists sa, SongCharts sc " +
								 "WHERE sa.SongId = sc.SongId " +
								   "AND sa.ArtistId in (" + ids.toString() + ") " +
								   "AND sc.rank <= 10 " +
							"GROUP BY ArtistId;";
		return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
		.then(function (rows) {
			var i, songCount, id, feat;

			for (i in rows) {
				songCount = rows[i];
				id = songCount.ArtistId;
				artists[id].chartedSongs = songCount.count;
			}
		});
	};
	
	var getSongCount = function (models, artists, ids) {
		var idString = ids.toString();
		var query = "SELECT ArtistId, count(*) AS count " +
									"FROM SongArtists sa " +
								 "WHERE sa.ArtistId in (" + ids.toString() + ") " +
						  "GROUP BY sa.ArtistId;";
		return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
		.then(function (rows) {
			var i, songCount, id, feat;

			for (i in rows) {
				songCount = rows[i];
				id = songCount.ArtistId;
				artists[id].songCount = songCount.count;
			}
		});
	};

	module.exports = function (router, models, db) {
		router.get('/api/artist', function (req, res) {
			models.Artist.findAll({
				include: [ {model: models.Album}, {model: models.Song} ],
				order: '`nameNorm`'
			}).then(function (artists) {
				res.json(artists);
			});
		});
		
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

			return models.sequelize.query(query + ';', { type: models.sequelize.QueryTypes.SELECT })
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

				promises.push(getPrimaryGroupSummary(models, artists, ids));
				promises.push(getAlbumSummary(models, artists, ids));
				promises.push(getChartedSongSummary(models, artists, ids));
				promises.push(getSongCount(models, artists, ids));

				return Promise.all(promises);
		 	}).then(function () {
				var result = [];
			
				for (var i in artists) {
					result.push(artists[i]);
				}

				res.json(result);
			});
		});

		function getTableSummary (table, summary) {
			var query = "SELECT count(*) as count FROM " + table + ";";

			return db.promisifyQuery(query)
				.then(function (rows) {
					summary[table] = rows[0].count;
				});
		}
		
		router.get('/api/summary', function (req, res) {
			var promises = [];
			var summary = {};

			promises.push (getTableSummary('Artists', summary));
			promises.push (getTableSummary('Albums', summary));
			promises.push (getTableSummary('Songs', summary));

			Promise.all (promises)
			.then (function () {
				res.json (summary);
			});
		});
	};
}());
