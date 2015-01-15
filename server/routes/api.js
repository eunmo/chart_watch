(function() {
	'use strict';
	
	var Promise = require('bluebird');

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
			var artist;
			var albums = [];
			var promises = [];

			// should also fetch artist object
			// should group by albums
			// -> albumArtist (id, name) array
			// -> song (id, title, time, track, [artist], [feat artist]) array

			promises[0] = models.Artist.findOne({where: {id: id} })
			.then(function(a) {
				artist = a.dataValues;
			});

			promises[1] = models.sequelize.query(sql)
			.then(function(rows) {
				var row;
				var album, song;
				for (var i in rows) {
					row = rows[i];

					// album
					if (albums[row.AlbumId] === undefined) {
						albums[row.AlbumId] = {
							id: row.AlbumId,
							title: row.albumTitle,
							release: row.release,
							albumArtists: [],
							songs: []
						};
					}
					album = albums[row.AlbumId];
					album.albumArtists[row.albumArtistOrder] = {
						id: row.albumArtistId,
						name: row.albumArtistName
					};

					// song
					if (album.songs[row.track] === undefined) {
						album.songs[row.track] = {
							id: row.SongId,
							title: row.songTitle,
							time: row.time,
							track: row.track,
							artists: [],
							features: []
						};
					}
					song = album.songs[row.track];

					// song artist
					if (row.feat === 0) {
						song.artists[row.songArtistOrder] = {
							id: row.songArtistId,
							name: row.songArtistName
						};
					} else {
						song.features[row.songArtistOrder] = {
							id: row.songArtistId,
							name: row.songArtistName
						};
					}
				}

				albums = albums.filter(function(n) { return n; });
				for (var i in albums) {
					album = albums[i];
					album.songs = album.songs.filter(function(n) { return n; });
				}
			});

			Promise.all(promises)
			.then(function() {
				if (artist !== null) {
					artist.albums = albums;
				}
				res.json(artist);
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
