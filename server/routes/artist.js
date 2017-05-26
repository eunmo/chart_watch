(function () {
	'use strict';

	var common = require('../common/cwcommon.js');	
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
		return db.album.getAlbumArtists(artist.albumIds)
			.then(function (rows) {
				var i, album, row;

				for (i in rows) {
					row = rows[i];
					album = maps.albumMap[row.AlbumId];
					album.albumArtists[row.order] = {
						id: row.ArtistId,
						name: row.name,
						order: row.order
					};
				}
			});
	};

	var findAlbumChartSummary = function (db, artist, maps) {
		return db.albumChartSummaryByIds(artist.albumIds)
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
		return db.song.getSongArtists(artist.songIds)
			.then(function (rows) {
				var i, j, row, songs, song, songArtist;

				for (i in rows) {
					row = rows[i];
					songs = maps.songMap[row.SongId].songs;
					songArtist = {
						id: row.ArtistId,
						name: row.name,
						order: row.order
					};
					for (j in songs) {
						song = songs[j];
						if (row.feat) {
							song.features[row.order] = songArtist;
						} else {
							song.artists[row.order] = songArtist;
						}
					}
				}
			});
	};

	var findSongChartSummary = function (db, artist, maps) {
		return db.songChartSummaryByIds(artist.songIds)
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

	var findBs = function (db, artist, maps) {
		var map = {};
		var i, j, k, album, song;

		updateArtistMap(map, artist);
		for (i in artist.albums) {
			album = artist.albums[i];

			for (k in album.albumArtists) {
				updateArtistMap(map, album.albumArtists[k]);
			}

			for (j in album.songs) {
				song = album.songs[j];

				for (k in song.artists) {
					updateArtistMap(map, song.artists[k]);
				}

				for (k in song.features) {
					updateArtistMap(map, song.features[k]);
				}
			}
		}

		var artistIds = [];
		for (i in map) {
			artistIds.push(map[i].id);
			map[i].Bs = {};
			map[i].found = false;
		}

		return db.artist.getB(artistIds)
			.then(function (rows) {
				var i, j, row, artists, elem, type, b;
				for (i in rows) {
					row = rows[i];
					elem = map[row.a];
					elem.found = true;
					artists = map[row.a].artists;
					type = row.type;
					b = { id: row.b, name: row.name };

					if (row.type !== 'p') {
						elem.Bs[type] = b;
					} else if (row.order !== undefined) {	// project group needs an order.
						if (elem.Bs[type] === undefined) {
							elem.Bs[type] = [];
						}
						elem.Bs[type][row.order] = b;
					}
				}

				for (i in map) {
					elem = map[i];
					artists = elem.artists;

					if (elem.found === false)
						continue;

					for (j in artists) {
						artists[j].Bs = elem.Bs;
					}
				}
			});
	};

	module.exports = function (router, models, db) {
		router.get('/api/artist/:_id', function (req, res) {
			var id = parseInt(req.params._id);
			var artist = { id: id };
			var maps = {};
			var promises = [];

			promises.push(findArtist(db, artist));
			promises.push(findAs(db, artist));
			
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

					return Promise.all(promises);
				})
				.then(function () {
					return findBs(db, artist, maps);
				})
				.then(function () {
					res.json(artist);
				});
		});
	};
}());
