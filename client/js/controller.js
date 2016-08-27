musicApp.controller('InitialCtrl', function ($rootScope, $scope, $http, songService) {
 
  $scope.initials = [];

	$scope.initials.push.apply($scope.initials, '가나다라마바사아자차카타파하'.split(''));
	$scope.initials.push.apply($scope.initials, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
	$scope.initials.push('0-9');
});

musicApp.controller('ArtistInitialCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.initial = $routeParams.initial;	
  $scope.albumArtists = [];
  $scope.singleArtists = [];
  $scope.chartedArtists = [];
	$scope.others = [];

	$http.get('api/initial/' + $routeParams.initial).success(function (data) {
		var i, j, count;
		for (i in data) {
			var artist = data[i];
			if (artist.albums.EP || artist.albums.Studio || artist.albums.Compilation)
				$scope.albumArtists.push(artist);
			else if (artist.albums.Single)
				$scope.singleArtists.push(artist);
			else if (artist.songs.length > 1 || artist.feats.length > 1)
				$scope.chartedArtists.push(artist);
			else
				$scope.others.push(artist);
		}
	});
});

musicApp.controller('ArtistCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {

	$scope.loaded = false;
	$scope.showFeat = true;

	$http.get('api/artist/' + $routeParams.id).success(function (artist) {

		var onlyFeat = true;

		for (var i in artist.albums) {
			var album = artist.albums[i];
			var maxDisk = 0;
			var song;
			for (var j in album.songs) {
				song = album.songs[j];
				song.albumId = album.id;
				if (maxDisk < song.disk)
					maxDisk = song.disk;
			}
			album.maxDisk = maxDisk;

			if (!album.isFeat)
				$scope.showFeat = false;
		}

		$scope.artist = artist;
		$scope.loaded = true;
	});

	var getSendSong = function (song, album) {
		var minRank = 100, rank;

		for (var prop in song.rank) {
			if (song.rank.hasOwnProperty(prop)) {
				rank = song.rank[prop].min;
				if (rank < minRank)
					minRank = rank;
			}
		}

		var sendSong = {
			id: song.id,
			title: song.title,
			albumId: album.id,
			plays: song.plays,
		};
		if (song.artists === undefined) {
			sendSong.artists = album.albumArtists;
		} else {
			sendSong.artists = song.artists;
		}
		if (minRank < 10)
			sendSong.rank = minRank;

		return sendSong;
	};

	$scope.addNext = function (song, album) {
		songService.addNext([getSendSong(song, album)]);
	};

	$scope.addSong = function (song, album) {
		songService.addSongs([getSendSong(song, album)]);
	};
	
	$scope.addNextAlbum = function (album) {
		var songs = [];
		for (var i in album.songs) {
			songs.push(getSendSong(album.songs[i], album));
		}
		songService.addNext(songs);
	};

	$scope.addAlbum = function (album) {
		var songs = [];
		for (var i in album.songs) {
			songs.push(getSendSong(album.songs[i], album));
		}
		songService.addSongs(songs);
	};

	$scope.showFeatures = function () {
		$scope.showFeat = true;
	};

	$scope.hideFeatures = function () {
		$scope.showFeat = false;
	};

	$scope.download = function (song) {
		var dl = document.createElement('a');
		dl.href = '/music/' + song.id + '.mp3';
		dl.download = song.title + '.mp3';
		dl.click();
	};
});

