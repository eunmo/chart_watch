(function () {
	'use strict';
	
	module.exports = function (router, models) {
		router.get ('/chart/single/view/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));
			
			models.SingleChart.findAll({
				where: { type: chartName, week: date },
			})
			.then (function (charts) {
				var out = [];
				var rank;
				var order;
				var i, j;

				for (i in charts) {
					out.push(charts[i]);
				}

				out.sort(function (a, b) {
					return (a.rank === b.rank) ? a.order - b.order : a.rank - b.rank;
				});

				res.json (out);
			});
		});
	};
}());

