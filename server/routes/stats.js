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
	};
}());
