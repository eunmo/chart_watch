(function() {
  'use strict';

  var initChart = function(charts, id, type) {
    if (charts[id] === undefined) {
      charts[id] = {};
    }
    if (charts[id][type] === undefined) {
      charts[id][type] = {
        min: 11,
        run: 0,
        count: 0
      };
    }
  };

  var getChartSummary = function(db, query) {
    return db.promisifyQuery(query).then(function(rows) {
      var charts = {};
      var i, row;
      var id, rank, type, count, chart;

      for (i in rows) {
        row = rows[i];
        id = row.id;
        type = row.type;
        rank = row.rank;
        count = row.count;

        initChart(charts, id, type);
        chart = charts[id][type];

        /* min: min rank
         * run: number of weeks in top 10 not counting weeks at min rank
         * count: weeks at min rank */
        if (rank < chart.min) {
          chart.min = rank;
          chart.run += chart.count;
          chart.count = count;
        } else {
          chart.run += count;
        }
      }

      return charts;
    });
  };

  module.exports = function(db) {
    db.chartSummary = {};

    db.chartSummary.getAlbums = function(ids) {
      var query =
        '  SELECT AlbumId as id, `type`, `rank`, count(*) as count ' +
        '    FROM AlbumCharts ' +
        '   WHERE AlbumId in (' +
        ids.join() +
        ') ' +
        '     AND `rank` <= 10 ' +
        'GROUP BY AlbumId, `type`, `rank`;';

      return getChartSummary(db, query);
    };

    db.chartSummary.getSongs = function(ids) {
      var query =
        '  SELECT SongId as id, `type`, `rank`, count(*) as count ' +
        '    FROM SingleCharts ' +
        '   WHERE SongId in (' +
        ids.join() +
        ') ' +
        '     AND `rank` <= 10 ' +
        'GROUP BY SongId, `type`, `rank`;';

      return getChartSummary(db, query);
    };

    db.chartSummary.fetchAlbumsByType = function(albums, ids, type, week) {
      var query =
        '  SELECT AlbumId as id, `type`, `rank`, count(*) as count ' +
        '    FROM AlbumCharts ' +
        '   WHERE AlbumId in (' +
        ids.join() +
        ') ' +
        "     AND `type` = '" +
        type +
        "' " +
        "     AND `week` < '" +
        week.toISOString() +
        "' " +
        'GROUP BY AlbumId, `type`, `rank`;';

      return getChartSummary(db, query).then(function(charts) {
        albums.forEach(function(album) {
          if (charts[album.id]) album.rank = true;
        });
      });
    };

    db.chartSummary.fetchSongsByType = function(songs, ids, type, week) {
      var query =
        '  SELECT SongId as id, `type`, `rank`, count(*) as count ' +
        '    FROM SingleCharts ' +
        '   WHERE SongId in (' +
        ids.join() +
        ') ' +
        "     AND `type` = '" +
        type +
        "' " +
        "     AND `week` < '" +
        week.toISOString() +
        "' " +
        'GROUP BY SongId, `type`, `rank`;';

      return getChartSummary(db, query).then(function(charts) {
        songs.forEach(function(song) {
          if (charts[song.id]) song.rank = true;
        });
      });
    };
  };
})();
