(function() {
  'use strict';
  module.exports = function(router, _, db) {
    router.get('/api/edit/artist/:_id', async function(req, res) {
      var id = req.params._id;

      let artists = await db.promisifyQuery(
        `SELECT * FROM Artists WHERE id=${id}`
      );
      let artist = artists[0];

      artist.bs = await db.promisifyQuery(
        'SELECT a.type, `order`, b.id, name ' +
          'FROM ArtistRelations a, Artists b ' +
          `WHERE a.A=${id} AND a.B=b.id`
      );

      artist.aliases = await db.promisifyQuery(
        `SELECT * FROM ArtistAliases WHERE ArtistId=${id}`
      );

      res.json(artist);
    });

    router.get('/api/edit/album/:_id', async function(req, res) {
      var id = req.params._id;

      let albums = await db.promisifyQuery(
        `SELECT * FROM Albums WHERE id=${id}`
      );
      let album = albums[0];

      album.artists = await db.promisifyQuery(
        'SELECT `order`, ArtistId, name ' +
          'FROM AlbumArtists a, Artists b ' +
          `WHERE a.AlbumId=${id} AND a.ArtistId=b.id`
      );

      album.songs = await db.promisifyQuery(
        'SELECT disk, track, SongId, title ' +
          'FROM AlbumSongs a, Songs b ' +
          `WHERE a.AlbumId=${id} AND a.SongId=b.id`
      );

      album.aliases = await db.promisifyQuery(
        `SELECT * FROM AlbumAliases WHERE AlbumId=${id}`
      );

      res.json(album);
    });

    router.get('/api/edit/song/:_id', async function(req, res) {
      var id = req.params._id;

      let songs = await db.promisifyQuery(`SELECT * FROM Songs WHERE id=${id}`);
      let song = songs[0];

      song.artists = await db.promisifyQuery(
        'SELECT `order`, feat, ArtistId, name ' +
          'FROM SongArtists a, Artists b ' +
          `WHERE a.SongId=${id} AND a.ArtistId=b.id`
      );

      song.aliases = await db.promisifyQuery(
        `SELECT * FROM SongAliases WHERE SongId=${id}`
      );

      res.json(song);
    });
  };
})();
