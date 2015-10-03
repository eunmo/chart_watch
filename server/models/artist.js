(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var Artist = sequelize.define('Artist', {
			name: { type: DataTypes.STRING, allowNull: false, unique: true },
			nameNorm: { type: DataTypes.STRING, allowNull: false, unique: true },
			origin: DataTypes.STRING,
			type: DataTypes.ENUM('Solo', 'Duet', 'Group'),
			gender: DataTypes.ENUM('Male', 'Female', 'Mixed')
		});

		Artist.associate = function (models) {
			Artist.belongsToMany(models.Album, {through: models.AlbumArtist});

			Artist.belongsToMany(models.Artist,
													 { through: models.ArtistGroup,
													   as: 'Group',
													   foreignKey: 'MemberId'});
			Artist.belongsToMany(models.Artist,
													 { through: models.ArtistGroup,
													   as: 'Member',
													   foreignKey: 'GroupId'});
			
			Artist.belongsToMany(models.Song, {through: models.SongArtist});
			
			Artist.hasMany(models.ArtistAlias);
		};

		// need views to show notable songs

		return Artist;
	};
}());
