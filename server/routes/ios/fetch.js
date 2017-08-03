(function () {
	'use strict';

	var Promise = require('bluebird');
	
	var charts = ['billboard', 'oricon', 'deutsche', 'uk', 'francais', 'melon', 'gaon'];

	module.exports = function (router, _, db) {

		function getMore (songs, needDetails) {
			var songIds = [];

			for (var i in songs) {
				songIds.push(songs[i].id);
			}

			var promises = [];
			promises.push(db.song.fetchArtists(songs, songIds));
			promises.push(db.song.fetchOldestAlbum(songs, songIds));

			if (needDetails)
				promises.push(db.song.fetchDetails(songs, songIds));

			return Promise.all(promises)
				.then(function() {
					return songs;
				});
		}

		function getSortedCurrentSongs () {
			return db.chartCurrent.getSortedSongs()
			.then(function (songs) {
				return getMore(songs, false);
			});
		}

		function getCharted (count) {
			var query =
				"SELECT distinct SongId as id " +
				"FROM Songs s, SingleCharts c " +
				"WHERE s.id = c.SongId and rank <= 10 and plays < 10 " +
				"ORDER BY SongId " +
				"LIMIT " + count;

			return db.promisifyQuery(query)
				.then(function (songs) {
					return getMore(songs, true);
				});
		}
		
		function getUncharted (count) {
			var query =
				"SELECT id " +
				"FROM Songs " +
				"WHERE plays < 3 " +
				"ORDER BY id " +
				"LIMIT " + count;
			
			return db.promisifyQuery(query)
				.then(function (songs) {
					return getMore(songs, true);
				});
		}

		function getSeasonal (limit) {

			return db.season.getAllSongsOfThisWeek()
				.then(function (rows) {
					var songMap = {};
					var songs = [];

					for (var i in rows) {
						if (songMap[rows[i].id] === undefined) {
							songMap[rows[i].id] = rows[i];
							songs.push(rows[i]);
						}
					}

					return getMore(songs, true);
				});
		}

		function getCurrentAlbums () {
			var query = "SELECT id FROM (";

			for (var i in charts) {
				var chart = charts[i];
				if (i > 0)
					query += " UNION ";
				query += "SELECT SongId as id, AlbumId, disk, track FROM AlbumSongs";
				query += " WHERE AlbumId in (SELECT AlbumId FROM AlbumCharts";
				query +=                  " WHERE rank <= 5 and type = \"" +  chart + "\"";
				query +=                  " AND week = (SELECT max(week) FROM AlbumCharts";
				query +=                              " WHERE type = \"" + chart + "\"))";
			}

			query += ") a ORDER BY AlbumId, disk, track;";
			
			return db.promisifyQuery(query)
				.then(function (songs) {
					return getMore(songs, true);
				});
		}

		function getFavoriteAlbums () {
			var albumQuery =
				"SELECT AlbumId, `release` FROM (" +
					"SELECT AlbumId FROM AlbumArtists a, Artists b " +
					"	WHERE a.ArtistId = b.id AND b.favorites = true " +
					" UNION " +
					"SELECT AlbumId FROM AlbumArtists a, ArtistRelations b, Artists c " +
					" WHERE a.ArtistId = b.a AND b.b = c.id AND c.favorites = true" +
				") a, Albums b " +
				" WHERE a.AlbumId = b.id " +
				"	ORDER BY `release` DESC LIMIT 50";

			return db.promisifyQuery(albumQuery)
				.then(function (albumIds) {
					var ids = [];

					for (var i in albumIds) {
						ids.push(albumIds[i].AlbumId);
					}

					var query =
						"SELECT SongId as id FROM AlbumSongs " +
						" WHERE AlbumId in (" + ids.join() + ") " +
					  " ORDER BY FIELD(AlbumId, " + ids.join() + "), disk, track";

					return db.promisifyQuery(query);
				}).then(function (songs) {
					return getMore(songs, true);
				});
		}

		router.get('/ios/fetch', function (req, res) {
			var promises = [];
			var result = {};

			var chartedLimit = 200;
		 	var unchartedLimit = 200;
			var seasonalLimit = 5;

			promises.push(
				getSortedCurrentSongs()
				.then( function (array) {
					result.current = array;
				})
			);

			promises.push(
				getCurrentAlbums()
				.then( function (array) {
					result.album = array;
				})
			);
			
			promises.push(
				getCharted(chartedLimit)
				.then( function (array) {
					result.charted = array;
				})
			);

			promises.push(
				getUncharted(unchartedLimit)
				.then( function (array) {
					result.uncharted = array;
				})
			);

			promises.push(
				getSeasonal(seasonalLimit)
				.then( function (array) {
					result.seasonal = array;
				})
			);

			promises.push(
				getFavoriteAlbums()
				.then( function (array) {
					result.favorite = array;
				})
			);

			Promise.all(promises)
			.then ( function () {
				res.json(result);
			});
			
		});
	};
}());
