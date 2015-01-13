(function() {
	'use strict';

	module.exports = function (router, models) {
		router.get('/api/music', function(req, res) {
			models.Song.findAll().then(function(songs) {
				res.json(songs);
			});
		});
		
		router.get('/api/artist', function(req, res) {
			models.Artist.findAll({order: '`nameNorm`'}).then(function(artists) {
				res.json(artists);
			});
		});
	};
}());
