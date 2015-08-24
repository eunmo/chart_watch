(function () {
	'use strict';

	var common = require('../common/cwcommon');
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
	var oriconScript = path.resolve('perl/oricon.pl');
	var oriconFilePrefix = path.resolve('chart/oricon/o');
	var charts = ['gaon', 'melon', 'billboard', 'uk', 'oricon'];
	
	module.exports = function (router, models) {
		function getChartSong (title, artistName, artistArray, i, rank, date, chart, songIds) {
			return models.Artist.findOne({ where: { name: artistName } })
			.then(function (artist) {
				if (!artist) {
					artistArray[i] = { index: rank, artistFound: false, songFound: false, song: title, artist: artistName };
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
							var index = 0;

							for (j in fullArtist.Songs) {
								if (songIds[fullArtist.Songs[j].id])
									continue;
								if (fullArtist.Songs[j].title.toLowerCase() === title.toLowerCase()) {
									index = j;
									break;
								}
							}

							songArtists = common.getSongArtists(fullArtist.Songs[index]);

							artistArray[i] = { index: rank, artistFound: true, songFound: true, song: fullArtist.Songs[index], songArtists: songArtists };

							return models.SongChart.create({
								type: chart,
								week: date,
								rank: rank,
								SongId: fullArtist.Songs[index].id
							}).catch(function (errors) {
								artistArray[i] = { index: rank, artistFound: true, songFound: false, song: title, artist: artist };
							});
						} else {
							artistArray[i] = { index: rank, artistFound: true, songFound: false, song: title, artist: artist };
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
			var chartRows = [];
			var chartRank = [];
			var songIds = [];

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
					chartRank[rank] = true;
					chartRows.push({ index: rank, artistFound: true, songFound: true, song: song, songArtists: common.getSongArtists(song) });
					songIds[song.id] = true;
				}

				if (fs.existsSync(chartFile)) {
					execStr = 'cat ' + chartFile;
				} else {
					execStr = 'perl ' + chartScript + ' ' + year + ' ' + month + ' ' + day + ' | tee ' + chartFile;
				}
				return exec(execStr);
			})
			.spread(function (stdout, stderr) {
				var chart = JSON.parse(stdout);
				var i, row;
				var promises = [];

				for (i in chart) {
					row = chart[i];
					if (chartRank[row.rank])
						continue;
					promises[i] = getChartSong (row.song, row.artist, artistArray, i, row.rank, date, chartName, songIds);
				}

				Promise.all(promises)
				.then(function () {
					var i, results = [];
					for (i in chartRows) {
						results.push(chartRows[i]);
					}
					for (i in artistArray) {
						results.push(artistArray[i]);
					}

					var rankCmp = function (a, b) {
						return a.index - b.index;
					}

					results.sort(rankCmp);
					res.json(results);
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
		
		router.get('/chart/oricon', function (req, res) {
			getChart(req, res, 'oricon', oriconScript, oriconFilePrefix);
		});

		function getMaxDate (type, dates) {
			return models.SongChart.max('week', { where: { type: type } } )
			.success(function (row) {
				dates[type] = row;
			});
		}

		function getCurrentSongs (type, dates, songs, index) {
			return models.SongChart.findAll({
				where: { type: type, week: dates[type], rank: { lt: 8 } },
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
			var dates = {};
			var songPromises = [];
			var songs = [];
			var songArray = [];
			var i;

			for (i in charts)
				datePromises.push(getMaxDate(charts[i], dates));

			Promise.all(datePromises)
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
							songArray[song.id] = {
								curRank: [rank],
								song: song,
								songArtists: common.getSongArtists(song)
							};
						} else {
							songArray[song.id].curRank.push(rank);
							songArray[song.id].curRank.sort();
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

					if (a.curRank.length === b.curRank.length) 
						return a.chart - b.chart;

					return b.curRank.length - a.curRank.length;
				};

				sendArray.sort(rankCmp);

				for (i in sendArray) {
					sendArray[i].index = Number(i) + 1;
				}

				res.json(sendArray);
			});
		});

		function weekToNum (week) {
			return week.getFullYear() * 10000 + week.getMonth() * 100 + week.getDate();
		}
		
		router.get('/chart/ones', function (req, res) {
			return models.SongChart.findAll({
				where: { rank: { $eq: 1 } },
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
			}).then(function (rows) {
				var weeks = [], results = [];
				var week, weekNum, rankRow, song, i, j;
				for (i in rows) {
					rankRow = rows[i];
					week = rankRow.week;
					weekNum = weekToNum(week);
					if (weeks[weekNum] === undefined) {
						weeks[weekNum] = {
							week: week,
							songs: []
						};
						for (j in charts) {
							weeks[weekNum].songs[j] = {};
						}
					}

					song = rankRow.Song;
					for (j in charts) {
						if (charts[j] === rankRow.type) {
							weeks[weekNum].songs[j] = {
								id: song.id,
								title: song.title,
								albumId: song.Albums[0].id,
								artists: common.getSongArtists(song)
							}
						}
					}
				}

				var weekCmp = function (a, b) {
					return b.week - a.week;
				};

				weeks.sort(weekCmp);

				for (i in weeks) {
					results.push(weeks[i]);
				}

				res.json(results);
			});
		});
	};
}());
