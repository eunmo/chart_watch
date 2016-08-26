(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var AlbumChart = sequelize.define('AlbumChart', {
			type: { type: DataTypes.STRING, allowNull: false },
			week: { type: DataTypes.DATEONLY, allowNull: false },
			rank: { type: DataTypes.INTEGER, allowNull: false },
			artist: { type: DataTypes.STRING, allowNull: false },
			title: { type: DataTypes.STRING, allowNull: false },
		});
		
		AlbumChart.associate = function (models) {
			AlbumChart.belongsTo (models.Album);
		};

		return AlbumChart;
	};
}());
