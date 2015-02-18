musicApp.directive('upNext', function () {
	return {
		restrict: 'E',
		templateUrl: 'partials/up-next.html'
	};
});

musicApp.directive('player', function () {
	return {
		restrict: 'E',
		templateUrl: 'partials/player.html'
	};
});

musicApp.directive('artistArray', function () {
	return {
		restrict: 'E',
		scope: {
			array: '=array'
		},
		templateUrl: 'partials/artist-array.html'
	};
});

musicApp.directive('artistLink', function () {
	return {
		restrict: 'E',
		scope: {
			artist: '=artist',
			suffix: '=suffix'
		},
		templateUrl: 'partials/artist-link.html'
	};
});

musicApp.directive('artistRows', function () {
	return {
		restrict: 'E',
		scope: {
			artists: '=artists',
			desc: '=desc'
		},
		templateUrl: 'partials/artist-rows.html'
	};
});
