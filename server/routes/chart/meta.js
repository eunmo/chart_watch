(function () {
	'use strict';

	var common = require('../../common/cwcommon');
	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');

	var charts = ['billboard', 'oricon', 'deutsche', 'uk', 'francais', 'melon', 'gaon'];
	var headers = ['US', 'オリコン', 'Deutsche', 'UK', 'Francais', '멜론', '가온'];
	
	module.exports = function (router, models, db) {

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
	};
}());
