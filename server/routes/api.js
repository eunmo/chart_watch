(function () {
	'use strict';

	var common = require('../common/cwcommon.js');	
	var Sequelize = require('sequelize');
	var Promise = require('bluebird');

	module.exports = function (router, models, db) {
		router.get('/api/artist', function (req, res) {
			models.Artist.findAll({
				include: [ {model: models.Album}, {model: models.Song} ],
				order: '`nameNorm`'
			}).then(function (artists) {
				res.json(artists);
			});
		});
		
		function getTableSummary (table, summary) {
			var query = "SELECT count(*) as count FROM " + table + ";";

			return db.promisifyQuery(query)
				.then(function (rows) {
					summary[table] = rows[0].count;
				});
		}
		
		router.get('/api/summary', function (req, res) {
			var promises = [];
			var summary = {};

			promises.push (getTableSummary('Artists', summary));
			promises.push (getTableSummary('Albums', summary));
			promises.push (getTableSummary('Songs', summary));

			Promise.all (promises)
			.then (function () {
				res.json (summary);
			});
		});
	};
}());
