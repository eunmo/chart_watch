(function () {
	'use strict';

	var path = require('path');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var gaonScript = path.resolve('perl/gaon.pl');
	
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

		function getChartSong (title, artistName, artistArray, i) {
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

							for (j in fullArtist.Songs[0].Artists) {
								artistRow = fullArtist.Songs[0].Artists[j];
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

							artistArray[i] = { index: Number(i) + 1, artistFound: true, songFound: true, song: fullArtist.Songs[0], songArtists: songArtists };
						} else {
							artistArray[i] = { index: Number(i) + 1, artistFound: true, songFound: false, song: title, artist: artist };
						}
					});
				}
			});
		}

		router.get('/chart/gaon', function (req, res) {
			var year = req.query.year;
			var week = req.query.week;

			var execStr = 'perl ' + gaonScript + ' ' + week + ' ' + year;

			exec(execStr)
			.spread(function (stdout, stderr) {
				var chart = JSON.parse(stdout);
				var i, row;
				var promises = [];
				var artistArray = [];

				for (i in chart) {
					row = chart[i];
					promises[i] = getChartSong (row.song, row.artist, artistArray, i);
				}

				Promise.all(promises)
				.then(function () {
					res.json(artistArray);
				});
			});
		});
	};
}());
