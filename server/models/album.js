(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var Album = sequelize.define('Album', {
			title: { type: DataTypes.STRING, allowNull: false },
			titleNorm: { type: DataTypes.STRING, allowNull: false },
			release: DataTypes.DATEONLY,
			format: DataTypes.STRING, // single, EP, studio, greatest, compilation (latter 3 all full)
			format2: DataTypes.STRING, // deluxe, soundtrack, partial
			genre: DataTypes.STRING
		});

		Album.associate = function (models) {
			Album.hasOne(models.Album, {as: 'Reissue', foreignKey: 'ReissueId'});

			Album.belongsToMany(models.Artist, {through: models.AlbumArtist});

			Album.belongsToMany(models.Song, {through: models.AlbumSong});

			Album.hasMany(models.AlbumChart);
			
			Album.hasMany(models.AlbumAlias);
		};

		return Album;
	};
}());
