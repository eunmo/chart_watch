(function () {
	'use strict';

	var Promise = require('bluebird');

	module.exports = function (router, models) {
		router.put('/api/edit/artist', function (req, res) {
			var input = req.body;
			var id = input.id;

			models.Artist.findOne({
				where: { name: input.name, id: {ne: id} }
			}).then (function (artist) {
				console.log(artist);
				if (artist !== null) {
					id = artist.id;
					return new Promise(function (resolve, reject) {
						resolve();
					});
				}
				return models.Artist.update({
					name: input.name,
					origin: input.origin,
					type: input.type,
					gender: input.gender
				},
				{	where: { id: id }	});
			}).then(function (array) {
				res.json(id);
			});
		});
	};
}());
