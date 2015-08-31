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
	$scope.showFeat = false;

	$http.get('api/artist/' + $routeParams.id).success(function (artist) {
		// format songs into rows
		for (var i in artist.albums) {
			var album = artist.albums[i];
			for (var j in album.songs) {
				album.songs[j].albumId = album.id;
			}
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
});

musicApp.controller('ChartCtrl', function ($rootScope, $scope, $routeParams, $http, songService) {
	$scope.chart = $routeParams.name;
	$scope.date = new Date();
	$scope.date = new Date(Date.UTC($scope.date.getFullYear(), $scope.date.getMonth(), $scope.date.getDate()));

	$scope.minDate = new Date(Date.UTC(2015, 0, 3));
	if ($scope.chart === 'gaon') {
		if ($scope.date.getDay() < 4) {
			$scope.date.setDate($scope.date.getDate() - 7);
		}
		$scope.chartName = 'Gaon';
		$scope.minDate = new Date(Date.UTC(2010, 0, 2));
	} else if ($scope.chart === 'melon') {
		if ($scope.date.getDay() < 1) {
			$scope.date.setDate($scope.date.getDate() - 7);
		}
		$scope.chartName = 'Melon';
		$scope.minDate = new Date(Date.UTC(2005, 0, 1));
	} else if ($scope.chart === 'billboard') {
		if ($scope.date.getDay() < 3) {
			$scope.date.setDate($scope.date.getDate() - 7);
		}
		$scope.chartName = 'Billboard';
		$scope.minDate = new Date(Date.UTC(2000, 0, 1));
	} else if ($scope.chart === 'uk') {
		if ($scope.date.getDay() < 1) {
			$scope.date.setDate($scope.date.getDate() - 7);
		}
		$scope.chartName = 'UK';
		$scope.minDate = new Date(Date.UTC(2000, 0, 1));
	} else if ($scope.chart === 'oricon') {
		if ($scope.date.getDay() < 3) {
			$scope.date.setDate($scope.date.getDate() - 7);
		}
		$scope.chartName = 'Oricon';
		$scope.minDate = new Date(Date.UTC(2010, 0, 2));
	}
	$scope.date.setDate($scope.date.getDate() - $scope.date.getDay() - 1);
	$scope.max = $scope.date.getTime();
	$scope.min = $scope.minDate.getTime();
	$scope.rows = [];

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
		var time = $scope.date.getTime();
		if ($scope.max < time) {
			$scope.date = new Date($scope.max);
		} else if (time < $scope.min) {
			$scope.date = new Date($scope.min);
		} else {
			$scope.date = new Date($scope.date);
		}
	};

	$scope.go = function () {
		$scope.updateDate(6 - $scope.date.getDay());
		$scope.fetch();
	};
	
	$scope.prev = function () {
		$scope.updateDate(-7);
		$scope.fetch();
	};
	
	$scope.next = function () {
		$scope.updateDate(7);
		$scope.fetch();
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
		console.log(chartRows);
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
	$scope.weeks = [];
	$http.get('chart/ones')
	.success(function (weeks) {
		$scope.weeks = weeks;
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
	$http.get('api/lastPlayed')
	.success(function (lastPlayed) {
		$scope.rows = lastPlayed;
	});
});

musicApp.controller('NewSongCtrl', function ($rootScope, $scope, $http, songService) {
	$scope.rows = [];
	$scope.title = 'Added';
	$http.get('api/newSongs')
	.success(function (lastPlayed) {
		$scope.rows = lastPlayed;
	});
});

musicApp.controller('PlayerController', function ($rootScope, $scope, $http, $timeout, songService) {

	// internal class for manipulating audio element
	var Audio = function ($scope) {
		var elem = document.createElement('audio');
		var song;
		var initialized = false;
		var loading = false;
		var loaded = false;
		var selected = false;
		var startNext = false;

		var start = function () {
			if (selected && loaded) {
				$timeout(function () {
					$scope.time = elem.currentTime;
					$scope.duration = elem.duration;
					$scope.title = song.title;
					$scope.albumId = song.albumId;
					$scope.artists = song.artists;
				}, 0);
				$scope.play();
			}
		};

		this.init = function () {
			if (!initialized) {
				elem.play();
				elem.pause();
				initialized = true;
			}
		};

		this.setSelected = function (bool) {
			selected = bool;
			start();
		};

		this.load = function (s) {
			song = s;
			loading = true;
			loaded = false;
			$http.get('api/s3/' + song.id).success(function (data) {
				elem.src = data.url;
				elem.load();
			});
		};

		this.play = function () {
			if ($scope.crossfade) {
				$scope.crossfade = false;
				elem.volume = 0.3;
				$(elem).animate({volume: 1}, 1000 * $scope.crossfadeDuration, 'swing');				
			} else {
				elem.volume = 1;
			}
			elem.play();
		};

		this.pause = function () {
			elem.pause();
		};

		this.stop = function () {
			loaded = loading = false;
		};

		this.seek = function (ratio) {
			elem.currentTime = elem.duration * ratio;
		};

		this.getLoading = function () {
			return loading;
		};
		
		this.getLoaded = function () {
			return loaded;
		};
		
		elem.addEventListener('canplaythrough', function () {
			loaded = true;
			startNext = false;
			start();
		});

		elem.addEventListener('timeupdate', function () {
			if (selected) {
				$scope.$apply(function () {
					$scope.time = elem.currentTime;
					$scope.updateProgress(elem.currentTime / elem.duration);
					if ($scope.useCrossfade && 
							elem.duration - elem.currentTime < $scope.crossfadeDuration && !startNext) {
						startNext = true;
						$scope.crossfade = true;
						$scope.playNext();
						$(elem).animate({volume: 0.3}, 1000 * $scope.crossfadeDuration, 'swing');
					}
				});
			}
		});

		elem.addEventListener('ended', function () {
			if (!startNext) {
				$scope.pause();
				$scope.updateProgress(0);
			}
			loading = false;
			$http.put('api/play/song', song);
			if (!startNext) {
				$scope.playNext();
			}
		});
	};

	var Shuffle = function ($scope) {
		var levels = [];
		var total = 0;

		this.addSongs = function (songs) {
			var song, level;
			for (i in songs) {
				song = songs[i];
				level = 1;

				if (song.rank) {
					level += (8 - song.rank);
					if (song.plays < 10)
						level += 10;
					else
						level += Math.floor(song.plays / 5);
				}

				if (song.plays < 3)
					level += 2;
				if (song.plays < 2)
					level += 2;
				
				if (levels[level] === undefined)
					levels[level] = [];
				levels[level].push(song);
				total += level;
			}
		}

		this.getNext = function () {
			var index = Math.floor((Math.random() * total));
			var level;

			for (level = 1; level < levels.length; level++) {
				if (levels[level]) {
					if (index < levels[level].length * level)
						break;
					index -= levels[level].length * level;
				}
			}

			index = Math.floor(Math.random() * levels[level].length);
			$scope.songs.push(levels[level][index]);
			levels[level].splice(index, 1);
			total -= level;
		}

		this.getTotal = function () {
			return total;
		}

		this.clear = function () {
			levels = [];
			total = 0;
		}
	};
	
	$scope.songs = [];
	$scope.shuffle = new Shuffle($scope);
	$scope.loaded = false;

	$scope.playing = false;
	$rootScope.audios = [];
	$rootScope.audios[0] = new Audio($scope);
	$rootScope.audios[1] = new Audio($scope);
	$rootScope.audios[2] = new Audio($scope);
	$scope.selectedIndex = 0;
	$scope.selectedAudio = $rootScope.audios[$scope.selectedIndex];
	$scope.selectedAudio.setSelected(true);
	
	$scope.time = 0;
	$scope.duration = 0;
	$scope.bindDone = false;
	$scope.preloaded = false;

	$scope.useCrossfade = false;
	$scope.crossfade = false;
	$scope.crossfadeDuration = 10;

	$scope.initAudio = function () {
		alert('init audio for iOS');
		$rootScope.audios[0].init();
		$rootScope.audios[1].init();
		$rootScope.audios[2].init();
	};

	$scope.getRandom = function () {
		while ($scope.songs.length <= 10 && $scope.shuffle.getTotal() > 0) {
			$scope.shuffle.getNext();
		}
	};

	$scope.getNextIndex = function () {
		var nextIndex = $scope.selectedIndex + 1;
		if (nextIndex >= 3)
			nextIndex = 0;
		return nextIndex;
	};

	$scope.preload = function () {
		if (0 in $scope.songs) {
			var song = $scope.songs[0];
			var nextIndex = $scope.getNextIndex();
			var nextAudio = $rootScope.audios[nextIndex];
			nextAudio.load(song);
			$scope.preloaded = true;
		}
	};

	$scope.playNext = function () {
		var nextIndex = $scope.getNextIndex();
		var nextAudio = $rootScope.audios[nextIndex];
		$scope.getRandom();

		if ($scope.preloaded) {
			$scope.preloaded = false;
			$scope.selectedAudio.setSelected(false);
			$scope.selectedAudio = nextAudio;
			$scope.selectedIndex = nextIndex;
			nextAudio.setSelected(true);

			$scope.songs.splice(0, 1);
			$scope.preload();
		} else {
			$scope.loadSong(0);
		}
	};

	$scope.loadSong = function (index) {
		$scope.getRandom();

		if ($scope.songs.length === 0) {
			$scope.loaded = false;
		}

		if (index in $scope.songs && !$scope.selectedAudio.getLoading()) {
			var song = $scope.songs[index];
			$scope.songs.splice(index, 1);
			$scope.selectedAudio.load(song);
			$scope.loaded = true;
		}

		$scope.preload();
	};
	
	$scope.$on('handleAddNext', function () {
		for (var i in songService.next) {
			$scope.songs.splice(i, 0, songService.next[i]);
		}
		$scope.loadSong(0);
	});

	$scope.$on('handleAddSong', function () {
		for (var i in songService.songs) {
			$scope.songs.push(songService.songs[i]);
		}
		$scope.loadSong(0);
	});

	$scope.$on('handleRandom', function () {
		$scope.shuffle.addSongs(songService.random);
		$scope.loadSong(0);
	});

	$scope.removeSong = function (song) {
		var index = $scope.songs.indexOf(song);
		$scope.songs.splice(index, 1);

		if (index === 0) {
			$scope.preload();
		}
	};

	$scope.clearAll = function () {
		var songSize = $scope.songs.length;
		$scope.shuffle.clear();
		$scope.songs.splice(0, songSize);
		$scope.preloaded = false;
	};

	$scope.play = function () {
		$scope.selectedAudio.play();
		$scope.playing = true;
		
		if (!$scope.bindDone) {
			$('#timeline').bind('click', function (event) {
				if ($scope.playing) {
					var xCoord = event.pageX - $('#timeline').offset().left;
					var clickRatio = xCoord / $('#timeline').width();
					clickRatio = (clickRatio < 0 ? 0 : (clickRatio > 1 ? 1 : clickRatio));
					$scope.updateProgress(clickRatio);
					$scope.selectedAudio.seek(clickRatio);
				}
			});
			$scope.bindDone = true;
		}
	};

	$scope.pause = function () {
		$scope.selectedAudio.pause();
		$scope.playing = false;
	};

	$scope.toggle = function () {
		if ($scope.playing)
			$scope.pause();
		else
			$scope.play();
	};

	$scope.next = function () {
		$scope.pause();
		$scope.selectedAudio.stop();
		$scope.playNext();
	};

	// jquery for slider (dirty, but works)
	$scope.updateProgress = function (ratio) {
		percent = (ratio < 0 ? 0 : (ratio > 1 ? 1 : ratio)) * 100;

		$('#timeline-bar').css('width', percent + '%');
	};
});
