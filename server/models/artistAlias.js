(function() {
  'use strict';

  module.exports = function(sequelize, DataTypes) {
    var ArtistAlias = sequelize.define('ArtistAlias', {
      alias: { type: DataTypes.STRING, allowNull: false },
      chart: { type: DataTypes.STRING, allowNull: false }
    });

    ArtistAlias.associate = function(models) {
      ArtistAlias.belongsTo(models.Artist);
    };

    return ArtistAlias;
  };
})();
