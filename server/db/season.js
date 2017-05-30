(function () {
	"use strict";
		
	var getSeasonalWeeks = function (date) {
		var dates = "";
		var mm = date.getMonth();
		var dd = date.getDate();
		var append = false;

		for (var yy = date.getFullYear() - 1; yy >= 2000; yy--) {
			date = new Date(Date.UTC(yy, mm, dd));
			date.setDate(date.getDate() + (6 - date.getDay()));

			if (append) {
				dates += ",";
			}

			dates += "'" + date.getFullYear() +
				"-" + (date.getMonth() + 1) +
				"-" + date.getDate() + "'";
			append = true;
		}

		return dates;
	};

	module.exports = function (db) {
		db.season = {};

		db.season.getSongsOfThisWeek = function () {
			var weeks = getSeasonalWeeks(new Date());
			var query =
				"SELECT week, SongId, type, rank " +
				"FROM SongCharts " +
				"WHERE rank <= " + 5 + " " +
				"AND week IN (" + weeks + ") AND `order` = 0;";

			return db.promisifyQuery(query);
		};
	};
}());
		
