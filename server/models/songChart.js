(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var SongChart = sequelize.define('SongChart', {
			type: { type: DataTypes.STRING, allowNull: false },
			year: { type: DataTypes.INTEGER },
			week: { type: DataTypes.INTEGER },
			rank: { type: DataTypes.INTEGER },
		});
		
		SongChart.associate = function (models) {
			SongChart.belongsTo(models.Song);			
		};

		return SongChart;
	};
}());
