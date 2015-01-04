(function() {
	'use strict';

	module.exports = function(sequelize, DataTypes) {
		var Album = sequelize.define('Album', {
			cover: DataTypes.STRING,
			title: { type: DataTypes.STRING, allowNull: false },
			realease: DataTypes.DATE,
			type: DataTypes.ENUM('Single', 'EP', 'Studio', 'Compilation')
		});

		// hasOne album: deluxe
		// belongsToMany artists (order)
		// hasMany songs (disk, track)

		return Album;
	};
}());
