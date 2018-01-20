musicApp.controller('InitialCtrl', function ($rootScope, $scope, $http) {

 	$scope.shortcuts = [];	
  $scope.initials = [];

	$scope.shortcuts.push({ glyph: 'stats', link: 'stats/plays/song' });
	$scope.shortcuts.push({ glyph: 'globe', link: 'chart/meta/current' });
	$scope.shortcuts.push({ glyph: 'music', link: 'chart/summary/single' });
	$scope.shortcuts.push({ glyph: 'cd', link: 'chart/summary/album' });
	$scope.shortcuts.push({ glyph: 'time', link: 'newSongs' });
	$scope.shortcuts.push({ glyph: 'fire', link: 'initial/Favorites' });

	var initials = 'ㄱㅇABCDㄴㅈEFGHㄷㅊIJKLㄹㅋMNOPㅁㅌQRSTㅂㅍUVWXㅅㅎYZ';
	var split = initials.split('');
	var initial;

	for (var i in split) {
		initial = split[i];
		$scope.initials.push ({ name: initial, link: initial });
	}

	$scope.initials.push ({ name: '#', link: '0-9' });

	$scope.summaryLoaded = false;
	
	$http.get('api/summary').success(function (data) {
		$scope.summaryLoaded = true;
		$scope.summary = data;
	});
});

musicApp.controller('ArtistInitialCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.initial = $routeParams.initial;	
  $scope.albumArtists = [];
  $scope.singleArtists = [];
  $scope.chartedArtists = [];
	$scope.others = [];

	$http.get('api/initial/' + $routeParams.initial).success(function (data) {
		var i, j, count, artist, albumType;
		for (i in data) {
			artist = data[i];

			artist.albumCount = 0;
			artist.singleCount = 0;
			for (albumType in artist.albums) {
				if (albumType === 'Single') {
					artist.singleCount += artist.albums[albumType];
				} else {
					artist.albumCount += artist.albums[albumType];
				}
			}

			if (artist.albumCount > 0) {
				$scope.albumArtists.push(artist);
			} else if (artist.singleCount > 0) {
				$scope.singleArtists.push(artist);
			} else if (artist.chartedSongs > 0) {
				$scope.chartedArtists.push(artist);
			} else {
				$scope.others.push(artist);
			}
		}
	});
});

