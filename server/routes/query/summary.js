(function() {
  'use strict';

  var Sequelize = require('sequelize');
  var Promise = require('bluebird');

  module.exports = function(router, _, db) {
    function getTableSummary(table, summary) {
      var query = 'SELECT count(*) as count FROM ' + table + ';';

      return db.promisifyQuery(query).then(function(rows) {
        summary[table] = rows[0].count;
      });
    }

    function getChartSummary(table, summary) {
      var query =
        'SELECT count(distinct `type`, `week`) as count FROM ' + table;

      return db.promisifyQuery(query).then(function(rows) {
        summary[table] = rows[0].count;
      });
    }

    router.get('/api/summary', function(req, res) {
      var promises = [];
      var summary = {};

      promises.push(getTableSummary('Artists', summary));
      promises.push(getTableSummary('Albums', summary));
      promises.push(getTableSummary('Songs', summary));
      promises.push(getChartSummary('SingleCharts', summary));

      Promise.all(promises).then(function() {
        res.json(summary);
      });
    });
  };
})();
