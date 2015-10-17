musicApp.controller('InitialCtrl', function ($rootScope, $scope, $http, songService) {
 
  $scope.initials = [];

	$scope.initials.push.apply($scope.initials, '가나다라마바사아자차카타파하'.split(''));
	$scope.initials.push.apply($scope.initials, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
	$scope.initials.push('0-9');

	$scope.shuffle = function () {
		$http.get('api/shuffle').success(function (data) {
			songService.addRandom(data);
		});
	};
});

musicApp.controller('ArtistInitialCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.initial = $routeParams.initial;	
  $scope.albumArtists = [];
  $scope.artists = [];
	$scope.features = [];
	$scope.groups = [];
	$scope.others = [];

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

	$http.get('api/initial/' + $routeParams.initial).success(function (data) {
		var i, j, count;
		for (i in data) {
			var artist = data[i];
			artist.primaryGroup = getPrimaryGroup(artist);			
			if (artist.Albums.length > 0) {
				count = 0;
				for (j in artist.Albums) {
					var album = artist.Albums[j];
					if (album.type === 'EP' || album.type === 'Studio' || album.type === 'LP')
						count++;
				}
				if (count > 0) {
					$scope.albumArtists.push(artist);
				} else {
					$scope.artists.push(artist);
				}
			} else {
				count = 0;
				for (j in artist.Songs) {
					var songArtist = artist.Songs[j].SongArtist;
					if (songArtist.feat)
						count++;
				}
				if (count > 0 && count === artist.Songs.length) {
					$scope.features.push(artist);
				} else if (artist.Songs.length > 0) {
					$scope.artists.push(artist);
				} else {
					if (artist.Member.length > 0) {
						$scope.groups.push(artist);
					} else {
						$scope.others.push(artist);
					}
				}
			}
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
		var sendSong = {
			id: song.id,
			title: song.title,
			albumId: album.id
		};
		if (song.artists === undefined) {
			sendSong.artists = album.albumArtists;
		} else {
			sendSong.artists = song.artists;
		}

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
		$http.get('api/s3d/' + song.id, { params: { title: song.title } }).success(function (data) {
			var dl = document.createElement('a');
			dl.href = data.url;
			dl.click();
		});		
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

		$scope.album = album;
	});

	$scope.edit = function () {
		$http.put('api/edit/album', $scope.album)
		.then(function (res) {
			$location.url('/artist/' + res.data);
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
		$http.put('api/edit/song', $scope.song)
		.then(function (res) {
			$location.url('/artist/' + res.data);
		});
	};

	$scope.addArtist = function () {
		if ($scope.song.editArtists[$scope.song.editArtists.length - 1].name !== null) {
			var artist = {
				name: null,
				feat: false,
				deleted: false,
				created: true
			};
			$scope.song.editArtists.push(artist);
		}
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

function capitalize(string) {
	if (string.length < 3)
		return string.toUpperCase();

	return string.charAt(0).toUpperCase() + string.slice(1);
}

musicApp.controller('ChartCtrl', function ($rootScope, $scope, $routeParams, $http, $location, songService) {

	function toUTCDate (date) {
		return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	}
	
	function getMaxDate (chart) {
		var date = toUTCDate(new Date());

		if ((chart === 'gaon' && date.getDay() < 4) ||
				(chart === 'melon' && date.getDay() < 1) ||
				(chart === 'billboard' && date.getDay() < 3) ||
				(chart === 'oricon' && date.getDay() < 3))
			date.setDate(date.getDate() - 7);
		
		date.setDate(date.getDate() - date.getDay() - 1);

		return date;
	}

	function getMinDate (chart) {
		if (chart === 'gaon') {
			return new Date(Date.UTC(2010, 0, 2)); // Jan 2nd, 2010
		} else if (chart === 'melon') {
			return new Date(Date.UTC(2005, 0, 1)); // Jan 1st, 2005
		} else {
			return new Date(Date.UTC(2000, 0, 1)); // Jan 1st, 2000
		}
	}

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
	$scope.chartName = capitalize($scope.chart);
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
					artists: row.songArtists
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

	$scope.addChart = function () {
		var i;
		var row, song;
		var songs = [];
		
		for (i in $scope.rows) {
			row = $scope.rows[i];
			song = {
				id: row.song.id,
				title: row.song.title,
				albumId: row.song.Albums[0].id,
				artists: row.songArtists
			};
			songs.push(song);
		}
		songService.addSongs(songs);
	};
});

musicApp.controller('OneSongsCtrl', function ($rootScope, $scope, $http, songService) {
	$scope.headers = [];
	$scope.weeks = [];
	$scope.linkWeek = false;
	$scope.title = 'Number Ones';

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
	$scope.title = capitalize($scope.chart) + ' History';

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

	$scope.refresh();
});

musicApp.controller('NewSongCtrl', function ($rootScope, $scope, $http, songService) {
	$scope.rows = [];
	$scope.title = 'Added';

	$scope.refresh = function () {
		$http.get('api/newSongs')
		.success(function (lastPlayed) {
			$scope.rows = lastPlayed;
		});
	};
	$scope.refresh();
});

musicApp.controller('StatsPlaysCtrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.data = [];

	$http.get('stats/plays').success(function (data) {
		$scope.data = data;
	});
});

musicApp.controller('StatsPlaysTitleCtrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.data = [];

	$http.get('stats/plays/title').success(function (data) {
		$scope.data = data;
	});
});
