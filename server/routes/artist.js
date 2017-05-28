(function () {
	'use strict';

	var Sequelize = require('sequelize');
	var Promise = require('bluebird');

	var songCmp = function (a, b) {
		if (a.disk === b.disk)
			return a.track - b.track;
		return a.disk - b.disk;
	};

	var findArtist = function (db, artist) {
		return db.artist.getRow(artist.id)
			.then(function (rows) {
				if (rows.length > 0) {
					var row = rows[0];
					artist.name = row.name;
					artist.gender = row.gender;
					artist.type = row.type;
					artist.origin = row.origin;
				}
			});
	};

	var findAs = function (db, artist) {
		return db.artist.getA(artist.id)
			.then(function (rows) {
				artist.As = rows;

				artist.ids = [artist.id];
				for (var i in rows) {
					artist.ids.push(rows[i].id);
				}
			});
	};

	var findBs = function (db, artist) {
		return db.artist.getBs([artist.id])
			.then(function (Bs) {
				artist.Bs = Bs[artist.id];
			});
	};

	var findAlbumsAndSongs = function (db, artist, maps) {
		return db.artist.getAlbumsAndSongs(artist.ids)
			.then(function (rows) {
				var i, j, row, album, song;
				var albumMap = {};

				for (i in rows) {
					row = rows[i];
					if (albumMap[row.AlbumId] === undefined) {
						albumMap[row.AlbumId] = { id: row.AlbumId, albumArtists: [], songs: [] };
					}

					song = {
						id: row.SongId,
						disk: row.disk,
						track: row.track,
						artists: [],
						features: []
					};
					albumMap[row.AlbumId].songs.push(song);
				}

				var albums = [];
				var albumIds = [];
				for (i in albumMap) {
					album = albumMap[i];
					album.songs.sort(songCmp);
					var songs = [album.songs[0]];
					var a, b;
					for (j = 1; j < album.songs.length; j++) {
						a = album.songs[j-1];
						b = album.songs[j];
						if (a.disk !== b.disk || a.track !== b.track)
							songs.push(b);
					}
					album.songs = songs;
					albums.push(album);
					albumIds.push(album.id);
				}

				var songMap = {};
				var songIds = [];
				for (i in albums) {
					for (j in albums[i].songs) {
						if (songMap[albums[i].songs[j].id] === undefined)
							songMap[albums[i].songs[j].id] = { id: albums[i].songs[j].id, songs: [] };
						songMap[albums[i].songs[j].id].songs.push(albums[i].songs[j]);
					}
				}

				for (i in songMap) {
					songIds.push(songMap[i].id);
				}

				artist.albums = albums;
				artist.albumIds = albumIds;
				artist.songIds = songIds;

				maps.albumMap = albumMap;
				maps.songMap = songMap;
			});
	};

	var findAlbumDetails = function (db, artist, maps) {
		db.album.getDetails(artist.albumIds)
			.then(function (rows) {
				var i, album, row;

				for (i in rows) {
					row = rows[i];
					album = maps.albumMap[row.id];
					album.title = row.title;
					album.format = row.format;
					album.release = row.release;
				}
			});
	};

	var findAlbumArtists = function (db, artist, maps) {
		return db.album.getArtists(artist.albumIds)
			.then(function (albumArtists) {
				for (var i in albumArtists) {
					maps.albumMap[i].albumArtists = albumArtists[i];
				}
			});
	};

	var findAlbumChartSummary = function (db, artist, maps) {
		return db.chartSummary.getAlbums(artist.albumIds)
			.then(function (charts) {
				for (var i in charts) {
					maps.albumMap[i].rank = charts[i];
				}
			});
	};
	
	var findSongDetails = function (db, artist, maps) {
		return db.song.getDetails(artist.songIds)
			.then(function (rows) {
				var i, j, row, songs, song;

				for (i in rows) {
					row = rows[i];
					songs = maps.songMap[row.id].songs;
					for (j in songs) {
						song = songs[j];
						song.title = row.title;
						song.plays = row.plays;
					}
				}
			});
	};

	var findSongArtists = function (db, artist, maps) {
		return db.song.getArtists(artist.songIds)
			.then(function (songArtists) {
				var i, j;
				for (i in songArtists) {
					for (j in maps.songMap[i].songs) {
						maps.songMap[i].songs[j].artists = songArtists[i].artists;
						maps.songMap[i].songs[j].features = songArtists[i].features;
					}
				}
			});
	};

	var findSongChartSummary = function (db, artist, maps) {
		return db.chartSummary.getSongs(artist.songIds)
			.then(function (charts) {
				var i, j, songs;
				for (i in charts) {
					songs = maps.songMap[i].songs;
					for (j in songs) {
						songs[j].rank = charts[i];
					}
				}
			});
	};

	var updateArtistMap = function (artistMap, artist) {
		if (artistMap[artist.id] === undefined) {
			artistMap[artist.id] = { id: artist.id, artists: [] };
		}
		artistMap[artist.id].artists.push(artist);
	};

	module.exports = function (router, models, db) {
		router.get('/api/artist/:_id', function (req, res) {
			var id = parseInt(req.params._id);
			var artist = { id: id };
			var maps = {};
			var promises = [];

			promises.push(findArtist(db, artist));
			promises.push(findAs(db, artist));
			promises.push(findBs(db, artist));
			
			Promise.all(promises)
				.then(function () {
					return findAlbumsAndSongs(db, artist, maps);
				})
				.then(function () {
					var promises = [];

					promises.push(findAlbumDetails(db, artist, maps));
					promises.push(findAlbumArtists(db, artist, maps));
					promises.push(findAlbumChartSummary(db, artist, maps));

					promises.push(findSongDetails(db, artist, maps));
					promises.push(findSongArtists(db, artist, maps));
					promises.push(findSongChartSummary(db, artist, maps));

					return Promise.all(promises)
						.then(function () {
							res.json(artist);
						});
				});
		});
	};
}());
