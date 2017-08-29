(function () {
	"use strict";
	module.exports = function (db) {
		db.album = {};
		
		db.album.getDetails = function (ids) {
			var query =
				"SELECT id, title, format, format2, `release` " +
			  "  FROM Albums " +
				" WHERE id in (" + ids.join() + ");";

			return db.promisifyQuery(query);
		};
		
		db.album.getArtists = function (ids) {
			var query =
				"SELECT AlbumId, `order`, ArtistId, name" +
				"  FROM AlbumArtists a, Artists b " +
				" WHERE a.AlbumId in (" + ids.join() + ") " +
				"   AND a.ArtistId = b.id;";
			
			var albumArtists = {};
			var artists = {};
			var artistIds = [];
			
			return db.promisifyQuery(query)
				.then(function(rows) {
					var i, row;
					var AlbumId, order, ArtistId, name, feat;
					var artist;

					for (i in rows) {
						row = rows[i];
						AlbumId = row.AlbumId;
						order = row.order;
						ArtistId = row.ArtistId;
						name = row.name;
						feat = row.feat;

						if (albumArtists[AlbumId] === undefined) {
							albumArtists[AlbumId] = [];
						}

						if (artists[ArtistId] === undefined) {
							artists[ArtistId] = { id: ArtistId, name: name };
							artistIds.push(ArtistId);
						}

						albumArtists[AlbumId][order] = artists[ArtistId];
					}

					return db.artist.getBs(artistIds);
				}).then(function (Bs) {
					var i, artist;

					for (i in artists) {
						if (Bs[i] !== undefined) {
							artists[i].Bs = Bs[i];
						}
					}

					return albumArtists;
				});
		};

		db.album.getByFormat = function (format) {
			var filter = " WHERE format = '" + format + "';";

			if (format === 'null') {
				filter = " WHERE format is null;";
			}

			var query = 
				"SELECT id, title, format, `release` " +
			  "  FROM Albums " + filter;

			return db.promisifyQuery(query);
		};
		
		db.album.getByFormat2 = function (format) {
			var filter = " WHERE format2 = '" + format + "';";

			if (format === 'null') {
				filter = " WHERE format2 is null;";
			}

			var query = 
				"SELECT id, title, format2, `release` " +
			  "  FROM Albums " + filter;

			return db.promisifyQuery(query);
		};
	};
}());