musicApp.controller('EditArtistCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

	$scope.artist = {};

	$http.get('api/edit/artist/' + $routeParams.id).success(function (artist) {
		var i, artistGroup;
		artist.editGroups = [];
		artist.editMembers = [];
		artist.editAliases = [];

		for (i in artist.Group) {
			var group = artist.Group[i];
			artistGroup = group.ArtistGroup;
			artist.editGroups[i] = {
				name: group.name,
				id: group.id,
				primary: artistGroup.primary,
				deleted: false,
				created: false
			};
		}

		for (i in artist.Member) {
			var member = artist.Member[i];
			artistGroup = member.ArtistGroup;
			artist.editMembers[i] = {
				name: member.name,
				id: member.id,
				primary: artistGroup.primary,
				deleted: false,
				created: false
			};
		}

		for (i in artist.ArtistAliases) {
			var alias = artist.ArtistAliases[i];
			artist.editAliases[i] = {
				id: alias.id,
				alias: alias.alias,
				chart: alias.chart,
				deleted: false,
				created: false
			};
		}

		$scope.artist = artist;
	});

	$scope.edit = function () {
		var artist = $scope.artist;
		artist.name = artist.name.replace (/\'/g, '`');
		artist.nameNorm = artist.nameNorm.replace (/\'/g, '`');
		$http.put('api/edit/artist', $scope.artist)
		.then(function (res) {
			$location.url('/artist/' + res.data);
		});
	};

	$scope.deleteArtist = function () {
		$http.delete('api/artist/' + $routeParams.id)
		.then(function (res) {
			$location.url('/');
		});
	};

	$scope.addGroup = function () {
		if ($scope.artist.editGroups.length === 0 ||
				$scope.artist.editGroups[$scope.artist.editGroups.length - 1].name !== null) {
			var artist = {
				name: null,
				primary: false,
				deleted: false,
				created: true
			};
			$scope.artist.editGroups.push(artist);
		}
	};

	$scope.addMember = function () {
		if ($scope.artist.editMembers.length === 0 ||
				$scope.artist.editMembers[$scope.artist.editMembers.length - 1].name !== null) {
			var artist = {
				name: null,
				primary: false,
				deleted: false,
				created: true
			};
			$scope.artist.editMembers.push(artist);
		}
	};
	
	$scope.addAlias = function () {
		if ($scope.artist.editAliases.length === 0 ||
				($scope.artist.editAliases[$scope.artist.editAliases.length - 1].alias !== null &&
				 $scope.artist.editAliases[$scope.artist.editAliases.length - 1].chart !== null)) {
			var alias = {
				alias: null,
				chart: null,
				deleted: false,
				created: true
			};
			$scope.artist.editAliases.push(alias);
		}
	};
});

