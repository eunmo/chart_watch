(function () {
	'use strict';

	var Promise = require('bluebird');

	module.exports = function (router, models) {
		router.put('/api/edit/artist', function (req, res) {
			var input = req.body;
			var id = input.id;

			models.Artist.findOne({
				where: { name: input.name, id: {ne: id} }
			}).then (function (artist) {
				console.log(artist);
				if (artist !== null) {
					id = artist.id;
					return models.AlbumArtist.update({
						ArtistId: id,
					},
					{ where: {ArtistId: input.id}
					})
					.then(function () {
						return models.SongArtist.update({
							ArtistId: id,
						},
						{ where: {ArtistId: input.id}
						});
					})
					.then(function () {
						return models.Artist.destroy({
							where: {id: input.id}
						});
					});
				} else {
					return models.Artist.update({
						name: input.name,
						nameNorm: input.nameNorm,
						origin: input.origin,
						type: input.type,
						gender: input.gender
					},
					{	where: { id: id }	});
				}
			}).then(function (array) {
				res.json(id);
			});
		});
		
		router.put('/api/edit/album', function (req, res) {
			var input = req.body;
			var id = input.id;

			models.Album.update({
				title: input.title,
				titleNorm: input.titleNorm,
				type: input.type
			},
			{ where: { id: id } })
			.then(function (array) {
				return models.AlbumArtist.findAll({
					where: { AlbumId: id }
				});
			})
			.then(function (albumArtistArray) {
				for (var i in albumArtistArray) {
					var albumArtistRow = albumArtistArray[i];
					if (albumArtistRow.order === 0) {
						res.json(albumArtistRow.ArtistId);
					}
				}
			});
		});
		
		router.put('/api/edit/song', function (req, res) {
			var input = req.body;
			var id = input.id;

			models.Song.update({
				title: input.title,
				titleNorm: input.titleNorm,
				plays: input.plays
			},
			{ where: { id: id } })
			.then(function (array) {
				return models.SongArtist.findAll({
					where: { SongId: id }
				});
			})
			.then(function (songArtistArray) {
				for (var i in songArtistArray) {
					var songArtistRow = songArtistArray[i];
					if (!songArtistRow.feat && songArtistRow.order === 0) {
						res.json(songArtistRow.ArtistId);
					}
				}
			});
		});

		router.put('/api/play/song', function (req, res) {
			var input = req.body;
			var id = input.id;
			var date = new Date();

			models.Song.findOne({
				where: {id: id}
			})
			.then(function (song) {
				song.increment('plays');
				song.setDataValue('lastPlayed', date);
				song.save();
				res.sendStatus(200);
			});
		});
	};
}());
