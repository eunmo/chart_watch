(function () {
	'use strict';

	var common = require('../../common/cwcommon');
	var Promise = require('bluebird');

	module.exports = function (router, models) {

		function pushSong (id, plays, lastPlayed) {
			return models.Song.findOne({
				where: { id: id }
			})
			.then(function (song) {
				if (song.lastPlayed < lastPlayed) {
					song.setDataValue('plays', plays);
					song.setDataValue('lastPlayed', lastPlayed);
					song.save();
				}
			});
		}

		router.put('/ios/plays/push', function (req, res) {
			var input = req.body;
			var promises = [];
			var i, song;

			for (i in input) {
				song = input[i];

				var lastPlayed = new Date(song.lastPlayed);
				promises.push(pushSong(song.id, song.plays, lastPlayed));
			}
			
			Promise.all(promises)
			.then(function () {
				res.sendStatus(200);
			});
		});

		function pullSong (id, i, results) {
			return models.Song.findOne({
				where: { id: id }
			})
			.then(function (song) {
				results[i] =
					{ id: id, plays: song.plays };
			});
		}
		
		router.put('/ios/plays/pull', function (req, res) {
			var input = req.body;
			var promises = [];
			var results = [];
			var i;

			for (i in input) {
				var id = input[i];

				promises.push(pullSong(id, i, results));
			}
			
			Promise.all(promises)
			.then(function () {
				res.json(results);
			});
		});
	};
}());
