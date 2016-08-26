(function () {
	'use strict';
	
	module.exports = function (router, models) {
		router.get ('/chart/album/view/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));
			
			models.AlbumChart.findAll({
				where: { type: chartName, week: date },
			})
			.then (function (charts) {
				var out = [];
				var rank;

				for (var i in charts) {
					rank = charts[i].rank;
					out[rank - 1] = charts[i];
				}
				res.json (out);
			});
		});
	};
}());

