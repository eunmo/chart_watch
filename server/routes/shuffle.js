(function () {
	'use strict';

	var common = require('../common/cwcommon.js');	
	var Sequelize = require('sequelize');
	var Promise = require('bluebird');

	var simpleRandom = function (rows, array, count, code) {
		var i, index;

		for (i = 0; i < count; i++) {
			index = Math.floor (Math.random () * rows.length);
			array.push ({ id: rows[index].id, code: code });
		}
	};
	
	var weightedRandom = function (rows, array, count, code) {
		var i, j, index;
		var weightedArray = [];
		var row;

		for (i = 0; i < rows.length; i++) {
			row = rows[i];
			for (j = 0; j < row.weight; j++) {
				weightedArray.push (row.id);
			}
		}

		for (i = 0; i < count; i++) {
			index = Math.floor (Math.random () * weightedArray.length);
			array.push ({ id: weightedArray[index], code: code });
		}
	};

	var queries = [
		{ query: "SELECT id FROM Songs;", code: 'A', callback: simpleRandom },
		{ query: "SELECT id FROM Songs WHERE (plays <= 2) OR (plays < 10 AND id IN (SELECT distinct SongId FROM SongCharts WHERE rank <= 10));", 
			code: 'B', callback: simpleRandom },
		{ query: "SELECT s.id,  11 - min(rank) as weight FROM Songs s, SongCharts sc WHERE s.id = sc.SongId AND sc.rank <= 10 GROUP BY s.id;", 
			code: 'C', callback: weightedRandom },
		{ query: "SELECT SongId id FROM Artists a, AlbumArtists aa, AlbumSongs s " +
						 "WHERE a.favorites = true AND a.id = aa.ArtistId AND aa.AlbumId = s.AlbumId GROUP BY SongId " +
						 "UNION " +
		 				 "SELECT SongId id FROM SongArtists sa, Artists a WHERE a.favorites = true AND a.id = sa.ArtistId GROUP BY SongId;",
			code: 'D', callback: simpleRandom }
		];

	var getSongIds = function (models, query, array, count) {
		return models.sequelize.query (query.query, { type: models.sequelize.QueryTypes.SELECT })
		.then (function (rows) {
			query.callback (rows, array, count, query.code);
		});
	};

		
	module.exports = function (router, models) {
		function getRandomSongIds () {
			var promises = [];
			var songIds = [];
			var songs = [];
			var limits = [];
			var random;
			var i;

			for (i in queries) {
				limits[i] = 0;
			}

			for (i = 0; i < 100; i++) {
				random = Math.floor (Math.random () * queries.length);
				limits[random]++;
			}

			for (i in queries) {
				promises.push (getSongIds (models, queries[i], songIds, limits[i]));
			}

			return Promise.all (promises)
				.then (function () {
					var i;
					var songId;
					var idArray = [];

					for (i in songIds) {
						songId = songIds[i];

						if (songs[songId.id]) {
							songs[songId.id].codes.push (songId.code);
						}
						else {
							songs[songId.id] = {
								id: songId.id, 
								codes: [songId.code], 
								artists: []
							};

							idArray.push (songId.id);
						}
					}

					var ids = "(";
					for (i in idArray) {
						if (i > 0)
							ids += ",";
						ids += idArray[i];
					}
					ids += ")";

					return { ids: ids, songs: songs };
				});
		}

		function getSongs (doc) {
			var query = "SELECT id, title, plays FROM Songs WHERE id IN " + doc.ids + ";";
			return models.sequelize.query (query, { type: models.sequelize.QueryTypes.SELECT })
				.then (function (rows) {
					var i;
					var song;

					for (i in rows) {
						song = rows[i];
						doc.songs[song.id].title = song.title;
						doc.songs[song.id].plays = song.plays;
					}

					return doc;
				});
		}

		function getAlbums (doc) {
			var query = "SELECT SongId, AlbumId " +
				          "FROM AlbumSongs s, Albums a " +
									"WHERE s.AlbumId = a.id " +
									"AND s.SongId in " + doc.ids + " " +
									"ORDER BY s.SongId, a.release;";
			
			return models.sequelize.query (query, { type: models.sequelize.QueryTypes.SELECT })
				.then (function (rows) {
					var i;
					var album;
					var song;

					for (i in rows) {
						album = rows[i];
						song = doc.songs[album.SongId];

						if (song.albumId === undefined) {
							song.albumId = album.AlbumId;
						}												
					}

					return doc;
				});
		}
		
		function getArtists (doc) {
			var query = "SELECT SongId, ArtistId, name " +
									"FROM SongArtists s, Artists a " +
									"WHERE s.SongId in " + doc.ids + " " +
									"AND s.ArtistId = a.id " +
									"AND s.feat = false " +
									"ORDER BY s.order;";
			
			return models.sequelize.query (query, { type: models.sequelize.QueryTypes.SELECT })
				.then (function (rows) {
					var i;
					var artist;
					var song;

					for (i in rows) {
						artist = rows[i];
						song = doc.songs[artist.SongId];
						song.artists.push ({ id: artist.ArtistId, name: artist.name });
					}

					return doc;
				});
		}

		function getCharts (doc) {
			var query = "SELECT SongId, MIN(rank) as rank " +
									"FROM SongCharts " +
									"WHERE SongId in " + doc.ids + " " +
									"AND rank <= 10 " + 
									"GROUP BY SongId;";

			return models.sequelize.query (query, { type: models.sequelize.QueryTypes.SELECT })
				.then (function (rows) {
					var i;
					var chart;
					var song;

					for (i in rows) {
						chart = rows[i];
						song = doc.songs[chart.SongId];
					 	song.rank = chart.rank;
					}

					return doc;
				});
		}

		function trimSongArray (doc) {
			var newSongs = [];
			var shuffle = [];
			var i;
			var index;

			for (i in doc.songs) {
				newSongs.push (doc.songs[i]);
			}

			while (newSongs.length > 0) {
				index = Math.floor (Math.random () * newSongs.length);
				shuffle.push (newSongs.splice (index, 1)[0]);
			}

			return shuffle;
		}

		router.get('/shuffle', function (req, res) {
			getRandomSongIds ()
			.then (getSongs)
			.then (getAlbums)
			.then (getArtists)
			.then (getCharts)
			.then (trimSongArray)
			.then (function (doc) {
				res.json (doc);
			});
		});
	};
}());
