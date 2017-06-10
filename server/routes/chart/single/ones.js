(function () {
	'use strict';
	
	module.exports = function (router, _, db) {
		router.get ('/chart/single/ones/:_chart', function (req, res) {
			var chartName = req.params._chart;

			var query =
				"SELECT `week`, `order`, artist, title, SongId as id " +
				"  FROM SingleCharts " +
				" WHERE `type` = \'" + chartName + "\' " +
				"   AND `rank` = 1 " +
				" ORDER BY `week` DESC, `order`";

			var out = { weeks: [], songs: [] };
			
			db.promisifyQuery(query)
				.then(function (rows) {
					var songMap = {};
					var ids = [];
					var songs = out.songs;
					var id;

					for (var i in rows) {
						id = rows[i].id;
						if (id !== null && songMap[id] === undefined) {
							ids.push(id);
							songs.push({ id: id });
						}
						out.weeks.push({ week: rows[i].week, song: id });
					}

					var promises = [];
					promises.push(db.song.fetchDetails(songs, ids));
					promises.push(db.song.fetchArtists(songs, ids));
					promises.push(db.song.fetchOldestAlbum(songs, ids));

					Promise.all(promises)
						.then(function () {
							res.json(out);
						});
				});
		});
	};
}());

