(function () {
	'use strict';

	module.exports = function (sequelize, DataTypes) {
		var ArtistRelation = sequelize.define('ArtistRelation', {
			type: { type: DataTypes.STRING, allowNull: false },
			order: DataTypes.INTEGER
		});

		/* Type table.
		 *
		 * In general, B is displayed along with A,
		 * and A's songs/albums are shown in B's page.
		 *
		 * B of a unit group will be displayed iff there are no relation (A p B).
		 *
		 * A a B -> A is an alias of B (B is more commonly known)
		 * A c B -> A is a character enacted by B
		 * A f B -> A is a former member of B
		 * A m B -> A is a member of B (primary group)
		 * A u B -> A is an unit group of B
		 * A p B -> A is a project group comprised of B (need order)
		 */

		return ArtistRelation;
	};
}());
