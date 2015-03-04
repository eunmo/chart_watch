(function () {
	'use strict';
	
	var Sequelize = require('sequelize');
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

	var getPrimaryGroup = function (artist) {
		var primaryGroup = null;
		for (var i in artist.Group) {
			var group = artist.Group[i];
			if (group.ArtistGroup.primary) {
				primaryGroup = {
					name: group.name,
					id: group.id
				};
				break;
			}
		}
		return primaryGroup;
	};

	var createAlbum = function (albumRow) {
		var i;
		var artistRow;
		var album = { 
			id: albumRow.id,
			title: albumRow.title,
			type: albumRow.type,
			release: albumRow.release,
			albumArtists: [],
			songs: []
		};

		for (i in albumRow.Artists) {
			artistRow = albumRow.Artists[i];
			album.albumArtists.push({
				id: artistRow.id,
				name: artistRow.name,
				order: artistRow.AlbumArtist.order,
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
			plays: songRow.plays,
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
				order: artistRow.SongArtist.order,
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

	var markFeat = function (result, albums) {
		var hasFeat = false;
		var albumFeatCount;
		var album, song, artist;
		var i, j, k;

		for (i in albums) {
			album = albums[i];
			album.isFeat = false;
			albumFeatCount = 0;

			for (j in album.songs) {
				song = album.songs[j];
				song.isFeat = false;

				for (k in song.features) {
					artist = song.features[k];

					if (artist.id === result.id) {
						song.isFeat = true;
						hasFeat = true;
						albumFeatCount++;
					}
				}
			}

			if (album.songs.length === albumFeatCount) {
				album.isFeat = true;
			}
		}

		return hasFeat;
	};

	var getMembership = function (models, id, results, index) {
			return models.Artist.findOne({
				where: {id: id},
				include: [
					{ model: models.Artist, as: 'Group', attributes: [ 'id', 'name' ] },
					{ model: models.Artist, as: 'Member', attributes: [ 'id', 'name' ] },
				]
			}).then(function (result) {
				results[index] = result;
			});
	};

	var getAlbumSongs = function (models, id, results, index) {
			return models.Artist.findOne({
				where: {id: id},
				include: [
					{ model: models.Album, include: [
						{ model: models.Artist, attributes: [ 'id', 'name' ] },
						{ model: models.Song, include: [
							{ model: models.Artist, attributes: [ 'id', 'name' ] }
						]}
					]}
				]
			}).then(function (result) {
				results[index] = result;
			});
	};

	var getSongAlbums = function (models, id, results, index) {
			return models.Artist.findOne({
				where: {id: id},
				include: [
					{ model: models.Song, include: [
						{ model: models.Artist, attributes: [ 'id', 'name' ] },
						{ model: models.Album, include: [
							{ model: models.Artist, attributes: [ 'id', 'name' ] }
						]}
					]}
				]
			}).then(function (result) {
				results[index] = result;
			});
	};

	var getArtistArray = function (models, artist) {
		var array = [];
		var idArray = [];
		var i, j, k;
		var album, albumArtist, song, songArtist;
		var primaryGroup;

		array[artist.id] = [];
		array[artist.id].push(artist);

		for (i in artist.albums) {
			album = artist.albums[i];
			for (k in album.albumArtists) {
				albumArtist = album.albumArtists[k];
				if (array[albumArtist.id] === undefined) {
					array[albumArtist.id] = [];
				}
				array[albumArtist.id].push(albumArtist);
			}

			for (j in album.songs) {
				song = album.songs[j];
				for (k in song.artists) {
					songArtist = song.artists[k];
					if (array[songArtist.id] === undefined) {
						array[songArtist.id] = [];
					}
					array[songArtist.id].push(songArtist);
				}

				for (k in song.features) {
					songArtist = song.features[k];
					if (array[songArtist.id] === undefined) {
						array[songArtist.id] = [];
					}
					array[songArtist.id].push(songArtist);
				}
			}
		}

		for (i in array) {
			idArray.push(i);
		}

		return models.Artist.findAll({
			where: { id: { $in: idArray } },
			include: [{ model: models.Artist, as: 'Group' }]
		}).then(function (results) {
			for (i in results) {
				primaryGroup = getPrimaryGroup(results[i]);
				if (primaryGroup !== null) {
					for (j in array[results[i].id]) {
						array[results[i].id][j].primaryGroup = primaryGroup;
					}
				}
			}
		});
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
			var promises = [];
			var results = [];
			var artist;

			promises[0] = getMembership(models, id, results, 0);
			promises[1] = getAlbumSongs(models, id, results, 1);
			promises[2] = getSongAlbums(models, id, results, 2);

			Promise.all(promises)
			.then(function (result) {
				var albums = extractAlbums(results[1]);
				getOtherAlbums(results[2], albums);
				var hasFeat = markFeat(results[0], albums);
				artist = {
					name: results[0].name,
					id: id,
					gender: results[0].gender,
					type: results[0].type,
					origin: results[0].origin,
					groups: results[0].Group,
					members: results[0].Member,
					albums: albums,
					hasFeat: hasFeat
				};

				promises = [];

				promises.push(getArtistArray(models, artist));

				return Promise.all(promises);
			})
			.then(function () {
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

			models.Artist.findAll({
				where: queryOption,
				include: [
					{ model: models.Artist, as: 'Group' },
					{ model: models.Artist, as: 'Member' },
					{ model: models.Album },
					{ model: models.Song }
				]
		 	}).then(function (artists) {
				res.json(artists);
			});
		});

		router.get('/api/shuffle', function (req, res) {
			models.Song.findAll({
				include: [
					{ model: models.Album },
					{ model: models.Artist }
				]
			}).then(function (result) {
				res.json(result);
			});
		});
	};
}());
