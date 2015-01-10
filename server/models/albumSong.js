(function() {
	'use strict';

	module.exports = function(sequelize, DataTypes) {
		var AlbumSong = sequelize.define('AlbumSong', {
			disk: { type: DataTypes.INTEGER,  defaultValue: 0 },
			track: DataTypes.INTEGER,
		});

		return AlbumSong;
	};
}());
