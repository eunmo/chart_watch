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
		
		router.get('/api/album-compilations/', function (req, res) {
			var query = '';
		 	query	+= 'SELECT AlbumId, title, `release`, ArtistId, `order`, name FROM Albums a, AlbumArtists b, Artists c ';
			query += 'WHERE a.format = \"Compilation\" AND a.id = b.AlbumId and c.id = b.ArtistId;';
			
			models.sequelize.query (query, { type: models.sequelize.QueryTypes.SELECT })
			.then (function (rows) {
				var albums = [];
				var i, row;

				for (i in rows) {
					row = rows[i];

					if (albums[row.AlbumId] === undefined) {
						albums[row.AlbumId] = { id: row.AlbumId, title: row.title, artists: [], release: new Date(row.release) };
					}

					albums[row.AlbumId].artists[row.order] = { id: row.ArtistId, name: row.name };
				}

				var out = [];

				for (i in albums) {
					out.push (albums[i]);
				}

				out.sort(function (a, b) { return a.release - b.release; });

				res.json(out);
			});
		});
		
		router.get('/api/all-albums', function (req, res) {
			var query = 'SELECT id, title, `release`, format FROM Albums';
			var albums = [];
			var album, row;

			models.sequelize.query (query, { type: models.sequelize.QueryTypes.SELECT })
			.then (function (rows) {
				for (var i in rows) {
					album = rows[i];
					album.artists = [];
					album.release = new Date(album.release);
					albums[album.id] = album;
				}
				query = 'Select AlbumId, ArtistId, `order`, name FROM AlbumArtists a, Artists b where a.ArtistId = b.id';
			
				return models.sequelize.query (query, { type: models.sequelize.QueryTypes.SELECT });
			}).then (function (rows) {
				for (var i in rows) {
					row = rows[i];
					albums[row.AlbumId].artists[row.order] = { id: row.ArtistId, name: row.name };
				}
				res.json (albums);
			});
		});
	};
}());
