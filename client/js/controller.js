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
 
  $scope.artists = [];

	$http.get('api/initial/' + $routeParams.initial).success(function (data) {
    $scope.artists = data;
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

	$scope.addSong = function (song, albumId) {
		var sendSong = {
			id: song.id,
			title: song.title,
			albumId: albumId
		};
		songService.addSongs([sendSong]);
	};
});

musicApp.controller('PlayerController', function ($rootScope, $scope, $http, songService) {
	
	$scope.songs = [];
	$scope.randomSource = [];
	$scope.songLoading = false;
	$scope.songLoaded = false;

	$scope.playing = false;
	$scope.audio = document.createElement('audio');
	
	$scope.time = 0;
	$scope.duration = 0;
	$scope.bindDone = false;

	$scope.loadSong = function (index) {
		while ($scope.songs.length < 16 && $scope.randomSource.length > 0) {
			var randomIndex = Math.floor((Math.random() * $scope.randomSource.length));
			$scope.songs.push($scope.randomSource[randomIndex]);
			$scope.randomSource.splice(randomIndex, 1);
		}
		if (!$scope.songLoaded && !$scope.songLoading && index in $scope.songs) {
			$scope.songLoading = true;
			var song = $scope.songs[index];
			$scope.songs.splice(index, 1);
			$http.get('api/s3/' + song.id).success(function (data) {
				$scope.audio.src = data.url;
				$scope.audio.load();
				$scope.songLoading = true;
				$scope.songLoaded = true;
				$scope.title = song.title;
				$scope.albumId = song.albumId;
			});
		}
	};

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
	};

	$scope.clearAll = function () {
		var randomSourceSize = $scope.randomSource.length;
		var songSize = $scope.songs.length;
		$scope.randomSource.splice(0, randomSourceSize);
		$scope.songs.splice(0, songSize);
	};

	$scope.play = function () {
		$scope.audio.play();
		$scope.playing = true;
	};

	$scope.pause = function () {
		$scope.audio.pause();
		$scope.playing = false;
	};

	$scope.audio.addEventListener('ended', function () {
		$scope.$apply(function () {
			$scope.pause();
		});
		$scope.updateTime(0);
		$scope.songLoading = false;
		$scope.songLoaded = false;
		$scope.loadSong(0);
	});

	$scope.updateTime = function () {
		if ($scope.playing) {
			var playPercent = 100 * ($scope.audio.currentTime / $scope.audio.duration);
			$scope.updateProgress(playPercent);
		}
	};

	$scope.audio.addEventListener('timeupdate', function () {
		$scope.$apply(function () {
			$scope.time = $scope.audio.currentTime;
			$scope.updateTime();
		});
	});

	$scope.audio.addEventListener('canplaythrough', function () {
		$scope.$apply(function () {
			$scope.time = $scope.audio.currentTime;
			$scope.duration = $scope.audio.duration;
		});
		if (!$scope.bindDone) {
			$('#timeline').bind('click', function (event) {
				if ($scope.playing) {
					var xCoord = event.pageX - $('#timeline').offset().left;
					var clickRatio = xCoord / $('#timeline').width();
					clickRatio = (clickRatio < 0 ? 0 : (clickRatio > 1 ? 1 : clickRatio));
					$scope.updateProgress(clickRatio * 100);
					$scope.audio.currentTime = $scope.audio.duration * clickRatio;
				}
			});
			$scope.bindDone = true;
		}
		$scope.play();
	});
	
	// jquery for slider (dirty, but works)
	$scope.updateProgress = function (percent) {
		percent = (percent < 0 ? 0 : (percent > 100 ? 100 : percent));

		$('#timeline-bar').css('width', percent + '%');
	};
});
