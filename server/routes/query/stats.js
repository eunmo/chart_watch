(function() {
  'use strict';

  module.exports = function(router, _, db) {
    router.get('/stats/plays-by-song', function(req, res) {
      var query =
        'SELECT plays, rank, count(*) as count ' +
        'FROM Songs ' +
        'LEFT JOIN (SELECT SongId, min(rank) as rank ' +
        'FROM SingleCharts ' +
        'WHERE rank <= 10  ' +
        'GROUP BY SongId) Charts ' +
        'ON Songs.id = Charts.SongId ' +
        'GROUP BY plays, rank';

      db.jsonQuery(query, res);
    });

    router.get('/stats/plays-by-album', function(req, res) {
      var query =
        'SELECT plays, rank, count(*) as count ' +
        'FROM Songs ' +
        'LEFT JOIN (SELECT SongId, min(rank) as rank ' +
        'FROM AlbumSongs a, AlbumCharts b ' +
        'WHERE a.AlbumId = b.AlbumId  ' +
        'AND rank <= 10  ' +
        'GROUP BY SongId) Charts ' +
        'ON Songs.id = Charts.SongId ' +
        'GROUP BY plays, rank';

      db.jsonQuery(query, res);
    });
  };
})();
