(function () {
	'use strict';
	
	module.exports = function (router, _, db) {
		router.get ('/chart/single/view/:_chart', function (req, res) {
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
			  "	ORDER BY `rank`, `order`;";

			db.promisifyQuery(query)
				.then(function (songs) {
					var ids = [];

					for (var i in songs) {
						if (songs[i].id !== null)
							ids.push(songs[i].id);
					}

					var promises = [];
					if (ids.length > 0) {
						promises.push(db.song.fetchArtists(songs, ids));
						promises.push(db.song.fetchOldestAlbum(songs, ids));
					}

					Promise.all(promises)
						.then(function () {
							res.json(songs);
						});
				});
		});
	};
}());

