(function () {
  'use strict';
		
	var path = require('path');
	var fs = require('fs');
	
	module.exports = function (router, models, db) {

		function getRoutes (__dirname, skipCurIndex) {
			fs.readdirSync(__dirname)
				.filter(function (file) {
					return (file.indexOf('.js') > 0 && file.indexOf('.swp') < 0 &&
									!(skipCurIndex && file === 'index.js'));
				}).forEach(function (file) {
					require(path.join(__dirname, file))(router, models, db);
				});
		}

		fs.readdirSync(__dirname)
			.filter(function (subDir) {
				return (subDir.indexOf('.js') < 0);
			}).forEach(function (subDir) { 
				getRoutes(path.join(__dirname, subDir), false);
			});
		
		getRoutes(__dirname, true);
	};
}());
