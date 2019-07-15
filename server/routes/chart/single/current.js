(function() {
  'use strict';

  module.exports = function(router, db) {
    router.get('/chart/single/current', function(req, res) {
      db.chartCurrent.getSortedSongs().then(function(songs) {
        var songIds = [];

        for (var i in songs) {
          songIds.push(songs[i].id);
        }

        var promises = [];
        promises.push(db.song.fetchArtists(songs, songIds));
        promises.push(db.song.fetchOldestAlbum(songs, songIds));
        promises.push(db.song.fetchChartSummary(songs, songIds));

        return Promise.all(promises).then(function() {
          res.json(songs);
        });
      });
    });
  };
})();
