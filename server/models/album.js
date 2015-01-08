(function() {
	'use strict';

	module.exports = function(sequelize, DataTypes) {
		var Album = sequelize.define('Album', {
			cover: DataTypes.STRING,
			title: { type: DataTypes.STRING, allowNull: false },
			realease: DataTypes.DATE,
			type: DataTypes.ENUM('Single', 'EP', 'Studio', 'Compilation')
		});

		Album.associate = function(models) {
			Album.hasOne(models.Album, {as: 'Deluxe', foreignKey: 'DeluxeId'});
			Album.belongsToMany(models.Song, {as: 'Track', through: models.Track});
		};

		// hasOne album: deluxe
		// hasMany artists (order)
		// hasMany songs (disk, track)

		return Album;
	};
}());
