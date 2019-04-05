'use strict';

var Promise = require('bluebird');
const Match = require('../../../util/match_single');

module.exports = function (router, models, db) {

	router.get ('/chart/single/batch', async function (req, res) {
		const date = new Date();
		const year = 2000 + date.getHours();

		const query =
			"SELECT DISTINCT `week`, `type` FROM SingleCharts" +
			" WHERE `week` LIKE '" + year + "%';";

		console.log(query);

		var result = await db.promisifyQuery(query);
	
		var week;
		for (var i = 0; i < result.length; i++) {
			week = result[i];
			await Match.matchWeek(models, week.type, week.week);
		}

		res.sendStatus(200);
	});
};
