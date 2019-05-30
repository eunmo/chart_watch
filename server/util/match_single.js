'use strict';

module.exports = {
	matchWeek: function (models, db, chartName, date) {

		function findArtistByName (name, chart) {
			return db.promisifyQuery("Select id from Artists " +
				"where name = \"" + name + "\" or nameNorm = \"" + name + "\" or " +
				"id = (select ArtistId from ArtistAliases where alias = \"" + name +
				"\" and chart = \"" + chart + "\")");
		}

		function normalizeName (name, chart) {
			var nameNorm = name;

			nameNorm = nameNorm.replace(/\(.*\)/g, '');

			if (chart === 'gaon') {
				nameNorm = nameNorm.replace(/[,&＆].*$/, '');
			} else if (chart === 'melon') {
				nameNorm = nameNorm.replace(/[,&＆].*$/, '');
				nameNorm = nameNorm.replace(/\sWith\s.*$/, '');
			} else if (chart === 'billboard') {
				nameNorm = nameNorm.replace(/[,&＆].*$/, '');
				nameNorm = nameNorm.replace(/\sFeaturing\s.*$/, '');
				nameNorm = nameNorm.replace(/\sDuet\sWith\s.*$/, '');
				nameNorm = nameNorm.replace(/\sAnd\s.*$/, '');
				nameNorm = nameNorm.replace(/\sFeat\..*$/, '');
				nameNorm = nameNorm.replace(/\s\+\s.*$/, '');
			} else if (chart === 'oricon') {
				nameNorm = nameNorm.replace(/\sfeat\..*$/, '');
				nameNorm = nameNorm.replace(/\swith\s.*$/, '');
				nameNorm = nameNorm.replace(/\svs\s.*$/, '');
				nameNorm = nameNorm.replace(/\s\+\s.*$/, '');
				nameNorm = nameNorm.replace(/〜.*〜$/, '');
				nameNorm = nameNorm.replace(/\/.*$/, '');
				nameNorm = nameNorm.replace(/[&＆].*$/, '');
			} else if (chart === 'deutsche') {
				nameNorm = nameNorm.replace(/[,&＆].*$/, '');
				nameNorm = nameNorm.replace(/\sfeat\..*$/, '');
				nameNorm = nameNorm.replace(/\sand\s.*$/, '');
				nameNorm = nameNorm.replace(/\s\+\s.*$/, '');
			} else if (chart === 'uk') {
				nameNorm = nameNorm.replace(/[&＆].*$/, '');
				nameNorm = nameNorm.replace(/\sFT\s.*$/, '');
				nameNorm = nameNorm.replace(/\sWITH\s.*$/, '');
				nameNorm = nameNorm.replace(/\sVS\s.*$/, '');
				nameNorm = nameNorm.replace(/\/.*$/, '');
			} else if (chart === 'francais') {
				nameNorm = nameNorm.replace(/[,&＆].*$/, '');
				nameNorm = nameNorm.replace(/\sfeat\..*$/i, '');
				nameNorm = nameNorm.replace(/\sand\s.*$/, '');
				nameNorm = nameNorm.replace(/\svs\.\s.*$/, '');
				nameNorm = nameNorm.replace(/\svs\s.*$/, '');
				nameNorm = nameNorm.replace(/\/.*$/, '');
			}

			nameNorm = nameNorm.trim();

			return nameNorm;
		}

		function normalizeNameInvert (name, chart) {
			var nameNorm = name;

			if (chart === 'gaon' || chart === 'melon') {
				nameNorm = nameNorm.replace(/.*?\(/, '');
				nameNorm = nameNorm.replace(/\).*/, '');
			}

			nameNorm = nameNorm.trim();

			return nameNorm;
		}

		function findArtist (entry) {
			var artist = entry.artist;
			var chart = entry.chart;

			return findArtistByName(artist, chart)
				.then(function (results) {
					if (results.length > 0) {
						entry.artistId = results[0].id;
					} else {
						var nameNorm = normalizeName(artist, chart);

						if (artist !== nameNorm) {
							return findArtistByName(nameNorm, chart)
								.then(function (results) {
									if (results.length > 0) {
										entry.artistId = results[0].id;
									} else {
										var nameInv = normalizeNameInvert(artist, chart);

										if (artist !== nameInv && nameNorm !== nameInv) {
											return findArtistByName(nameInv, chart)
												.then(function (results) {
													if (results.length > 0) {
														entry.artistId = results[0].id;
													}
												});
										}
									}
								});
						}
					}
				});
		}

		var findSongByArtist = function (artistId, title, chart) {
			var query = "Select id, title from Songs where id in " +
				"(select SongId from SongArtists where ArtistId = " + artistId + ") " +
				"and (title = \"" + title + "\" or title like \"" + title + " (%)\")";

			if (chart === 'francais' && title.includes('Ã\?')) {
				var titleRegex = title.replace(/Ã\?/g, '%');
				query = "Select id, title from Songs where id in " +
					"(select SongId from SongArtists where ArtistId = " + artistId + ") " +
					"and (title like \"" + titleRegex + "\")";
			}

			return db.promisifyQuery(query)
				.then(function (results) {
					if (results.length > 0) {
						return results;
					} else {
						return db.promisifyQuery(
							"Select id, title from Songs where id =" +
							"(select SongId from SongAliases where SongId in" +
							" (select SongId from SongArtists where ArtistId = " + artistId + ")" +
							" and alias = \"" + title + "\" and chart = \"" + chart + "\")");

					}
				}).then(function (results) {
					if (results.length === 0 && chart === 'oricon') {
						var titleNorm = title;

						titleNorm = titleNorm.replace(/.*?\(/, '');
						titleNorm = titleNorm.replace(/\).*/, '');
						titleNorm = titleNorm.trim();

						if (titleNorm !== title) {
							return db.promisifyQuery(
								"Select id, title from Songs where id in " +
								"(select SongId from SongArtists where ArtistId = " + artistId + ") " +
								"and title = \"" + titleNorm + "\"");

						} else {
							return results;
						}
					} else {
						return results;
					}
				});
		};

		var findAlbumSongByArtist = function (artistId, title, chart) {
			return db.promisifyQuery(
				"Select id, title from Songs where id in " +
				"(select SongId from AlbumSongs where AlbumId in " +
				"	(select AlbumId from AlbumArtists where ArtistId = " + artistId + ")) " +
				"and (title = \"" + title + "\" or title like \"" + title + " (%)\")")
				.then(function (results) {
					if (results.length > 0) {
						return results;
					} else {
						return db.promisifyQuery(
							"Select id, title from Songs where id =" +
							"(select SongId from SongAliases where SongId in" +
							" (select SongId from AlbumSongs where AlbumId in " +
							"	 (select AlbumId from AlbumArtists where ArtistId = " + artistId + ")) " +
							" and alias = \"" + title + "\" and chart = \"" + chart + "\")");

					}
				}).then(function (results) {
					if (results.length === 0 && chart === 'oricon') {
						var titleNorm = title;

						titleNorm = titleNorm.replace(/.*?\(/, '');
						titleNorm = titleNorm.replace(/\).*/, '');
						titleNorm = titleNorm.trim();

						if (titleNorm !== title) {
							return db.promisifyQuery(
								"Select id, title from Songs where id in " +
								"(select SongId from AlbumSongs where AlbumId in " +
								"	(select AlbumId from AlbumArtists where ArtistId = " + artistId + ")) " +
								"and title = \"" + titleNorm + "\"");

						} else {
							return results;
						}
					} else {
						return results;
					}
				});
		};

		var findSingleByArtist = function (artistId, title, chart) {
			return db.promisifyQuery(
				"Select id, title from Songs where id = " +
				"(select SongId from AlbumSongs where track = 1 and " + 
				" albumId = (select id from Albums where id in " +
				"(select AlbumId from AlbumArtists where ArtistId = " + artistId + " and " +
				"(title = \"" + title + "\" or title like \"" + title + " (%)\"))))");
		};

		function findSongByFunction (artistId, title, titleNorm, chart, queryFunction) {
			return queryFunction(artistId, title, chart)
				.then(function (results) {
					if (results.length === 0 && title !== titleNorm) {
						return queryFunction(artistId, titleNorm, chart);
					} else {
						return results;
					}
				});
		}

		function handleTitleException (artistId, title, chart, date) {
			if (artistId === 52) { // Bruno Mars
				var FinesseRemixDate = new Date (2018,0, 6); // 2018-01-06
				if (title === 'Finesse' ||
					title === 'FINESSE') {
					if (date >= FinesseRemixDate) {
						return 'Finesse (Remix)';
					}
				}
			} else if (artistId === 287) { // Ed Sheeran
				var PerfectDuetDate = new Date (2017, 11, 9); // 2017-12-09
				if (chart === 'billboard') {
					if (title === 'Perfect') {
						if (date >= PerfectDuetDate) {
							return 'Perfect Duet';
						}
					}
				}
			} else if (artistId === 333) { // 소녀시대
				if (chart === 'oricon') {
					if (title === 'Oh!' ||
						title === 'Run Devil Run' ||
						title === 'Gee') {
						return title + ' (Japanese Ver.)';
					}
				}
			} else if (artistId === 681) { // 방탄소년단
				if (chart === 'oricon') {
					if (title === 'MIC Drop' ||
						title === 'DNA') {
						return title + ' (Japanese Ver.)';
					}
				}
			} else if (artistId === 704) { // 동방신기
				if (chart === 'melon') {
					if (title === 'Love In The Ice') {
						return 'Love in the Ice (Korean Ver.)';
					}
				}
			} else if (artistId === 1294) { // R. Kelly
				if (chart === 'billboard' || chart === 'deutsche') {
					if (title === 'Ignition') {
						return 'Ignition Remix';
					}
				}
			} else if (artistId === 1320) { // Jennifer Lopez
				var ImRealDate = new Date(2001, 7, 25); // 2001-08-25
				var AintItFunnyDate = new Date(2001, 11, 15); // 2001-12-15
				if (chart === 'billboard') {
					if (title === 'I`m Real') {
						if (date >= ImRealDate) {
							return 'I`m Real (Murder Remix)';
						}
					} else if (title === 'Ain`t It Funny') {
						return 'Ain`t It Funny (Murder Remix)';
					} else if (title === 'I`m Gonna Be Alright') {
						return 'I`m Gonna Be Alright (Track Masters Remix)';
					}
				} else if (chart === 'deutsche') {
					if (title === 'I`m Real') {
						return 'I`m Real (Murder Remix)';
					} else if (title === 'I`m Gonna Be Alright') {
						return 'I`m Gonna Be Alright (Track Masters Remix)';
					}
				} else if (chart === 'uk') {
					if (title === 'I`M REAL') {
						return 'I`m Real (Murder Remix)';
					} else if (title === 'AIN`T IT FUNNY') {
						if (date >= AintItFunnyDate) {
							return 'Ain`t It Funny (Murder Remix)';
						}
					} else if (title === 'I`M GONNA BE ALRIGHT') {
						return 'I`m Gonna Be Alright (Track Masters Remix)';
					}
				}
			} else if (artistId === 1585) { // 50 Cent
				if (chart === 'billboard') {
					if (title === 'Outta Control (Remix)') {
						return title;
					}
				} else if (chart === 'deutsche') {
					if (title === 'Outta Control') {
						return 'Outta Control (Remix)';
					}
				} else if (chart === 'uk') {
					if (title === 'OUTTA CONTROL') {
						return 'Outta Control (Remix)';
					}
				}
			} else if (artistId === 5649) { // Luis Fonsi
				var DespacitoRemixDate = new Date (2017, 3, 22); // 2017-04-22
				if (chart === 'billboard') {
					if (title === 'Despacito') {
						if (date >= DespacitoRemixDate) {
							return 'Despacito (Remix)';
						}
					}
				}
			} else if (artistId === 6083) { // J Balvin
				var MiGenteRemixDate = new Date (2017, 8, 30); // 2017-09-30
				if (chart === 'billboard') {
					if (title === 'Mi Gente') {
						if (date >= MiGenteRemixDate) {
							return 'Mi Gente (Remix)';
						}
					}
				}
			}

			return null;
		}

		function normalizeTitle (artistId, title, chart, date) {
			var titleNorm = title;

			if (titleNorm.includes(')')) {
				titleNorm = titleNorm.replace(/\(.*/g, '');
				titleNorm = titleNorm.replace(/\).*/g, '');
			} else {
				titleNorm = titleNorm.replace(/^.*\(/, '');
			}

			if (chart === 'oricon') {
				titleNorm = titleNorm.replace(/(\s|。)feat\..*$/, '');
				titleNorm = titleNorm.replace(/\sE\.P\.$/, '');
			}

			titleNorm = titleNorm.trim();

			return titleNorm;
		}

		function getMatch (title, titleNorm, results) {
			var i, song;

			for (i in results) {
				song = results[i];

				if (song.title.toLowerCase() === title.toLowerCase()) {
					return song;
				}
			}

			return results[0];
		}

		function findSong (entry) {
			var artistId = entry.artistId;
			var title = entry.title;
			var chart = entry.chart;
			var date = entry.date;
			var titleNorm;
			var exception = handleTitleException(artistId, title, chart, date);

			if (exception !== null) {
				title = titleNorm = exception;
			} else {	
				titleNorm = normalizeTitle(artistId, title, chart, date);
			}

			if (entry.artistId === 389)
				console.log(entry);

			return findSongByFunction(artistId, title, titleNorm, chart, findSongByArtist)
				.then(function (results) {
					if (results.length > 0) {
						entry.song = getMatch(title, titleNorm, results);
					} else {
						return findSongByFunction(artistId, title, titleNorm, chart, findAlbumSongByArtist)
							.then(function (results) {
								if (results.length > 0) {
									entry.song = getMatch(title, titleNorm, results);
								} else {
									return findSongByFunction(artistId, title, titleNorm, chart, findSingleByArtist)
										.then(function (results) {
											if (results.length > 0) {
												entry.song = getMatch(title, titleNorm, results);
											}
										});
								}
							});
					}
				});
		}

		function matchChart (entry) {
			entry.artistId = null;
			entry.candidateSongs = [];
			entry.song = null;

			return findArtist (entry)
				.then (function ()	{
					if (entry.artistId !== null) {

						return findSong (entry);
					}
				}).then (function () {
					if (entry.song !== null) {
						return models.SingleChart.update (
							{ SongId: entry.song.id },
							{ where: { id: entry.id } }
						);
					}
				});
		}

		/// actual code
		return models.SingleChart.findAll ({
			where: { type: chartName, week: date },
		})
		.then(function (charts) {
			var promises = [];
			var chartRow;
			var entry;

			for (var i in charts) {
				chartRow = charts[i];

				if (chartRow.SongId === null) {
					entry = {
						id: chartRow.id,
						artist: chartRow.artist,
						title: chartRow.title,
						chart: chartName,
						date: date
					};
					promises.push (matchChart (entry));
				}
			}

			return Promise.all(promises);
		});
	}
}
