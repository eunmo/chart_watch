(function() {
  'use strict';

  module.exports = function(router, models) {
    router.get('/chart/single/clear/:_chart', function(req, res) {
      var chartName = req.params._chart;
      var year = req.query.year;
      var month = req.query.month;
      var day = req.query.day;
      var date = new Date(Date.UTC(year, month - 1, day));

      models.SingleChart.destroy({
        where: { type: chartName, week: date }
      }).then(function(charts) {
        res.sendStatus(200);
      });
    });
  };
})();
