(function () {
	'use strict';

	var Promise = require('bluebird');

	var simpleRandom = function (rows, array, count, code) {
		var i, index;

		for (i = 0; i < count; i++) {
			index = Math.floor(Math.random () * rows.length);
			array.push(rows[index].id);
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
			array.push(weightedArray[index]);
		}
	};

	var queries = [
		{ query: "SELECT id FROM Songs;", code: 'A', callback: simpleRandom },
		{ query: "SELECT id FROM Songs WHERE (plays <= 2) OR (plays < 10 AND id IN (SELECT distinct SongId FROM SingleCharts WHERE rank <= 10));", 
			code: 'B', callback: simpleRandom },
		{ query: "SELECT s.id,  11 - min(rank) as weight FROM Songs s, SingleCharts sc WHERE s.id = sc.SongId AND sc.rank <= 10 GROUP BY s.id;", 
			code: 'C', callback: weightedRandom },
		{ query:
				"SELECT DISTINCT id " +
				"  FROM (" +
								"SELECT SongId id FROM Artists a, AlbumArtists aa, AlbumSongs s " +
	 							" WHERE a.favorites = true AND a.id = aa.ArtistId AND aa.AlbumId = s.AlbumId " +
								"UNION " +
						 		"SELECT SongId id FROM SongArtists sa, Artists a " +
								" WHERE a.favorites = true AND a.id = sa.ArtistId " +
								"UNION " +
								"SELECT SongId id FROM Artists a, ArtistRelations b, AlbumArtists aa, AlbumSongs s " +
 								" WHERE a.favorites = true AND a.id = b.b AND b.a = aa.ArtistId AND aa.AlbumId = s.AlbumId " +
								"UNION " +
 								"SELECT SongId id FROM SongArtists sa, Artists a, ArtistRelations b " +
								" WHERE a.favorites = true AND a.id = b.b AND b.a = sa.ArtistId) a;",
			code: 'D', callback: simpleRandom }
		];

	var getSongIds = function (db, query, array, count) {
		return db.promisifyQuery(query.query)
		.then(function (rows) {
			query.callback(rows, array, count, query.code);
		});
	};
	
	var getDetails = function (db, doc) {
		return db.song.getDetails(doc.ids)
			.then(function (rows) {
				var i, row, song;
				var	details = {};

				for (i in rows) {
					row = rows[i];
					details[row.id] = row;
				}

				for (i in doc.songs) {
					song = doc.songs[i];
					row = details[song.id];

					song.title = row.title;
					song.plays = row.plays;
				}
			});
	};
		
	module.exports = function (router, _, db) {
		function getRandomSongs () {
			var promises = [];
			var songIds = [];
			var limits = [];
			var random;
			var i;

			for (i in queries) {
				limits[i] = 0;
			}

			for (i = 0; i < 100; i++) {
				random = Math.floor(Math.random () * queries.length);
				limits[random]++;
			}

			for (i in queries) {
				promises.push(getSongIds(db, queries[i], songIds, limits[i]));
			}

			return Promise.all (promises)
				.then(function () {
					var songs = {};
					var ids = [];
					var i, id;

					for (i in songIds) {
						id = songIds[i];

						if (songs[id] === undefined) {
							songs[id] = { id: id };
							ids.push(id);
						}
					}

					return { ids: ids, songs: songs };
				});
		}

		function fillSongs (doc) {
			var promises = [];

			promises.push(getDetails(db, doc));
			promises.push(db.song.fetchArtists(doc.songs, doc.ids));
			promises.push(db.song.fetchOldestAlbum(doc.songs, doc.ids));
			promises.push(db.song.fetchMinChartRank(doc.songs, doc.ids));

			return Promise.all (promises)
				.then(function () {
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
			getRandomSongs ()
			.then (fillSongs)
			.then (trimSongArray)
			.then (function (doc) {
				res.json (doc);
			});
		});
	};
}());
