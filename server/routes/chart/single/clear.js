(function() {
  'use strict';

  module.exports = function(router, db) {
    router.get('/chart/single/clear/:_chart', async function(req, res) {
      var chartName = req.params._chart;
      var year = req.query.year;
      var month = req.query.month;
      var day = req.query.day;
      var date = new Date(Date.UTC(year, month - 1, day));
      var week = date.toISOString().substring(0, 10);

      await db.promisifyQuery(
        `DELETE FROM SingleCharts WHERE \`type\`='${chartName}' AND \`week\`='${week}';`
      );

      res.sendStatus(200);
    });
  };
})();
