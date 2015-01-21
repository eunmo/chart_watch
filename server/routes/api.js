(function () {
	'use strict';
	
	var Promise = require('bluebird');

	var artistCmpId = function (a, b) {
		return a.id - b.id;
	};

	var artistCmpOrder = function (a, b) {
		return a.order - b.order;
	};

	var songCmp = function (a, b) {
		if (a.disk === b.disk)
			return a.track - b.track;
		return a.disk - b.disk;
	};

	var removeDuplicateArtistOrSort = function (album, song) {
		var i, match = true;

		if (album.albumArtists.length === song.artists.length) {

			for (i in album.albumArtists) {
				if (album.albumArtists[i].id !== song.artists[i].id) {
					match = false;
					break;
				}
			}

			if (match)
				delete song.artists;
		} else {
			song.artists.sort(artistCmpOrder);
		}
	};

	var findSongInAlbums = function (id, albums) {
		var album;
		var i, j;

		for (i in albums) {
			album = albums[i];
			
			for (j in album.songs) {
				if (id === album.songs[j].id) {
					return true;
				}
			}
		}

		return false;
	};

	var findAlbumInAlbums = function (id, albums) {
		var i;

		for (i in albums) {
			if (albums[i].id === id)
				return albums[i];
		}

		return null;
	};

	var createAlbum = function (albumRow) {
		var i;
		var artistRow;
		var album = { 
			id: albumRow.id,
			title: albumRow.title,
			release: albumRow.release,
			albumArtists: [],
			songs: []
		};

		for (i in albumRow.Artists) {
			artistRow = albumRow.Artists[i];
			album.albumArtists.push({
				id: artistRow.id,
				name: artistRow.name,
				order: artistRow.order
			});
		}

		album.albumArtists.sort(artistCmpId);

		return album;
	};

	var createSong = function (songRow, albumSong, album) {
		var i;
		var artistRow;
		var songArtist;
		var song = {
			id: songRow.id,
			title: songRow.title,
			time: songRow.time,
			disk: albumSong.disk,
			track: albumSong.track,
			artists: [],
			features: []
		};

		for (i in songRow.Artists) {
			artistRow = songRow.Artists[i];
			songArtist = {
				id: artistRow.id,
				name: artistRow.name,
				order: artistRow.SongArtist.order
			};
			if (artistRow.SongArtist.feat) {
				song.features.push(songArtist);
			} else {
				song.artists.push(songArtist);
			}
		}

		song.features.sort(artistCmpOrder);
		removeDuplicateArtistOrSort(album, song);
		album.songs.push(song);
	};
	
	var extractAlbums = function (result) {
		var albums = [];
		var albumRow, songRow;
		var album;
		var i, j;

		for (i in result.Albums) {
			albumRow = result.Albums[i];
			album = createAlbum(albumRow);

			for (j in albumRow.Songs) {
				songRow = albumRow.Songs[j];
				createSong(songRow, songRow.AlbumSong, album);
			}

			album.albumArtists.sort(artistCmpOrder);
			album.songs.sort(songCmp);
			albums.push(album);
		}

		return albums;
	};

	var getOtherAlbums = function (result, albums) {
		var songRow, albumRow;
		var album;
		var i, j;

		for (i in result.Songs) {
			songRow = result.Songs[i];
			
			if (!findSongInAlbums(songRow.id, albums)) {
				for (j in songRow.Albums) {
					albumRow = songRow.Albums[j];
					album = findAlbumInAlbums(albumRow.id, albums);
					if (album === null) {
						album = createAlbum(albumRow);
						albums.push(album);
					}
					album.albumArtists.sort(artistCmpId);
					createSong(songRow, albumRow.AlbumSong, album);
					album.albumArtists.sort(artistCmpOrder);
					album.songs.sort(songCmp);
				}
			}
		}
	};

	module.exports = function (router, models) {
		router.get('/api/artist', function (req, res) {
			models.Artist.findAll({
				include: [ {model: models.Album}, {model: models.Song} ],
				order: '`nameNorm`'
			}).then(function (artists) {
				res.json(artists);
			});
		});

		router.get('/api/artist/:_id', function (req, res) {
			var id = req.params._id;
			models.Artist.findOne({
				where: {id: id},
				include: [
					{ model: models.Album, include: [
						{ model: models.Artist},
						{ model: models.Song, include: [
							{ model: models.Artist }
						]}
					]},
					{ model: models.Song, include: [
						{ model: models.Artist },
						{ model: models.Album, include: [
							{ model: models.Artist }
						]}
					]}
				]
			}).then(function (result) {
				var artist = { name: result.name };
				var albums = extractAlbums(result);
				getOtherAlbums(result, albums);
				artist.albums = albums;
				res.json(artist);
			});
		});
		
		router.get('/api/initial/:_initial', function (req, res) {
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

			models.Artist.findAll({ where: queryOption }).then(function (artists) {
				res.json(artists);
			});
		});
	};
}());
