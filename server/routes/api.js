(function() {
	'use strict';

	module.exports = function (router, models) {
		router.get('/api/music', function(req, res) {
			models.Song.findAll().then(function(songs) {
				res.json(songs);
			});
		});
	};
}());