musicApp.controller('ArtistCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {

	$scope.id = $routeParams.id;
	$scope.loaded = false;
	$scope.showFeat = true;
	$scope.selectedAlbums = [];
	$scope.years = [];

	var hideRedundantArtists = function (artist) {
		var i, j, k, album, song;
		var hide;

		for (i in artist.albums) {
			album = artist.albums[i];
			for (j in album.songs) {
				song = album.songs[j];
				hide = true;

				if (album.albumArtists.length !== song.artists.length)
					continue;

				for (k in album.albumArtists) {
					if (album.albumArtists[k].id !== song.artists[k].id) {
						hide = false;
						break;
					}
				}

				if (hide) {
					song.artists = [];
				}
			}
		}
	};

	var getA = function (artist) {
		if (artist.As.length === 0)
			return;

		var i, A;
		var As = {};

		for (i in artist.As) {
			A = artist.As[i];
			if (As[A.type] === undefined)
				As[A.type] = [];

			As[A.type].push(A);
		}

		var array = [];
		for (i in As) {
			As[i].sort(function (a, b) { var x = a.name; var y = b.name; return ((x < y) ? -1 : ((x > y) ? 1 : 0)); });
			array.push({ type: i, artists: As[i] });
		}

		array.sort(function (a, b) { var x = a.type; var y = b.type; return ((x < y) ? -1 : ((x > y) ? 1 : 0)); });
		$scope.As = array;
	};
	
	var getB = function (artist) {
		if (artist.Bs === undefined)
			return;

		var array = [];
		for (var i in artist.Bs) {
			if (i === 'p') {
				array.push({ type: i, artists: artist.Bs[i] });
			}else {
				array.push({ type: i, artists: [artist.Bs[i]] });
			}
		}

		array.sort(function (a, b) { var x = a.type; var y = b.type; return ((x < y) ? -1 : ((x > y) ? 1 : 0)); });
		$scope.Bs = array;
	};

	$http.get('api/artist/' + $routeParams.id).success(function (artist) {

		var years = {};
		var i, j, album, maxDisk, song;
		var release, year;
		var disks;

		for (i in artist.albums) {
			album = artist.albums[i];
			maxDisk = 0;
			disks = {};

			for (j in album.songs) {
				song = album.songs[j];
				song.albumId = album.id;
				if (disks[song.disk] === undefined) {
					disks[song.disk] = { disk: song.disk, songs: [] };
				}
				disks[song.disk].songs.push(song);
			}

			album.disks = [];
			for (j in disks) {
				disks[j].songs.sort(function (a, b) { return a.track - b.track; });
				album.disks.push(disks[j]);
			}
			album.disks.sort(function (a, b) { return a.disk - b.disk; });
			if (album.disks.length >= 1 && album.disks[album.disks.length - 1].disk > 1) {
				album.showDisk = true;
			}

			release = new Date(album.release);
			year = release.getFullYear();

			if (years[year] === undefined)
				years[year] = { year: year, albums: [album] };
			else
				years[year].albums.push(album);
		}

		for (i in years) {
			year = years[i];
			$scope.years.push(year);
		}

		hideRedundantArtists(artist);
		getA(artist);
		getB(artist);

		$scope.artist = artist;

		if (artist.albums.length === 1)
			$scope.selectAlbum(artist.albums[0]);

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
		if (song.artists === undefined || song.artists.length === 0) {
			sendSong.artists = album.albumArtists;
		} else {
			sendSong.artists = song.artists;
		}
		sendSong.features = song.features;
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

	$scope.addDisk = function (disk, album) {
		var songs = [];
		for (var i in disk.songs) {
			songs.push(getSendSong(disk.songs[i], album));
		}
		songService.addSongs(songs);
	};

	$scope.download = function (song) {
		var dl = document.createElement('a');
		dl.href = '/music/' + song.id + '.mp3';
		dl.download = song.title + '.mp3';
		dl.click();
	};

	$scope.selectAlbum = function (album) {
		$scope.selectedAlbums = [album];
	};
	
	$scope.deselectAlbum = function () {
		$scope.selectedAlbums = [];
	};
});

musicApp.controller('AddArtistAlbumCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

	$scope.loaded = false;
	$scope.showFeat = true;
	$scope.album = {
		artist: $routeParams.id,
		title: '',
		releaseDate: new Date(Date.UTC(2000, 0, 1)), // Jan 1st, 2000
		newSongs: [],
		cover: null
	};

	$http.get('api/artist/' + $routeParams.id).success(function (artist) {
		$scope.artist = artist;
	});
	
	$scope.addSong = function () {
		$scope.album.newSongs.push ({
			disk: 1,
			track: null,
			id: null,
		});
	};

	$scope.add = function () {
		var album = $scope.album;
		var i;
		album.title = album.title.replace (/\'/g, '`');

		var newSongs = [];
		for (i in album.newSongs) {
			var newSong = album.newSongs[i];
			if (newSong.disk !== null && newSong.track !== null && newSong.id !== null) {
				newSongs.push (newSong);
			}
		}

		album.newSongs = newSongs;

		$http.put('api/add/album', $scope.album)
		.then(function (res) {
			$location.url('/artist/' + res.data);
		});
	};
});

musicApp.controller('EditArtistCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

	$scope.artist = {};
	$scope.relations = [ 'a', 'c', 'f', 'm', 'p', 'u' ];

	$http.get('api/edit/artist/' + $routeParams.id).success(function (artist) {
		var i, artistGroup, artistRelation;
		artist.editRelations = [];
		artist.editAliases = [];

		for (i in artist.B) {
			var b = artist.B[i];
			artistRelation = b.ArtistRelation;
			artist.editRelations[i] = {
				name: b.name,
				id: b.id,
				type: b.ArtistRelation.type,
				order: b.ArtistRelation.order,
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

	$scope.addRelation = function () {
		if ($scope.artist.editRelations.length === 0 ||
				$scope.artist.editRelations[$scope.artist.editRelations.length - 1].name !== null) {
			var artist = {
				name: null,
				deleted: false,
				created: true
			};
			$scope.artist.editRelations.push(artist);
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
		album.editAliases = [];

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

		for (i in album.AlbumAliases) {
			var alias = album.AlbumAliases[i];
			album.editAliases[i] = {
				id: alias.id,
				alias: alias.alias,
				chart: alias.chart,
				deleted: false,
				created: false
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

		if (album.format2 === 'Null')
			album.format2 = null;

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

		album.newSongs = newSongs;

		for (i in album.editAliases) {
			var alias = album.editAliases[i];
			alias.alias = alias.alias.replace (/\'/g, '`');
		}

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
	
	$scope.addAlias = function () {
		if ($scope.album.editAliases.length === 0 ||
				($scope.album.editAliases[$scope.album.editAliases.length - 1].alias !== null &&
				 $scope.album.editAliases[$scope.album.editAliases.length - 1].chart !== null)) {
			var alias = {
				alias: null,
				chart: null,
				deleted: false,
				created: true
			};
			$scope.album.editAliases.push(alias);
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

	if ((chart === 'melon' && date.getDay() < 1) ||
			(chart === 'oricon' && date.getDay() < 2) ||
			(chart === 'francais' && date.getDay() < 2) ||
			(chart === 'billboard' && date.getDay() < 3) ||
			(chart === 'deutsche' && date.getDay() < 3) ||
			(chart === 'gaon' && date.getDay() < 4))
		date.setDate(date.getDate() - 7);

	if ((chart === 'uk' && date.getDay() === 6))
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

musicApp.controller('MetaChartCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {
	$scope.songs = [];
	$scope.charts = ['billboard', 'oricon', 'deutsche', 'uk', 'francais', 'melon', 'gaon'];
	$scope.type = $routeParams.type;

	$http.get('chart/single/' + $routeParams.type)
	.success(function (chartRows) {
		for (var i in chartRows) {
			var row = chartRows[i];
			var minRank = row.curRank[0];

			if (minRank == 2 || minRank == 4 || (minRank > 5 && minRank <= 10)) {
				row.active = true;
			}
			
			minRank = 100;
			for (var prop in row.rank) {
				if (row.rank.hasOwnProperty(prop)) {
					rank = row.rank[prop].min;
					if (rank < minRank)
						minRank = rank;
				}
			}
			row.minRank = minRank;
		}

		$scope.songs = chartRows;
	});

	$scope.addSongs = function (index) {
		var i;
		var row, song;
		var songs = [];
		var minRank, rank;

		for (i = index; i < $scope.songs.length; i++) {
			songs.push($scope.songs[i]);
		}
		songService.addSongs(songs);
	};

	$scope.addChart = function () {
		$scope.addSongs(0);
	};

	$scope.getRankCellStyle = function (rank) {
		if (rank === undefined)
			return "";
						
		var colors = ["#9ecae1","#6baed6","#4292c6","#2171b5","#ef6548"];
		return "color: white; text-align: center; font-weight: bold; background-color: " + 
			(rank < 6 ? colors[5 - rank] : "#c6dbef");
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

	$scope.clear = function () {
		$http.get('chart/album/clear/' + $scope.chart,
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

musicApp.controller('SingleChartCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

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
			$location.url('/chart/single/' + $scope.chart + '/'  + dateString);
		}
	} else {
		$scope.date = $scope.maxDate;
	} 

	$scope.view = function () {
		$scope.rows = [];
		$http.get('chart/single/view/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function (chartRows) {

			var prevRow = { rank: 0};
			var curRow;
			for (var i in chartRows) {
				curRow = chartRows[i];

				if (prevRow.rank === curRow.rank) {
					prevRow.rowspan = curRow.order + 1;
				} else {
					prevRow = curRow;
					curRow.rowspan = 1;
				}
			}

			$scope.rows = chartRows;
		});
	};

	$scope.fetch = function () {
		$http.get('chart/single/fetch/' + $scope.chart,
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
		$http.get('chart/single/match/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function () {
			$scope.view ();
		});
	};

	$scope.clear = function () {
		$http.get('chart/single/clear/' + $scope.chart,
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
		$location.url('/chart/single/' + $scope.chart + '/'  + dateString);
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
	
	$scope.album = function () {
		var dateString = $scope.date.toISOString().substr(0, 10);
		$location.url('/chart/single/album/' + $scope.chart + '/'  + dateString);
	};

	$scope.history = function () {
		$location.url('/chart/single/ones/' + $scope.chart);
	};
});

musicApp.controller('SingleOnesCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {
	$scope.weeks = [];
	$scope.chart = $routeParams.name;

	$http.get('chart/single/ones/' + $routeParams.name)
	.success(function (results) {
		$scope.weeks = results.weeks;

		var songs = {};
		var song, i;
		for (i in results.songs) {
			song = results.songs[i];
			songs[song.id] = song;
		}
		
		var week, j;
		for (i in results.weeks) {
			week = results.weeks[i];
			week.songs = [];
			for (j in week.songIds) {
				week.songs[j] = songs[week.songIds[j]];
			}
		}
		
		function weekMatch(a, b) {
			var match = false;
			
			if (a.length !== b.length) {
				return false;
			}

			for (var i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) {
					return false;
				}
			}

			return true;
		}

		var prevWeek = {songIds: []};
		for (i in results.weeks) {
			week = results.weeks[i];

			if (weekMatch(week.songIds, prevWeek.songIds)) {
				week.display = false;
				prevWeek.streak++;
			} else {
				prevWeek = week;
				week.display = true;
				week.streak = 1;
			}
		}
	});
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

musicApp.controller('ChartMissingAlbumCtrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.data = [];
	$scope.rank = $routeParams.rank;
	$scope.type = 'No.' + $routeParams.rank + ' Albums';
	$scope.q = "";
	$scope.showNote = true;

	$http.get('chart/missing/album/' + $routeParams.rank).success(function (data) {
		$scope.data = data;
	});

	$scope.hide = function () {
		$scope.showNote = false;
	};

	$scope.myFilter = function (row) {
		return $scope.showNote || row.note === null;
	};
});

musicApp.controller('ChartMissingAlbumYearCtrl', function ($rootScope, $scope, $routeParams, $http) {
	$scope.data = [];
	$scope.rank = $routeParams.rank;
	$scope.type = 'No.' + $routeParams.rank + ' Albums of ' + $routeParams.year;
	$scope.q = "";

	$http.get('chart/missing/album/' + $routeParams.rank + '/' + $routeParams.year).success(function (data) {
		$scope.data = data;
	});
});

musicApp.controller('AlbumCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.loaded = false;

	$http.get('api/album/' + $routeParams.id).success(function (album) {
		$scope.album = album;
		$scope.loaded = true;
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

	$scope.fetchSingle = function () {
		$scope.urlPrefix = '/chart/single/fetch/';
		$scope.prepareRun ();
		$scope.run ();
	};
	
	$scope.matchSingle = function () {
		$scope.urlPrefix = '/chart/single/match/';
		$scope.prepareRun ();
		$scope.run ();
	};
});

musicApp.controller ('AlbumFormatCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.loaded = false;
	$scope.format = $routeParams.format;

	$http.get ('api/album/format/' + $routeParams.format).success (function (albums) {
		$scope.albums = albums;
		$scope.loaded = true;
	});
});

musicApp.controller ('AlbumFormat2Ctrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.loaded = false;
	$scope.format = $routeParams.format;

	$http.get ('api/album/format2/' + $routeParams.format).success (function (albums) {
		$scope.albums = albums;
		$scope.loaded = true;
	});
});

musicApp.controller ('AddAlbumChartNoteCtrl', function ($rootScope, $scope, $http) {

	$scope.notes = [];

	$scope.newNote = function () {
		$scope.notes.push({
			artist: null,
			title: null,
			note: null
		});
	};

	$scope.newNote();

	$scope.newAlbum = function (note) {
		var index = note.artist.indexOf('\t');

		if (index !== -1) {
			note.title = note.artist.substr (index + 1).trim ();
			note.artist = note.artist.substr (0, index).trim ();
		}
	};

	$scope.submit = function () {
		var notes = [];
		var note;

		for (var i in $scope.notes) {
			note = $scope.notes[i];
			if (note.artist !== null && note.title !== null && note.note !== null) {
				note.artist = note.artist.replace (/\'/g, '`');
				note.title = note.title.replace (/\'/g, '`');
				notes.push (note);
			}
		}

		$http.put ('api/add/album-chart-note', notes)
		.then (function (res) {
			$scope.notes = [];
			$scope.newNote();
		});
	};
});

musicApp.controller ('IOSCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.loaded = false;
	$scope.sections = [];

	$http.get ('ios/fetch').success (function (data) {
		$scope.sections.push ({ name: 'Current', songs: data.current });
		$scope.sections.push ({ name: 'Album', songs: data.album });
		$scope.sections.push ({ name: 'Seasonal', songs: data.seasonal });
		$scope.sections.push ({ name: 'Charted', songs: data.charted });
		$scope.sections.push ({ name: 'Uncharted', songs: data.uncharted });
		$scope.sections.push ({ name: 'Favorites', songs: data.favorite });

		var total = 0;
		var songs = [];
		var i, j;
		for (i in $scope.sections) {
			for (j in $scope.sections[i].songs) {
				songs[$scope.sections[i].songs[j].id] = 1;
			}
		}

		for (i in songs) {
			total++;
		}

		$scope.total = total;
		$scope.loaded = true;
	});
});

musicApp.controller ('SeasonSingleCtrl', function ($rootScope, $scope, $routeParams, $http) {

	var limit = 5;

	$scope.loaded = false;
	$scope.charts = [];
	$scope.weeks = [];

	$http.get ('api/season').success (function (data) {
		var songs = [];
		var i, j, k;
		var song;

		for (i in data.songs) {
			song = data.songs[i];
			songs[song.id] = song;
		}

		var weekRow, week;
		
		for (i in data.weeks) {
			weekRow = data.weeks[i];
			week = { week: weekRow.week, songs: [] };
				
			for (k = 0; k < limit; k++) {
				week.songs[k] = [];
			}
	
			for (j in weekRow.songs) {
				for (k = 0; k < limit; k++) {
					song = weekRow.songs[j][k];

					if (song === null || song === undefined) {
						week.songs[k][j] = {};
					}
					else {
						week.songs[k][j] = songs[song];
					}
				}
			}

			$scope.weeks.push (week);
		}

		$scope.charts = data.charts;
		$scope.loaded = true;
	});
});

musicApp.controller ('SeasonSingleListCtrl', function ($scope, $http, songService) {

	$scope.songs = [];

	$http.get ('api/season-detail').success (function (data) {
		$scope.songs = data;
		$scope.songs.sort(function (a, b) {
			if (a.plays === b.plays) {
				return a.id - b.id;
			}

			return a.plays - b.plays;
		});
	});
	
	$scope.addSong = function (song) {
		songService.addSongs([song]);
	};
});

musicApp.controller('StatsPlaysCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.rawData = [];
	$scope.data = [];
	$scope.ranks = [];
	$scope.tiers = [];
	$scope.songs = [];
	$scope.total = { sum: 0, count: 0 };
	$scope.allVisible = true;
	$scope.plays = [];
	$scope.viewTypes = [ { name: 'Chart', active : true },
											 { name: 'Table', active : false },
											 { name: 'Cumul', active : false } ];
	
	for (i = 0; i < 10; i++) {
		$scope.ranks[i] = { name: i + 1, active: true, data: [] };
	}
	$scope.ranks[10] = { name: '11+', active: true, data: [] };

	for (var i = 0; i <= 100; i++) {
		$scope.plays[i] = { play: i, rank: [], cumul: [] };
		for (var j = 0; j <= 10; j++) {
			$scope.plays[i].rank[j] = 0;
		}
	}

	$scope.plays[100].play = '100+';

	$http.get('stats/plays-by-' + $routeParams.type).success(function (data) {
		var i, j, datum, tier, rank, plays;
		
		$scope.rawData = data;

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

		$scope.data = data;
	});
		
	$http.get('api/lastPlayed/10').success(function (lastPlayed) {
		$scope.recentSongs = lastPlayed;
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

	$scope.toggleRank = function (index) {
		if ($scope.ranks[index]) {
			if ($scope.ranks[index].active) {
				$scope.ranks[index].active = false;
			} else {
				$scope.ranks[index].active = true;
			}

			updateData();
		}
	};

	$scope.toggleType = function (viewType) {
		for (var i in $scope.viewTypes) {
			$scope.viewTypes[i].active = false;
		}

		viewType.active = true;
	};

	$scope.setAllRanks = function (bool) {
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

musicApp.controller('AlbumListCtrl', function ($rootScope, $scope, $http) {
	$scope.albums = [];

	$http.get('api/all-albums').success(function (data) {
		for (var i in data) {
			if (data[i] !== null) {
				$scope.albums.push (data[i]);
			}
		}
	});	
});

musicApp.controller('SummarySingleChartCtrl', function ($rootScope, $scope, $http) {
	$scope.charts = [];
	var chartNames = ['billboard', 'oricon',	'deutsche', 'uk', 'francais', 'melon', 'gaon'];

	$http.get('chart/single/summary').success(function (data) {

		for (var i in data) {
			$scope.charts[chartNames.indexOf(data[i].type)] = data[i];
		}
	});
});

musicApp.controller('SummaryAlbumChartCtrl', function ($rootScope, $scope, $http) {
	$scope.charts = [];
	var chartNames = ['billboard', 'oricon',	'deutsche', 'uk', 'francais', 'gaon'];

	$http.get('chart/album/summary').success(function (data) {

		for (var i in data) {
			$scope.charts[chartNames.indexOf(data[i].type)] = data[i];
		}
	});
});

musicApp.controller('SingleChartAlbumCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {
	
	$scope.chart = $routeParams.name;
	$scope.date = toUTCDate(new Date($routeParams.date));
	$scope.songs = [];
		
	$http.get('chart/single/album/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function (songs) {
			$scope.songs = songs;
		});

	$scope.play = function () {
		songService.addSongs($scope.songs);
	};

	$scope.addSongsFrom = function (index) {
		var i;
		var row, song;
		var songs = [];
		var minRank, rank;

		for (i = index; i < $scope.songs.length; i++) {
			songs.push($scope.songs[i]);
		}
		songService.addSongs(songs);
	};
});
