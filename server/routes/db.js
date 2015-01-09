(function() {
	'use strict';

	module.exports = function (router, models) {
		router.get('/db/album', function(req, res) {
			models.Album.findAll().then(function(albums) {
				res.status(200).send(albums);
			});
		});

		router.get('/db/artist', function(req, res) {
			models.Artist.findAll().then(function(artists) {
				res.status(200).send(artists);
			});
		});

		router.get('/db/song', function(req, res) {
			models.Song.findAll().then(function(songs) {
				res.status(200).send(songs);
			});
		});

		router.get('/db/track', function(req, res) {
			models.Track.findAll().then(function(tracks) {
				res.status(200).send(tracks);
			});
		});
	};
}());
