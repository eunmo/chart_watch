(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var AlbumAlias = sequelize.define('AlbumAlias', {
			alias: { type: DataTypes.STRING, allowNull: false },
			chart: { type: DataTypes.STRING, allowNull: false },
		});
		
		AlbumAlias.associate = function (models) {
			AlbumAlias.belongsTo(models.Album);			
		};

		return AlbumAlias;
	};
}());
