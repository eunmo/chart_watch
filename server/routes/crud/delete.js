(function() {
  'use strict';

  var Promise = require('bluebird');
  var Sequelize = require('sequelize');

  module.exports = function(router, models) {
    router.delete('/api/artist/:_id', function(req, res) {
      var id = req.params._id;
      var promises = [];
      var songArtistCount = 0;
      var albumArtistCount = 0;
      var artistRelationCount = 0;

      promises.push(
        models.SongArtist.count({
          where: { ArtistId: id }
        }).then(function(count) {
          songArtistCount = count;
        })
      );

      promises.push(
        models.AlbumArtist.count({
          where: { ArtistId: id }
        }).then(function(count) {
          albumArtistCount = count;
        })
      );

      promises.push(
        models.ArtistRelation.count({
          where: Sequelize.or({ A: id }, { B: id })
        }).then(function(count) {
          artistRelationCount = count;
        })
      );

      Promise.all(promises).then(function() {
        if (
          songArtistCount === 0 &&
          albumArtistCount === 0 &&
          artistRelationCount === 0
        ) {
          models.Artist.destroy({
            where: { id: id }
          }).then(function() {
            res.sendStatus(200);
          });
        } else {
          res.sendStatus(200);
        }
      });
    });
  };
})();
