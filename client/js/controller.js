musicApp.controller('InitialCtrl', function ($rootScope, $scope, $http, songService) {
 
  $scope.initials = [];

	$scope.initials.push.apply($scope.initials, '가나다라마바사아자차카타파하'.split(''));
	$scope.initials.push.apply($scope.initials, 'ABCDEFGHIJLKMNOPQRSTUVWXYZ'.split(''));
	$scope.initials.push('0-9');

	$scope.shuffle = function () {
		$http.get('api/shuffle').success(function (data) {
			var songs = [];
			var song, songRow;
			for (var i in data) {
				songRow = data[i];
				song = {
					id: songRow.id,
					title: songRow.title,
					albumId: songRow.Albums[0].id
				};
				songs.push(song);
			}
			songService.addRandom(songs);
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

	$scope.artists = [];

	$http.get('api/artist/' + $routeParams.id).success(function (artist) {
		// format songs into rows
		for (var i in artist.albums) {
			var album = artist.albums[i];
			for (var j in album.songs) {
				album.songs[j].albumId = album.id;
			}
		}
		$scope.artists.push(artist);
	});

	$scope.addNext = function (song, albumId) {
		var sendSong = {
			id: song.id,
			title: song.title,
			albumId: albumId
		};
		songService.addNext([sendSong]);
	};

	$scope.addSong = function (song, albumId) {
		var sendSong = {
			id: song.id,
			title: song.title,
			albumId: albumId
		};
		songService.addSongs([sendSong]);
	};
	
	$scope.addNextAlbum = function (album) {
		var songs = [];
		for (var i in album.songs) {
			var song = album.songs[i];
			var sendSong = {
				id: song.id,
				title: song.title,
				albumId: album.id
			};
			songs.push(sendSong);
		}
		songService.addNext(songs);
	};

	$scope.addAlbum = function (album) {
		var songs = [];
		for (var i in album.songs) {
			var song = album.songs[i];
			var sendSong = {
				id: song.id,
				title: song.title,
				albumId: album.id
			};
			songs.push(sendSong);
		}
		songService.addSongs(songs);
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
		album.editArtists = [];

		for (var i in album.Artists) {
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

musicApp.controller('PlayerController', function ($rootScope, $scope, $http, songService) {

	// internal class for manipulating audio element
	var Audio = function ($scope) {
		var elem = document.createElement('audio');
		var song;
		var initialized = false;
		var loading = false;
		var loaded = false;
		var selected = false;

		var start = function () {
			if (selected && loaded) {
				$scope.$apply(function () {
					$scope.time = elem.currentTime;
					$scope.duration = elem.duration;
					$scope.title = song.title;
					$scope.albumId = song.albumId;
				});
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
			start();
		});

		elem.addEventListener('timeupdate', function () {
			$scope.$apply(function () {
				$scope.time = elem.currentTime;
				$scope.updateProgress(elem.currentTime / elem.duration);
			});
		});

		elem.addEventListener('ended', function () {
			$scope.pause();
			$scope.updateProgress(0);
			loading = false;
			$http.put('api/play/song', song);
			$scope.playNext();
		});
	};
	
	$scope.songs = [];
	$scope.randomSource = [];
	$scope.loaded = false;

	$scope.playing = false;
	$rootScope.audios = [];
	$rootScope.audios[0] = new Audio($scope);
	$rootScope.audios[1] = new Audio($scope);
	$scope.selectedIndex = 0;
	$scope.selectedAudio = $rootScope.audios[$scope.selectedIndex];
	$scope.selectedAudio.setSelected(true);
	
	$scope.time = 0;
	$scope.duration = 0;
	$scope.bindDone = false;
	$scope.preloaded = false;

	$scope.initAudio = function () {
		alert('init audio for iOS');
		$rootScope.audios[0].init();
		$rootScope.audios[1].init();
	};

	$scope.getRandom = function () {
		// add songs from selected random source
		// TODO add customized random here.
		while ($scope.songs.length < 16 && $scope.randomSource.length > 0) {
			var randomIndex = Math.floor((Math.random() * $scope.randomSource.length));
			$scope.songs.push($scope.randomSource[randomIndex]);
			$scope.randomSource.splice(randomIndex, 1);
		}
	};

	$scope.preload = function () {
		if (0 in $scope.songs) {
			var song = $scope.songs[0];
			var nextIndex = 1 - $scope.selectedIndex;
			var nextAudio = $rootScope.audios[nextIndex];
			nextAudio.load(song);
			$scope.preloaded = true;
		}
	};

	$scope.playNext = function () {
		var nextIndex = 1 - $scope.selectedIndex;
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
		for (var i in songService.random) {
			$scope.randomSource.push(songService.random[i]);
		}
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
		var randomSourceSize = $scope.randomSource.length;
		var songSize = $scope.songs.length;
		$scope.randomSource.splice(0, randomSourceSize);
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
