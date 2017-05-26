(function () {
	"use strict";
	module.exports = function (db) {
		db.album = {};
		
		db.album.getDetails = function (ids) {
			var query =
				"SELECT id, title, format, `release` " +
			  "  FROM Albums " +
				" WHERE id in (" + ids.join() + ");";

			return db.promisifyQuery(query);
		};

		db.album.getAlbumArtists = function (ids) {
			var query =
				"SELECT AlbumId, `order`, ArtistId, name" +
				"  FROM AlbumArtists a, Artists b " +
				" WHERE a.AlbumId in (" + ids.join() + ") " +
				"   AND a.ArtistId = b.id;";
			
			return db.promisifyQuery(query);
		};
	};
}());
