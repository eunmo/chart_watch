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
			$http.put('api/play/song', song);
			if (!startNext) {
				$scope.playNext();
			}
		});
	};

	var Shuffle = function ($scope) {
		var tiers = [];
		var max_tier = 5;
		var total = 0;
		var totals = [];

		var init = function () {
			for (i = 1; i <= max_tier; i++) {
				tiers[i] = [];
				totals[i] = 0;
			}
			total = 0;
		};

		this.addSongs = function (songs) {
			var song, level, tier;
			var counts = [];

			for (var i in songs) {
				song = songs[i];
				level = 1;

				if (song.rank) {
					level += (8 - song.rank);
					if (song.plays >= 10) {
						level += Math.floor(song.plays / 5);
						tier = 1;
					} else if (song.plays >= 5) {
						tier = 2;
					} else {
						tier = 3;
					}
				} else {
					if (song.plays < 3) {
						tier = 4;
					} else {
						tier = 5;
					}
				}

				if (tiers[tier] === undefined)
					tiers[tier] = [];	
				if (tiers[tier][level] === undefined)
					tiers[tier][level] = [];
				tiers[tier][level].push(song);
				if (totals[tier] === undefined)
					totals[tier] = 0;
				totals[tier] += level;
				total++;

				if (counts[tier] === undefined)
					counts[tier] = 0;
				counts[tier]++;
			}
			
			for (i = 1; i <= max_tier; i++) {
				console.log('Tier ' + i + ': ' + counts[i]);
			}
		};
		
		var getNextFromTier = function (tier) {
			var index = Math.floor((Math.random() * totals[tier]));
			var level;

			for (level in tiers[tier]) {
				if (tiers[tier][level]) {
					if (index < tiers[tier][level].length * level)
						break;
					index -= tiers[tier][level].length * level;
				}
			}

			index = Math.floor(Math.random() * tiers[tier][level].length);
			$scope.songs.push(tiers[tier][level][index]);
			tiers[tier][level].splice(index, 1);
			totals[tier] -= level;
			total--;
		};

		this.getNext = function () {
			var tier = Math.floor((Math.random() * max_tier)) + 1;

			while (true) {
				if (totals[tier] === undefined || totals[tier] === 0) {
					tier--;
					if (tier === 0)
						tier = max_tier;
				}
				else
					break;
			}
				
			getNextFromTier(tier);
		};

		this.getTotal = function () {
			return total;
		};

		this.clear = function () {
			init();
		};
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

	// jquery for slider (dirty, but works)
	$scope.updateProgress = function (ratio) {
		percent = (ratio < 0 ? 0 : (ratio > 1 ? 1 : ratio)) * 100;

		$('#timeline-bar').css('width', percent + '%');
	};
});
