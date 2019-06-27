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

  module.exports = function(router, _, db) {
    function idRowsToArray(rows) {
      var array = [];

      for (var i in rows) {
        array.push(rows[i].id);
      }

      return array;
    }

    function getSingleCharts() {
      return db.chartCurrent.getSortedSongs().then(idRowsToArray);
    }

    function getAlbumCharts() {
      const limit = 5;

      return db.chartCurrent.getAlbums(limit);
    }

    function getCharted(count) {
      var query =
        'SELECT distinct SongId as id ' +
        'FROM Songs s, SingleCharts c ' +
        'WHERE s.id = c.SongId and rank <= 10 and plays < 10 ' +
        'ORDER BY SongId ' +
        'LIMIT ' +
        count;

      return db.promisifyQuery(query).then(idRowsToArray);
    }

    function getUncharted(count) {
      var query =
        'SELECT id ' +
        'FROM Songs ' +
        'WHERE plays < 3 ' +
        'ORDER BY id ' +
        'LIMIT ' +
        count;

      return db.promisifyQuery(query).then(idRowsToArray);
    }

    function getFavoriteAlbums() {
      var curDate = new Date();
      var limitDate = new Date(
        Date.UTC(
          curDate.getFullYear() - 1,
          curDate.getMonth(),
          curDate.getDate()
        )
      );
      var albumQuery =
        'SELECT AlbumId id FROM (' +
        'SELECT AlbumId FROM AlbumArtists a, Artists b ' +
        '	WHERE a.ArtistId = b.id AND b.favorites = true ' +
        ' UNION ' +
        'SELECT AlbumId FROM AlbumArtists a, ArtistRelations b, Artists c ' +
        ' WHERE a.ArtistId = b.a AND b.b = c.id AND c.favorites = true' +
        ') a, Albums b ' +
        ' WHERE a.AlbumId = b.id ' +
        "   AND `release` >= '" +
        limitDate.toISOString() +
        "' " +
        '	ORDER BY `release` DESC';

      return db.promisifyQuery(albumQuery).then(idRowsToArray);
    }

    function getSeasonal() {
      return db.season.getAllSongsOfThisWeek().then(function(rows) {
        var map = {};
        var i, row;
        for (i in rows) {
          row = rows[i];
          map[row.id] = row.id;
        }

        return mapToArray(map);
      });
    }

    function getNewAlbums() {
      var query =
        'SELECT distinct AlbumId id From AlbumSongs a, Songs s' +
        ' WHERE a.SongId = s.id AND s.plays = 0';

      return db.promisifyQuery(query).then(idRowsToArray);
    }

    function addArrayToMap(array, map) {
      var id;

      for (var i in array) {
        id = array[i];
        if (map[id] === undefined) {
          map[id] = { id: id };
        }
      }
    }

    function mapToArray(map) {
      var array = [];

      for (var i in map) {
        array.push(map[i]);
      }

      return array;
    }

    function toIdArray(map) {
      var array = [];

      for (var i in map) {
        array.push(map[i].id);
      }

      return array;
    }

    function getSongAlbums(songMap, albumMap) {
      var songIds = toIdArray(songMap);
      var albums, album, track;
      var id, songId, i, j;

      return db.song.getAlbumIds(songIds).then(function(songAlbums) {
        for (id in songAlbums) {
          songId = parseInt(id);
          albums = songAlbums[songId];
          addArrayToMap(toIdArray(albums), albumMap);
          for (i in albums) {
            album = albumMap[albums[i].id];
            track = {
              id: songId,
              disk: albums[i].disk,
              track: albums[i].track
            };

            if (album.tracks === undefined) {
              album.tracks = [track];
            } else {
              var found = false;
              for (j in album.tracks) {
                if (album.tracks[j].id === songId) {
                  found = true;
                  break;
                }
              }

              if (found === false) {
                album.tracks.push(track);
              }
            }
          }
        }
      });
    }

    function getAlbumSongs(albumMap, songMap) {
      var albumIds = toIdArray(albumMap);

      return db.album.getSongs(albumIds).then(function(albumSongs) {
        for (var albumId in albumSongs) {
          albumMap[albumId].tracks = albumSongs[albumId];
          addArrayToMap(toIdArray(albumSongs[albumId]), songMap);
        }
      });
    }

    function getSongArtists(songMap, artistMap) {
      var songIds = toIdArray(songMap);
      var songId, array;

      return db.song.getArtists(songIds).then(function(songArtists) {
        for (songId in songArtists) {
          array = songMap[songId].artists = toIdArray(
            songArtists[songId].artists
          );
          addArrayToMap(array, artistMap);
          array = songMap[songId].features = toIdArray(
            songArtists[songId].features
          );
          addArrayToMap(array, artistMap);
        }
      });
    }

    function getAlbumArtists(albumMap, artistMap) {
      var albumIds = toIdArray(albumMap);
      var albumId, array;

      return db.album.getArtists(albumIds).then(function(albumArtists) {
        for (albumId in albumArtists) {
          array = albumMap[albumId].artists = toIdArray(albumArtists[albumId]);
          addArrayToMap(array, artistMap);
        }
      });
    }

    function getSongDetails(songMap) {
      var songIds = toIdArray(songMap);

      return db.song.fetchDetails(songMap, songIds);
    }

    function getAlbumDetails(albumMap) {
      var albumIds = toIdArray(albumMap);

      return db.album.fetchDetails(albumMap, albumIds);
    }

    function getArtistDetails(artistMap) {
      var artistIds = toIdArray(artistMap);

      return db.artist.fetchDetails(artistMap, artistIds);
    }

    function getSongMinChartRank(songMap) {
      var songIds = toIdArray(songMap);

      return db.song.fetchMinChartRank(songMap, songIds);
    }

    function condenseIds(rows) {
      var result = [];

      if (rows.length === 0) return result;

      var cur,
        prev = rows[0].id;
      var start = prev;

      for (var i = 1; i < rows.length; i++) {
        cur = rows[i].id;
        if (prev + 1 !== cur) {
          result.push([start, prev]);
          start = cur;
        }
        prev = cur;
      }

      result.push([start, cur]);

      return result;
    }

    function getSongIds(result) {
      var query = 'SELECT id FROM Songs ORDER BY id';

      return db.promisifyQuery(query).then(function(rows) {
        result.songIds = condenseIds(rows);
      });
    }

    function getAlbumIds(result) {
      var query = 'SELECT id From Albums ORDER BY id';

      return db.promisifyQuery(query).then(function(rows) {
        result.albumIds = condenseIds(rows);
      });
    }

    router.get('/ios/fetch2', function(req, res) {
      var promises = [];
      var result = {};
      var songMap = {};
      var albumMap = {};
      var artistMap = {};

      var chartedLimit = 200;
      var unchartedLimit = 200;
      var seasonalLimit = 5;

      promises.push(
        getSingleCharts().then(function(array) {
          result.singleCharts = array;
          addArrayToMap(array, songMap);
        })
      );

      promises.push(
        getAlbumCharts().then(function(array) {
          result.albumCharts = array;
          addArrayToMap(array, albumMap);
        })
      );

      promises.push(
        getCharted(chartedLimit).then(function(array) {
          result.charted = array;
          addArrayToMap(array, songMap);
        })
      );

      promises.push(
        getUncharted(unchartedLimit).then(function(array) {
          result.uncharted = array;
          addArrayToMap(array, songMap);
        })
      );

      promises.push(
        getFavoriteAlbums().then(function(array) {
          result.favorites = array;
          addArrayToMap(array, albumMap);
        })
      );

      promises.push(
        getSeasonal().then(function(array) {
          result.seasonal = array;
          addArrayToMap(array, songMap);
        })
      );

      promises.push(
        getNewAlbums().then(function(array) {
          result.newAlbums = array;
          addArrayToMap(array, albumMap);
        })
      );

      Promise.all(promises)
        .then(function() {
          var promises = [];

          promises.push(getSongAlbums(songMap, albumMap));
          promises.push(getAlbumSongs(albumMap, songMap));
          promises.push(getSongIds(result));
          promises.push(getAlbumIds(result));

          return Promise.all(promises);
        })
        .then(function() {
          var promises = [];

          promises.push(getSongArtists(songMap, artistMap));
          promises.push(getAlbumArtists(albumMap, artistMap));

          return Promise.all(promises);
        })
        .then(function() {
          var promises = [];

          promises.push(getSongDetails(songMap));
          promises.push(getAlbumDetails(albumMap));
          promises.push(getArtistDetails(artistMap));
          promises.push(getSongMinChartRank(songMap));

          return Promise.all(promises);
        })
        .then(function() {
          result.songs = mapToArray(songMap);
          result.albums = mapToArray(albumMap);
          result.artists = mapToArray(artistMap);

          result.seasonal.sort(function(aId, bId) {
            var a = songMap[aId];
            var b = songMap[bId];

            if (a.plays === b.plays) {
              return a.id - b.id;
            }

            return a.plays - b.plays;
          });

          res.json(result);
        });
    });
  };
})();
