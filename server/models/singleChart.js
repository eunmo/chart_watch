(function() {
  'use strict';

  module.exports = function(sequelize, DataTypes) {
    var SingleChart = sequelize.define('SingleChart', {
      type: { type: DataTypes.STRING, allowNull: false },
      week: { type: DataTypes.DATEONLY, allowNull: false },
      rank: { type: DataTypes.INTEGER, allowNull: false },
      order: { type: DataTypes.INTEGER },
      artist: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false }
    });

    SingleChart.associate = function(models) {
      SingleChart.belongsTo(models.Song);
    };

    return SingleChart;
  };
})();
