(function () {
	"use strict";
	module.exports = function (db) {
		db.song = {};
		
		db.song.getDetails = function (ids) {
			var query =
				"SELECT id, title, plays " +
			  "  FROM Songs " +
				" WHERE id in (" + ids.join() + ");";

			return db.promisifyQuery(query);
		};

		db.song.getSongArtists = function (ids) {
			var query =
				"SELECT SongId, `order`, ArtistId, name, feat" +
				"  FROM SongArtists a, Artists b " +
				" WHERE a.SongId in (" + ids.join() + ") " +
				"   AND a.ArtistId = b.id;";
			
			return db.promisifyQuery(query);
		};

		db.song.get = function (columns, filter) {
			var query =
				"SELECT id, title, plays " + columns + 
				"  FROM Songs " + filter + ";";

			return db.promisifyQuery(query);
		};
		
		db.song.getArtists = function (ids) {
			var query =
				"SELECT SongId, `order`, ArtistId, name, feat" +
				"  FROM SongArtists a, Artists b " +
				" WHERE a.SongId in (" + ids.join() + ") " +
				"   AND a.ArtistId = b.id;";
			
			var songArtists = {};
			var artists = {};
			var artistIds = [];
			
			return db.promisifyQuery(query)
				.then(function(rows) {
					var i, row;
					var SongId, order, ArtistId, name, feat;
					var artist;

					for (i in rows) {
						row = rows[i];
						SongId = row.SongId;
						order = row.order;
						ArtistId = row.ArtistId;
						name = row.name;
						feat = row.feat;

						if (songArtists[SongId] === undefined) {
							songArtists[SongId] = {
								artists: [],
								features: []
							};
						}

						if (artists[ArtistId] === undefined) {
							artists[ArtistId] = { id: ArtistId, name: name };
							artistIds.push(ArtistId);
						}

						artist = artists[ArtistId];
						if (feat) {
							songArtists[SongId].features[order] = artist;
						} else {
							songArtists[SongId].artists[order] = artist;
						}	
					}

					return db.artist.getBs(artistIds);
				}).then(function (Bs) {
					var i, artist;

					for (i in artists) {
						if (Bs[i] !== undefined) {
							artists[i].Bs = Bs[i];
						}
					}

					return songArtists;
				});
		};
			
		db.song.getAlbums = function (ids) {
			var query = 
				"SELECT SongId, AlbumId, `release` " +
				"  FROM AlbumSongs a, Albums b " +
				" WHERE a.SongId in (" + ids.join() + ") " +
				"   AND a.AlbumId = b.id";

			return db.promisifyQuery(query)
				.then(function(rows) {
					var songAlbums = {};
					var i, row;
					var SongId, AlbumId, release;

					for (i in rows) {
						row = rows[i];
						SongId = row.SongId;
						AlbumId = row.AlbumId;
						release = row.release;

						if (songAlbums[SongId] === undefined) {
							songAlbums[SongId] = [];
						}

						songAlbums[SongId].push({ id: AlbumId, release: row.release });
					}

					for (i in songAlbums) {
						songAlbums[i].sort(function (a, b) { return a.release - b.release; });
					}

					return songAlbums;
				});
		};
			
		db.song.getAlbumIds = function (ids) {
			var query = 
				"SELECT SongId, AlbumId, disk, track " +
				"  FROM AlbumSongs a " +
				" WHERE a.SongId in (" + ids.join() + ") " +
				" ORDER BY SongId, disk, track";

			return db.promisifyQuery(query)
				.then(function(rows) {
					var songAlbums = {};
					var i, row;
					var SongId, AlbumId, disk, track;

					for (i in rows) {
						row = rows[i];
						SongId = row.SongId;
						AlbumId = row.AlbumId;
						disk = row.disk;
						track = row.track;

						if (songAlbums[SongId] === undefined) {
							songAlbums[SongId] = [];
						}

						songAlbums[SongId].push({ id: AlbumId, disk: disk, track: track });
					}

					return songAlbums;
				});
		};
		
		db.song.getByPlays = function (play) {
			var whereClause, orderByClause;
			var order = [];

			if (play == 100) {
				whereClause = "WHERE plays >= 100 ";
				orderByClause = "ORDER BY plays DESC, ISNULL(rank), rank, id ";
			} else {
				whereClause = "WHERE plays = " + play + " ";
				orderByClause = "ORDER BY ISNULL(rank), rank, id ";
			}

			var query =
				"SELECT id, title, plays, lastPlayed " +
				"  FROM Songs a LEFT JOIN (SELECT SongId, min(rank) as rank " +
																	"  FROM SingleCharts " +
																	" WHERE rank <= 10 " +
																"GROUP BY SongId) b " +
				"    ON a.id = b.SongId " + whereClause + orderByClause +
				" LIMIT 200;";

			return db.promisifyQuery(query);
		};

		db.song.queryForFavoriteArtists = 
			"SELECT DISTINCT id " +
			"  FROM (" +
							"SELECT SongId id FROM Artists a, AlbumArtists aa, AlbumSongs s " +
 							" WHERE a.favorites = true AND a.id = aa.ArtistId AND aa.AlbumId = s.AlbumId " +
							"UNION " +
					 		"SELECT SongId id FROM SongArtists sa, Artists a " +
							" WHERE a.favorites = true AND a.id = sa.ArtistId " +
							"UNION " +
							"SELECT SongId id FROM Artists a, ArtistRelations b, AlbumArtists aa, AlbumSongs s " +
							" WHERE a.favorites = true AND a.id = b.b AND b.a = aa.ArtistId AND aa.AlbumId = s.AlbumId " +
							"UNION " +
							"SELECT SongId id FROM SongArtists sa, Artists a, ArtistRelations b " +
							" WHERE a.favorites = true AND a.id = b.b AND b.a = sa.ArtistId) a;";

		db.song.fetchDetails = function (songs, ids) {
			return db.song.getDetails(ids)
				.then(function (rows) {
					var i, row, song;
					var	details = {};
	
					for (i in rows) {
						row = rows[i];
						details[row.id] = row;
					}

					for (i in songs) {
						song = songs[i];
						row = details[song.id];

						song.title = row.title;
						song.plays = row.plays;
					}
				});
		};

		db.song.fetchArtists = function (songs, ids) {
			return db.song.getArtists(ids)
				.then(function (songArtists) {
					var i, song;

					for (i in songs) {
						song = songs[i];

						if (songArtists[song.id] !== undefined) {
							song.artists = songArtists[song.id].artists;
							song.features = songArtists[song.id].features;
						}
					}
				});
		};
	
		db.song.fetchOldestAlbum = function (songs, ids) {
			return db.song.getAlbums(ids)
				.then(function (songAlbums) {
					var i, song;

					for (i in songs) {
						song = songs[i];

						if (songAlbums[song.id] !== undefined) {
							song.albumId = songAlbums[song.id][0].id;
						}
					}
				});
		};
		
		db.song.fetchMinChartRank = function (songs, ids) {
			var query = "  SELECT SongId id, min(rank) rank " +
									"    FROM SingleCharts " +
									"   WHERE SongId in (" + ids.join() + ") " +
									"     AND rank <= 10 " +
									"GROUP BY SongId;";
			
			return db.promisifyQuery(query)
				.then(function (rows) {
					var i, row, song;
				 	var	charts = {};

					for (i in rows) {
						row = rows[i];
						charts[row.id] = row.rank;
					}

					for (i in songs) {
						song = songs[i];

						if (charts[song.id] !== undefined) {
							song.minRank = charts[song.id];
						}
					}
				});
		};

		db.song.fetchChartSummary = function (songs, ids) {
			return db.chartSummary.getSongs(ids)
				.then(function (charts) {
					var i, song;
					for (i in songs) {
						song = songs[i];

						if (charts[song.id] !== undefined) {
							song.rank = charts[song.id];
						}
					}
				});
		};
		
		db.song.fetchFavorite = function (songs) {
			console.log(db.song.queryForFavoriteArtists);
			return db.promisifyQuery(db.song.queryForFavoriteArtists)
				.then(function (rows) {
					var idMap = {};
					rows.forEach(row => { idMap[row.id] = true; });
					songs.forEach(song => { if (idMap[song.id]) song.favorite = true; });
//					songs.forEach(song => { if (idMap[song.id]) console.log(song); });
				});
		};
	};
}());
