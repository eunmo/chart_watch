(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var ChartExtra = sequelize.define('ChartExtra', {
			type: { type: DataTypes.STRING, allowNull: false },
			week: { type: DataTypes.DATEONLY, allowNull: false },
			name: { type: DataTypes.STRING, allowNull: false },
			title: { type: DataTypes.STRING, allowNull: false },
		});
		
		return ChartExtra;
	};
}());
