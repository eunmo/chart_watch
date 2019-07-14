'use strict';

var Promise = require('bluebird');
const Match = require('../../../util/match_album');

module.exports = function(router, _, db) {
  router.get('/chart/album/match/:_chart', async function(req, res) {
    var chartName = req.params._chart;
    var year = req.query.year;
    var month = req.query.month;
    var day = req.query.day;
    var date = new Date(Date.UTC(year, month - 1, day));

    await Match.matchWeek(db, chartName, date);

    res.sendStatus(200);
  });
};
