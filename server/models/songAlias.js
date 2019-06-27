(function() {
  'use strict';

  module.exports = function(sequelize, DataTypes) {
    var SongAlias = sequelize.define('SongAlias', {
      alias: { type: DataTypes.STRING, allowNull: false },
      chart: { type: DataTypes.STRING, allowNull: false }
    });

    SongAlias.associate = function(models) {
      SongAlias.belongsTo(models.Song);
    };

    return SongAlias;
  };
})();
