(function() {
  'use strict';

  module.exports = function(router, db) {
    function formatResult(rows, res) {
      var weekMap = {};
      var songMap = {};
      var ids = [];
      var i, row, id, week;

      var out = { weeks: [], songs: [] };
      var songs = out.songs;

      for (var i in rows) {
        row = rows[i];
        id = row.id;
        if (id !== null && songMap[id] === undefined) {
          ids.push(id);
          songs.push({ id: id });
          songMap[id] = true;
        }

        if (weekMap[row.week] === undefined) {
          weekMap[row.week] = { week: rows[i].week, songIds: [] };
        }
        week = weekMap[row.week];
        week.songIds[row.order] = id;
      }

      for (week in weekMap) {
        out.weeks.push(weekMap[week]);
      }

      var promises = [];
      promises.push(db.song.fetchDetails(songs, ids));
      promises.push(db.song.fetchArtists(songs, ids));
      promises.push(db.song.fetchOldestAlbum(songs, ids));

      Promise.all(promises).then(function() {
        res.json(out);
      });
    }

    router.get('/chart/single/ones/:_chart', function(req, res) {
      var chartName = req.params._chart;

      var query =
        'SELECT `week`, `order`, artist, title, SongId as id ' +
        '  FROM SingleCharts ' +
        " WHERE `type` = '" +
        chartName +
        "' " +
        '   AND `rank` = 1 ' +
        ' ORDER BY `week` DESC, `order`';

      db.promisifyQuery(query).then(function(rows) {
        return formatResult(rows, res);
      });
    });

    router.get('/api/chart/single/ones/:_chart/:_year', function(req, res) {
      var chartName = req.params._chart;
      var year = req.params._year;

      var query =
        'SELECT `week`, `order`, artist, title, SongId as id ' +
        '  FROM SingleCharts ' +
        " WHERE `type` = '" +
        chartName +
        "' " +
        '   AND `rank` = 1 ' +
        '   AND YEAR(`week`) = ' +
        year +
        ' ORDER BY `week` DESC, `order`';

      db.promisifyQuery(query).then(function(rows) {
        return formatResult(rows, res);
      });
    });
  };
})();