musicApp.controller('EditAlbumCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

	$scope.album = {};

	$http.get('api/edit/album/' + $routeParams.id).success(function (album) {
		var i;
		album.editArtists = [];
		album.editSongs = [];
		album.newSongs = [];

		for (i in album.Artists) {
			var artist = album.Artists[i];
			var albumArtist = artist.AlbumArtist;
			album.editArtists[i] = {
				order: albumArtist.order,
				name: artist.name,
				id: artist.id,
				deleted: false,
				created: false,
			};
		}

		for (i in album.Songs) {
			var song = album.Songs[i];
			var albumSong = song.AlbumSong;
			album.editSongs[i] = {
				disk: albumSong.disk,
				track: albumSong.track,
				title: song.title,
				id: song.id,
				plays: song.plays
			};
		}

		album.releaseDate = new Date(album.release);
		album.cover = null;

		$scope.album = album;
	});

	$scope.edit = function () {
		var album = $scope.album;
		var i;
		album.title = album.title.replace (/\'/g, '`');
		album.titleNorm = album.titleNorm.replace (/\'/g, '`');

		for (i in album.editSongs) {
			var song = album.editSongs[i];
			song.title = song.title.replace (/\'/g, '`');
			if (song.title !== album.Songs[i].title)
				song.edited = true;
		}

		var newSongs = [];
		for (i in album.newSongs) {
			var newSong = album.newSongs[i];
			if (newSong.disk !== null && newSong.track !== null && newSong.id !== null) {
				newSongs.push (newSong);
			}
		}

		if (newSongs.length > 0) {
			album.newSongs = newSongs;
		}

		console.log (album);

		$http.put('api/edit/album', $scope.album)
		.then(function (res) {
			$location.url('/artist/' + res.data);
		});
	};
	
	$scope.addSong = function () {
		$scope.album.newSongs.push ({
			disk: null,
			track: null,
			id: null
		});
	};
	
	$scope.addArtist = function () {
		if ($scope.album.editArtists[$scope.album.editArtists.length - 1].name !== null) {
			var artist = {
				name: null,
				deleted: false,
				created: true
			};
			$scope.album.editArtists.push(artist);
		}
	};
});

musicApp.controller('EditSongCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

	$scope.song = {};

	$http.get('api/edit/song/' + $routeParams.id).success(function (song) {
		song.editArtists = [];
		song.editAliases = [];

		for (var i in song.Artists) {
			var artist = song.Artists[i];
			var songArtist = artist.SongArtist;
			song.editArtists[i] = {
				order: songArtist.order,
				name: artist.name,
				id: artist.id,
				feat: songArtist.feat,
				deleted: false,
				created: false,
			};
		}
		
		for (i in song.SongAliases) {
			var alias = song.SongAliases[i];
			song.editAliases[i] = {
				id: alias.id,
				alias: alias.alias,
				chart: alias.chart,
				deleted: false,
				created: false
			};
		}

		$scope.song = song;
	});

	$scope.edit = function () {
		var song = $scope.song;
		var artists = [];
		song.title = song.title.replace (/\'/g, '`');
		song.titleNorm = song.titleNorm.replace (/\'/g, '`');

		/* remove artists without a name */
		for (var i in song.editArtists) {
			var artist = song.editArtists[i];
			console.log (artist);

			if (artist.name !== null && artist.name !== "") {
				artists.push(artist);
			}
		}
		song.editArtists = artists;
		
		$http.put('api/edit/song', $scope.song)
		.then(function (res) {
			$location.url('/artist/' + res.data);
		});
	};

	function getOrder (isFeat) {
		var order = 0;
		var artist;

		for (var i in $scope.song.editArtists) {
			artist = $scope.song.editArtists[i];
			if (artist.feat === isFeat && order <= artist.order) {
				order = artist.order + 1;
			}
		}

		return order;
	}

	function addArtist (isFeat) {
		var artist = {
			order: getOrder (isFeat),
			name: null,
			feat: isFeat,
			deleted: false,
			created: true
		};
		$scope.song.editArtists.push(artist);
	}

	$scope.addArtist = function () {
		addArtist (false);
	};

	$scope.addFeature = function () {
		addArtist (true);
	};
	
	$scope.addAlias = function () {
		if ($scope.song.editAliases.length === 0 ||
				($scope.song.editAliases[$scope.song.editAliases.length - 1].alias !== null &&
				 $scope.song.editAliases[$scope.song.editAliases.length - 1].chart !== null)) {
			var alias = {
				alias: null,
				chart: null,
				deleted: false,
				created: true
			};
			$scope.song.editAliases.push(alias);
		}
	};
});

function toUTCDate (date) {
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function getMaxDate (chart) {
	var date = toUTCDate(new Date());

	if ((chart === 'gaon' && date.getDay() < 4) ||
			(chart === 'melon' && date.getDay() < 1) ||
			(chart === 'billboard' && date.getDay() < 3) ||
			(chart === 'oricon' && date.getDay() < 2))
		date.setDate(date.getDate() - 7);

	if ((chart === 'deutsche' && date.getDay() === 6) ||
			(chart === 'uk' && date.getDay() === 6) ||
			(chart === 'francais' && date.getDay() === 6))
		date.setDate(date.getDate() + 7);

	date.setDate(date.getDate() - date.getDay() - 1);

	return date;
}

function getMinDate (chart) {
	if (chart === 'gaon') {
		return new Date(Date.UTC(2010, 0, 2)); // Jan 2nd, 2010
	} else {
		return new Date(Date.UTC(2000, 0, 1)); // Jan 1st, 2000
	}
}

musicApp.controller('ChartCtrl', function ($rootScope, $scope, $routeParams, $http, $location, songService) {

	$scope.adjustDate = function () {
		var time = $scope.date.getTime();
		if ($scope.max < time) {
			$scope.date = new Date($scope.max);
		} else if (time < $scope.min) {
			$scope.date = new Date($scope.min);
		} else {
			$scope.date = new Date($scope.date);
		}
	};

	$scope.chart = $routeParams.name;
	$scope.maxDate = getMaxDate($scope.chart);
	$scope.minDate = getMinDate($scope.chart);
	
	$scope.max = $scope.maxDate.getTime();
	$scope.min = $scope.minDate.getTime();
	$scope.rows = [];

	if ($routeParams.date) {
		$scope.date = toUTCDate(new Date($routeParams.date));
		$scope.adjustDate();
		var dateString = $scope.date.toISOString().substr(0, 10);
		if ($routeParams.date !== dateString) {
			$location.url('/chart/' + $scope.chart + '/'  + dateString);
		}
	} else {
		$scope.date = $scope.maxDate;
	} 

	$scope.fetch = function () {
		$scope.rows = [];
		$http.get('chart/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function (chartRows) {
			$scope.rows = chartRows;
		});
	};

	$scope.fetch();

	$scope.updateDate = function (offset) {
		$scope.date.setDate($scope.date.getDate() + offset);
		$scope.adjustDate();
		var dateString = $scope.date.toISOString().substr(0, 10);
		$location.url('/chart/' + $scope.chart + '/'  + dateString);
	};

	$scope.go = function () {
		$scope.updateDate(6 - $scope.date.getDay());
	};
	
	$scope.prev = function () {
		$scope.updateDate(-7);
	};
	
	$scope.next = function () {
		$scope.updateDate(7);
	};

	$scope.history = function () {
		$location.url('/chart/history/' + $scope.chart);
	};

	$scope.addChart = function () {
		var i;
		var row, song;
		var songs = [];
		
		for (i in $scope.rows) {
			row = $scope.rows[i];
			if (row.songFound) {
				song = {
					id: row.song.id,
					title: row.song.title,
					albumId: row.song.Albums[0].id,
					artists: row.songArtists,
					plays: row.song.plays
				};
				songs.push(song);
			}
		}
		songService.addSongs(songs);
	};
});

musicApp.controller('CurrentChartCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {
	$scope.rows = [];

	$http.get('chart/current')
	.success(function (chartRows) {
		$scope.rows = chartRows;
	});

	$scope.addSongs = function (index) {
		var i;
		var row, song;
		var songs = [];
		var minRank, rank;

		for (i = index; i < $scope.rows.length; i++) {
			row = $scope.rows[i];

			minRank = 100;
			for (var prop in row.rank) {
				if (row.rank.hasOwnProperty(prop)) {
					rank = row.rank[prop].min;
					if (rank < minRank)
						minRank = rank;
				}
			}

			song = {
				id: row.song.id,
				title: row.song.title,
				albumId: row.song.Albums[0].id,
				artists: row.songArtists,
				rank: minRank,
				plays: row.song.plays
			};
			songs.push(song);
		}
		songService.addSongs(songs);
	};

	$scope.addChart = function () {
		$scope.addSongs(0);
	};
});

musicApp.controller('AlbumChartCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

	$scope.adjustDate = function () {
		var time = $scope.date.getTime();
		if ($scope.max < time) {
			$scope.date = new Date($scope.max);
		} else if (time < $scope.min) {
			$scope.date = new Date($scope.min);
		} else {
			$scope.date = new Date($scope.date);
		}
	};

	$scope.chart = $routeParams.name;
	$scope.maxDate = getMaxDate($scope.chart);
	$scope.minDate = getMinDate($scope.chart);
	
	$scope.max = $scope.maxDate.getTime();
	$scope.min = $scope.minDate.getTime();
	$scope.rows = [];

	if ($routeParams.date) {
		$scope.date = toUTCDate(new Date($routeParams.date));
		$scope.adjustDate();
		var dateString = $scope.date.toISOString().substr(0, 10);
		if ($routeParams.date !== dateString) {
			$location.url('/chart/album/' + $scope.chart + '/'  + dateString);
		}
	} else {
		$scope.date = $scope.maxDate;
	} 

	$scope.view = function () {
		$scope.rows = [];
		$http.get('chart/album/view/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function (chartRows) {
			$scope.rows = chartRows;
		});
	};

	$scope.fetch = function () {
		$http.get('chart/album/fetch/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function () {
			$scope.view ();
		});
	};

	$scope.match = function () {
		$http.get('chart/album/match/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function () {
			$scope.view ();
		});
	};

	$scope.view();

	$scope.updateDate = function (offset) {
		$scope.date.setDate($scope.date.getDate() + offset);
		$scope.adjustDate();
		var dateString = $scope.date.toISOString().substr(0, 10);
		$location.url('/chart/album/' + $scope.chart + '/'  + dateString);
	};

	$scope.go = function () {
		$scope.updateDate(6 - $scope.date.getDay());
	};
	
	$scope.prev = function () {
		$scope.updateDate(-7);
	};
	
	$scope.next = function () {
		$scope.updateDate(7);
	};
});

musicApp.controller('CurrentChartCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {
	$scope.rows = [];

	$http.get('chart/current')
	.success(function (chartRows) {
		$scope.rows = chartRows;
	});

	$scope.addSongs = function (index) {
		var i;
		var row, song;
		var songs = [];
		var minRank, rank;

		for (i = index; i < $scope.rows.length; i++) {
			row = $scope.rows[i];

			minRank = 100;
			for (var prop in row.rank) {
				if (row.rank.hasOwnProperty(prop)) {
					rank = row.rank[prop].min;
					if (rank < minRank)
						minRank = rank;
				}
			}

			song = {
				id: row.song.id,
				title: row.song.title,
				albumId: row.song.Albums[0].id,
				artists: row.songArtists,
				rank: minRank,
				plays: row.song.plays
			};
			songs.push(song);
		}
		songService.addSongs(songs);
	};

	$scope.addChart = function () {
		$scope.addSongs(0);
	};
});


musicApp.controller('OneSongsCtrl', function ($rootScope, $scope, $http, songService) {
	$scope.headers = [];
	$scope.weeks = [];
	$scope.linkWeek = false;
	$scope.chart = 'Number Ones';

	$http.get('chart/ones')
	.success(function (results) {
		$scope.headers = results.headers;
		$scope.weeks = results.weeks;
	});

	$scope.addNext = function (song) {
		songService.addNext([song]);
	};

	$scope.addSong = function (song) {
		songService.addSongs([song]);
	};
});

musicApp.controller('ChartHistoryCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {
	$scope.headers = [];
	$scope.weeks = [];
	$scope.linkWeek = true;
	$scope.chart = $routeParams.name;

	$http.get('chart/history/' + $routeParams.name)
	.success(function (results) {
		$scope.headers = results.headers;
		$scope.weeks = results.weeks;
	});

	$scope.addNext = function (song) {
		songService.addNext([song]);
	};

	$scope.addSong = function (song) {
		songService.addSongs([song]);
	};
});


musicApp.controller('RecentCtrl', function ($rootScope, $scope, $http, songService) {
	$scope.rows = [];
	$scope.title = 'Played';

	$scope.refresh = function () {
		$http.get('api/lastPlayed')
		.success(function (lastPlayed) {
			$scope.rows = lastPlayed;
		});
	};

	$scope.$on('handleSongEnded', function () {
		$scope.refresh();
	});

	$scope.refresh();
});

musicApp.controller('NewSongCtrl', function ($rootScope, $scope, $http) {
	$scope.rows = [];
	$scope.title = 'Added';

	$scope.refresh = function () {
		$http.get('api/newSongs/100')
		.success(function (lastPlayed) {
			$scope.rows = lastPlayed;
		});
	};
	$scope.refresh();
});

musicApp.controller('StatsPlaysChartCtrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.rawData = [];
	$scope.data = [];
	$scope.ranks = [];
	$scope.tiers = [];
	$scope.songs = [];
	$scope.total = { sum: 0, count: 0 };
	$scope.allVisible = true;

	for (i = 0; i < 10; i++) {
		$scope.ranks[i] = { name: i + 1, active: true, data: [] };
	}
	$scope.ranks[10] = { name: '11+', active: true, data: [] };

	$http.get('stats/plays').success(function (data) {
		var i, datum, tier;

		for (i in data) {
			datum = data[i];
			
			if (datum.rank) {
				if (datum.plays >= 10) {
					tier = 0;
				} else {
					tier = 1;
				}

				$scope.ranks[datum.rank - 1].data.push(datum);
			} else {
				if (datum.plays <= 2) {
					tier = 2;
				} else {
					tier = 3;
				}
				$scope.ranks[10].data.push(datum);
			}

			if ($scope.tiers[tier] === undefined)
				$scope.tiers[tier] = { sum: 0, count: 0 };
			$scope.tiers[tier].count += datum.count;
			$scope.tiers[tier].sum += datum.count * datum.plays;
			$scope.total.count += datum.count;
			$scope.total.sum += datum.count * datum.plays;
		}

		$scope.rawData = data;
		$scope.data = data;
	});

	function updateData () {
		var i, data = [];
		
		$scope.allVisible = true;
		for (i in $scope.ranks) {
			if ($scope.ranks[i].active)
				data = data.concat($scope.ranks[i].data);
			else
				$scope.allVisible = false;
		}

		$scope.data = data;
	}

	$scope.toggle = function (index) {
		if ($scope.ranks[index]) {
			if ($scope.ranks[index].active) {
				$scope.ranks[index].active = false;
			} else {
				$scope.ranks[index].active = true;
			}

			updateData();
		}
	};

	$scope.setAll = function (bool) {
		var i;

		for (i in $scope.ranks) {
			$scope.ranks[i].active = bool;
		}

		updateData();
		
		if (!bool) {
			$scope.selectedPlayCount = undefined;
			$scope.songs = [];
		}
	};

	$scope.showSongs = function (play) {
		$http.get('api/plays/' + play).success(function (data) {
			$scope.selectedPlayCount = play;
			$scope.songs = data;
		});
	};
});

musicApp.controller('StatsPlaysTableCtrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.rawData = [];
	$scope.data = [];
	$scope.plays = [];

	for (var i = 0; i <= 100; i++) {
		$scope.plays[i] = { play: i, rank: [], cumul: [] };
		for (var j = 0; j <= 10; j++) {
			$scope.plays[i].rank[j] = 0;
		}
	}

	$scope.plays[100].play = '100+';

	$http.get('stats/plays').success(function (data) {
		var i, j, datum, rank, plays;

		for (i in data) {
			datum = data[i];

			plays = Math.min(datum.plays, 100);
			rank = (datum.rank !== null) ? datum.rank - 1 : 10;

			$scope.plays[plays].rank[rank] += datum.count;
		}

		for (i = 0; i <= 100; i++) {
			$scope.plays[i].cumul[0] = $scope.plays[i].rank[0];
			for (j = 1; j <= 10; j++) {
				$scope.plays[i].cumul[j] = $scope.plays[i].cumul[j - 1] + $scope.plays[i].rank[j];
			}
		}

		for (i in $scope.plays) {
			for (j in $scope.plays.rank) {

			}
		}

		$scope.rawData = data;
		$scope.data = data;
	});
});

musicApp.controller('ChartMissingCtrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.data = [];

	$http.get('chart/missing').success(function (data) {
		$scope.data = data;
	});
});

musicApp.controller('ChartMissing1Ctrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.data = [];
	$scope.type = 'No.1 Songs';

	$http.get('chart/missing/1').success(function (data) {
		$scope.data = data;
	});
});

musicApp.controller('ChartMissingAlbumCtrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.data = [];
	$scope.type = 'No.1 Albums';

	$http.get('chart/missing/album').success(function (data) {
		$scope.data = data;
	});
});

musicApp.controller('SongCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.loaded = false;

	$http.get('api/song/' + $routeParams.id).success(function (song) {
		$scope.song = song;
		$scope.loaded = true;
	});
});

musicApp.controller('BatchCtrl', function ($rootScope, $scope, $http) {
	$scope.chartNames = ['billboard', 'oricon',	'deutsche', 'uk', 'francais', 'melon', 'gaon'];
	$scope.charts = [];

	$scope.start = getMinDate ('uk');
	$scope.end = getMaxDate ('uk');

	for (var i in $scope.chartNames) {
		var chartName = $scope.chartNames[i];
		var minDate = getMinDate (chartName);
		var maxDate = getMaxDate (chartName);

		$scope.charts.push ({
			chart: chartName,
			minDate: minDate,
			maxDate: maxDate,
			start: minDate,
			end: maxDate,
			enabled: false,
			progress: 0
		});
	}

	$scope.adjustDates = function () {
		for (var i in $scope.charts) {
			var chart = $scope.charts[i];
			var startTime = chart.start.getTime ();
			var endTime = chart.end.getTime ();
			var maxTime = chart.maxDate.getTime ();
			var minTime = chart.minDate.getTime ();

			if (maxTime < startTime) {
				chart.start = new Date (chart.maxDate);
			} else if (minTime > startTime) {
				chart.start = new Date (chart.minDate);
			} else {
				chart.start.setDate (chart.start.getDate () + (6 - chart.start.getDay ()));
			}

			if (maxTime < endTime) {
				chart.end = new Date (chart.maxDate);
			} else if (minTime > endTime) {
				chart.end = new Date (chart.minDate);
			} else {
				chart.end.setDate (chart.end.getDate () + (6 - chart.end.getDay ()));
			}
		}
	};

	$scope.setAllDates = function () {
		for (var i in $scope.charts) {
			$scope.charts[i].start = $scope.start;
			$scope.charts[i].end = $scope.end;
		}

		$scope.adjustDates ();
	};

	$scope.prepareRun = function () {
		$scope.chartIndex = 0;
		$scope.running = true;
		
		$scope.adjustDates ();

		for (var i in $scope.charts) {
			$scope.charts[i].cur = new Date ($scope.charts[i].start);
			$scope.charts[i].cur.setDate ($scope.charts[i].cur.getDate () - 7);
			$scope.charts[i].progress = 0;
		}
	};

	$scope.advance = function () {
		while ($scope.chartIndex < $scope.charts.length) {
			var chart = $scope.charts[$scope.chartIndex];

			if (chart.enabled === false) {
				$scope.chartIndex++;
				continue;
			}

			chart.cur.setDate (chart.cur.getDate () + 7);

			if (chart.cur.getTime () > chart.end.getTime ()) {
				$scope.chartIndex++;
			} else {
				chart.progress =
					(chart.cur.getTime () - chart.start.getTime ()) /
					(chart.end.getTime () - chart.start.getTime ()) * 100;
				break;
			}
		}
	};

	$scope.run = function () {
		$scope.advance ();
		var chart = $scope.charts[$scope.chartIndex];

		if ($scope.chartIndex < $scope.charts.length) {
			$http.get($scope.urlPrefix + chart.chart,
					{ params: { 
											year: chart.cur.getFullYear(),
											month: chart.cur.getMonth() + 1,
											day: chart.cur.getDate()
										} })
			.success(function () {
				$scope.run ();
			});
		}
		else {
			$scope.running = false;
		}
	};

	$scope.fetchMatchSingle = function () {
		$scope.urlPrefix = '/chart/';
		$scope.prepareRun ();
		$scope.run ();
	};

	$scope.fetchAlbum = function () {
		$scope.urlPrefix = '/chart/album/fetch/';
		$scope.prepareRun ();
		$scope.run ();
	};

	$scope.matchAlbum = function () {
		$scope.urlPrefix = '/chart/album/match/';
		$scope.prepareRun ();
		$scope.run ();
	};
});
