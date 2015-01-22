musicApp.controller('InitialCtrl', function ($rootScope, $scope) {
 
  $scope.initials = [];

	$scope.initials.push.apply($scope.initials, '가나다라마바사아자차카타파하'.split(''));
	$scope.initials.push.apply($scope.initials, 'ABCDEFGHIJLKMNOPQRSTUVWXYZ'.split(''));
	$scope.initials.push('0-9');
});

musicApp.controller('ArtistInitialCtrl', function ($rootScope, $scope, $routeParams, $http) {
 
  $scope.artists = [];

	$http.get('api/initial/' + $routeParams.initial).success(function (data) {
    $scope.artists = data;
	});
});

musicApp.controller('ArtistCtrl', function ($rootScope, $scope, $routeParams, $http, addSongService) {

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
		console.log('adding');
		addSongService.addSongs([sendSong]);
	};
});

musicApp.controller('PlayerController', function ($rootScope, $scope, $http, $interval, addSongService) {
	
	$scope.songs = [];
	$scope.songLoading = false;
	$scope.songLoaded = false;

	$scope.loadSong = function (index) {
		if (!$scope.songLoaded && !$scope.songLoading && index in $scope.songs) {
			$scope.songLoading = true;
			var song = $scope.songs[index];
			$scope.songs.splice(index, 1);
			$http.get('api/s3/' + song.id).success(function (data) {
				$scope.audio.src = data.url;
				$scope.songLoading = true;
				$scope.songLoaded = true;
			});
		}
	};

	$scope.$on('handleAddSong', function () {
		var song, listSong;
		for (var i in addSongService.songs) {
			$scope.songs.push(addSongService.songs[i]);
		}
		$scope.loadSong(0);
	});

	$scope.removeSong = function (song) {
		var index = $scope.songs.indexOf(song);
		$scope.songs.splice(index, 1);
	};

	$scope.playing = false;
	$scope.audio = document.createElement('audio');
	
	// $scope.audio.src = '/1.mp3';
	$scope.time = 0;
	$scope.duration = 0;
	$scope.bindDone = false;

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
		$scope.songLoading = false;
		$scope.songLoaded = false;
		$scope.loadSong(0);
	});

	$scope.updateTime = function () {
		if ($scope.playing) {
			var playPercent = 100 * ($scope.audio.currentTime / $scope.audio.duration);
			$scope.movePlayhead(playPercent);
		}
	};

	$interval(function () { $scope.updateTime(); }, 10);

	$scope.audio.addEventListener('timeupdate', function () {
		$scope.$apply(function () {
			$scope.time = $scope.audio.currentTime;
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
					var xCoord = event.pageX - $('#timeline').offset().left - ($('#playhead').width() / 2);
					var clickRatio = xCoord / ($('#timeline').width() - $('#playhead').width());
					clickRatio = (clickRatio < 0 ? 0 : (clickRatio > 1 ? 1 : clickRatio));
					$scope.movePlayhead(clickRatio * 100);
					$scope.audio.currentTime = $scope.audio.duration * clickRatio;
				}
			});
			$scope.bindDone = true;
		}
		$scope.play();
	});
	
	// jquery for slider (dirty, but works)
	$scope.movePlayhead = function (percent) {
		percent = (percent < 0 ? 0 : (percent > 100 ? 100 : percent));
		percent = percent * ($('#timeline').width() - $('#playhead').width()) / $('#timeline').width();

		$('#playhead').css('margin-left', percent + '%');
	};
});
