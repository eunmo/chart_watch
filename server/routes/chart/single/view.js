(function () {
	'use strict';
	
	module.exports = function (router, _, db) {

		function getQuery(chart, date) {
			var query = 
				"SELECT `rank`, `order`, artist, title, SongId as id " +
				"  FROM SingleCharts " +
				" WHERE `type` = \'" + chart + "\' " +
				"   AND `week` = \'" + date.toISOString() + "\' "+
			  "	ORDER BY `rank`, `order`;";

			return query;
		}

		function getWeek(chart, date) {
			var query = getQuery(chart, date);

			return db.promisifyQuery(query);
		}

		router.get ('/chart/single/view/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));

			return getWeek(chartName, date)
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
		
		router.get ('/api/chart/single/view/full/:_chart/:_week', function (req, res) {
			var chartName = req.params._chart;
			var week = req.params._week;
			var [year, month, day] = week.split('-');
			var thisWeek = new Date (Date.UTC (year, month - 1, day));
			var lastWeek = new Date (Date.UTC (year, month - 1, day - 7));
			
			var query = getQuery(chartName, thisWeek);

			Promise.all([getWeek(chartName, thisWeek), getWeek(chartName, lastWeek)])
			.then(function ([thisWeekRows, lastWeekRows]) {
				var songs = [];
				var nonMatches = {};

				thisWeekRows.forEach(row => {
					if (row.id != null) {
						songs[row.id] = {id: row.id};
						delete row.artist;
						delete row.title;
					} else if (nonMatches[row.artist + row.title + row.order] === undefined)
						nonMatches[row.artist + row.title + row.order] = row;
				});

				lastWeekRows.forEach(row => {
					var id = row.id;
					if (id !== null && songs[id] !== undefined) {
						if (songs[id].lastWeek === undefined)
							songs[id].lastWeek = row.rank;
						else
							songs[id].lastWeek = Math.min(songs[id].lastWeek, row.rank);
					}

					if (id === null) {
						var nonMatch = nonMatches[row.artist + row.title + row.order];
						
						if (nonMatch !== undefined) {
							if (nonMatch.lastWeek === undefined)
								nonMatch.lastWeek = row.rank;
							else
								nonMatch.lastWeek = Math.min(nonMatch.lastWeek, row.rank);
						}
					}
				});

				var ids = songs.filter(a => a).map(a => a.id);

				var promises = [];

				promises.push(db.song.fetchDetails(songs, ids));
				promises.push(db.song.fetchArtists(songs, ids));
				promises.push(db.song.fetchOldestAlbum(songs, ids));
				promises.push(db.chartSummary.fetchSongsByType(songs, ids, chartName, thisWeek));

				return Promise.all(promises)
				.then(function() {
					res.json({
						thisWeek: thisWeekRows,
						songs: songs.filter(a => a),
					});
				});
			});
		});
	};
}());

