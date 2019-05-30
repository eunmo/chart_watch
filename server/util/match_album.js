'use strict';

module.exports = {
	matchWeek: function (models, chartName, date) {

		function findAlbum (entry) {
			var query = "SELECT id FROM Albums WHERE title = \"" + entry.title + "\" " +
									"UNION " + 
									"SELECT AlbumId as id from AlbumAliases " +
									"WHERE alias = \"" + entry.title + "\" " +
										"AND chart = \"" + entry.chart + "\";";
			
			if (entry.chart === 'francais' && entry.title.includes('Ã\?')) {
				var titleRegex = entry.title.replace(/Ã\?/g, '%');
				console.log(titleRegex);
				query = "SELECT id FROM Albums WHERE title like \"" + titleRegex + "\" " +
								"UNION " + 
								"SELECT AlbumId as id from AlbumAliases " +
								"WHERE alias = \"" + entry.title + "\" " +
									"AND chart = \"" + entry.chart + "\";";
			}

			return models.sequelize.query (query,
																		 { type: models.sequelize.QueryTypes.SELECT })
			.then (function (albums) {
				if (albums.length > 0) {
					entry.candidateAlbums = albums;
				}
			});
		}

		function findArtistAlias (entry) {
			var query = "SELECT aa.AlbumId, ar.alias, ar.ArtistId " +
									"FROM AlbumArtists aa, ArtistAliases ar " +
									"WHERE aa.AlbumId in  " + entry.albumIds + " " +
									  "AND ar.alias = \"" + entry.artist + "\" " +
										"AND ar.chart = \"" + entry.chart + "\" " +
									  "AND aa.ArtistId = ar.ArtistId;";

			return models.sequelize.query (query,
																		 { type: models.sequelize.QueryTypes.SELECT })
			.then (function (albums) {
				if (albums.length > 0) {
					entry.AlbumId = albums[0].AlbumId;
				}
			});
		}

		function findArtist (entry) {
			var query = "SELECT aa.AlbumId, ar.name " +
									"FROM AlbumArtists aa, Artists ar " +
									"WHERE aa.AlbumId in  " + entry.albumIds + " " +
									  "AND (ar.name = \""+ entry.artist + "\" " +
									       "or " +
									       "ar.nameNorm = \"" + entry.artist + "\") " +
									  "AND aa.ArtistId = ar.id;";
					
			if (false
					|| entry.artist === 'Soundtrack'
					|| entry.artist === 'Various Artists'
					|| entry.artist === 'サウンドトラック'
					|| entry.artist === 'MOTION PICTURE CAST RECORDING'
					|| entry.artist === 'Multi Interprètes'
					|| entry.artist === 'Original Broadway Cast'
					|| entry.artist === 'Original Broadway Cast Recording'
			) {
					entry.AlbumId = entry.candidateAlbums[0].id;
					return;
			}

			return models.sequelize.query (query,
																		 { type: models.sequelize.QueryTypes.SELECT })
			.then (function (albums) {
				if (albums.length > 0) {
					entry.AlbumId = albums[0].AlbumId;
				}
				else {
					return findArtistAlias (entry);
				}
			});
		}
		
		function matchChart (entry) {
			entry.candidateAlbums = [];
			entry.AlbumId = null;

			return findAlbum (entry)
		  .then (function ()	{
				if (entry.candidateAlbums.length > 0) {
					var albumIds = '(';
					for (var i in entry.candidateAlbums) {
						if (i > 0)
							albumIds += ",";
						albumIds += entry.candidateAlbums[i].id;
					}
					albumIds += ')';
					entry.albumIds = albumIds;

					return findArtist (entry);
				}
			})
			.then (function () {
				if (entry.AlbumId !== null) {
					return models.AlbumChart.update (
						{ AlbumId: entry.AlbumId },
						{ where: { id: entry.id } }
					);
				}
			});
		}

		return models.AlbumChart.findAll ({
			where: { type: chartName, week: date },
		})
		.then(function (charts) {
			var promises = [];
			var chartRow;
			var entry;

			for (var i in charts) {
				chartRow = charts[i];

				if (chartRow.AlbumId === null) {
					entry = {
						id: chartRow.id,
						artist: chartRow.artist,
						title: chartRow.title,
						chart: chartName,
					};
					promises.push (matchChart (entry));
				}
			}

			return Promise.all (promises);
		});
	}
}

