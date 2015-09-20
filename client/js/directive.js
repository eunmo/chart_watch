musicApp.directive('navi', function () {
	return {
		restrict: 'E',
		templateUrl: 'partials/navi.html'
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

musicApp.directive('chartBadge', function () {
	return {
		restrict: 'E',
		scope: {
			rank: '=rank',
			prefix: '=prefix'
		},
		templateUrl: 'partials/chart-badge.html'
	};
});

musicApp.directive('rankBadge', function () {
	return {
		restrict: 'E',
		scope: {
			rank: '=rank',
			prefix: '=prefix'
		},
		templateUrl: 'partials/rank-badge.html'
	};
});
