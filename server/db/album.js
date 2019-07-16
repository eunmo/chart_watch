(function() {
  'use strict';
  module.exports = function(db) {
    db.album = {};

    db.album.getDetails = function(ids) {
      var query =
        'SELECT id, title, format, format2, `release` ' +
        '  FROM Albums ' +
        ' WHERE id in (' +
        ids.join() +
        ');';

      return db.promisifyQuery(query);
    };

    db.album.getArtists = function(ids) {
      var query =
        'SELECT AlbumId, `order`, ArtistId, name' +
        '  FROM AlbumArtists a, Artists b ' +
        ' WHERE a.AlbumId in (' +
        ids.join() +
        ') ' +
        '   AND a.ArtistId = b.id;';

      var albumArtists = {};
      var artists = {};
      var artistIds = [];

      return db
        .promisifyQuery(query)
        .then(function(rows) {
          var i, row;
          var AlbumId, order, ArtistId, name, feat;
          var artist;

          for (i in rows) {
            row = rows[i];
            AlbumId = row.AlbumId;
            order = row.order;
            ArtistId = row.ArtistId;
            name = row.name;

            if (albumArtists[AlbumId] === undefined) {
              albumArtists[AlbumId] = [];
            }

            if (artists[ArtistId] === undefined) {
              artists[ArtistId] = { id: ArtistId, name: name };
              artistIds.push(ArtistId);
            }

            albumArtists[AlbumId][order] = artists[ArtistId];
          }

          return db.artist.getBs(artistIds);
        })
        .then(function(Bs) {
          var i, artist;

          for (i in artists) {
            if (Bs[i] !== undefined) {
              artists[i].Bs = Bs[i];
            }
          }

          return albumArtists;
        });
    };

    db.album.getSongs = function(ids) {
      var query =
        'SELECT SongId, AlbumId, disk, track ' +
        '  FROM AlbumSongs a ' +
        ' WHERE a.AlbumId in (' +
        ids.join() +
        ') ' +
        ' ORDER BY AlbumId, disk, track';

      return db.promisifyQuery(query).then(function(rows) {
        var albumSongs = {};
        var i, row;
        var SongId, AlbumId, disk, track;

        for (i in rows) {
          row = rows[i];
          SongId = row.SongId;
          AlbumId = row.AlbumId;
          disk = row.disk;
          track = row.track;

          if (albumSongs[AlbumId] === undefined) {
            albumSongs[AlbumId] = [];
          }

          albumSongs[AlbumId].push({
            id: parseInt(SongId),
            disk: disk,
            track: track
          });
        }

        return albumSongs;
      });
    };

    db.album.getByFormat = function(format) {
      var filter = " WHERE format = '" + format + "';";

      if (format === 'null') {
        filter = ' WHERE format is null;';
      }

      var query =
        'SELECT id, title, format, `release` ' + '  FROM Albums ' + filter;

      return db.promisifyQuery(query);
    };

    db.album.getByFormat2 = function(format) {
      var filter = " WHERE format2 = '" + format + "';";

      if (format === 'null') {
        filter = ' WHERE format2 is null;';
      }

      var query =
        'SELECT id, title, format2, `release` ' + '  FROM Albums ' + filter;

      return db.promisifyQuery(query);
    };

    db.album.fetchDetails = function(albums, ids) {
      return db.album.getDetails(ids).then(function(rows) {
        var i, row, album;
        var details = {};

        for (i in rows) {
          row = rows[i];
          details[row.id] = row;
        }

        for (i in albums) {
          album = albums[i];
          row = details[album.id];

          album.title = row.title;
          album.format = row.format;
          album.format2 = row.format2;
          album.release = row.release;
        }
      });
    };

    db.album.fetchArtists = function(albums, ids) {
      return db.album.getArtists(ids).then(function(albumArtists) {
        var i, album;

        for (i in albums) {
          album = albums[i];

          if (albumArtists[album.id] !== undefined) {
            album.artists = albumArtists[album.id];
          }
        }
      });
    };

    db.album.add = async function(title, release, format) {
      console.log(release);
      let releaseD = new Date(release);
      let releaseDate = releaseD.toISOString().substring(0, 10);
      let formatS = format === null ? 'NULL' : `'${format}'`;

      await db.promisifyQuery(
        'INSERT INTO Albums (id, title, `release`, format) ' +
          `VALUES (DEFAULT, '${title}', '${releaseDate}', ${formatS})`
      );

      let albums = await db.promisifyQuery(
        `SELECT id FROM Albums WHERE title='${title}' AND \`release\`='${releaseDate}'`
      );

      if (albums.length === 0) {
        throw new Error('Cannot create album!');
      }

      return albums[0].id;
    };
  };
})();
