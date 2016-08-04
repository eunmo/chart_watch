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
				}, 0);
				$scope.nowPlaying[0] = song;
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
			elem.src = '/music/' + song.id + '.mp3';
			elem.load();
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
			$http.put('api/play/song', song).success(function () {
				songService.songEnded(song);
			});
			if (!startNext) {
				$scope.playNext();
			}
		});
	};
	
	$scope.songs = [];
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
	$scope.nowPlaying = [];
	$scope.bindDone = false;
	$scope.preloaded = false;

	$scope.useCrossfade = false;
	$scope.crossfade = false;
	$scope.crossfadeDuration = 10;

	$scope.upNextLimit = 10;
	$scope.expanded = false;

	$scope.initAudio = function () {
		alert('init audio for iOS');
		$rootScope.audios[0].init();
		$rootScope.audios[1].init();
		$rootScope.audios[2].init();
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

	$scope.removeSong = function (song) {
		var index = $scope.songs.indexOf(song);
		$scope.songs.splice(index, 1);

		if (index === 0) {
			$scope.preload();
		}
	};

	$scope.clearAll = function () {
		var songSize = $scope.songs.length;
		$scope.songs.splice(0, songSize);
		$scope.preloaded = false;
	};

	$scope.seek = function (ratio) {
		$scope.updateProgress(ratio);
		$scope.selectedAudio.seek(ratio);
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
					$scope.seek(clickRatio);
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

	$scope.rewind = function () {
		$scope.seek(0);
	};

	$scope.expand = function () {
		$scope.upNextLimit = 1000000;
		$scope.expanded = true;
	};

	$scope.shrink = function () {
		$scope.upNextLimit = 10;
		$scope.expanded = false;
	};
	
	$scope.shuffle = function () {
		$http.get('shuffle').success(function (data) {
			var array = [];

			for (var i in data) {
				var song = data[i];
				if (song.plays > 0) {
					array.push (song);
				}
				else {
					console.log (song);
				}
			}

			songService.addSongs(array);
		});
	};

	// jquery for slider (dirty, but works)
	$scope.updateProgress = function (ratio) {
		percent = (ratio < 0 ? 0 : (ratio > 1 ? 1 : ratio)) * 100;

		$('#timeline-bar').css('width', percent + '%');
	};
});
