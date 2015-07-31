(function () {
	'use strict';

	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var gaonScript = path.resolve('perl/gaon.pl');
	var gaonFilePrefix = path.resolve('chart/gaon/gaon');
	var melonScript = path.resolve('perl/melon.pl');
	var melonFilePrefix = path.resolve('chart/melon/melon');
	var billboardScript = path.resolve('perl/billboard.pl');
	var billboardFilePrefix = path.resolve('chart/billboard/billboard');
	var ukScript = path.resolve('perl/uk.pl');
	var ukFilePrefix = path.resolve('chart/uk/uk');
	
	var artistCmpOrder = function (a, b) {
		return a.order - b.order;
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

	module.exports = function (router, models) {

		function getSongArtists (song) {
			var songArtists = [];
			var j;
			var artistRow, songArtist;

			for (j in song.Artists) {
				artistRow = song.Artists[j];
				if (!artistRow.SongArtist.feat) {
					songArtist = {
						id: artistRow.id,
						name: artistRow.name,
						order: artistRow.SongArtist.order,
						primaryGroup: getPrimaryGroup(artistRow)
					};
					songArtists.push(songArtist);
				}
			}

			songArtists.sort(artistCmpOrder);

			return songArtists;
		}

		function getChartSong (title, artistName, artistArray, i, date, chart) {
			return models.Artist.findOne({ where: { name: artistName } })
			.then(function (artist) {
				if (!artist) {
					artistArray[i] = { index: Number(i) + 1, artistFound: false, songFound: false, song: title, artist: artistName };
				}

				if (artist) {
					return models.Artist.findOne({
						where: { id: artist.id },
						include: [
							{ model: models.Song,
								where: { title: { like: title + '%' } },
								include: [
									{ model: models.Album },
									{ model: models.Artist, include: [
										{ model: models.Artist, as: 'Group' }
									]}
							 	]
							} 
						]
					})
					.then(function (fullArtist) {
						if (fullArtist) {
							var songArtists = [];
							var j;
							var artistRow, songArtist;
							var index = 0;

							for (j in fullArtist.Songs) {
								if (fullArtist.Songs[j].title.toLowerCase() === title.toLowerCase()) {
									index = j;
									break;
								}
							}

							for (j in fullArtist.Songs[index].Artists) {
								artistRow = fullArtist.Songs[index].Artists[j];
								if (!artistRow.SongArtist.feat) {
									songArtist = {
										id: artistRow.id,
										name: artistRow.name,
										order: artistRow.SongArtist.order,
										primaryGroup: getPrimaryGroup(artistRow)
									};
									songArtists.push(songArtist);
								}
							}

							songArtists.sort(artistCmpOrder);

							artistArray[i] = { index: Number(i) + 1, artistFound: true, songFound: true, song: fullArtist.Songs[index], songArtists: songArtists };

							return models.SongChart.create({
								type: chart,
								week: date,
								rank: Number(i) + 1,
								SongId: fullArtist.Songs[index].id
							});
						} else {
							artistArray[i] = { index: Number(i) + 1, artistFound: true, songFound: false, song: title, artist: artist };
						}
					});
				}
			});
		}

		function getChart (req, res, chartName, chartScript, filePrefix) {
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var artistArray = [];
			var chartFile = filePrefix + '.' + year +
											(month < 10 ? '.0' : '.') + month +
											(day < 10 ? '.0' : '.') + day;
			var date = new Date(year, month - 1, day);

			models.SongChart.findAll({
				where: { type: chartName, week: date },
				include: [
					{ model: models.Song,
						include: [
							{ model: models.Album },
							{ model: models.Artist, include: [
								{ model: models.Artist, as: 'Group' }
							]}
						]
					}
				]
			})
			.then(function (charts) {
				var i, row, rank, song;
				var execStr;

				for (i in charts) {
					row = charts[i];
					rank = row.rank;
					song = row.Song;
					artistArray[rank - 1] = { index: rank, artistFound: true, songFound: true, song: song, songArtists: getSongArtists(song) };
				}

				if (fs.existsSync(chartFile)) {
					execStr = 'cat ' + chartFile;
				} else {
					execStr = 'perl ' + chartScript + ' ' + year + ' ' + month + ' ' + day + ' | tee ' + chartFile;
				}
				return exec(execStr);
			})
			.spread(function (stdout, stderr) {
				console.log(stdout);
				var chart = JSON.parse(stdout);
				var i, row;
				var promises = [];

				for (i in chart) {
					if (artistArray[i] !== undefined)
						continue;
					row = chart[i];
					promises[i] = getChartSong (row.song, row.artist, artistArray, i, date, chartName);
				}

				Promise.all(promises)
				.then(function () {
					res.json(artistArray);
				});
			});
		}

		router.get('/chart/gaon', function (req, res) {
			getChart(req, res, 'gaon', gaonScript, gaonFilePrefix);
		});

		router.get('/chart/melon', function (req, res) {
			getChart(req, res, 'melon', melonScript, melonFilePrefix);
		});
		
		router.get('/chart/billboard', function (req, res) {
			getChart(req, res, 'billboard', billboardScript, billboardFilePrefix);
		});
		
		router.get('/chart/uk', function (req, res) {
			getChart(req, res, 'uk', ukScript, ukFilePrefix);
		});

		function getMaxDate (type, dates, index) {
			return models.SongChart.max('week', { where: { type: type } } )
			.success(function (row) {
				dates[index] = row;
			});
		}

		function getCurrentSongs (type, date, songs, index) {
			return models.SongChart.findAll({
				where: { type: type, week: date, rank: { lt: 8 } },
				include: [
					{ model: models.Song,
						include: [
							{ model: models.Album },
							{ model: models.Artist, include: [
								{ model: models.Artist, as: 'Group' }
							]}
						]
					}
				]
			})
			.then(function (charts) {
				songs[index] = charts;
			});
		}

		router.get('/chart/current', function (req, res) {
			var datePromises = [];
			var dates = [];
			var songPromises = [];
			var songs = [];
			var songArray = [];

			datePromises.push(getMaxDate('gaon', dates, 0));
			datePromises.push(getMaxDate('melon', dates, 1));
			datePromises.push(getMaxDate('billboard', dates, 2));
			datePromises.push(getMaxDate('uk', dates, 3));

			Promise.all(datePromises)
			.then(function () {

				songPromises.push(getCurrentSongs('gaon', dates[0], songs, 0));
				songPromises.push(getCurrentSongs('melon', dates[1], songs, 1));
				songPromises.push(getCurrentSongs('billboard', dates[2], songs, 2));
				songPromises.push(getCurrentSongs('uk', dates[3], songs, 3));

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
							songArray[song.id] = {
								curRank: [rank],
								song: song,
								songArtists: getSongArtists(song)
							};
						} else {
							songArray[song.id].curRank.push(rank);
							songArray[song.id].curRank.sort();
						}
					}
				}

				for (i in songArray) {
					idArray.push(i);
				}
		
				return models.SongChart.findAll({
					where: { SongId: { $in: idArray } }
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
								count: 1
							};
						} else if (chartRow.rank < rankArray[songId][chartRow.type].min) {
							rankArray[songId][chartRow.type].min = chartRow.rank;
							rankArray[songId][chartRow.type].count = 1;
						} else if (chartRow.rank === rankArray[songId][chartRow.type].min) {
							rankArray[songId][chartRow.type].count++;
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
					sendArray.push(songArray[i]);
				}

				var rankCmp = function (a, b) {
					var minSize = Math.min(a.curRank.length, b.curRank.length);
					for (i = 0; i < minSize; i++) {
						if (a.curRank[i] !== b.curRank[i])
							return a.curRank[i] - b.curRank[i];
					}

					if (a.curRank.length === b.curRank.lenghth)
						return a.id - b.id;

					return b.curRank.length - a.curRank.length;
				};

				sendArray.sort(rankCmp);

				for (i in sendArray) {
					sendArray[i].index = Number(i) + 1;
				}

				res.json(sendArray);
			});
		});
	};
}());
