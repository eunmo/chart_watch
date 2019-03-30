'use strict';

var path = require('path');
var Promise = require('bluebird');
var exec = Promise.promisify(require('child_process').exec);

module.exports = function (router, models, db) {

	router.get ('/chart/single/check', async function (req, res) {
		var current = await db.chartCurrent.getCurrentWeeks('SingleCharts');

		current.forEach(async function (chart) {
			const curWeek = new Date(chart.week);
			var nextWeek = new Date(chart.week);
			nextWeek.setDate(nextWeek.getUTCDate() + 7);
			
			const dateStr = nextWeek.toISOString().substr(0, 10).replace(/-/g, ' ');
			const execStr = 'perl ' + path.join(__dirname, '../../../../perl/single', chart.type + '.pl') + ' ' + dateStr;

			const [stdout, stderr] = await exec(execStr);
			const data = JSON.parse(stdout);

			if (data.length <= 10)
				return;

			var query = 
				"SELECT `rank`, artist, title " +
				"  FROM SingleCharts " +
				" WHERE `type` = \'" + chart.type + "\' " +
				"   AND `week` = \'" + curWeek.toISOString() + "\' " +
				"   AND `order` = 0" +
			  "	ORDER BY `rank`;";

			const curWeekRows = await db.promisifyQuery(query);

			if (curWeekRows.length !== data.length)
				return;

			var matches = true;

			data.forEach((row, index) => {
				const record = curWeekRows[index];
				if (row.artist !== record.artist ||
						row.titles[0] !== record.title)
					matches = false;
			});

			if (matches)
				return;

			data.forEach(row => {
				for (var i in row.titles) {
					models.SingleChart.create({
						type: chart.type,
						week: nextWeek,
						rank: row.rank,
						order: i,
						artist: row.artist,
						title: row.titles[i]
					});
				}
			});
		});

		res.sendStatus(200);
	});
}
