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
																	"  FROM SongCharts " +
																	" WHERE rank <= 10 " +
																"GROUP BY SongId) b " +
				"    ON a.id = b.SongId " + whereClause + orderByClause +
				" LIMIT 200;";

			return db.promisifyQuery(query);
		};
	};
}());
