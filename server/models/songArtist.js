(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var SongArtist = sequelize.define('SongArtist', {
			order: { type: DataTypes.INTEGER },
			feat: { type: DataTypes.BOOLEAN, defaultValue: false }
		});

		return SongArtist;
	};
}());
