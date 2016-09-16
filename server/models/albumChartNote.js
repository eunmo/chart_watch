(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var AlbumChartNote = sequelize.define('AlbumChartNote', {
			artist: { type: DataTypes.STRING, allowNull: false },
			title: { type: DataTypes.STRING, allowNull: false },
			note: { type: DataTypes.STRING, allowNull: false },
		});

		return AlbumChartNote;
	};
}());
