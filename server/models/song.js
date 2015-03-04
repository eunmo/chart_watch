(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var Song = sequelize.define('Song', {
			title: { type: DataTypes.STRING, allowNull: false },
			titleNorm: { type: DataTypes.STRING, allowNull: false },
			skit: { type: DataTypes.BOOLEAN, defaultValue: false },
			plays: { type: DataTypes.INTEGER, defaultValue: 0 },
			lastPlayed: DataTypes.DATE,
			time: DataTypes.INTEGER,
			bitrate: DataTypes.INTEGER
		});

		Song.associate = function (models) {
			Song.belongsToMany(models.Album, {through: models.AlbumSong});			
			
			Song.belongsToMany(models.Artist, {through: models.SongArtist});

			Song.hasMany(models.SongChart);
		};

		// (tentative) hasOne song (for skits)

		return Song;
	};
}());
