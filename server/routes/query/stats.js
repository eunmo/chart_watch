(function () {
	'use strict';
	
	module.exports = function (router, models) {
		router.get('/stats/plays-by-song', function (req, res) {
			var queryString =
				"SELECT plays, rank, count(*) as count " +
				"FROM Songs " +
				"LEFT JOIN (SELECT SongId, min(rank) as rank " +
									 "FROM SongCharts " +
									 "WHERE rank <= 10  " +
									 "GROUP BY SongId) Charts " +
				"ON Songs.id = Charts.SongId " +
				"GROUP BY plays, rank";

			models.sequelize.query(queryString, { type: models.sequelize.QueryTypes.SELECT })
			.then(function (plays) {
				res.json(plays);
			});
		});
		
		router.get('/stats/plays-by-album', function (req, res) {
			var queryString =
				"SELECT plays, rank, count(*) as count " +
				"FROM Songs " +
				"LEFT JOIN (SELECT SongId, min(rank) as rank " +
									 "FROM AlbumSongs a, AlbumCharts b " +
									 "WHERE a.AlbumId = b.AlbumId  " +
									 "AND rank <= 10  " +
									 "GROUP BY SongId) Charts " +
				"ON Songs.id = Charts.SongId " +
				"GROUP BY plays, rank";

			models.sequelize.query(queryString, { type: models.sequelize.QueryTypes.SELECT })
			.then(function (plays) {
				res.json(plays);
			});
		});
	};
}());
