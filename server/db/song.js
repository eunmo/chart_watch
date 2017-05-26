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
	};
}());
