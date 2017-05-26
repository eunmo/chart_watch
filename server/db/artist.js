(function () {
	"use strict";
	module.exports = function (db) {
		db.artist = {};

		db.artist.getRow = function (id) {
			var query =
				"SELECT name, gender, `type`, origin FROM Artists " +
				" WHERE id = " + id + ";";

			return db.promisifyQuery(query);
		};

		db.artist.getA = function (id) {
			var query =
				"SELECT ar.`type`, ar.order, a.name, a.id " +
				"  FROM ArtistRelations ar, Artists a " +
				" WHERE ar.b = " + id +
				"   AND ar.a = a.id";

				return db.promisifyQuery(query);
		};

		db.artist.getB = function (ids) {
			var query =
				"SELECT ar.a, ar.b, ar.`type`, ar.order, a.name " +
				"  FROM ArtistRelations ar, Artists a " +
				" WHERE ar.a in (" + ids.join() + ") " +
				"   AND ar.b = a.id";

				return db.promisifyQuery(query);
		};
		
		db.artist.getAlbumsAndSongs = function (ids) {
			var query =
				"SELECT ArtistId, b.AlbumId, SongId, disk, track " +
				"  FROM AlbumArtists a, AlbumSongs b " +
				" WHERE a.ArtistId in (" + ids.join() + ") " +
				"   AND a.AlbumId = b.AlbumId " +
				" UNION " +
				"SELECT ArtistId, AlbumId, a.SongId, disk, track " +
				"  FROM SongArtists a, AlbumSongs b " +
				" WHERE a.ArtistId in (" + ids.join() + ") " +
				"   AND a.SongId = b.SongId;";
				
			return db.promisifyQuery(query);
		};
	};
}());
