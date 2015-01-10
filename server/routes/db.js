(function() {
	'use strict';

	module.exports = function (router, models) {
		router.get('/db/album', function(req, res) {
			models.Album.findAll().then(function(albums) {
				res.status(200).send(albums);
			});
		});
		
		router.get('/db/albumArtist', function(req, res) {
			models.AlbumArtist.findAll().then(function(albumArtists) {
				res.status(200).send(albumArtists);
			});
		});
		
		router.get('/db/albumSong', function(req, res) {
			models.AlbumSong.findAll().then(function(albumSongs) {
				res.status(200).send(albumSongs);
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
		
		router.get('/db/songArtist', function(req, res) {
			models.SongArtist.findAll().then(function(songArtists) {
				res.status(200).send(songArtists);
			});
		});
	};
}());
