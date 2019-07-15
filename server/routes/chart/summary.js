(function() {
  'use strict';

  module.exports = function(router, db) {
    function getSingles(result) {
      return db.chartCurrent.getSingleSummary().then(function(weeks) {
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

        result.singles = weeks;

        var promises = [];
        promises.push(db.song.fetchDetails(songs, songIds));
        promises.push(db.song.fetchArtists(songs, songIds));
        promises.push(db.song.fetchOldestAlbum(songs, songIds));

        return Promise.all(promises);
      });
    }

    function getAlbums(result) {
      return db.chartCurrent.getAlbumSummary().then(function(weeks) {
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

        result.albums = weeks;

        var promises = [];
        promises.push(db.album.fetchDetails(albums, albumIds));
        promises.push(db.album.fetchArtists(albums, albumIds));

        return Promise.all(promises);
      });
    }

    router.get('/api/chart/summary', function(req, res) {
      var result = {};
      return Promise.all([getSingles(result), getAlbums(result)]).then(
        function() {
          res.json(result);
        }
      );
    });
  };
})();
