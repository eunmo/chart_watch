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

		function getCurrentSongIds(currentWeeks) {
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

					var promises = [];
					promises.push(db.song.fetchDetails(songs, ids));
					promises.push(db.song.fetchChartSummary(songs, ids));
					promises.push(db.song.fetchFavorite(songs));
					return Promise.all(promises);
				}).then(function () {
					var songs = [];
					var song;

					for (var i in sortedSongs) {
						song = sortedSongs[i];
						if (song.curRank[0] <= 5 || 
								(song.plays <= 10 && (song.rank || song.favorite))) {
							songs.push(song);
						}
					}

					return songs;
				});
		};
		
		function getCurrentTopSongIds(weeks) {
			var query = '';

			for (var i = 0; i < weeks.length; i++) {
				if (i > 0)
					query += " UNION ALL ";
				query +=
					"SELECT SongId id, artist, title, `type`, `rank`, `order` " +
					"  FROM SingleCharts " +
					" WHERE `type` = \'" + weeks[i].type + "\' " +
					"   AND `week` = \'" + weeks[i].week.toISOString() + "\' " +
					"   AND `rank` = 1";
			}

			return db.promisifyQuery(query + ';')
				.then(function (songs) {
					var week, count, song;
					var i, j;

					for (i in weeks) {
						week = weeks[i];
						week.songs = [];
					}

					for (i in songs) {
						song = songs[i];
						for (j in weeks) {
							week = weeks[j];

							if (week.type === song.type) {
								week.songs[song.order] = song;
							}
						}
					}
				});
		}

		function getCount(weeks, chart, column) {
			var query = '';

			for (var i = 0; i < weeks.length; i++) {
				if (i > 0)
					query += " UNION ALL ";
				query +=
					"SELECT `type`, count(*) `entry`, count(" + column + ") `match` " +
					"  FROM " + chart +
					" WHERE `type` = \'" + weeks[i].type + "\' " +
					"   AND `week` = \'" + weeks[i].week.toISOString() + "\' ";
			}
			
			return db.promisifyQuery(query + ';')
				.then(function (counts) {
					var week, count;
					var i, j;

					for (i in weeks) {
						week = weeks[i];
						week.summary = {};
					}
					
					for (i in counts) {
						count = counts[i];
						for (j in weeks) {
							week = weeks[j];

							if (week.type === count.type) {
								week.summary.entry = count.entry;
								week.summary.match = count.match;
							}
						}
					}
				});
		}

		db.chartCurrent.getSingleSummary = function () {

			return getCurrentWeeks('SingleCharts')
				.then(function (weeks) {

					var promises = [];
					promises.push(getCurrentTopSongIds(weeks));
					promises.push(getCount(weeks, 'SingleCharts', 'SongId'));

					return Promise.all(promises)
						.then(function () {
							return weeks;
						});
				});
		};
		
		function getCurrentTopAlbumIds(weeks) {
			var query = '';

			for (var i = 0; i < weeks.length; i++) {
				if (i > 0)
					query += " UNION ALL ";
				query +=
					"SELECT AlbumId id, artist, title, `type`, `rank` " +
					"  FROM AlbumCharts " +
					" WHERE `type` = \'" + weeks[i].type + "\' " +
					"   AND `week` = \'" + weeks[i].week.toISOString() + "\' " +
					"   AND `rank` = 1";
			}

			return db.promisifyQuery(query + ';')
				.then(function (albums) {
					var week, count, album;
					var i, j;

					for (i in albums) {
						album = albums[i];
						for (j in weeks) {
							week = weeks[j];

							if (week.type === album.type) {
								week.album = album;
							}
						}
					}
				});
		}

		db.chartCurrent.getAlbumSummary = function () {
			var weeks = [];
			var albums = [];

			return getCurrentWeeks('AlbumCharts')
				.then(function (weeks) {
					
					var promises = [];
					promises.push(getCurrentTopAlbumIds(weeks));
					promises.push(getCount(weeks, 'AlbumCharts', 'AlbumId'));

					return Promise.all(promises)
						.then(function () {
							return weeks;
						});
				});
		};
		
		function getCurrentAlbumIds(weeks, limit) {
			var query = '';

			for (var i = 0; i < weeks.length; i++) {
				if (i > 0)
					query += " UNION ALL ";
				query +=
					"SELECT AlbumId id " +
					"  FROM AlbumCharts " +
					" WHERE `type` = \'" + weeks[i].type + "\' " +
					"   AND `week` = \'" + weeks[i].week.toISOString() + "\' " +
					"   AND AlbumId IS NOT NULL " +
					"   AND `rank` <= " + limit;
			}

			query = "SELECT distinct id FROM (" + query + ") a ORDER BY id DESC;";

			return db.promisifyQuery(query)
				.then(function (albums) {
					var albumIds = [];

					for (i in albums) {
						albumIds.push(albums[i].id);
					}

					return albumIds;
				});
		}
		
		db.chartCurrent.getAlbums = function (limit) {

			return getCurrentWeeks('AlbumCharts')
				.then(function (weeks) {

					return getCurrentAlbumIds(weeks, limit);
				});
		};
	};
}());
