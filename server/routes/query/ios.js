(function () {
	'use strict';

	var common = require('../../common/cwcommon');
	var Promise = require('bluebird');
	
	var charts = ['billboard', 'oricon', 'deutsche', 'uk', 'francais', 'melon', 'gaon'];

	module.exports = function (router, models) {

		function pushSong (id, plays, lastPlayed) {
			return models.Song.findOne({
				where: { id: id }
			})
			.then(function (song) {
				if (song.lastPlayed < lastPlayed) {
					song.setDataValue('plays', plays);
					song.setDataValue('lastPlayed', lastPlayed);
					song.save();
				}
			});
		}

		router.put('/api/ios/push', function (req, res) {
			var input = req.body;
			var promises = [];
			var i, song;

			for (i in input) {
				song = input[i];

				var lastPlayed = new Date(song.lastPlayed);
				promises.push(pushSong(song.id, song.plays, lastPlayed));
			}
			
			Promise.all(promises)
			.then(function () {
				res.sendStatus(200);
			});
		});

		function pullSong (id, i, results) {
			return models.Song.findOne({
				where: { id: id }
			})
			.then(function (song) {
				results[i] =
					{ id: id, plays: song.plays };
			});
		}
		
		router.put('/api/ios/pull', function (req, res) {
			var input = req.body;
			var promises = [];
			var results = [];
			var i;

			for (i in input) {
				var id = input[i];

				promises.push(pullSong(id, i, results));
			}
			
			Promise.all(promises)
			.then(function () {
				res.json(results);
			});
		});
		
		function getMaxDate (type, dates) {
			return models.SongChart.max('week', { where: { type: type } } )
			.success(function (row) {
				dates[type] = row;
			});
		}

		function getCurrentSongs (type, dates, songs, index) {
			return models.SongChart.findAll({
				where: { type: type, week: dates[type], rank: { lte: 10 } },
				include: [
					{ model: models.Song,
						include: [
							{ model: models.Album },
							{ model: models.Artist }
						]
					}
				]
			})
			.then(function (charts) {
				songs[index] = charts;
			});
		}

		function getSortedCurrentSongs () {
			var datePromises = [];
			var dates = {};
			var songPromises = [];
			var songs = [];
			var songArray = [];
			var i;

			for (i in charts)
				datePromises.push(getMaxDate(charts[i], dates));

			return Promise.all(datePromises)
			.then(function () {

				for (i in charts)
					songPromises.push(getCurrentSongs(charts[i], dates, songs, i));

				return Promise.all(songPromises);
			})
			.then(function () {
				var idArray = [];
				var rankArray = [];
				var row, rank, song, i, j;
				var chartRow, songId;

				for (i in songs) {
					for (j in songs[i]) {
						row = songs[i][j];
						rank = row.rank;
						song = row.Song;
						if (songArray[song.id] === undefined) {
							var newSong = common.newSong(song);
							newSong.curRank = [rank];
							newSong.order = row.order;
							newSong.songArtists = common.getSongArtists(song);
							newSong.albumId = song.Albums[0].id;
							songArray[song.id] = newSong;
						} else {
							songArray[song.id].curRank.push(rank);
							songArray[song.id].curRank.sort(function (a,b) {return a-b;});
						}
						songArray[song.id][charts[i]] = { min: rank, count: 1 };
					}
				}

				for (i in songArray) {
					for (j in charts) {
						if (songArray[i][charts[j]] !== undefined &&
								songArray[i][charts[j]].min === songArray[i].curRank[0]) {
							songArray[i].chart = Number(j);
							break;
						}
					}
				}

				for (i in songArray) {
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
						songArray[i].rank = rankArray[i];
					}
				});
			})
		.then(function () {
				var sendArray = [];
				var row, rank, song, i, j;

				for (i in songArray) {
					song = songArray[i];
					if (song.curRank[0] <= 5 || song.plays <= 10)
						sendArray.push(song);
				}

				var rankCmp = function (a, b) {
					var minSize = Math.min(a.curRank.length, b.curRank.length);
					for (i = 0; i < minSize; i++) {
						if (a.curRank[i] !== b.curRank[i])
							return a.curRank[i] - b.curRank[i];
					}

					if (a.curRank.length === b.curRank.length) {
						if (a.chart === b.chart) {
							return a.order - b.order;
						}
						return a.chart - b.chart;
					}

					return b.curRank.length - a.curRank.length;
				};

				sendArray.sort(rankCmp);

				return sendArray;
			});
		}

		function idToSongs (songIds) {
			var ids = [];

			for (var i in songIds) {
				ids.push(songIds[i].id);
			}

			return models.Song.findAll({
				where: { id: { in: ids } },
						 include: [
			{ model: models.Album },
						 { model: models.Artist }
							 ]
			}).then(function (songs) {
				var resArray = [];
				var song, songRow;

				for (i in songs) {
					songRow = songs[i];
					song = common.newSong(songRow);
					song.songArtists = common.getSongArtists(songRow);
					songRow.Albums.sort(function (a, b) { return a.release - b.release; });
					song.albumId = songRow.Albums[0].id;
					resArray.push(song);
				}

				return resArray;
			});
		}

		function getCharted (count) {
			var queryString =
				"SELECT distinct SongId as id " +
				"FROM Songs s, SongCharts c " +
				"WHERE s.id = c.SongId and rank <= 10 and plays < 10 " +
				"ORDER BY SongId " +
				"LIMIT " + count;
			return models.sequelize.query(queryString, { type: models.sequelize.QueryTypes.SELECT 
			}).then( function (ids) {
				return idToSongs(ids);
			});
		}
		
		function getUncharted (count) {
			var queryString =
				"SELECT id " +
				"FROM Songs " +
				"WHERE plays < 3 " +
				"ORDER BY id " +
				"LIMIT " + count;
			return models.sequelize.query(queryString, { type: models.sequelize.QueryTypes.SELECT 
			}).then( function (ids) {
				return idToSongs(ids);
			});
		}

		function getSeasonal (limit) {
			var weeks = common.getSeasonalWeeks(new Date());
			var queryString =
				"SELECT week, SongId " +
				"FROM SongCharts " +
				"WHERE rank <= " + limit + " " +
				"AND week IN (" + weeks + ") " +
				"ORDER BY week DESC, rank DESC, SongId";
			return models.sequelize.query(queryString, { type: models.sequelize.QueryTypes.SELECT 
			}).then( function (results) {
				var ids = [];
				var idMap = [];

				for (var i in results) {
					var id = results[i].SongId;
					if (idMap[id] === undefined) {
						ids.push({id: results[i].SongId});
						idMap[id] = i;
					}
				}
				
				return idToSongs(ids)
				.then( function (array) {
					var resArray = [];
					
					for (var i in results) {
						var songId = results[i].SongId;
						if (idMap[songId] === i) {
							for (var j in array) {
								var song = array[j];

								if (song.id === songId) {
									song.week = results[i].week;
									resArray.push(song);
								}
							}
						}
					}	
				  
					return resArray;
				});
			});
		}

		function getCurrentAlbums () {
			var query = "SELECT id FROM (";
			var songIds;

			for (var i in charts) {
				var chart = charts[i];
				if (i > 0)
					query += " UNION ";
				query += "SELECT SongId as id, AlbumId, disk, track FROM AlbumSongs";
				query += " WHERE AlbumId in (SELECT AlbumId FROM AlbumCharts";
				query +=                  " WHERE rank <= 5 and type = \"" +  chart + "\"";
				query +=                  " AND week = (SELECT max(week) FROM AlbumCharts";
				query +=                              " WHERE type = \"" + chart + "\"))";
			}

			query += ") a ORDER BY AlbumId, disk, track;";

			return models.sequelize.query(query, { type: models.sequelize.QueryTypes.SELECT 
			}).then( function (ids) {
				songIds = ids;
				return idToSongs(ids);
			}).then( function (songs) {
				var resArray = [];

				for (var i in songIds) {
					var songId = songIds[i].id;
					for (var j in songs) {
						var song = songs[j];

						if (song.id === songId) {
							resArray.push(song);
							break;
						}
					}
				}

				return resArray;
			});
		}

		router.get('/api/ios/fetch', function (req, res) {
			var promises = [];
			var result = {};
			var chartedLimit = req.query.charted;
			var unchartedLimit = req.query.uncharted;
			var seasonalLimit = req.query.seasonal;

			chartedLimit = 200;
		 	unchartedLimit = 200;
			seasonalLimit = 5;

			promises.push(
				getSortedCurrentSongs()
				.then( function (array) {
					result.current = array;
				})
			);

			promises.push(
				getCurrentAlbums()
				.then( function (array) {
					result.album = array;
				})
			);
			
			promises.push(
				getCharted(chartedLimit)
				.then( function (array) {
					result.charted = array;
				})
			);

			promises.push(
				getUncharted(unchartedLimit)
				.then( function (array) {
					result.uncharted = array;
				})
			);

			promises.push(
				getSeasonal(seasonalLimit)
				.then( function (array) {
					result.seasonal = array;
				})
			);

			Promise.all(promises)
			.then ( function () {
				res.json(result);
			});
			
		});
	};
}());