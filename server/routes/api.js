(function() {
	'use strict';

	module.exports = function (router, models) {
		router.get('/api/music', function(req, res) {
			models.Song.findAll().then(function(songs) {
				res.json(songs);
			});
		});
		
		router.get('/api/artist', function(req, res) {
			models.Artist.findAll({
				include: [ {model: models.Album}, {model: models.Song} ],
				order: '`nameNorm`'
			}).then(function(artists) {
				res.json(artists);
			});
		});
		
		router.get('/api/artist/:_id', function(req, res) {
			var id = req.params._id;
			var sql = 'SELECT * FROM ViewAlbumIArtistISongIArtistI V ' +
								'WHERE V.AlbumArtistId = ' + id + ' ' +
								'OR V.SongArtistId = ' + id + ' ' +
								'ORDER BY V.release';

			// should also fetch artist object
			// should group by albums
			// -> albumArtist (id, name) array
			// -> song (id, title, time, track, [artist], [feat artist]) array

			models.sequelize.query(sql).success(function(data) {
				res.json(data);
			});
		});
		
		router.get('/api/initial/:_initial', function(req, res) {
			var initial = req.params._initial;
			var queryOption = {};

			if (initial.match(/[가나다라마바사아자차카타파하]/)) {
				// korean
				var krnInitials = '가나다라마바사아자차카타파하';
				var index = krnInitials.indexOf(initial);

				if (index < 13) {
					queryOption = { nameNorm: { gte: krnInitials[index], lt: krnInitials[index+1] } };
				} else {
					queryOption = { nameNorm: { gte: '하' } };
				}
			} else if (initial.match(/0-9/)) {
				// numbers
				queryOption = { nameNorm: { lt: 'a' } };
			} else {
				// alphabet
				queryOption = { nameNorm: { like: initial + '%'}};
			}

			models.Artist.findAll({ where: queryOption }).then(function(artists) {
				res.json(artists);
			});
		});
	};
}());
