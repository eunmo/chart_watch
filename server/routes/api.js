(function () {
	'use strict';

	var common = require('../common/cwcommon.js');	
	var Sequelize = require('sequelize');
	var Promise = require('bluebird');

	var artistCmpId = function (a, b) {
		return a.id - b.id;
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
			else
				song.artists.sort(common.artistCmpOrder);
		} else {
			song.artists.sort(common.artistCmpOrder);
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
		var song = common.newSong(songRow);
		song.disk = albumSong.disk;
		song.track = albumSong.track;

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

		song.features.sort(common.artistCmpOrder);
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

			album.albumArtists.sort(common.artistCmpOrder);
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
					album.albumArtists.sort(common.artistCmpOrder);
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

	var getArtistGroup = function (models, artist) {
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

	var getSongChart = function (models, artist) {
		var array = [];
		var idArray = [];
		var rankArray = [];
		var i, j, k;
		var album, song, chartRow, songId;

		for (i in artist.albums) {
			album = artist.albums[i];
			for (j in album.songs) {
				song = album.songs[j];
				if (array[song.id] === undefined) {
					array[song.id] = [];
				}
				array[song.id].push(song);
			}
		}

		for (i in array) {
			idArray.push(i);
		}

		return models.SongChart.findAll({
			where: { SongId: { $in: idArray }, rank: { $lte: 10 } }
		}).then(function (results) {
			for (i in results) {
				chartRow = results[i];
				songId = chartRow.SongId;
				if (rankArray[songId] === undefined) {
					rankArray[songId] = {};
				}
				if (rankArray[songId][chartRow.type] === undefined) {
					rankArray[songId][chartRow.type] = {
						min: chartRow.rank,
						run: 0,
						count: 1
					};
				} else if (chartRow.rank < rankArray[songId][chartRow.type].min) {
					rankArray[songId][chartRow.type].min = chartRow.rank;
					rankArray[songId][chartRow.type].run += rankArray[songId][chartRow.type].count;
					rankArray[songId][chartRow.type].count = 1;
				} else if (chartRow.rank === rankArray[songId][chartRow.type].min) {
					rankArray[songId][chartRow.type].count++;
				} else {
					rankArray[songId][chartRow.type].run++;
				}
			}

			for (i in rankArray) {
				for (j in array[i]) {
					array[i][j].rank = rankArray[i];
				}
			}
		});
	};

	var getPrimaryGroupSummary = function (models, artists, ids) {
		var query = "SELECT MemberId, GroupId, name " + 
								"FROM ArtistGroups g, Artists a " +
								"WHERE g.MemberId in (" + ids.toString() + ") " +
								"AND g.GroupId = a.id " + 
								"AND g.primary = true;";
		return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
		.then(function (rows) {
			var i, primary, id, type;

			for (i in rows) {
				primary = rows[i];
				artists[primary.MemberId].primaryGroup = {
					id: primary.GroupId,
					name: primary.name
				};
			}
		});
	};

	var getAlbumSummary = function (models, artists, ids) {
		var query = "SELECT ArtistId, `type`, count(*) AS count, max(a.id) As AlbumId " +
								"FROM AlbumArtists aa, Albums a " +
								"WHERE aa.ArtistId in (" + ids.toString() + ") " + 
								"AND aa.AlbumId = a.id " + 
								"GROUP BY aa.ArtistId, a.`type`";
		return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
		.then(function (rows) {
			var i, albumCount, id, type;

			for (i in rows) {
				albumCount = rows[i];
				id = albumCount.ArtistId;
				type = albumCount.type;
				if (type) {
					artists[id].albums[type] = albumCount.count;
					artists[id].maxAlbum = Math.max(artists[id].maxAlbum, albumCount.AlbumId);
				}
			}
		});
	};

	var getSongSummary = function (models, artists, ids) {
		var idString = ids.toString();
		var query = "SELECT ArtistId, feat, IFNULL (rank, 0) AS rank, count(*) AS count " +
								"FROM (" +
											 "SELECT ArtistId, feat, sa.SongId, IF (min(rank) <= 10, min(rank), NULL) AS rank " +
											 "FROM SongArtists sa LEFT JOIN SongCharts sc " +
											 "ON sa.SongId = sc.SongId " +
											 "WHERE sa.ArtistId in (" + ids.toString() + ") " +
											 "AND sc.order = 0 " + 
											 "GROUP BY ArtistId, SongId) a " + 
								"GROUP BY ArtistId, feat, rank;";
		return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT })
		.then(function (rows) {
			var i, songCount, id, feat;

			for (i in rows) {
				songCount = rows[i];
				id = songCount.ArtistId;
				if (songCount.feat) {
					artists[id].feats[songCount.rank] = songCount.count;
				} else {
					artists[id].songs[songCount.rank] = songCount.count;
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

				promises.push(getArtistGroup(models, artist));
				if (albums.length > 0)
					promises.push(getSongChart(models, artist));

				return Promise.all(promises);
			})
			.then(function () {
				res.json(artist);
			});
		});


		
		router.get('/api/initial/:_initial', function (req, res) {
			var initial = req.params._initial;
			var queryOption = {};
			var artists = [];
			var promises = [];

			var query = "SELECT id, name, nameNorm, origin, type, gender " +
									"FROM Artists " +
									"WHERE ";

			if (initial.match(/[가나다라마바사아자차카타파하]/)) {
				// korean
				var krnInitials = '가나다라마바사아자차카타파하';
				var index = krnInitials.indexOf(initial);

				query += "nameNorm >= '" + krnInitials[index] + "' ";

				if (index < 13) {
					query += "AND nameNorm < '" + krnInitials[index+1] + "' ";
				}
			} else if (initial.match(/0-9/)) {
				// numbers
				query += "nameNorm < 'a' ";
			} else {
				// alphabet
				query += "nameNorm like '" + initial + "%' ";
			}

			return models.sequelize.query(query + ';', { type: models.sequelize.QueryTypes.SELECT })
		 	.then(function (rows) {
				var ids = [];
				var artist, i, id;

				for (i in rows) {
					artist = rows[i];
					id = artist.id;
					ids.push(id);
					artists[id] = {
						id: id,
						name: artist.name,
						nameNorm: artist.nameNorm,
						origin: artist.origin,
						type: artist.type,
						gender: artist.gender,
						maxAlbum: 0,
						albums: {},
						songs: [],
						feats: []
					};
				}

				promises.push(getPrimaryGroupSummary(models, artists, ids));
				promises.push(getAlbumSummary(models, artists, ids));
				promises.push(getSongSummary(models, artists, ids));

				return Promise.all(promises);
		 	}).then(function () {
				var result = [];

				for (var i in artists) {
					result.push(artists[i]);
				}

				res.json(result);
			});
		});

		router.get('/api/shuffle', function (req, res) {
			var promises = [];
			var songs, albums, artists;
			var albumSongs, songArtists, artistGroups, songCharts;

			promises.push(models.Song.findAll()
										.then(function (result) { songs = result; }));
			promises.push(models.Artist.findAll()
										.then(function (result) { artists = result; }));
			promises.push(models.AlbumSong.findAll()
										.then(function (result) { albumSongs = result; }));
			promises.push(models.SongArtist.findAll({ where: { feat: false } })
										.then(function (result) { songArtists = result; }));
			promises.push(models.ArtistGroup.findAll({ where: { primary: true } } )
										.then(function (result) { artistGroups = result; }));
			promises.push(models.SongChart.findAll({ where: { rank: { lte: 10 } } })
										.then(function (result) { songCharts = result; }));
			Promise.all(promises)
			.then(function () {
				var songArray = [];
				var lastPlayed = [];
				var plays = [];
				var rank = [];
				var rankMax = [];
				var resArray = [];
				var artistArray = [];
				var i;
				var row;
				var songId, artistId;

				for (i in songs) {
					row = songs[i];
					songId = row.id;
					songArray[songId] = {
						id: row.id,
						title: row.title,
						plays: row.plays,
						artists: []
					};
					plays[songId] = row.plays;
					if (row.lastPlayed === null) {
						lastPlayed[songId] = true;
					}
				}

				for (i in artists) {
					row = artists[i];
					artistArray[row.id] = {
						id: row.id,
						name: row.name
					};
				}

				for (i in artistGroups) {
					row = artistGroups[i];
					artistArray[row.MemberId].primaryGroup = artistArray[row.GroupId];
				}

				for (i in albumSongs) {
					row = albumSongs[i];
					songId = row.SongId;
					if (songArray[songId].albumId === undefined) {
						songArray[songId].albumId = row.AlbumId;
					}
				}

				for (i in songArtists) {
					row = songArtists[i];
					songId = row.SongId;
					artistId = row.ArtistId;
					songArray[songId].artists[row.order] = artistArray[artistId];
				}

				for (i in songCharts) {
					row = songCharts[i];
					songId = row.SongId;
					rank[songId] = true;
					if (rankMax[songId] === undefined || rankMax[songId] > row.rank) {
						rankMax[songId] = row.rank;
					}
				}

				for (i in songArray) {
					songId = songArray[i].id;
					if (rankMax[songId])
						songArray[i].rank = rankMax[songId];
					if (songArray[i].plays > 0)
						resArray.push(songArray[i]);
				}

				res.json(resArray);
			});
		});
	};
}());
