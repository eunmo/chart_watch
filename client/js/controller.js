musicApp.controller('ArtistListCtrl', function($rootScope, $scope, $http) {
 
  $scope.artists = [];

	$http.get('api/artist').success(function(data) {
    $scope.artists = data;
	});
});

musicApp.controller('Controller', function($rootScope, $scope, $http) {
 
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

musicApp.controller('ArtistCtrl', function($rootScope, $scope, $routeParams, $http) {

	$scope.artists = [];

	$http.get('api/artist/' + $routeParams.id).success(function(artist) {
		// format songs into rows
		for (var j in artist.albums) {
			var album = artist.albums[j];
			var length = album.songs.length;
			var maxRow = Math.max(5, Math.round(length / 2));
			album.songRows = [];
			for (var k in album.songs) {
				if (k < maxRow) {
					album.songRows.push([]);
				}
				var row = (k < maxRow) ? k : k - maxRow;
				var col = (k < maxRow) ? 0 : 1;
				album.songRows[row][col] = album.songs[k];
			}
		}
		console.log(artist);
		$scope.artists.push(artist);
	});
});

musicApp.controller('InitialCtrl', function($rootScope, $scope) {
 
  $scope.initials = [];

	$scope.initials.push.apply($scope.initials, '가나다라마바사아자차카타파하'.split(''));
	$scope.initials.push.apply($scope.initials, 'ABCDEFGHIJLKMNOPQRSTUVWXYZ'.split(''));
	$scope.initials.push('0-9');
});
