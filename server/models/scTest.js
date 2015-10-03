(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var SCTest = sequelize.define('SCTest', {
			type: { type: DataTypes.STRING, allowNull: false },
			week: { type: DataTypes.DATEONLY, allowNull: false },
			rank: { type: DataTypes.INTEGER, allowNull: false },
			order: { type: DataTypes.INTEGER },
		});
		
		SCTest.associate = function (models) {
			SCTest.belongsTo(models.Song);			
		};

		return SCTest;
	};
}());
