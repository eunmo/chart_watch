(function() {
  'use strict';

  var path = require('path');
  var Promise = require('bluebird');
  var exec = Promise.promisify(require('child_process').exec);

  module.exports = function(router, db) {
    router.get('/chart/single/fetch/:_chart', async function(req, res) {
      var chartName = req.params._chart;
      var year = req.query.year;
      var month = req.query.month;
      var day = req.query.day;
      var date = new Date(Date.UTC(year, month - 1, day));
      var week = date.toISOString().substring(0, 10);

      let charts = await db.promisifyQuery(
        `SELECT * FROM SingleCharts WHERE \`type\`='${chartName}' AND \`week\`='${week}';`
      );

      if (charts.length > 0) {
        res.sendStatus(200);
        return;
      }

      var dateStr = year + ' ' + month + ' ' + day;
      var execStr = `perl ${path.join(
        __dirname,
        '../../../../perl/single',
        chartName + '.pl'
      )} ${dateStr}`;
      let [stdout, stderr] = await exec(execStr);
      var rawData = JSON.parse(stdout);

      if (rawData.length === 0) {
        res.sendStatus(200);
        return;
      }

      var values = rawData.map(row =>
        row.titles
          .map(
            (title, index) =>
              `(DEFAULT, '${chartName}', '${week}', ${row.rank}, ${index}, '${row.artist}', '${title}', curdate(), curdate())`
          )
          .join('')
      );

      await db.promisifyQuery(
        'INSERT INTO SingleCharts ' +
          '(id,type,week,`rank`,`order`,artist,title,updatedAt,createdAt) ' +
          `VALUES ${values.join(',')}`
      );
      res.sendStatus(200);
    });
  };
})();
