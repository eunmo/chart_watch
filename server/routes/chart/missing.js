(function() {
  'use strict';

  module.exports = function(router, _, db) {
    router.get('/chart/missing/album/:_rank', function(req, res) {
      var query =
        '(SELECT name, rank, a.title, count, chart, week, note FROM ' +
        '(SELECT artist as name, min(rank) as rank, title, count(*) as count, min(type) as chart, min(week) as week ' +
        'FROM AlbumCharts where rank <= ' +
        req.params._rank +
        ' AND AlbumId is null ' +
        'GROUP BY artist, title) a ' +
        'LEFT JOIN AlbumChartNotes b ON (a.name = b.artist AND a.title = b.title)) ' +
        'UNION ' +
        "(SELECT artist as name, min(rank) as rank, title, count(*) as count, min(type) as chart, min(week) as week, 'Partial' " +
        'FROM AlbumCharts where rank <= ' +
        req.params._rank +
        " AND AlbumId in (SELECT id from Albums WHERE format = 'Partial') " +
        'GROUP BY artist, title) ' +
        'ORDER BY week, chart;';

      db.jsonQuery(query, res);
    });

    router.get('/chart/missing/album/:_rank/:_year', function(req, res) {
      var query =
        'SELECT artist as name, min(rank) as rank, title, count(*) as count, min(type) as chart, min(week) as week ' +
        'FROM AlbumCharts where rank <= ' +
        req.params._rank +
        ' AND YEAR (week) = ' +
        req.params._year +
        ' AND AlbumId is null ' +
        'GROUP BY artist, title ' +
        'ORDER BY week, chart';

      db.jsonQuery(query, res);
    });
  };
})();
