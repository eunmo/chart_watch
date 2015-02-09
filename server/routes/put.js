(function () {
	'use strict';

	module.exports = function (router, models) {
		router.put('/api/edit/artist', function (req, res) {
			var input = req.body;
			var id = input.id;
			console.log(req.body);
			models.Artist.update({
				origin: input.origin,
				type: input.type,
				gender: input.gender
		 	},
			{	where: { id: id }	}
			).then(function (array) {
				res.json(id);
			});
		});
	};
}());
