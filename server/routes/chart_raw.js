(function () {
	'use strict';

	var common = require('../common/cwcommon');
	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var gaonScript = path.resolve('perl/raw/gaon.pl');
	var gaonFilePrefix = path.resolve('chart/raw/g');
	var melonScript = path.resolve('perl/melon.pl');
	var melonFilePrefix = path.resolve('chart/melon/melon');
	var billboardScript = path.resolve('perl/billboard.pl');
	var billboardFilePrefix = path.resolve('chart/billboard/billboard');
	var ukScript = path.resolve('perl/uk.pl');
	var ukFilePrefix = path.resolve('chart/uk/uk');
	var oriconScript = path.resolve('perl/raw/oricon.pl');
	var oriconFilePrefix = path.resolve('chart/raw/o');
	var charts = ['gaon', 'melon', 'billboard', 'uk', 'oricon'];
	
	module.exports = function (router, models) {

		function findArtistByName (name, chart) {
			return models.sequelize.query("Select id, name from Artists where name = \"" + name + "\" or " +
																		"id = (select ArtistId from ArtistAliases where alias = \"" + name +
																		"\" and chart = \"" + chart + "\")",
																		{ type: models.sequelize.QueryTypes.SELECT });
		}

		function normalizeName (name, chart) {
			var nameNorm = name;

			nameNorm = nameNorm.replace(/\(.*\)/g, '');

			if (chart === 'gaon') {
				nameNorm = nameNorm.replace(/[,&＆].*$/, '');
			} else if (chart === 'oricon') {
				nameNorm = nameNorm.replace(/\sfeat\..*$/, '');
				nameNorm = nameNorm.replace(/\swith\s.*$/, '');
				nameNorm = nameNorm.replace(/\svs\s.*$/, '');
				nameNorm = nameNorm.replace(/\s\+\s.*$/, '');
				nameNorm = nameNorm.replace(/〜.*〜$/, '');
				nameNorm = nameNorm.replace(/\/.*$/, '');
			}

			nameNorm = nameNorm.trim();

			return nameNorm;
		}
		
		function normalizeNameInvert (name, chart) {
			var nameNorm = name;

			if (chart === 'gaon') {
				nameNorm = nameNorm.replace(/.*?\(/, '');
				nameNorm = nameNorm.replace(/\).*/, '');
			} else if (chart === 'oricon') {
			}

			nameNorm = nameNorm.trim();

			console.log(name + ' ' + nameNorm);

			return nameNorm;
		}

		function getArtist (artist, index, artists, chart) {
			return findArtistByName(artist, chart)
			.then(function (results) {
				if (results.length > 0) {
					artists[index] = results[0];
				} else {
					var nameNorm = normalizeName(artist, chart);

					if (artist !== nameNorm) {
						return findArtistByName(nameNorm, chart)
						.then(function (results) {
							if (results.length > 0) {
								artists[index] = results[0];
							} else {
								var nameInv = normalizeNameInvert(artist, chart);

								if (artist !== nameInv && nameNorm !== nameInv) {
									return findArtistByName(nameInv, chart)
									.then(function (results) {
										if (results.length > 0) {
											artists[index] = results[0];
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
			return models.sequelize.query("Select id, title from Songs where id in " +
																		"(select SongId from SongArtists where ArtistId = " + artistId + ") " +
																		"and (title = \"" + title + "\" or title like \"" + title + " (%)\")",
																		{ type: models.sequelize.QueryTypes.SELECT })
			.then(function (results) {
				if (results.length > 0) {
					return results;
				} else {
					return models.sequelize.query("Select id, title from Songs where id =" +
																				"(select SongId from SongAliases where SongId in" +
																				" (select SongId from SongArtists where ArtistId = " + artistId + ")" +
																				" and alias = \"" + title + "\" and chart = \"" + chart + "\")",
																				{ type: models.sequelize.QueryTypes.SELECT });

				}
			});
		};

		var findAlbumSongByArtist = function (artistId, title, chart) {
			return models.sequelize.query("Select id, title from Songs where id in " +
																		"(select SongId from AlbumSongs where AlbumId in " +
																	  "	(select AlbumId from AlbumArtists where ArtistId = " + artistId + ")) " +
																		"and (title = \"" + title + "\" or title like \"" + title + " (%)\")",
																		{ type: models.sequelize.QueryTypes.SELECT });
		};

		var findSingleByArtist = function (artistId, title, chart) {
			return models.sequelize.query("Select id, title from Songs where id = " +
																		"(select SongId from AlbumSongs where track = 1 and " + 
																		" albumId = (select id from Albums where id in " +
																		             "(select AlbumId from AlbumArtists where ArtistId = " + artistId + " and " +
																								 "(title = \"" + title + "\" or title like \"" + title + " (%)\"))))",
																		{ type: models.sequelize.QueryTypes.SELECT });
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

		function normalizeTitle (artistId, title, chart, date) {
			var titleNorm = title;

			titleNorm = titleNorm.replace(/\(.*/g, '');

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

				if (song.title === title) {
					return song;
				}
			}
			
			for (i in results) {
				song = results[i];

				if (song.title === titleNorm) {
					return song;
				}
			}

			return results[0];
		}

		function getSong (artistId, title, index, songs, chart, date) {
			var titleNorm = normalizeTitle(artistId, title, chart, date);

			return findSongByFunction(artistId, title, titleNorm, chart, findSongByArtist)
			.then(function (results) {
				if (results.length > 0) {
					songs[index] = getMatch(title, titleNorm, results);
				} else {
					return findSongByFunction(artistId, title, titleNorm, chart, findAlbumSongByArtist)
					.then(function (results) {
						if (results.length > 0) {
							songs[index] = getMatch(title, titleNorm, results);
						} else {
							return findSongByFunction(artistId, title, titleNorm, chart, findSingleByArtist)
							.then(function (results) {
								if (results.length > 0) {
									songs[index] = getMatch(title, titleNorm, results);
								}	
							});
						}
					});
				}
			});
		}

		function addSong (chart, date, rank, order, songId) {
			return models.SCTest.create({
				type: chart,
				week: date,
				rank: rank,
				order: order,
				SongId: songId
			}).catch(function (errors) {
			});
		}

		function getArtistId (rows) {
			var i, row;

			for (i in rows) {
				row = rows[i];
				return row.Song.Artists[0].id;
			}
		}

		function getDBArtist (rows) {
			var i, row;

			for (i in rows) {
				row = rows[i];
				return row.Song.Artists[0];
			}
		}

		function getChartSong (id, arr, idx) {
			return models.Song.findOne({
				where: { id: id },
				include: [
					{ model: models.Album },
					{ model: models.Artist, include: [
						{ model: models.Artist, as: 'Group' }
					]}
				]
			})
			.then(function (song) {
				arr[idx] = song;
			});
		}

		function getChart (req, res, chartName, chartScript, filePrefix) {
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var artistArray = [];
			var chartFile = filePrefix + '.' + year +
											(month < 10 ? '.0' : '.') + month +
											(day < 10 ? '.0' : '.') + day;
			var date = new Date(year, month - 1, day);
			var webData;
			var promises = [];
			var execStr;
			var i, j;
			var row, title;
			var artists = [];
			var results = [];
			var dbSongs = [];

			if (fs.existsSync(chartFile) && fs.statSync(chartFile).size > 1024) {
				execStr = 'cat ' + chartFile;
			} else {
				execStr = 'perl ' + chartScript + ' ' + year + ' ' + month + ' ' + day + ' | tee ' + chartFile;
			}

			exec(execStr)
			.spread(function (stdout, stderr) {
				webData = JSON.parse(stdout);
				
				return models.SCTest.findAll({
					where: { type: chartName, week: date },
					include: [
						{ model: models.Song,
							include: [
								{ model: models.Album },
								{ model: models.Artist, include: [
									{ model: models.Artist, as: 'Group' }
								]}
							]
					}
					]
				})
				.then(function (charts) {

					for (i in charts) {
						row = charts[i];

						if (results[row.rank] === undefined) {
							results[row.rank] = [];
						}

						results[row.rank][row.order] = row;
						results[row.rank][row.order].found = true;
					}

					for (i in webData) {
						row = webData[i];

						if (results[row.rank] === undefined) {
							promises.push(getArtist(row.artist, row.rank, artists, chartName));
						}
					}

					return Promise.all(promises);
				});
			})
			.then(function ()	{
				var artist;
				promises = [];

				for (i in webData) {
					row = webData[i];

					artist = artists[row.rank];

					if (artist) {
						artist.songs = [];
						for (j in row.titles) {
							title = row.titles[j];
							promises.push(getSong(artist.id, title, j, artist.songs, chartName, date));
						}
					}	else if (results[row.rank]) {
						for (j in row.titles) {
							title = row.titles[j];
							if (results[row.rank][j] === undefined) {
								promises.push(getSong(getArtistId(results[row.rank]), title, j, results[row.rank], chartName, date));
							}
						}
					}	
				}

				return Promise.all(promises);
			})
			.then(function () {
				var artist, song, index = 0;
				promises = [];

				for (i in webData) {
					row = webData[i];

					artist = artists[row.rank];

					if (artist) {
						for (j in row.titles) {
							song = artist.songs[j];
							if (song) {
								song = artist.songs[j];
								promises.push(addSong(chartName, date, row.rank, j, song.id));
								promises.push(getChartSong(song.id, dbSongs, index++));
							}
						}
					} else if (results[row.rank]) {
						for (j in row.titles) {
							if (results[row.rank][j] !== undefined && !results[row.rank][j].found) {
								song = results[row.rank][j];
								promises.push(addSong(chartName, date, row.rank, j, song.id));
								promises.push(getChartSong(song.id, dbSongs, index++));
							}
						}
					}
				}

				return Promise.all(promises);
			})
			.then(function () {
				var artist, song, songArtists, index = 0;
				var chart = [];

				for (i in webData) {
					row = webData[i];

					artist = artists[row.rank];

					if (artist) {
						for (j in row.titles) {
							song = artist.songs[j];
							if (song) {
								song = dbSongs[index++];
								songArtists = common.getSongArtists(song);
								chart.push({ index: row.rank, artistFound: true, songFound: true, song: song, songArtists: songArtists });
							} else {
								title = row.titles[j];
								chart.push({ index: row.rank, artistFound: true, artistRaw: row.artist, songFound: false, song: title, artist: artist });
							}
						}
					} else if (results[row.rank]) {
						for (j in row.titles) {
							if (results[row.rank][j] === undefined) {
								title = row.titles[j];
								chart.push({ index: row.rank, artistFound: true, artistRaw: row.artist, songFound: false, song: title, artist: getDBArtist(results[row.rank]) });
							} else if (results[row.rank][j].found) {
								song = results[row.rank][j].Song;
								songArtists = common.getSongArtists(song);
								chart.push({ index: row.rank, artistFound: true, songFound: true, song: song, songArtists: songArtists });
							} else {
								song = dbSongs[index++];
								songArtists = common.getSongArtists(song);
								chart.push({ index: row.rank, artistFound: true, songFound: true, song: song, songArtists: songArtists });
							}
						}
					} else {
						for (j in row.titles) {
							title = row.titles[j];
							chart.push({ index: row.rank, artistFound: false, songFound: false, song: title, artist: row.artist }); 
						}
					}
				}
				res.json(chart);
			});
		}
		
		router.get('/chart/gaonRaw', function (req, res) {
			getChart(req, res, 'gaon', gaonScript, gaonFilePrefix);
		});

		router.get('/chart/oriconRaw', function (req, res) {
			getChart(req, res, 'oricon', oriconScript, oriconFilePrefix);
		});

	};
}());
