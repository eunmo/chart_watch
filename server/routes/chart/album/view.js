(function() {
  'use strict';

  var Promise = require('bluebird');

  module.exports = function(router, db) {
    function getQuery(chart, date) {
      var query =
        'SELECT `rank`, artist, title, AlbumId ' +
        '  FROM AlbumCharts ' +
        " WHERE `type` = '" +
        chart +
        "' " +
        "   AND `week` = '" +
        date.toISOString() +
        "' " +
        '	ORDER BY `rank`;';

      return query;
    }

    function getWeek(chart, date) {
      var query = getQuery(chart, date);

      return db.promisifyQuery(query);
    }

    router.get('/chart/album/view/:_chart', function(req, res) {
      var chartName = req.params._chart;
      var year = req.query.year;
      var month = req.query.month;
      var day = req.query.day;
      var date = new Date(Date.UTC(year, month - 1, day));

      var query = getQuery(chartName, date);

      db.jsonQuery(query, res);
    });

    router.get('/api/chart/album/view/full/:_chart/:_week', function(req, res) {
      var chartName = req.params._chart;
      var week = req.params._week;
      var [year, month, day] = week.split('-');
      var thisWeek = new Date(Date.UTC(year, month - 1, day));
      var lastWeek = new Date(Date.UTC(year, month - 1, day - 7));

      var query = getQuery(chartName, thisWeek);

      Promise.all([
        getWeek(chartName, thisWeek),
        getWeek(chartName, lastWeek)
      ]).then(function([thisWeekRows, lastWeekRows]) {
        var albums = [];
        var nonMatches = {};

        if (thisWeekRows.length === 0) {
          res.json({ thisWeek: [], albums: [] });
          return;
        }

        thisWeekRows.forEach(row => {
          if (row.AlbumId !== null) {
            albums[row.AlbumId] = { id: row.AlbumId };
            delete row.artist;
            delete row.title;
          } else if (nonMatches[row.artist + row.title] === undefined)
            nonMatches[row.artist + row.title] = row;
        });

        lastWeekRows.forEach(row => {
          var id = row.AlbumId;
          if (id !== null && albums[id] !== undefined) {
            if (albums[id].lastWeek === undefined)
              albums[id].lastWeek = row.rank;
            else albums[id].lastWeek = Math.min(albums[id].lastWeek, row.rank);
          }

          var nonMatch = nonMatches[row.artist + row.title];

          if (nonMatch !== undefined) {
            if (nonMatch.lastWeek === undefined) nonMatch.lastWeek = row.rank;
            else nonMatch.lastWeek = Math.min(nonMatch.lastWeek, row.rank);
          }
        });

        var ids = albums.filter(a => a).map(a => a.id);

        if (ids.length === 0) {
          res.json({ thisWeek: thisWeekRows, albums: [] });
          return;
        }

        var promises = [];

        promises.push(db.album.fetchDetails(albums, ids));
        promises.push(db.album.fetchArtists(albums, ids));
        promises.push(
          db.chartSummary.fetchAlbumsByType(albums, ids, chartName, thisWeek)
        );

        return Promise.all(promises).then(function() {
          res.json({
            thisWeek: thisWeekRows,
            albums: albums.filter(a => a)
          });
        });
      });
    });
  };
})();
