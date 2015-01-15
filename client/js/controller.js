musicApp.controller('ArtistListCtrl', function($rootScope, $scope, $http) {
 
  $scope.artists = [];

	$http.get('api/artist').success(function(data) {
    $scope.artists = data;
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
			album.songRows = [];
			for (var k in album.songs) {
				if (k * 2 < length) {
					album.songRows.push([]);
				}
				var row = (length == 1) ? 0 : k % Math.floor(length / 2);
				var col = (k * 2 < length) ? 0 : 1;
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
