(function () {
	'use strict';

	var common = require('../common/cwcommon');
	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var charts = ['gaon', 'melon', 'billboard', 'oricon', 'deutsche', 'uk'];
	
	module.exports = function (router, models) {
		
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
								order: row.order,
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

					if (a.curRank.length === b.curRank.length) {
						if (a.chart === b.chart) {
							return a.order - b.order;
						}
						return a.chart - b.chart;
					}

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

		function getOnes (arr) {
			return models.SongChart.findAll({
				where: { rank: { $eq: 1 }, order: { $eq: 0 } },
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
				arr[0] = rows;
			});
		}

		function getExtra (arr) {
			return models.ChartExtra.findAll()
			.then(function (rows) {
				arr[1] = rows;
			});
		}

		function initWeek (weeks, week) {
			var weekNum, j;

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

			return weekNum;
		}
		
		router.get('/chart/ones', function (req, res) {
			var promises = [];
			var arr = [];

			promises.push(getOnes(arr));
			promises.push(getExtra(arr));

			Promise.all(promises)
			.then(function () {
				var weeks = [], results = [];
				var week, weekNum, rankRow, song, i, j;

				for (i in arr[0]) {
					rankRow = arr[0][i];
					weekNum = initWeek(weeks, rankRow.week);

					song = rankRow.Song;
					for (j in charts) {
						if (charts[j] === rankRow.type) {
							weeks[weekNum].songs[j] = {
								id: song.id,
								title: song.title,
								albumId: song.Albums[0].id,
								artists: common.getSongArtists(song)
							};
						}
					}
				}

				for (i in arr[1]) {
					rankRow = arr[1][i];
					weekNum = initWeek(weeks, rankRow.week);
					
					for (j in charts) {
						if (charts[j] === rankRow.type) {
							weeks[weekNum].songs[j] = {
								extra: true,
								artist: rankRow.name,
								title: rankRow.title
							};
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
