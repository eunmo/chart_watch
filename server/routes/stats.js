(function () {
	'use strict';

	module.exports = function (router, models) {
		router.get('/stats/plays', function (req, res) {
			models.sequelize.query("Select plays, count(*) as count from Songs group by plays",
														 { type: models.sequelize.QueryTypes.SELECT })
			.then(function (plays) {
				res.json(plays);
			});
		});
		
		router.get('/stats/plays/title', function (req, res) {
			models.sequelize.query("Select plays, count(*) as count from Songs " +
														 "where id in (select SongId from SongCharts where rank < 8) " +
														 "group by plays",
														 { type: models.sequelize.QueryTypes.SELECT })
			.then(function (plays) {
				res.json(plays);
			});
		});
	};
}());
