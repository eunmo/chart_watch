'use strict';

var path = require('path');
const Match = require('../../../util/match_album');
const exec = require('../../../util/exec');

module.exports = function(router, db) {
  let check = async function(chart) {
    const curWeek = new Date(chart.week);
    var nextWeek = new Date(chart.week);
    nextWeek.setDate(nextWeek.getUTCDate() + 7);

    const dateStr = nextWeek
      .toISOString()
      .substr(0, 10)
      .replace(/-/g, ' ');
    const execStr =
      'perl ' +
      path.join(__dirname, '../../../../perl/album', chart.type + '.pl') +
      ' ' +
      dateStr;

    const data = await exec.toJSON(execStr);

    if (data.length <= 10) return;

    var query =
      'SELECT `rank`, artist, title ' +
      '  FROM AlbumCharts ' +
      " WHERE `type` = '" +
      chart.type +
      "' " +
      "   AND `week` = '" +
      curWeek.toISOString() +
      "' " +
      '	ORDER BY `rank`;';

    const curWeekRows = await db.promisifyQuery(query);

    if (curWeekRows.length !== data.length) return;

    var diffCount = 0;

    data.forEach((row, index) => {
      const record = curWeekRows[index];
      if (row.artist !== record.artist || row.title !== record.title)
        diffCount++;
    });

    if (diffCount <= 10) return;

    var values = [];
    data.forEach(row => {
      values.push(
        '(DEFAULT,' +
          "'" +
          chart.type +
          "'," +
          "'" +
          nextWeek
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ') +
          "'," +
          row.rank +
          ',' +
          "'" +
          row.artist +
          "'," +
          "'" +
          row.title +
          "')"
      );
    });

    query =
      'INSERT INTO `AlbumCharts` ' +
      '(`id`,`type`,`week`,`rank`,`artist`,`title`) ' +
      'VALUES ' +
      values.join(',');

    await db.promisifyQuery(query);

    await Match.matchWeek(db, chart.type, nextWeek);
  };
  router.get('/chart/album/check', async function(req, res) {
    var current = await db.chartCurrent.getCurrentWeeks('AlbumCharts');

    for (var i = 0; i < current.length; i += 1) {
      await check(current[i]);
    }

    res.sendStatus(200);
  });
};
