(function() {
  'use strict';

  var common = require('../common/cwcommon');

  var charts = [
    'billboard',
    'oricon',
    'deutsche',
    'uk',
    'francais',
    'melon',
    'gaon'
  ];

  var initWeek = function(weeks, week) {
    var weekNum;

    weekNum = common.weekToNum(week);

    if (weeks[weekNum] === undefined) {
      weeks[weekNum] = {
        week: week,
        ranks: []
      };
    }

    return weekNum;
  };

  var weeksToArray = function(weeks) {
    var results = [];

    var weekCmp = function(a, b) {
      return b.week - a.week;
    };

    for (var i in weeks) {
      results.push(weeks[i]);
    }

    results.sort(weekCmp);

    return results;
  };

  var getChartWeeks = function(db, query) {
    return db.promisifyQuery(query).then(function(rows) {
      var chartFound = [];
      var weeks = {};
      var row;
      var i, j, k;
      var count = 0;
      var chartMap = {};
      var chartIndex;
      var weekNum;
      var chartHeader = [];
      var result = {};

      for (j in charts) {
        chartFound[j] = false;
      }

      for (i in rows) {
        row = rows[i];
        chartFound[charts.indexOf(row.type)] = true;
        initWeek(weeks, row.week);
      }

      for (j in charts) {
        if (chartFound[j]) {
          chartMap[charts[j]] = count;
          for (k in weeks) {
            weeks[k].ranks[count] = '-';
          }
          chartHeader[count] = charts[j];
          count++;
        }
      }

      for (i in rows) {
        row = rows[i];
        chartIndex = chartMap[row.type];
        weekNum = common.weekToNum(row.week);
        weeks[weekNum].ranks[chartIndex] = row.rank;
      }

      return { headers: chartHeader, weeks: weeksToArray(weeks) };
    });
  };

  module.exports = function(db) {
    db.chartWeeks = {};

    db.chartWeeks.getOneAlbum = function(id) {
      var query =
        'SELECT `type`, week, rank FROM AlbumCharts WHERE AlbumId = ' +
        id +
        ';';

      return getChartWeeks(db, query);
    };

    db.chartWeeks.getOneSong = function(id) {
      var query =
        'SELECT `type`, week, rank FROM SingleCharts WHERE SongId = ' +
        id +
        ';';

      return getChartWeeks(db, query);
    };
  };
})();
