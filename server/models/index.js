(function() {
	"use strict";

	var fs        = require('fs');
	var path      = require('path');
	var Sequelize = require('sequelize');
	var dbconfig = require(process.env.PWD + '/db.json');
	var sequelize = new Sequelize(dbconfig.uri);
	var db        = {};

	var modelDir = path.resolve('server/models');

	fs.readdirSync(modelDir)
		.filter(function(file) {
			return (file.indexOf('.') !== 0) && (file !== 'index.js') &&
				(path.extname(file) !== '.sql');
		})
		.forEach(function(file) {
			var model = sequelize['import'](path.join(modelDir, file));
			db[model.name] = model;
		});

	Object.keys(db).forEach(function(modelName) {
		if ('associate' in db[modelName]) {
			db[modelName].associate(db);
		}
	});

	db.sequelize = sequelize;
	db.Sequelize = Sequelize;

	module.exports = db;
}());
