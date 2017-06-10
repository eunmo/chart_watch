(function () {
	'use strict';

	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var chartInitial = { gaon: 'g', melon: 'm', billboard: 'b', uk: 'u', oricon: 'o', deutsche: 'd',
		francais: 'f'};
	
	module.exports = function (router, models) {

		function addChartEntry (row, chartName, date) {
			var i;

			for (i in row.titles) {
				models.SingleChart.create({
					type: chartName,
					week: date,
					rank: row.rank,
					order: i,
					artist: row.artist,
					title: row.titles[i]
				});
			}
		}

		router.get ('/chart/single/fetch/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));
			
			var chartFile = path.resolve('chart/' + chartInitial[chartName]) + '.' + year +
											(month < 10 ? '.0' : '.') + month +
											(day < 10 ? '.0' : '.') + day;

			var dateStr = year + ' ' + month + ' ' + day;
			var execStr = 'perl ' + path.resolve ('perl/single/' + chartName + '.pl') + ' ' + dateStr;
			
			if (fs.existsSync(chartFile)) {
				execStr = 'cat ' + chartFile;
			}
			
			models.SingleChart.findAll ({
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

