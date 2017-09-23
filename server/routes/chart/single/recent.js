(function () {
	'use strict';
	
	module.exports = function (router, _, db) {
		router.get('/chart/single/recent', function (req, res) {
			db.chartCurrent.getExpandedSongs()
			.then(function (songs) {
				var songIds = [];

				for (var i in songs) {
					songIds.push(songs[i].id);
				}
					
				var promises = [];
				promises.push(db.song.fetchArtists(songs, songIds));
				promises.push(db.song.fetchOldestAlbum(songs, songIds));
				promises.push(db.song.fetchChartSummary(songs, songIds));
		
				return Promise.all(promises)
					.then(function() {
						var filteredSongs = [];
						var song;

						for (var i in songs) {
							song = songs[i];
							if (song.curRank[0] <= 5 ||
									(song.plays <= 10 && song.rank)) {
								filteredSongs.push(song);
							}
						}

						res.json(filteredSongs);
					});
			});
		});
	};
}());
