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
			Album.hasOne(models.Album, {as: 'Reissue', foreignKey: 'ReissueId'});

			Album.belongsToMany(models.Artist, {through: models.AlbumArtist});

			Album.belongsToMany(models.Song, {through: models.AlbumSong});
		};

		return Album;
	};
}());
