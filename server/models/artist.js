(function() {
	'use strict';

	module.exports = function(sequelize, DataTypes) {
		var Artist = sequelize.define('Artist', {
			name: { type: DataTypes.STRING, allowNull: false, unique: true },
			origin: DataTypes.STRING,
			type: DataTypes.ENUM('Solo', 'Duet', 'Group'),
			gender: DataTypes.ENUM('Male', 'Female', 'Mixed')
		});

		// hasMany albums
		// hasMany artists: affiliation
		// hasMany songs (order): main
		// hasMany songs (order): feat

		// need views to show notable songs

		return Artist;
	};
}());
