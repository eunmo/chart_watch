(function() {
  'use strict';

  var formidable = require('formidable');
  var util = require('util');
  var path = require('path');
  var fs = require('fs');
  var Promise = require('bluebird');
  var AWS = require('aws-sdk');
  var s3config = require('../../../s3.json');
  const exec = require('../../util/exec');

  var uploadDir = path.join(__dirname, '../../../uploads/temp');
  var imageDir = path.join(__dirname, '../../../uploads/img');
  var tagScript = path.join(__dirname, '../../../perl/tag.pl');
  var imgScript = path.join(__dirname, '../../../perl/img.pl');

  module.exports = function(router, db) {
    async function getArtistIdMap(tag) {
      let map = {};

      for (var i = 0; i < tag.artist.length; i += 1) {
        let name = tag.artist[i];
        let nameNorm = tag.artistNorm[i];

        if (map[name] === undefined) {
          map[name] = await db.artist.findOrCreateForUpload(name, nameNorm);
        }
      }

      for (var i = 0; i < tag.feat.length; i += 1) {
        let name = tag.feat[i];
        let nameNorm = tag.featNorm[i];

        if (map[name] === undefined) {
          map[name] = await db.artist.findOrCreateForUpload(name, nameNorm);
        }
      }

      for (var i = 0; i < tag.albumArtist.length; i += 1) {
        let name = tag.albumArtist[i];
        let nameNorm = tag.albumArtistNorm[i];

        if (map[name] === undefined) {
          map[name] = await db.artist.findOrCreateForUpload(name, nameNorm);
        }
      }

      return map;
    }

    function moveFile(file, songId) {
      var filePath = file.path;
      var fileBuffer = fs.readFileSync(filePath);
      var s3 = new AWS.S3(s3config);
      var param = {
        Bucket: 'eunmo-music',
        Key: songId.toString(),
        ContentType: 'audio/mpeg',
        Body: fileBuffer
      };

      return new Promise(function(resolve, reject) {
        s3.putObject(param, function(error, response) {
          if (error !== null) {
            console.log('s3 error: ' + error);
            return reject();
          }
          fs.unlinkSync(filePath);
          resolve();
        });
      });
    }

    async function handleUpload(file) {
      var filePath = file.path;
      var execTagStr = 'perl ' + tagScript + ' ' + filePath;
      let tag = await exec.toJSON(execTagStr);

      let artistIdMap = await getArtistIdMap(tag);

      let albumArtists = tag.albumArtist.map(artist => artistIdMap[artist]);

      let albums = await db.promisifyQuery(
        'SELECT id FROM AlbumArtists a, Albums b ' +
          `WHERE a.ArtistId in (${albumArtists.join(
            ','
          )}) AND a.AlbumId=b.id AND title='${tag.album}'`
      );

      let albumId = null;
      if (albums.length === 0) {
        var releaseDate = new Date(Date.UTC(tag.year, tag.month, tag.day));
        albumId = await db.album.add(tag.album, releaseDate, null);

        var imgPath = path.join(imageDir, `${albumId}.jpg`);
        var execImgStr = `perl ${imgScript} ${filePath} ${imgPath}`;
        await exec.simple(execImgStr);

        var albumArtistValues = tag.albumArtist.map(
          (artist, index) => `(${index}, ${albumId}, ${artistIdMap[artist]})`
        );
        await db.promisifyQuery(
          'INSERT INTO AlbumArtists (`order`, AlbumId, ArtistId) ' +
            `VALUES ${albumArtistValues.join(',')}`
        );
      } else {
        albumId = albums[0].id;
      }

      let curMaxSongIds = await db.promisifyQuery(
        `SELECT max(id) as max FROM Songs`
      );
      let maxSongId = curMaxSongIds[0].max;

      await db.promisifyQuery(
        'INSERT INTO Songs (id, title, titleNorm, time, bitrate)' +
          `VALUES (DEFAULT, '${tag.title}', '${tag.titleNorm}', ${tag.time}, ${tag.bitrate})`
      );

      let songs = await db.promisifyQuery(
        `SELECT id FROM Songs WHERE id>${maxSongId} AND title='${tag.title}'`
      );
      let songId = songs[0].id;

      var songArtists = tag.artist.map(
        (artist, index) => `(${index}, 0, ${songId}, ${artistIdMap[artist]})`
      );

      if (tag.feat.length > 0) {
        songArtists = songArtists.concat(
          tag.feat.map(
            (artist, index) =>
              `(${index}, 1, ${songId}, ${artistIdMap[artist]})`
          )
        );
      }

      let disk = tag.disk === 0 ? 1 : tag.disk;
      await db.promisifyQuery(
        'INSERT INTO SongArtists (`order`, feat, SongId, ArtistId) ' +
          `VALUES ${songArtists.join(',')};` +
          'INSERT INTO AlbumSongs (disk, track, SongId, AlbumId) ' +
          `VALUES (${disk}, ${tag.track}, ${songId}, ${albumId})`
      );

      await moveFile(file, songId);
    }

    router.post('/upload', function(req, res) {
      var form = new formidable.IncomingForm();
      var files = [];
      var tags = [];
      var albumArtistArray = [];

      form.uploadDir = uploadDir;

      form
        .on('file', function(field, file) {
          if (file.size > 0) files.push(file);
        })
        .on('end', async function() {
          if (files.length === 0) {
            res.json(null);
          } else {
            for (var file of files) {
              await handleUpload(file);
            }
            res.redirect('/#/newSongs');
          }
        });
      form.parse(req);
    });
  };
})();
