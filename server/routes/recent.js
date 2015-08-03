(function () {
	'use strict';
	
	var common = require('../common/cwcommon');

	var getRank = function (charts) {
		var i;
		var rank = {};
		var chartRow;

		for (i in charts) {
			chartRow = charts[i];
			if (rank[chartRow.type] === undefined) {
				rank[chartRow.type] = {
					min: chartRow.rank,
					count: 1
				};
			} else if (chartRow.rank < rank[chartRow.type].min) {
				rank[chartRow.type].min = chartRow.rank;
				rank[chartRow.type].count = 1;
			} else if (chartRow.rank == rank[chartRow.type].min) {
				rank[chartRow.type].count++;
			}
		}

		return rank;
	}

	module.exports = function (router, models) {
		function getLastPlayed (limit) {
			return models.Song.findAll({
				where: { lastPlayed: { ne: null } },
				order: 'lastPlayed DESC',
				limit: limit
			}).then(function (Songs) {
				var ids = [];

				for (var row in Songs) {
					ids.push(Songs[row].id);
				}

				return models.Song.findAll({
					where: { id: { in: ids } },
					include: [
						{ model: models.Album },
						{ model: models.Artist, include: [
							{ model: models.Artist, as: 'Group' }
						]},
						{ model: models.SongChart }
					],
					order: 'lastPlayed DESC'
				});
			}).then(function (Songs) {
				var i;
				var resArray = [];
				var song, songRow;

				for (i in Songs) {
					songRow = Songs[i];
					song = common.newSong(songRow);
					song.lastPlayed = songRow.lastPlayed;
					song.songArtists = common.getSongArtists(songRow);
					song.rank = getRank(songRow.SongCharts);
					song.albumId = songRow.Albums[0].id;
					resArray.push(song);
				}

				return resArray;
			});
		}

		router.get('/api/lastPlayed', function (req, res) {
			getLastPlayed(100)
			.then(function (songs) {
				res.json(songs);
			});
		});
		
		router.get('/api/lastPlayed/:_limit', function (req, res) {
			getLastPlayed(req.params._limit)
			.then(function (songs) {
				res.json(songs);
			});
		});
	};
}());
