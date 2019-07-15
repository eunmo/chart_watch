(function() {
  'use strict';

  module.exports = function(router, db) {
    router.get('/chart/album/summary', function(req, res) {
      db.chartCurrent.getAlbumSummary().then(function(weeks) {
        var albumIds = [];
        var albums = [];

        var week, album;
        for (var i in weeks) {
          week = weeks[i];
          album = week.album;
          if (album.id) {
            albums.push(album);
            albumIds.push(album.id);
          }
        }

        var promises = [];
        promises.push(db.album.fetchDetails(albums, albumIds));
        promises.push(db.album.fetchArtists(albums, albumIds));

        return Promise.all(promises).then(function() {
          res.json(weeks);
        });
      });
    });
  };
})();
