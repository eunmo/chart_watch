(function () {
	'use strict';

	var common = require('../../common/cwcommon');
	var Promise = require('bluebird');
	
	var charts = ['billboard', 'oricon', 'deutsche', 'uk', 'francais', 'melon', 'gaon'];

	module.exports = function (router, models) {

		router.get('/api/season', function (req, res) {
		
			var limit = 3;	
			var weeks = common.getSeasonalWeeks (new Date());
			var queryString =
				"SELECT week, SongId, type, rank " +
				"FROM SongCharts " +
				"WHERE rank <= " + limit + " " +
				"AND week IN (" + weeks + ") AND `order` = 0;";
			var outParam = { charts: charts };

			return models.sequelize.query (queryString, { type: models.sequelize.QueryTypes.SELECT 
			}).then (function (results) {
				var weeks = [];
				var i, j;
				var weekNum, week;
				var row;

				for (i in results) {
					row = results[i];
					weekNum = common.weekToNum (row.week);
					if (weeks[weekNum] === undefined) {
						weeks[weekNum] = {
							week: row.week,
							songs: []
						};

						for (j in charts) {
							weeks[weekNum].songs[j] = [];
						}
					}
					week = weeks[weekNum];

					for (j in charts) {
						if (row.type === charts[j]) {
							week.songs[j][row.rank - 1] = row.SongId;
						}
					}
				}

				outParam.weeks = [];
				for (i in weeks) {
					outParam.weeks.push (weeks[i]);
				}

				var ids = [];

				for (i in results) {
					ids.push (results[i].SongId);
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
						song.artists = common.getSongArtists(songRow);
						song.albumId = songRow.Albums[0].id;
						resArray.push(song);
					}

					return resArray;
				}).then (function (songs) {
					outParam.songs = songs;
					res.json (outParam);
				});
			});
		});
	};
}());
