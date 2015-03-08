(function () {
	'use strict';

	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var gaonScript = path.resolve('perl/gaon.pl');
	var gaonFilePrefix = path.resolve('chart/gaon/gaon');
	var melonScript = path.resolve('perl/melon.pl');
	var melonFilePrefix = path.resolve('chart/melon/melon');
	
	var artistCmpOrder = function (a, b) {
		return a.order - b.order;
	};

	var getPrimaryGroup = function (artist) {
		var primaryGroup = null;
		for (var i in artist.Group) {
			var group = artist.Group[i];
			if (group.ArtistGroup.primary) {
				primaryGroup = {
					name: group.name,
					id: group.id
				};
				break;
			}
		}
		return primaryGroup;
	};

	module.exports = function (router, models) {

		function getSongArtists (song) {
			var songArtists = [];
			var j;
			var artistRow, songArtist;

			for (j in song.Artists) {
				artistRow = song.Artists[j];
				if (!artistRow.SongArtist.feat) {
					songArtist = {
						id: artistRow.id,
						name: artistRow.name,
						order: artistRow.SongArtist.order,
						primaryGroup: getPrimaryGroup(artistRow)
					};
					songArtists.push(songArtist);
				}
			}

			songArtists.sort(artistCmpOrder);

			return songArtists;
		}

		function getChartSong (title, artistName, artistArray, i, year, week, chart) {
			return models.Artist.findOne({ where: { name: artistName } })
			.then(function (artist) {
				if (!artist) {
					artistArray[i] = { index: Number(i) + 1, artistFound: false, songFound: false, song: title, artist: artistName };
				}

				if (artist) {
					return models.Artist.findOne({
						where: { id: artist.id },
						include: [
							{ model: models.Song,
								where: { title: { like: title + '%' } },
								include: [
									{ model: models.Album },
									{ model: models.Artist, include: [
										{ model: models.Artist, as: 'Group' }
									]}
							 	]
							} 
						]
					})
					.then(function (fullArtist) {
						if (fullArtist) {
							var songArtists = [];
							var j;
							var artistRow, songArtist;
							var index = 0;

							for (j in fullArtist.Songs) {
								if (fullArtist.Songs[j].title === title) {
									index = j;
									break;
								}
							}

							for (j in fullArtist.Songs[index].Artists) {
								artistRow = fullArtist.Songs[index].Artists[j];
								if (!artistRow.SongArtist.feat) {
									songArtist = {
										id: artistRow.id,
										name: artistRow.name,
										order: artistRow.SongArtist.order,
										primaryGroup: getPrimaryGroup(artistRow)
									};
									songArtists.push(songArtist);
								}
							}

							songArtists.sort(artistCmpOrder);

							artistArray[i] = { index: Number(i) + 1, artistFound: true, songFound: true, song: fullArtist.Songs[index], songArtists: songArtists };

							return models.SongChart.create({
								type: chart,
								year: year,
								week: week,
								rank: Number(i) + 1,
								SongId: fullArtist.Songs[index].id
							});
						} else {
							artistArray[i] = { index: Number(i) + 1, artistFound: true, songFound: false, song: title, artist: artist };
						}
					});
				}
			});
		}

		function getChart (req, res, chartName, chartScript, filePrefix) {
			var year = req.query.year;
			var week = req.query.week;
			var artistArray = [];
			var chartFile = filePrefix + '.' + year + (week < 10 ? '.0' : '.') + week;

			models.SongChart.findAll({
				where: { type: chartName, year: year, week: week },
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
				var i, row, rank, song;
				var execStr;

				for (i in charts) {
					row = charts[i];
					rank = row.rank;
					song = row.Song;
					artistArray[rank - 1] = { index: rank, artistFound: true, songFound: true, song: song, songArtists: getSongArtists(song) };
				}

				if (fs.existsSync(chartFile)) {
					execStr = 'cat ' + chartFile;
				} else {
					execStr = 'perl ' + chartScript + ' ' + week + ' ' + year + ' | tee ' + chartFile;
				}
				return exec(execStr);
			})
			.spread(function (stdout, stderr) {
				var chart = JSON.parse(stdout);
				var i, row;
				var promises = [];

				for (i in chart) {
					if (artistArray[i] !== undefined)
						continue;
					row = chart[i];
					promises[i] = getChartSong (row.song, row.artist, artistArray, i, year, week, chartName);
				}

				Promise.all(promises)
				.then(function () {
					res.json(artistArray);
				});
			});
		}

		router.get('/chart/gaon', function (req, res) {
			getChart(req, res, 'gaon', gaonScript, gaonFilePrefix);
		});

		router.get('/chart/melon', function (req, res) {
			getChart(req, res, 'melon', melonScript, melonFilePrefix);
		});
	};
}());
