(function () {
	'use strict';
	module.exports = function (router, models) {
		router.get('/api/edit/artist/:_id', function (req, res) {
			var id = req.params._id;
			models.Artist.findOne({
				where: {id: id},
				include: [
					{ model: models.Artist, as: 'Group' },
					{ model: models.Artist, as: 'Member' },
					{ model: models.Artist, as: 'B' },
					{ model: models.ArtistAlias }
				]
			}).then(function (artist) {
				res.json(artist);
			});
		});

		router.get('/api/edit/album/:_id', function (req, res) {
			var id = req.params._id;
			models.Album.findOne({
				where: {id: id},
				include: [
					{ model: models.Artist },
					{ model: models.Song },
					{ model: models.AlbumAlias }
				]
			}).then(function (album) {
				res.json(album);
			});
		});

		router.get('/api/edit/song/:_id', function (req, res) {
			var id = req.params._id;
			models.Song.findOne({
				where: {id: id},
				include: [
					{ model: models.Artist },
					{ model: models.SongAlias }
				]
			}).then(function (song) {
				res.json(song);
			});
		});
	};
}());
