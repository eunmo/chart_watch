(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var ArtistGroup = sequelize.define('ArtistGroup', {
			primary: { type: DataTypes.BOOLEAN, defaultValue: false }
		});

		return ArtistGroup;
	};
}());
