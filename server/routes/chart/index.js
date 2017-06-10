(function () {
  'use strict';
		
	var path = require('path');
	var fs = require('fs');
	
	var dir = path.resolve('server/routes/chart');	
	
	module.exports = function (router, models, db) {

		function getRoutes (dir, skipCurIndex) {
			fs.readdirSync(dir)
				.filter(function (file) {
					return (file.indexOf('.js') > 0 && file.indexOf('.swp') < 0 &&
									!(skipCurIndex && file === 'index.js'));
				}).forEach(function (file) {
					require(path.join(dir, file))(router, models, db);
				});
		}

		fs.readdirSync(dir)
			.filter(function (subDir) {
				return (subDir.indexOf('.js') < 0);
			}).forEach(function (subDir) { 
				getRoutes(path.join(dir, subDir), false);
			});
		
		getRoutes(dir, true);
	};
}());
