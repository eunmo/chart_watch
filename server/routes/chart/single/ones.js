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
					var weekMap = {};
					var songMap = {};
					var ids = [];
					var songs = out.songs;
					var i, row, id, week;

					for (var i in rows) {
						row = rows[i];
						id = row.id;
						if (id !== null && songMap[id] === undefined) {
							ids.push(id);
							songs.push({ id: id });
						}
						
						if (weekMap[row.week] === undefined) {
							weekMap[row.week] = { week: rows[i].week, songIds: [] };
						}
						week = weekMap[row.week];
						week.songIds[row.order] = id;
					}

					for (week in weekMap) {
						out.weeks.push(weekMap[week]);
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

