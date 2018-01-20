(function () {
	'use strict';

	var path = require('path');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);
	
	module.exports = function (router, models) {

		function addChartEntry (row, chartName, date) {
			models.AlbumChart.create({
				type: chartName,
				week: date,
				rank: row.rank,
				artist: row.artist,
				title: row.title
			});
		}

		router.get ('/chart/album/fetch/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));

			var dateStr = year + ' ' + month + ' ' + day;
			var execStr = 'perl ' + path.join(__dirname, '../../../../perl/album', chartName + '.pl') + ' ' + dateStr;
			
			models.AlbumChart.findAll ({
				where: { type: chartName, week: date },
			})
			.then(function (charts) {
				if (charts.length === 0) {
					exec(execStr)
					.spread(function (stdout, stderr) {
						var rawData = JSON.parse (stdout);

						if (rawData.length === 0) {
							res.sendStatus (200);
							return;
						}

						for (var i in rawData) {
							addChartEntry (rawData[i], chartName, date);
						}
							
						res.sendStatus (200);
					});
				}
				else {
					res.sendStatus (200);
				}
			});
		});
	};
}());

