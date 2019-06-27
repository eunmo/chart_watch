(function() {
  'use strict';

  var common = require('../../common/cwcommon');
  var Promise = require('bluebird');

  module.exports = function(router, models, db) {
    function getUpdateQuery(song) {
      var time = new Date(song.lastPlayed);
      var lastPlayed = time
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      var query =
        'UPDATE Songs set plays = ' +
        song.plays +
        ', lastPlayed = "' +
        lastPlayed +
        '" WHERE id = ' +
        song.id +
        ';';

      return query;
    }

    function getCheckQuery(songs) {
      return (
        'SELECT id, plays FROM Songs where id in (' +
        songs.map(s => s.id).join(',') +
        ');'
      );
    }

    router.put('/ios/plays/sync', async function(req, res) {
      var input = req.body;

      if (input.length === 0) {
        res.json([]);
        return;
      }

      var queries = input.map(getUpdateQuery).join('');
      await db.promisifyQuery(queries);
      db.jsonQuery(getCheckQuery(input), res);
    });
  };
})();
