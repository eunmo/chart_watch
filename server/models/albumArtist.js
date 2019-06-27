(function() {
  'use strict';

  module.exports = function(sequelize, DataTypes) {
    var AlbumArtist = sequelize.define('AlbumArtist', {
      order: { type: DataTypes.INTEGER }
    });

    return AlbumArtist;
  };
})();
