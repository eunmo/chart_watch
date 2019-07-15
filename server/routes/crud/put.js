(function() {
  'use strict';

  var Promise = require('bluebird');
  var path = require('path');
  var exec = Promise.promisify(require('child_process').exec);

  var imageDir = path.join(__dirname, '../../../uploads/img');

  module.exports = function(router, models, db) {
    function addArtistRelation(artistId, relation) {
      return models.Artist.findOrCreate({
        where: { name: relation.name },
        defaults: { nameNorm: relation.name }
      }).spread(function(artist, created) {
        return models.ArtistRelation.findOrCreate({
          where: { A: artistId, B: artist.id },
          defaults: { type: relation.type, order: relation.order }
        });
      });
    }

    function updateArtistRelation(artistId, relation) {
      return models.ArtistRelation.update(
        { type: relation.type, order: relation.order },
        { where: { A: artistId, B: relation.id } }
      );
    }

    function deleteArtistRelation(artistId, relation) {
      return models.ArtistRelation.destroy({
        where: { A: artistId, B: relation.id }
      });
    }

    function addArtistAlias(artistId, alias, chart) {
      return models.ArtistAlias.findOrCreate({
        where: { ArtistId: artistId, alias: alias, chart: chart }
      });
    }

    function deleteArtistAlias(artistId, alias, chart) {
      return models.ArtistAlias.destroy({
        where: { ArtistId: artistId, alias: alias, chart: chart }
      });
    }

    function updateArtistAlias(id, alias, chart) {
      return models.ArtistAlias.update(
        {
          alias: alias,
          chart: chart
        },
        {
          where: { id: id }
        }
      );
    }

    router.put('/api/edit/artist', function(req, res) {
      var input = req.body;
      var id = input.id;
      var promises = [];
      var i;
      var favorites = input.favorites;

      if (favorites === false) favorites = null;

      for (i in input.editRelations) {
        var editRelation = input.editRelations[i];
        if (editRelation.created) {
          if (editRelation.name !== null) {
            promises.push(addArtistRelation(id, editRelation));
          }
        } else if (editRelation.deleted) {
          promises.push(deleteArtistRelation(id, editRelation));
        } else {
          promises.push(updateArtistRelation(id, editRelation));
        }
      }

      for (i in input.editAliases) {
        var editAlias = input.editAliases[i];
        if (editAlias.created) {
          if (editAlias.alias !== null && editAlias.chart !== null) {
            promises.push(addArtistAlias(id, editAlias.alias, editAlias.chart));
          }
        } else if (editAlias.deleted) {
          promises.push(
            deleteArtistAlias(id, editAlias.alias, editAlias.chart)
          );
        } else {
          promises.push(
            updateArtistAlias(editAlias.id, editAlias.alias, editAlias.chart)
          );
        }
      }

      Promise.all(promises).then(function() {
        return models.Artist.findOne({
          where: { name: input.name, id: { ne: id } }
        })
          .then(function(artist) {
            if (artist !== null) {
              id = artist.id;
              return models.AlbumArtist.update(
                {
                  ArtistId: id
                },
                { where: { ArtistId: input.id } }
              )
                .then(function() {
                  return models.SongArtist.update(
                    {
                      ArtistId: id
                    },
                    { where: { ArtistId: input.id } }
                  );
                })
                .then(function() {
                  return models.Artist.destroy({
                    where: { id: input.id }
                  });
                });
            } else {
              return models.Artist.update(
                {
                  name: input.name,
                  nameNorm: input.nameNorm,
                  origin: input.origin,
                  type: input.type,
                  gender: input.gender,
                  favorites: favorites
                },
                { where: { id: id } }
              );
            }
          })
          .then(function(array) {
            res.json(id);
          });
      });
    });

    function addAlbumCover(id, url) {
      var sizes = [160, 80, 40, 30];
      var imgPath = path.join(imageDir, id + '.jpg');
      var execStr = 'curl "' + url + '" -o ' + imgPath + '; ';

      for (var i in sizes) {
        var size = sizes[i];
        var smallImgPath = path.join(imageDir, id + '.' + size + 'px.jpg');
        execStr +=
          'convert ' + imgPath + ' -resize ' + size + ' ' + smallImgPath + '; ';
      }

      return exec(execStr);
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
      let release = new Date(input.releaseDate);
      let releaseDate = release.toISOString().substring(0, 10);

      await db.promisifyQuery(
        'INSERT INTO Albums (id, title, titleNorm, `release`, format, createdAt, updatedAt) ' +
          `VALUES (DEFAULT, '${input.title}', '${input.title}', '${releaseDate}', '${input.format}', curdate(), curdate())`
      );

      let albums = await db.promisifyQuery(
        `SELECT id FROM Albums WHERE title='${input.title}' AND \`release\`='${releaseDate}'`
      );
      let id = albums[0].id;

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

      console.log(queries);
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
