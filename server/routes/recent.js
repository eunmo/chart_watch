(function () {
	'use strict';

	var getExternals = function (db, rows) {
		var i, row;
		var songs = [];
		var ids = [];
		var promises = [];

		for (i in rows) {
			row = rows[i];
			ids.push(row.id);
			songs.push({
				id: row.id,
				title: row.title,
				plays: row.plays,
				lastPlayed: row.lastPlayed	
			});

			console.log(row.lastPlayed);
		}

		promises.push(db.song.fetchArtists(songs, ids));
		promises.push(db.song.fetchOldestAlbum(songs, ids));
		promises.push(db.song.fetchChartSummary(songs, ids));

		return Promise.all(promises)
			.then(function () {
				return songs;
			});
	};

	module.exports = function (router, models, db) {
		function getLastPlayed (limit) {
			var columns = ", lastPlayed";
			var filter = "WHERE lastPlayed is not null ORDER BY lastPlayed DESC LIMIT " + limit;

			return db.song.get(columns, filter)
				.then(function (rows) {
					return getExternals (db, rows);
				});
		}
		
		function getRecentlyAdded (limit) {
			var columns = ", createdAt as lastPlayed";
			var filter = "ORDER BY createdAt DESC LIMIT " + limit;

			return db.song.get(columns, filter)
				.then(function (rows) {
					return getExternals (db, rows);
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
			
			return db.song.getByPlays(play)
				.then(function (rows) {
					return getExternals (db, rows);
				}).then(function (songs) {
					res.json(songs);
				});
		});
	};
}());
