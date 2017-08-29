(function () {
	'use strict';
	
	var charts = ['billboard', 'oricon', 'deutsche', 'uk', 'francais', 'melon', 'gaon'];

	module.exports = function (db) {
		db.chartCurrent = {};

		function getCurrentWeeks (tableName) {
			var query =
				"SELECT max(`week`) `week`, `type` " +
				"  FROM " + tableName +
				" GROUP BY `type`;";

			return db.promisifyQuery(query);
		}

		function getCurrentSongIds (currentWeeks) {
			var query = '';

			for (var i = 0; i < currentWeeks.length; i++) {
				if (i > 0)
					query += " UNION ALL ";
				query +=
					"SELECT SongId, `type`, `rank`, `order` " +
					"  FROM SingleCharts " +
					" WHERE `type` = \'" + currentWeeks[i].type + "\' " +
					"   AND `week` = \'" + currentWeeks[i].week.toISOString() + "\' " +
					"   AND `rank` <= 10 " +
					"   AND SongId is not null";
			}
			
			return db.promisifyQuery(query + ';');
		}
		
		function getCurrentSongIdsExpanded (currentWeeks) {
			var query = '';

			for (var i = 0; i < currentWeeks.length; i++) {
				if (i > 0)
					query += " UNION ALL ";
				query +=
					"SELECT SongId, `type`, `rank`, `order` " +
					"  FROM SingleCharts " +
					" WHERE `type` = \'" + currentWeeks[i].type + "\' " +
					"   AND `week` = \'" + currentWeeks[i].week.toISOString() + "\' " +
					"   AND SongId is not null";
			}
			
			return db.promisifyQuery(query + ';');
		}


		function sortCurRank (a, b) {
			return (a.rank === b.rank) ? charts.indexOf(a.type) - charts.indexOf(b.type) : a.rank - b.rank;
		}

		function sortSong (a, b) {
			var minSize = Math.min(a.curRank.length, b.curRank.length);
			for (var i = 0; i < minSize; i++) {
				if (a.curRank[i].rank !== b.curRank[i].rank)
					return a.curRank[i].rank - b.curRank[i].rank;
			}

			if (a.curRank.length === b.curRank.length) {
				if (a.curRank[0].type === b.curRank[0].type) {
					return a.curRank[0].order - b.curRank[0].order;
				}
				return charts.indexOf(a.curRank[0].type) - charts.indexOf(b.curRank[0].type);
			}

			return b.curRank.length - a.curRank.length;
		}

		function sortCurrentSongIds (currentSongIds) {
			var songMap = {};
			var row;
			var i;

			for (i in currentSongIds) {
				row = currentSongIds[i];
				if (songMap[row.SongId] === undefined)
					songMap[row.SongId] = { id: row.SongId, curRank: [] };
				songMap[row.SongId].curRank.push({ type: row.type, rank: row.rank, order: row.order });
			}

			var songs = [];
			var song;
			for (i in songMap) {
				song = songMap[i];
				song.curRank.sort(sortCurRank);
				songs.push(song);
			}

			songs.sort(sortSong);

			var curRank, rank;
			var j;
			for (i in songs) {
				song = songs[i];
				curRank = song.curRank;
				song.curRank = [];

				for (j in curRank) {
					rank = curRank[j].rank;
					song.curRank.push(rank);
					song[curRank[j].type] = rank;
				}
			}

			return songs;
		}

		db.chartCurrent.getSortedSongs = function () {
			var sortedSongs = [];

			return getCurrentWeeks('SingleCharts')
				.then(getCurrentSongIds)
				.then(sortCurrentSongIds)
				.then(function (songs) {
					var ids = [];

					for (var i in songs) {
						ids.push(songs[i].id);
					}

					sortedSongs = songs;

					return db.song.fetchDetails(songs, ids);
				}).then(function () {
					var songs = [];
					var song;

					for (var i in sortedSongs) {
						song = sortedSongs[i];
						if (song.curRank[0] <= 5 || song.plays <= 10) {
							songs.push(song);
						}
					}

					return songs;
				});
		};

		db.chartCurrent.getExpandedSongs = function () {
			var sortedSongs = [];

			return getCurrentWeeks('SingleCharts')
				.then(getCurrentSongIdsExpanded)
				.then(sortCurrentSongIds)
				.then(function (songs) {
					var ids = [];

					for (var i in songs) {
						ids.push(songs[i].id);
					}

					sortedSongs = songs;

					return db.song.fetchDetails(songs, ids);
				}).then(function () {
					return sortedSongs;
				});
		};
	};
}());

