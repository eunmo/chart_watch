(function() {
  'use strict';

  var Promise = require('bluebird');
  var path = require('path');
  var exec = Promise.promisify(require('child_process').exec);

  var imageDir = path.join(__dirname, '../../../uploads/img');

  module.exports = function(router, models) {
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

    function addAlbumArtist(albumId, artistName, order) {
      return models.Artist.findOrCreate({
        where: { name: artistName },
        defaults: { nameNorm: artistName }
      }).spread(function(artist, created) {
        return models.AlbumArtist.findOrCreate({
          where: { AlbumId: albumId, ArtistId: artist.id },
          defaults: { order: order }
        });
      });
    }

    function deleteAlbumArtist(albumId, artistId) {
      return models.AlbumArtist.destroy({
        where: { AlbumId: albumId, ArtistId: artistId }
      });
    }

    function updateAlbumArtist(albumId, artistId, order, feat) {
      return models.AlbumArtist.update(
        {
          order: order
        },
        { where: { AlbumId: albumId, ArtistId: artistId } }
      );
    }

    function updateAlbumSong(id, editSong) {
      return models.Song.update(
        {
          title: editSong.title,
          titleNorm: editSong.title
        },
        { where: { id: editSong.id } }
      );
    }

    function addAlbumSong(id, newSong) {
      return models.Song.findOne({
        where: { id: newSong.id }
      }).then(function(array) {
        if (array !== null) {
          return models.AlbumSong.findOrCreate({
            where: { AlbumId: id, disk: newSong.disk, track: newSong.track },
            defaults: { SongId: newSong.id }
          });
        }
      });
    }

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

    function addAlbumAlias(artistId, alias, chart) {
      return models.AlbumAlias.findOrCreate({
        where: { AlbumId: artistId, alias: alias, chart: chart }
      });
    }

    function deleteAlbumAlias(artistId, alias, chart) {
      return models.AlbumAlias.destroy({
        where: { AlbumId: artistId, alias: alias, chart: chart }
      });
    }

    function updateAlbumAlias(id, alias, chart) {
      return models.AlbumAlias.update(
        {
          alias: alias,
          chart: chart
        },
        {
          where: { id: id }
        }
      );
    }

    router.put('/api/edit/album', function(req, res) {
      var input = req.body;
      var id = input.id;
      var promises = [];
      var i;

      for (i in input.editArtists) {
        var editArtist = input.editArtists[i];
        if (editArtist.created) {
          if (editArtist.name !== null) {
            promises.push(
              addAlbumArtist(id, editArtist.name, editArtist.order)
            );
          }
        } else if (editArtist.deleted) {
          promises.push(deleteAlbumArtist(id, editArtist.id));
        } else {
          promises.push(updateAlbumArtist(id, editArtist.id, editArtist.order));
        }
      }

      for (i in input.editSongs) {
        var editSong = input.editSongs[i];
        if (editSong.edited) promises.push(updateAlbumSong(id, editSong));
      }

      for (i in input.newSongs) {
        promises.push(addAlbumSong(id, input.newSongs[i]));
      }

      if (input.cover !== null) {
        promises.push(addAlbumCover(id, input.cover));
      }

      for (i in input.editAliases) {
        var editAlias = input.editAliases[i];
        if (editAlias.created) {
          if (editAlias.alias !== null && editAlias.chart !== null) {
            promises.push(addAlbumAlias(id, editAlias.alias, editAlias.chart));
          }
        } else if (editAlias.deleted) {
          promises.push(deleteAlbumAlias(id, editAlias.alias, editAlias.chart));
        } else {
          promises.push(
            updateAlbumAlias(editAlias.id, editAlias.alias, editAlias.chart)
          );
        }
      }

      Promise.all(promises)
        .then(function() {
          return models.Album.update(
            {
              title: input.title,
              titleNorm: input.titleNorm,
              release: new Date(input.releaseDate),
              format: input.format,
              format2: input.format2
            },
            { where: { id: id } }
          );
        })
        .then(function(array) {
          return models.AlbumArtist.findAll({
            where: { AlbumId: id }
          });
        })
        .then(function(albumArtistArray) {
          for (var i in albumArtistArray) {
            var albumArtistRow = albumArtistArray[i];
            if (albumArtistRow.order === 0) {
              res.json(albumArtistRow.ArtistId);
            }
          }
        });
    });

    function addAlbumArtistById(albumId, artistId, order) {
      return models.AlbumArtist.findOrCreate({
        where: { AlbumId: albumId, ArtistId: artistId },
        defaults: { order: order }
      });
    }

    router.put('/api/add/album', function(req, res) {
      var input = req.body;

      models.Album.create({
        title: input.title,
        titleNorm: input.title,
        release: new Date(input.releaseDate),
        format: input.format
      }).then(function(album) {
        var promises = [];
        var id = album.id;
        var i;

        promises.push(addAlbumArtistById(id, input.artist, 0));

        for (i in input.newSongs) {
          promises.push(addAlbumSong(id, input.newSongs[i]));
        }

        if (input.cover !== null) {
          promises.push(addAlbumCover(id, input.cover));
        }

        Promise.all(promises).then(function() {
          res.json(input.artist);
        });
      });
    });

    function addSongArtist(songId, artistName, order, feat) {
      return models.Artist.findOrCreate({
        where: { name: artistName },
        defaults: { nameNorm: artistName }
      }).spread(function(artist, created) {
        return models.SongArtist.findOrCreate({
          where: { SongId: songId, ArtistId: artist.id },
          defaults: { order: order, feat: feat }
        });
      });
    }

    function deleteSongArtist(songId, artistId) {
      return models.SongArtist.destroy({
        where: { SongId: songId, ArtistId: artistId }
      });
    }

    function updateSongArtist(songId, artistId, order, feat) {
      return models.SongArtist.update(
        {
          order: order,
          feat: feat
        },
        { where: { SongId: songId, ArtistId: artistId } }
      );
    }

    function addSongAlias(songId, alias, chart) {
      return models.SongAlias.findOrCreate({
        where: { SongId: songId, alias: alias, chart: chart }
      });
    }

    function deleteSongAlias(songId, alias, chart) {
      return models.SongAlias.destroy({
        where: { SongId: songId, alias: alias, chart: chart }
      });
    }

    function updateSongAlias(id, alias, chart) {
      return models.SongAlias.update(
        {
          alias: alias,
          chart: chart
        },
        {
          where: { id: id }
        }
      );
    }

    router.put('/api/edit/song', function(req, res) {
      var input = req.body;
      var id = input.id;
      var promises = [];

      for (var i in input.editArtists) {
        var editArtist = input.editArtists[i];
        if (editArtist.created) {
          if (editArtist.name !== null) {
            promises.push(
              addSongArtist(
                id,
                editArtist.name,
                editArtist.order,
                editArtist.feat
              )
            );
          }
        } else if (editArtist.deleted) {
          promises.push(deleteSongArtist(id, editArtist.id));
        } else {
          promises.push(
            updateSongArtist(
              id,
              editArtist.id,
              editArtist.order,
              editArtist.feat
            )
          );
        }
      }

      for (i in input.editAliases) {
        var editAlias = input.editAliases[i];
        if (editAlias.created) {
          if (editAlias.alias !== null && editAlias.chart !== null) {
            promises.push(addSongAlias(id, editAlias.alias, editAlias.chart));
          }
        } else if (editAlias.deleted) {
          promises.push(deleteSongAlias(id, editAlias.alias, editAlias.chart));
        } else {
          promises.push(
            updateSongAlias(editAlias.id, editAlias.alias, editAlias.chart)
          );
        }
      }

      Promise.all(promises)
        .then(function() {
          return models.Song.update(
            {
              title: input.title,
              titleNorm: input.titleNorm,
              plays: input.plays
            },
            { where: { id: id } }
          );
        })
        .then(function(array) {
          return models.SongArtist.findAll({
            where: { SongId: id }
          });
        })
        .then(function(songArtistArray) {
          for (var i in songArtistArray) {
            var songArtistRow = songArtistArray[i];
            if (!songArtistRow.feat && songArtistRow.order === 0) {
              res.json(songArtistRow.ArtistId);
            }
          }
        });
    });

    router.put('/api/play/song', function(req, res) {
      var input = req.body;
      var id = input.id;
      var date = new Date();

      models.Song.findOne({
        where: { id: id }
      }).then(function(song) {
        song.increment('plays');
        song.setDataValue('lastPlayed', date);
        song.save();
        res.sendStatus(200);
      });
    });

    function addAlbumChartNote(note) {
      return models.AlbumChartNote.findOrCreate({
        where: { artist: note.artist, title: note.title },
        defaults: { note: note.note }
      });
    }

    router.put('/api/add/album-chart-note', function(req, res) {
      var input = req.body;
      var promises = [];

      for (var i in input) {
        promises.push(addAlbumChartNote(input[i]));
      }

      Promise.all(promises).then(function() {
        res.sendStatus(200);
      });
    });
  };
})();
