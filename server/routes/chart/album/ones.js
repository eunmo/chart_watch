(function () {
	'use strict';
	
	module.exports = function (router, _, db) {

		function formatResult(rows, res) {
			var weekMap = {};
			var albumMap = {};
			var ids = [];
			var i, row, id, week;
			
			var out = { weeks: [], albums: [] };
			var albums = out.albums;

			for (var i in rows) {
				row = rows[i];
				id = row.id;
				if (id !== null && albumMap[id] === undefined) {
					ids.push(id);
					albums.push({ id: id });
					albumMap[id] = true;
				}

				weekMap[row.week] = { week: rows[i].week, albumIds: id };
			}

			for (week in weekMap) {
				out.weeks.push(weekMap[week]);
			}

			var promises = [];
			promises.push(db.album.fetchDetails(albums, ids));
			promises.push(db.album.fetchArtists(albums, ids));

			Promise.all(promises)
				.then(function () {
					res.json(out);
				});
		}

		router.get ('/api/chart/album/ones/:_chart/:_year', function (req, res) {
			var chartName = req.params._chart;
			var year = req.params._year;

			var query =
				"SELECT `week`, artist, title, AlbumId as id " +
				"  FROM AlbumCharts " +
				" WHERE `type` = \'" + chartName + "\' " +
				"   AND `rank` = 1 " +
				"   AND YEAR(`week`) = " + year +
				" ORDER BY `week` DESC";
			
			db.promisifyQuery(query)
				.then(function (rows) {
					return formatResult(rows, res);
				});
		});
	};
}());

