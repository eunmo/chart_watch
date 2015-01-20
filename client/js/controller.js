musicApp.controller('ArtistListCtrl', function($rootScope, $scope, $http) {
 
  $scope.artists = [];

	$http.get('api/artist').success(function(data) {
    $scope.artists = data;
	});
});

musicApp.controller('ListController', function($rootScope, $scope, $http) {
 
  $scope.artists = [];
  $scope.albums = [];
  $scope.songs = [];
  $scope.artistMap = [];
  $scope.albumMap = [];
  $scope.songMap = [];

	$http.get('api/all').success(function(data) {
		var i, j;
		var artist, album, song;
		var ass;

		for (i in data.artists) {
			artist = data.artists[i];
			artist.albums = [];
			artist.songs = [];
			artist.features = [];
			artist.featuredAlbums = [];
			$scope.artists[i] = artist;
			$scope.artistMap[artist.id] = i;
		}

		for (i in data.albums) {
			album = data.albums[i];
			album.artists = [];
			album.songs = [];
			$scope.albums[i] = album;
			$scope.albumMap[album.id] = i;
		}

		for (i in data.songs) {
			song = data.songs[i];
			song.albums = [];
			song.artists = [];
			song.features = [];
			$scope.songs[i] = song;
			$scope.songMap[song.id] = i;
		}

		for (i in data.albumArtists) {
			ass = data.albumArtists[i];
			album = $scope.albums[$scope.albumMap[ass.AlbumId]];
			artist = $scope.artists[$scope.artistMap[ass.ArtistId]];
			album.artists[ass.order] = artist;
			artist.albums.push(album);
		}

		for (i in data.albumSongs) {
			ass = data.albumSongs[i];
			album = $scope.albums[$scope.albumMap[ass.AlbumId]];
			song = $scope.songs[$scope.songMap[ass.SongId]];
			album.songs.push( { song: song, disk: ass.disk, track: ass.track } );
			song.albums.push(album);
		}

		for (i in data.songArtists) {
			ass = data.songArtists[i];
			song = $scope.songs[$scope.songMap[ass.SongId]];
			artist = $scope.artists[$scope.artistMap[ass.ArtistId]];
			if (ass.feat) {
				song.features[ass.order] = artist;
				artist.features.push(song);
				for (j in song.albums) {
					artist.featuredAlbums.push(album);
				}
			} else {
			 	song.artists[ass.order] = artist;
				artist.songs.push(song);
			}
		}
		
		for (i in data.albums) {
			album = data.albums[i];
			album.artists = album.artists.filter(function(n) { return n; });
		}

		for (i in data.songs) {
			song = data.songs[i];
			song.artists = song.artists.filter(function(n) { return n; });
			song.features = song.features.filter(function(n) { return n; });
		}
	});
});

musicApp.controller('ArtistInitialCtrl', function($rootScope, $scope, $routeParams, $http) {
 
  $scope.artists = [];

	$http.get('api/initial/' + $routeParams.initial).success(function(data) {
    $scope.artists = data;
	});
});

musicApp.controller('ArtistCtrl', function($rootScope, $scope, $routeParams, $http, addSongService) {

	$scope.artists = [];

	$http.get('api/artist/' + $routeParams.id).success(function(artist) {
		// format songs into rows
		for (var i in artist.albums) {
			var album = artist.albums[i];
			for (var j in album.songs) {
				album.songs[j].albumId = album.id;
			}
		}
		$scope.artists.push(artist);
	});

	$scope.addSong = function (song, albumId) {
		var sendSong = {
			id: song.id,
			title: song.title,
			albumId: albumId
		};
		addSongService.addSongs([sendSong]);

	};
});

musicApp.controller('InitialCtrl', function($rootScope, $scope) {
 
  $scope.initials = [];

	$scope.initials.push.apply($scope.initials, '가나다라마바사아자차카타파하'.split(''));
	$scope.initials.push.apply($scope.initials, 'ABCDEFGHIJLKMNOPQRSTUVWXYZ'.split(''));
	$scope.initials.push('0-9');
});

musicApp.controller('PlayerController', function($rootScope, $scope, $interval, addSongService) {
	$scope.songs = [];

	$scope.$on('handleAddSong', function () {
		var song, listSong;
		for (var i in addSongService.songs) {
			$scope.songs.push(addSongService.songs[i]);
		}
	});

	$scope.removeSong = function (song) {
		var index = $scope.songs.indexOf(song);
		$scope.songs.splice(index, 1);
	};

	$scope.playing = false;
	$scope.audio = document.createElement('audio');
	
	$scope.audio.src = '/1.mp3';
	$scope.time = 0;
	$scope.duration = 0;
	$scope.bindDone = false;

	$scope.play = function() {
		$scope.audio.play();
		$scope.playing = true;
	};

	$scope.stop = function() {
		$scope.audio.pause();
		$scope.playing = false;
	};

	$scope.audio.addEventListener('ended', function() {
		$scope.$apply(function() {
			$scope.stop();
		});
	});

	$scope.updateTime = function () {
		if ($scope.playing) {
			var playPercent = 100 * ($scope.audio.currentTime / $scope.audio.duration);
			$scope.movePlayhead(playPercent);
		}
	};

	$interval(function () { $scope.updateTime(); }, 10);

	$scope.audio.addEventListener('timeupdate', function() {
		$scope.$apply(function() {
			$scope.time = $scope.audio.currentTime;
		});
	});

	$scope.audio.addEventListener('canplaythrough', function() {
		$scope.$apply(function() {
			$scope.duration = $scope.audio.duration;
		});
		if (!$scope.bindDone) {
			$("#timeline").bind('click', function (event) {
				if ($scope.playing) {
					var xCoord = event.pageX - $("#timeline").offset().left - ($("#playhead").width() / 2);
					var clickRatio = xCoord / ($("#timeline").width() - $("#playhead").width());
					clickRatio = (clickRatio < 0 ? 0 : (clickRatio > 1 ? 1 : clickRatio));
					$scope.movePlayhead(clickRatio * 100);
					$scope.audio.currentTime = $scope.audio.duration * clickRatio;
				}
			});
			$scope.bindDone = true;
		}
	});
	
	// jquery for slider (dirty, but works)
	$scope.movePlayhead = function (percent) {
		percent = (percent < 0 ? 0 : (percent > 100 ? 100 : percent));
		percent = percent * ($("#timeline").width() - $("#playhead").width()) / $("#timeline").width();

		$("#playhead").css("margin-left", percent + '%');
	};
});
