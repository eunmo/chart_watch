(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var SongChart = sequelize.define('SongChart', {
			type: { type: DataTypes.STRING, allowNull: false },
			week: { type: DataTypes.DATEONLY, allowNull: false },
			rank: { type: DataTypes.INTEGER, allowNull: false },
			order: { type: DataTypes.INTEGER },
		});
		
		SongChart.associate = function (models) {
			SongChart.belongsTo(models.Song);			
		};

		return SongChart;
	};
}());
