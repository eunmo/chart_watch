(function() {
  'use strict';

  var path = require('path');
  const exec = require('../../util/exec');

  var imageDir = path.join(__dirname, '../../../uploads/img');

  module.exports = function(router, db) {
    async function mergeArtists(toId, fromId) {
      var queries = [
        `UPDATE SongArtists SET ArtistId=${toId} WHERE ArtistId=${fromId}`,
        `UPDATE AlbumArtists SET ArtistId=${toId} WHERE ArtistId=${fromId}`,
        `DELETE FROM Artists WHERE id=${fromId}`
      ];
      await db.promisifyQuery(queries.join(';'));
    }

    router.put('/api/edit/artist', async function(req, res) {
      var input = req.body;
      var id = input.id;
      var promises = [];
      var i;

      let artists = await db.promisifyQuery(
        `SELECT id FROM Artists WHERE name='${input.name}' AND id!=${id}`
      );

      if (artists.length > 0) {
        var toId = artists[0].id;
        await mergeArtists(toId, id);
        res.json(toId);
        return;
      }

      var origin = input.origin === null ? 'NULL' : `'${input.origin}'`;
      var type = input.type === null ? 'NULL' : `'${input.type}'`;
      var gender = input.gender === null ? 'NULL' : `'${input.gender}'`;
      var favorites = input.favorites === true ? '1' : 'NULL';
      var queries = [
        'UPDATE Artists ' +
          `SET name='${input.name}', nameNorm='${input.nameNorm}', origin=${origin}, type=${type}, gender=${gender}, favorites=${favorites} ` +
          `WHERE id=${id}`
      ];

      for (i in input.editRelations) {
        var editRelation = input.editRelations[i];
        if (editRelation.created) {
          if (editRelation.name !== null) {
            var artistId = await db.artist.findOrCreate(editRelation.name);
            var order = Number.isInteger(editRelation.order)
              ? editRelation.order
              : null;
            queries.push(
              'INSERT INTO ArtistRelations (type, `order`, createdAt, updatedAt, A, B) ' +
                `VALUES ('${editRelation.type}', ${order}, curdate(), curdate(), ${id}, ${artistId})`
            );
          }
        } else if (editRelation.deleted) {
          queries.push(
            `DELETE FROM ArtistRelations WHERE A=${id} AND B=${editRelation.id}`
          );
        } else {
          queries.push(
            'UPDATE ArtistRelations ' +
              `SET type='${editRelation.type}', \`order\`=${editRelation.order} ` +
              `WHERE A=${id} AND B=${editRelation.id}`
          );
        }
      }

      for (i in input.editAliases) {
        var editAlias = input.editAliases[i];
        if (editAlias.created) {
          if (editAlias.alias !== null && editAlias.chart !== null) {
            queries.push(
              'INSERT INTO ArtistAliases (id, alias, chart, createdAt, updatedAt, ArtistId) ' +
                `VALUES (DEFAULT, '${editAlias.alias}', '${editAlias.chart}', curdate(), curdate(), ${id})`
            );
          }
        } else if (editAlias.deleted) {
          queries.push(`DELETE FROM ArtistAliases WHERE id=${editAlias.id}`);
        } else {
          queries.push(
            'UPDATE ArtistAliases ' +
              `SET alias='${editAlias.alias}', chart='${editAlias.chart}' ` +
              `WHERE id=${editAlias.id}`
          );
        }
      }

      await db.promisifyQuery(queries.join(';'));
      res.json(id);
    });

    async function addAlbumCover(id, url) {
      var imgPath = path.join(imageDir, id + '.jpg');
      var execStr = 'curl "' + url + '" -o ' + imgPath + '; ';
      await exec.simple(execStr);
    }

    async function addNewSongs(albumId, newSong, queries) {
      let songs = await db.promisifyQuery(
        `SELECT id from Songs where id=${newSong.id}`
      );
      if (songs.length > 0) {
        queries.push(
          'INSERT INTO AlbumSongs (disk, track, createdAt, updatedAt, SongId, AlbumId) ' +
            `VALUES (${newSong.disk}, ${newSong.track}, curdate(), curdate(), ${newSong.id}, ${albumId})`
        );
      }
    }

    router.put('/api/edit/album', async function(req, res) {
      var input = req.body;
      var id = input.id;
      let release = new Date(input.releaseDate);
      let releaseDate = release.toISOString().substring(0, 10);
      let format2 = input.format2 !== null ? `'${input.format2}'` : 'NULL';

      var queries = [
        'UPDATE Albums ' +
          `SET title='${input.title}', \`release\`='${releaseDate}', format='${input.format}', format2=${format2} ` +
          `WHERE id=${id}`
      ];

      var newArtistValues = [];
      for (var i in input.editArtists) {
        var editArtist = input.editArtists[i];
        if (editArtist.created) {
          var artistId = await db.artist.findOrCreate(editArtist.name);
          queries.push(
            'INSERT INTO AlbumArtists (`order`, createdAt, updatedAt, AlbumId, ArtistId) ' +
              `VALUES (${editArtist.order}, curdate(), curdate(), ${id}, ${artistId})`
          );
        } else if (editArtist.deleted) {
          queries.push(
            'DELETE FROM AlbumArtists ' +
              `WHERE AlbumId=${id} AND ArtistId=${editArtist.id}`
          );
        } else {
          queries.push(
            'UPDATE AlbumArtists ' +
              `SET \`order\`=${editArtist.order} ` +
              `WHERE AlbumId=${id} AND ArtistId=${editArtist.id}`
          );
        }
      }

      for (i in input.editSongs) {
        var editSong = input.editSongs[i];
        if (editSong.edited) {
          queries.push(
            `UPDATE Songs SET title='${editSong.title}' WHERE id=${editSong.id}`
          );
        }
      }

      for (i in input.newSongs) {
        await addNewSongs(id, input.newSongs[i], queries);
      }

      for (i in input.editAliases) {
        var editAlias = input.editAliases[i];
        if (editAlias.created) {
          if (editAlias.alias !== null && editAlias.chart !== null) {
            queries.push(
              'INSERT INTO AlbumAliases (id, alias, chart, createdAt, updatedAt, AlbumId) ' +
                `VALUES (DEFAULT, '${editAlias.alias}', '${editAlias.chart}', curdate(), curdate(), ${id})`
            );
          }
        } else if (editAlias.deleted) {
          queries.push(
            'DELETE FROM AlbumAliases ' + `WHERE id=${editAlias.id}`
          );
        } else {
          queries.push(
            'UPDATE AlbumAliases ' +
              `SET alias='${editAlias.alias}', chart='${editAlias.chart}' ` +
              `WHERE id=${editAlias.id}`
          );
        }
      }

      if (input.cover !== null) {
        await addAlbumCover(id, input.cover);
      }

      await db.promisifyQuery(queries.join(';'));
      res.sendStatus(200);
    });

    router.put('/api/add/album', async function(req, res) {
      var input = req.body;

      let id = await db.album.add(input.title, input.releaseDate, input.format);

      var queries = [
        'INSERT INTO AlbumArtists (`order`, createdAt, updatedAt, AlbumId, ArtistId) ' +
          `VALUES (0, curdate(), curdate(), ${id}, ${input.artist})`
      ];

      for (var i in input.newSongs) {
        await addNewSongs(id, input.newSongs[i], queries);
      }

      if (input.cover !== null) {
        await addAlbumCover(id, input.cover);
      }

      await db.promisifyQuery(queries.join(';'));
      res.json(id);
    });

    router.put('/api/edit/song', async function(req, res) {
      var input = req.body;
      var id = input.id;
      var queries = [
        'UPDATE Songs ' +
          `SET title='${input.title}', plays='${input.plays}' ` +
          `WHERE id=${id}`
      ];

      var newArtistValues = [];
      for (var i in input.editArtists) {
        var editArtist = input.editArtists[i];
        if (editArtist.created) {
          var artistId = await db.artist.findOrCreate(editArtist.name);
          queries.push(
            'INSERT INTO SongArtists (`order`, feat, createdAt, updatedAt, SongId, ArtistId) ' +
              `VALUES (${editArtist.order}, ${editArtist.feat}, curdate(), curdate(), ${id}, ${artistId})`
          );
        } else if (editArtist.deleted) {
          queries.push(
            'DELETE FROM SongArtists ' +
              `WHERE SongId=${id} AND ArtistId=${editArtist.id}`
          );
        } else {
          queries.push(
            'UPDATE SongArtists ' +
              `SET \`order\`=${editArtist.order}, feat=${editArtist.feat} ` +
              `WHERE SongId=${id} AND ArtistId=${editArtist.id}`
          );
        }
      }

      for (i in input.editAliases) {
        var editAlias = input.editAliases[i];
        if (editAlias.created) {
          if (editAlias.alias !== null && editAlias.chart !== null) {
            queries.push(
              'INSERT INTO SongAliases (id, alias, chart, createdAt, updatedAt, SongId) ' +
                `VALUES (DEFAULT, '${editAlias.alias}', '${editAlias.chart}', curdate(), curdate(), ${id})`
            );
          }
        } else if (editAlias.deleted) {
          queries.push('DELETE FROM SongAliases ' + `WHERE id=${editAlias.id}`);
        } else {
          queries.push(
            'UPDATE SongAliases ' +
              `SET alias='${editAlias.alias}', chart='${editAlias.chart}' ` +
              `WHERE id=${editAlias.id}`
          );
        }
      }

      await db.promisifyQuery(queries.join(';'));
      res.sendStatus(200);
    });

    router.put('/api/add/album-chart-note', async function(req, res) {
      var note = req.body;
      var promises = [];

      await db.promisifyQuery(
        'REPLACE INTO AlbumChartNotes ' +
          '(id, artist, title, note, createdAt, updatedAt) ' +
          `VALUES (DEFAULT, '${note.artist}', '${note.title}', '${note.note}', curdate(), curdate())`
      );

      res.sendStatus(200);
    });
  };
})();
