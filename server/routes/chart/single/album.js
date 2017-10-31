(function () {
	'use strict';
	
	module.exports = function (router, _, db) {
		router.get ('/chart/single/album/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));

			var query =
				"SELECT `rank`, `order`, artist, title, SongId as id " +
				"  FROM SingleCharts " +
				" WHERE `type` = \'" + chartName + "\' " +
				"   AND `week` = \'" + date.toISOString() + "\' "+
				"   AND `rank` <= 10 " +
			  "	ORDER BY `rank`, `order`;";

			db.promisifyQuery(query)
				.then(function (data) {
					var songs = data;
					var ids = [];
					
					for (var i in songs) {
						if (songs[i].id !== null)
							ids.push(songs[i].id);
					}

					return db.song.getAlbums(ids);
				}).then(function (data) {
					var albumMap = {};
					var albumIds = [];
					var album;

					for (var i in data) {
						album = data[i][0];
						albumMap[album.id] = album;
					}

					for (i in albumMap) {
						albumIds.push(albumMap[i].id);
					}

					query =
						"SELECT SongId as id " +
						"  FROM AlbumSongs " +
						" WHERE AlbumId in (" + albumIds.join() + ")" +
						" ORDER BY `AlbumId`, `disk`, `track`";

					return db.promisifyQuery(query);
				}).then(function (data) {
					var songs = data;
					var ids = [];
					
					for (var i in songs) {
						ids.push(songs[i].id);
					}

					var promises = [];
					promises.push(db.song.fetchDetails(songs, ids));
					promises.push(db.song.fetchArtists(songs, ids));
					promises.push(db.song.fetchOldestAlbum(songs, ids));
					promises.push(db.song.fetchChartSummary(songs, ids));
					
					Promise.all(promises)
						.then(function () {
							res.json(songs);
						});
				});
		});
	};
}());

