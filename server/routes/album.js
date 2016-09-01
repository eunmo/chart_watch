(function () {
	'use strict';

	var common = require('../common/cwcommon');
	var Promise = require('bluebird');
	
	var charts = ['billboard', 'oricon', 'deutsche', 'uk', 'francais', 'melon', 'gaon'];
	var headers = ['US', 'オリコン', 'Deutsche', 'UK', 'Francais', '멜론', '가온'];

	var getArtists = function (models, id, results) {
		return models.Album.findOne({
			where: {id: id},
			include: [
				{ model: models.Artist, attributes: [ 'id', 'name' ],
					include: [
						{ model: models.Artist, as: 'Group', attributes: [ 'id', 'name' ] }
					]
				}
			]
		}).then(function (array) {
			results.artists = array;
		});
	};
		
	function initWeek (weeks, week, headers) {
		var weekNum;

		weekNum = common.weekToNum(week);

		if (weeks[weekNum] === undefined) {
			weeks[weekNum] = {
				week: week,
				ranks: []
			};
		}

		return weekNum;
	}
	
	var getCharts = function (models, id, results) {
		return models.Album.findOne({
			where: {id: id},
			include: [
				{ model: models.AlbumChart, attributes: [ 'type', 'week', 'rank' ] }
			]
		}).then(function (array) {
			var chartFound = [];
			var weeks = [];
			var chartRow;
			var i, j, k;
			var count = 0;
			var chartMap = {};
			var chartIndex;
			var weekNum;
			var chartHeader = [];
			var result = {};
				
			for (j in charts) {
				chartFound[j] = false;
			}

			for (i in array.AlbumCharts) {
				chartRow = array.AlbumCharts[i];
				for (j in charts) {
					if (charts[j] === chartRow.type) {
						chartFound[j] = true;
					}
				}
				
				initWeek(weeks, chartRow.week);
			}

			for (j in charts) {
				if (chartFound[j]) {
					chartMap[charts[j]] = count;
					for (k in weeks) {
						weeks[k].ranks[count] = '-';
					}
					chartHeader[count] = charts[j];
					count++;
				}
			}

			for (i in array.AlbumCharts) {
				chartRow = array.AlbumCharts[i];
				chartIndex = chartMap[chartRow.type];
				weekNum = common.weekToNum(chartRow.week);
				weeks[weekNum].ranks[chartIndex] = chartRow.rank;
			}

			result.header = chartHeader;
			result.weeks = [];
		
			for (k in weeks) {
				result.weeks.push(weeks);
			}
			
			results.charts = { headers: chartHeader, weeks: common.sortWeeks(weeks) };
		});
	};

	module.exports = function (router, models) {
		router.get('/api/album/:_id', function (req, res) {
			var id = req.params._id;
			var promises = [];
			var results = {};

			promises.push(getArtists(models, id, results));
			promises.push(getCharts(models, id, results));

			Promise.all(promises)
			.then(function () {
				var album = common.newAlbum(results.artists);
				album.artists = results.artists.Artists;
				album.charts = results.charts;
				res.json(album);
			});
		});
	};
}());