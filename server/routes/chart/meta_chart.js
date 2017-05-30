(function () {
	'use strict';

	var common = require('../../common/cwcommon');
	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');

	var charts = ['billboard', 'oricon', 'deutsche', 'uk', 'francais', 'melon', 'gaon'];
	var headers = ['US', 'オリコン', 'Deutsche', 'UK', 'Francais', '멜론', '가온'];
	
	module.exports = function (router, models, db) {
		
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
							songArray[song.id] = {
								curRank: [rank],
								order: row.order,
								song: song,
								songArtists: common.getSongArtists(song)
							};
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
					if (song.curRank[0] <= 5 || song.song.plays <= 10)
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

				for (i in sendArray) {
					sendArray[i].index = Number(i) + 1;
				}

				return sendArray;
			});
		}

		router.get('/chart/current', function (req, res) {
			getSortedCurrentSongs()
			.then(function (sendArray) {
				res.json(sendArray);
			});
		});

		function getOnes (arr) {
			return models.SongChart.findAll({
				where: { rank: { $eq: 1 }, order: { $eq: 0 } },
				include: [
					{ model: models.Song,
						include: [
							{ model: models.Album },
							{ model: models.Artist }
						]
				}
				]
			}).then(function (rows) {
				arr[0] = rows;
			});
		}

		function getExtra (arr, limit) {
			return models.ChartExtra.findAll({
				where: { rank: { $lte: limit } }
			})
			.then(function (rows) {
				arr[1] = rows;
			});
		}

		function initWeek (weeks, week, headers) {
			var weekNum, j;

			weekNum = common.weekToNum(week);

			if (weeks[weekNum] === undefined) {
				weeks[weekNum] = {
					week: week,
					songs: []
				};
				for (j in headers) {
					weeks[weekNum].songs[j] = {};
				}
			}

			return weekNum;
		}
		
		router.get('/chart/ones', function (req, res) {
			var promises = [];
			var arr = [];

			promises.push(getOnes(arr));
			promises.push(getExtra(arr, 1));

			Promise.all(promises)
			.then(function () {
				var weeks = [];
				var week, weekNum, rankRow, song, i, j;

				for (i in arr[0]) {
					rankRow = arr[0][i];
					weekNum = initWeek(weeks, rankRow.week, headers);

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

				res.json({
					headers: headers,
					weeks: common.sortWeeks(weeks)
				});
			});
		});

		router.get('/chart/missing/', function (req, res) {
			var query =
				"SELECT name, title, min(rank) as rank, count(*) as count, min(type) as chart, max(week) as week " + 
				"FROM ChartExtras " +
				"GROUP BY name, title "+
				"ORDER BY rank, count DESC, week DESC";
			
			db.jsonQuery(query, res);
		});

		router.get('/chart/missing/1', function (req, res) {
			var query =
				"SELECT name, title, count(*) as count, min(type) as chart, min(week) as week " + 
				"FROM ChartExtras where rank = 1 " +
				"GROUP BY name, title "+
				"ORDER BY week, chart";
			
			db.jsonQuery(query, res);
		});

		router.get('/chart/missing/album/:_rank', function (req, res) {
			var query =
				"(SELECT name, rank, a.title, count, chart, week, note FROM " +
				 "(SELECT artist as name, min(rank) as rank, title, count(*) as count, min(type) as chart, min(week) as week " + 
				    "FROM AlbumCharts where rank <= " + req.params._rank +
				    " AND AlbumId is null " +
				   "GROUP BY artist, title) a " +
				 "LEFT JOIN AlbumChartNotes b ON (a.name = b.artist AND a.title = b.title)) " +
				"UNION " +
				"(SELECT artist as name, min(rank) as rank, title, count(*) as count, min(type) as chart, min(week) as week, 'Partial' " +
				   "FROM AlbumCharts where rank <= " + req.params._rank +
					 " AND AlbumId in (SELECT id from Albums WHERE format = 'Partial') " +
					"GROUP BY artist, title) " +
				"ORDER BY week, chart;";

			db.jsonQuery(query, res);
		});

		router.get('/chart/missing/album/:_rank/:_year', function (req, res) {
			var query =
				"SELECT artist as name, min(rank) as rank, title, count(*) as count, min(type) as chart, min(week) as week " + 
				"FROM AlbumCharts where rank <= " + req.params._rank +
			  " AND YEAR (week) = " + req.params._year +
				" AND AlbumId is null " +
				"GROUP BY artist, title " +
				"ORDER BY week, chart";

			db.jsonQuery(query, res);
		});
	};
}());