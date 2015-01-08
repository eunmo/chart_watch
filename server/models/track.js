(function() {
	'use strict';

	module.exports = function(sequelize, DataTypes) {
		var Track = sequelize.define('Track', {
			disk: { type: DataTypes.INTEGER,  defaultValue: 0 },
			track: DataTypes.INTEGER,
		});

		return Track;
	};
}());
