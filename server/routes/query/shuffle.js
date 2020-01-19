(function() {
  'use strict';

  var Promise = require('bluebird');

  var simpleRandom = function(rows, array, count) {
    var i, index;

    for (i = 0; i < count; i++) {
      index = Math.floor(Math.random() * rows.length);
      array.push(rows[index].id);
    }
  };

  var getSongIds = function(db, query, array, count) {
    return db.promisifyQuery(query.query).then(function(rows) {
      simpleRandom(rows, array, count);
    });
  };

  var getDetails = function(db, doc) {
    return db.song.getDetails(doc.ids).then(function(rows) {
      var i, row, song;
      var details = {};

      for (i in rows) {
        row = rows[i];
        details[row.id] = row;
      }

      for (i in doc.songs) {
        song = doc.songs[i];
        row = details[song.id];

        song.title = row.title;
        song.plays = row.plays;
      }
    });
  };

  module.exports = function(router, db) {
    function getRandomSongs() {
      var promises = [];
      var songIds = [];
      var limits = [];
      var weights = [];
      var query, random, i;

      var queries = [
        { query: 'SELECT id FROM Songs;' },
        {
          query: 'SELECT id FROM Songs WHERE plays <= 2;',
          weight: 3
        },
        { query: 'SELECT id FROM Songs WHERE plays <= 3;' },
        {
          query:
            'SELECT id FROM Songs WHERE plays < 10 AND id IN (SELECT distinct SongId FROM SingleCharts WHERE `rank` <= 10);'
        },
        { query: db.season.getQuery() },
        { query: db.song.queryForFavoriteArtists }
      ];

      queries.forEach((query, index) => {
        limits[index] = 0;
        var weight = query.weight ? query.weight : 1;
        for (i = 0; i < weight; i++) {
          weights.push(index);
        }
      });

      for (i = 0; i < 100; i++) {
        random = Math.floor(Math.random() * weights.length);
        limits[weights[random]]++;
      }

      for (i in queries) {
        promises.push(getSongIds(db, queries[i], songIds, limits[i]));
      }

      return Promise.all(promises).then(function() {
        var songs = {};
        var ids = [];
        var i, id;

        for (i in songIds) {
          id = songIds[i];

          if (songs[id] === undefined) {
            songs[id] = { id: id };
            ids.push(id);
          }
        }

        return { ids: ids, songs: songs };
      });
    }

    function fillSongs(doc) {
      var promises = [];

      promises.push(getDetails(db, doc));
      promises.push(db.song.fetchArtists(doc.songs, doc.ids));
      promises.push(db.song.fetchOldestAlbum(doc.songs, doc.ids));
      promises.push(db.song.fetchMinChartRank(doc.songs, doc.ids));

      return Promise.all(promises).then(function() {
        return doc;
      });
    }

    function trimSongArray(doc) {
      var newSongs = [];
      var shuffle = [];
      var i;
      var index;

      for (i in doc.songs) {
        newSongs.push(doc.songs[i]);
      }

      while (newSongs.length > 0) {
        index = Math.floor(Math.random() * newSongs.length);
        shuffle.push(newSongs.splice(index, 1)[0]);
      }

      return shuffle;
    }

    router.get('/shuffle', function(req, res) {
      getRandomSongs()
        .then(fillSongs)
        .then(trimSongArray)
        .then(function(doc) {
          res.json(doc);
        });
    });
  };
})();
