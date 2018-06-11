(function () {
	"use strict";
		
	var getSeasonalWeeks = function (date) {
		var dates = "";
		var mm = date.getMonth();
		var dd = date.getDate();
		var append = false;

		/*
		for (var yy = date.getFullYear() - 1; yy >= 2000; yy--) {
			date = new Date(Date.UTC(yy, mm, dd));
			date.setDate(date.getDate() + (6 - date.getDay()));

			if (append) {
				dates += ",";
			}

			dates += "'" + date.toISOString() + "'";
			append = true;
		}
		*/

		var i;
		
		for (var yy = date.getFullYear() - 1; yy >= 2000; yy--) {
			i = 0;
			while (true) {
				date = new Date(Date.UTC(yy, mm, dd + i * 7));

				if (date.getMonth() === 6 && date.getDate() >= 7)
					break;

				date.setDate(date.getDate() + (6 - date.getDay()));

				if (append) {
					dates += ",";
				}

				dates += "'" + date.toISOString() + "'";
				append = true;
				i++;
			}
		}

		console.log(dates);

		return dates;
	};

	module.exports = function (db) {
		db.season = {};

		db.season.getSongsOfThisWeek = function () {
			var weeks = getSeasonalWeeks(new Date());
			var query =
				"SELECT week, SongId, type, rank " +
				"FROM SingleCharts " +
				"WHERE rank <= " + 5 + " " +
				"AND week IN (" + weeks + ") AND `order` = 0 AND SongId is not null;";

			return db.promisifyQuery(query);
		};

		db.season.getAllSongsOfThisWeek = function () {
			var weeks = getSeasonalWeeks(new Date());
			var query =
				"SELECT SongId as id " +
				"FROM SingleCharts " +
				"WHERE rank <= " + 5 + " " +
				"AND week IN (" + weeks + ") AND SongId is not null " +
				"ORDER BY week DESC, rank;";

			return db.promisifyQuery(query);
		};
	};
}());
		
