(function() {
  'use strict';

  var Promise = require('bluebird');

  var charts = [
    'billboard',
    'oricon',
    'deutsche',
    'uk',
    'francais',
    'melon',
    'gaon'
  ];

  module.exports = function(router, db) {
    router.get('/api/season', function(req, res) {
      var outParam = { weeks: {}, songs: [], charts: charts };

      db.season
        .getSongsOfThisWeek()
        .then(function(rows) {
          var i, j, row;
          var weeks = outParam.weeks;
          var songs = {};
          var songIds = [];
          var week, id, type, rank;
          var curWeek;

          for (i in rows) {
            row = rows[i];
            week = row.week;
            id = row.SongId;
            type = row.type;
            rank = row.rank;

            if (weeks[week] === undefined) {
              weeks[week] = { week: week, songs: [] };

              for (j in charts) {
                weeks[week].songs[j] = [];
              }
            }

            curWeek = weeks[week];
            curWeek.songs[charts.indexOf(type)][rank - 1] = id;

            if (songs[id] === undefined) {
              songs[id] = { id: id };
              songIds.push(id);
              outParam.songs.push(songs[id]);
            }
          }

          var promises = [];
          songs = outParam.songs;
          promises.push(db.song.fetchDetails(songs, songIds));
          promises.push(db.song.fetchArtists(songs, songIds));
          promises.push(db.song.fetchOldestAlbum(songs, songIds));

          return Promise.all(promises);
        })
        .then(function() {
          res.json(outParam);
        });
    });

    router.get('/api/season-detail', function(req, res) {
      var outSongs = [];

      db.season
        .getAllSongsOfThisWeek()
        .then(function(rows) {
          var i, j, row, id;
          var songs = [];
          var songIds = [];

          for (i in rows) {
            row = rows[i];
            id = row.id;

            if (songs[id] === undefined) {
              songs[id] = { id: id };
              songIds.push(id);
              outSongs.push(songs[id]);
            }
          }

          var promises = [];
          promises.push(db.song.fetchDetails(songs, songIds));
          promises.push(db.song.fetchArtists(songs, songIds));
          promises.push(db.song.fetchOldestAlbum(songs, songIds));
          promises.push(db.song.fetchMinChartRank(songs, songIds));

          return Promise.all(promises);
        })
        .then(function() {
          res.json(outSongs);
        });
    });
  };
})();
