(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var Artist = sequelize.define('Artist', {
			name: { type: DataTypes.STRING, allowNull: false, unique: true },
			nameNorm: { type: DataTypes.STRING, allowNull: false, unique: true },
			origin: DataTypes.STRING,
			type: DataTypes.ENUM('Solo', 'Duet', 'Group'),
			gender: DataTypes.ENUM('Male', 'Female', 'Mixed'),
			favorites: DataTypes.BOOLEAN
		});

		Artist.associate = function (models) {
			Artist.belongsToMany(models.Album, {through: models.AlbumArtist});

			Artist.belongsToMany(models.Artist,
													 { through: models.ArtistRelation,
													   as: 'B',
													   foreignKey: 'A',
													 	 otherKey: 'B'});
			Artist.belongsToMany(models.Artist,
													 { through: models.ArtistRelation,
													   as: 'A',
													   foreignKey: 'B',
													 	 otherKey: 'A'});
			
			Artist.belongsToMany(models.Song, {through: models.SongArtist});
			
			Artist.hasMany(models.ArtistAlias);
		};

		return Artist;
	};
}());
