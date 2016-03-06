(function () {
	'use strict';
	
	var common = require('../common/cwcommon');

	var getRank = function (charts) {
		var i;
		var rank = {};
		var chartRow;

		for (i in charts) {
			chartRow = charts[i];

			if (chartRow.rank > 10)
				continue;

			if (rank[chartRow.type] === undefined) {
				rank[chartRow.type] = {
					min: chartRow.rank,
					run: 0,
					count: 1
				};
			} else if (chartRow.rank < rank[chartRow.type].min) {
				rank[chartRow.type].min = chartRow.rank;
				rank[chartRow.type].run += rank[chartRow.type].count;
				rank[chartRow.type].count = 1;
			} else if (chartRow.rank === rank[chartRow.type].min) {
				rank[chartRow.type].count++;
			} else {
				rank[chartRow.type].run++;
			}
		}

		return rank;
	};

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
		
		function getRecentlyAdded (limit) {
			return models.Song.findAll({
				order: 'createdAt DESC',
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
					order: 'createdAt DESC',
				});
			}).then(function (Songs) {
				var i;
				var resArray = [];
				var song, songRow;

				for (i in Songs) {
					songRow = Songs[i];
					song = common.newSong(songRow);
					song.lastPlayed = songRow.createdAt;
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

		router.get('/api/newSongs/', function (req, res) {
			getRecentlyAdded(200)
			.then(function (songs) {
				res.json(songs);
			});
		});

		router.get('/api/newSongs/:_limit', function (req, res) {
			getRecentlyAdded(req.params._limit)
			.then(function (songs) {
				res.json(songs);
			});
		});
		
		router.get('/api/plays/:_play', function (req, res) {
			var play = req.params._play;
			var whereClause, orderByClause;
			var order = [];

			if (play == 100) {
				whereClause = "WHERE s.plays >= 100 ";
				orderByClause = "ORDER BY plays DESC, ISNULL(rank), rank, s.id ";
			} else {
				whereClause = "WHERE s.plays = " + req.params._play + " ";
				orderByClause = "ORDER BY ISNULL(rank), rank, s.id ";
			}

			var queryString =
				"SELECT s.id " +
				"FROM Songs s " +
				"LEFT JOIN (SELECT SongId, min(rank) as rank " +
									 "FROM SongCharts " +
									 "WHERE rank <= 10  " +
									 "GROUP BY SongId) c " +
				"ON s.id = c.SongId " +
				whereClause +
				orderByClause +
			  "LIMIT 200 ";

			models.sequelize.query(queryString, { type: models.sequelize.QueryTypes.SELECT })
			.then(function (Songs) {
				var ids = [], id;

				for (var row in Songs) {
					id = Songs[row].id;
					ids.push(id);
					order[id] = row;
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
					resArray[order[song.id]] = song;
				}

				res.json(resArray);
			});
		});
	};
}());
