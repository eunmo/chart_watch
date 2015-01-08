(function() {
	'use strict';

	module.exports = function(sequelize, DataTypes) {
		var Song = sequelize.define('Song', {
			file: { type: DataTypes.STRING, allowNull: false },
			title: { type: DataTypes.STRING, allowNull: false },
			skit: { type: DataTypes.BOOLEAN, defaultValue: false },
			plays: { type: DataTypes.INTEGER, defaultValue: 0 },
			lastPlayed: DataTypes.DATE,
			time: DataTypes.INTEGER,
			bitrate: DataTypes.INTEGER
		});

		Song.associate = function(models) {
			Song.belongsToMany(models.Album, {through: models.Track});			
		};

		// (tentative) hasOne song (for skits)
		// hasMany albums
		// hasMany artists (order): main
		// hasMany artists (order): feat 

		return Song;
	};
}());
