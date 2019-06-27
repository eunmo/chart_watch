(function() {
  'use strict';

  module.exports = function(router, _, db) {
    router.get('/chart/single/summary', function(req, res) {
      db.chartCurrent.getSingleSummary().then(function(weeks) {
        var songIds = [];
        var songs = [];

        var week, song;
        for (var i in weeks) {
          week = weeks[i];
          for (var j in week.songs) {
            song = week.songs[j];
            if (song.id) {
              songs.push(song);
              songIds.push(song.id);
            }
          }
        }

        var promises = [];
        promises.push(db.song.fetchDetails(songs, songIds));
        promises.push(db.song.fetchArtists(songs, songIds));
        promises.push(db.song.fetchOldestAlbum(songs, songIds));

        return Promise.all(promises).then(function() {
          res.json(weeks);
        });
      });
    });
  };
})();
